import { GraphQLClient } from 'graphql-request';
import crypto from 'crypto';

const HASURA_URL = process.env.HASURA_GRAPHQL_ENDPOINT || 'http://localhost:8080/v1/graphql';
const ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET || 'myadminsecret';

const adminClient = new GraphQLClient(HASURA_URL, {
  headers: { 'x-hasura-admin-secret': ADMIN_SECRET },
});

// Helper to create a client impersonating a user with a specific role
const getUserClient = (userId: string, role: string) => new GraphQLClient(HASURA_URL, {
  headers: {
    'x-hasura-role': 'user',
    'x-hasura-user-id': userId,
  }
});

async function run() {
  console.log('Testing Permission Layers...\n');
  
  const ownerId = `test-owner-${crypto.randomBytes(4).toString('hex')}`;
  const editorId = `test-editor-${crypto.randomBytes(4).toString('hex')}`;
  const viewerId = `test-viewer-${crypto.randomBytes(4).toString('hex')}`;
  const otherUserId = `test-other-${crypto.randomBytes(4).toString('hex')}`;

  // 1. Setup users
  console.log('1. Setting up test users...');
  await adminClient.request(`
    mutation InsertUsers($objects: [auth_users_insert_input!]!) {
      insert_auth_users(objects: $objects) { affected_rows }
    }
  `, {
    objects: [
      { id: ownerId, display_name: "Owner" },
      { id: editorId, display_name: "Editor" },
      { id: viewerId, display_name: "Viewer" },
      { id: otherUserId, display_name: "Other User" }
    ]
  });

  // 2. Setup Org & Members via admin
  const resOrg = await adminClient.request(`
    mutation CreateOrg { insert_organizations_one(object: {name: "Test Org", slug: "test-org-${crypto.randomBytes(2).toString('hex')}"}) { id } }
  `);
  const orgId = resOrg.insert_organizations_one.id;
  
  await adminClient.request(`
    mutation InsertMembers($objects: [org_members_insert_input!]!) {
      insert_org_members(objects: $objects) { affected_rows }
    }
  `, {
    objects: [
      { org_id: orgId, user_id: ownerId, role: 'owner' },
      { org_id: orgId, user_id: editorId, role: 'editor' },
      { org_id: orgId, user_id: viewerId, role: 'viewer' }
    ]
  });
  console.log('Org and members created.\n');

  const ownerClient = getUserClient(ownerId, 'owner');
  const editorClient = getUserClient(editorId, 'editor');
  const viewerClient = getUserClient(viewerId, 'viewer');
  const otherClient = getUserClient(otherUserId, 'viewer');

  // Test 1: Layer 1 (Org Isolation)
  console.log('Test 1: Org Isolation (Layer 1)');
  try {
    const res = await otherClient.request(`query { organizations { id } }`);
    if (res.organizations.length === 0) console.log('✅ PASS: User outside org cannot see the org');
    else console.log('❌ FAIL: User outside org could see the org');
  } catch(e) { console.log('✅ PASS: Access denied for outsider'); }

  // Test 2: Layer 2 (Viewer Role)
  console.log('\nTest 2: Viewer Role (Layer 2)');
  try {
    await viewerClient.request(`mutation { update_organizations_by_pk(pk_columns: {id: "${orgId}"}, _set: {name: "Hacked"}) { id } }`);
    console.log('❌ FAIL: Viewer could update org');
  } catch(e) { console.log('✅ PASS: Viewer cannot update org'); }

  // Test 3: Layer 2 (Editor Role)
  console.log('\nTest 3: Editor Role (Layer 2)');
  try {
    await editorClient.request(`mutation { update_organizations_by_pk(pk_columns: {id: "${orgId}"}, _set: {name: "Hacked"}) { id } }`);
    console.log('❌ FAIL: Editor could update org settings');
  } catch(e) { console.log('✅ PASS: Editor cannot update org settings'); }

  let workflowId;
  try {
    const res = await editorClient.request(`
      mutation { insert_workflows_one(object: {org_id: "${orgId}", name: "Editor Workflow"}) { id } }
    `);
    workflowId = res.insert_workflows_one.id;
    console.log('✅ PASS: Editor can create workflows');
  } catch(e) { console.log('❌ FAIL: Editor failed to create workflow', e); }

  // Test 4: Layer 2 (Owner Role)
  console.log('\nTest 4: Owner Role (Layer 2)');
  try {
    await ownerClient.request(`mutation { update_organizations_by_pk(pk_columns: {id: "${orgId}"}, _set: {name: "Owner Updated"}) { id } }`);
    console.log('✅ PASS: Owner can update org settings');
  } catch(e) { console.log('❌ FAIL: Owner failed to update org settings', e); }

  console.log('\nAll permission tests completed.');
}

run();
