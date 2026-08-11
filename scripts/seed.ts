import { GraphQLClient } from 'graphql-request';
import crypto from 'crypto';

const HASURA_URL = process.env.HASURA_GRAPHQL_ENDPOINT || 'http://localhost:8080/v1/graphql';
const ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET || 'myadminsecret';

const client = new GraphQLClient(HASURA_URL, {
  headers: {
    'x-hasura-admin-secret': ADMIN_SECRET,
  },
});

async function run() {
  console.log('Seeding database...');
  
  // 1. Create a demo user if doesn't exist (directly in auth.users)
  const userId = '11111111-1111-1111-1111-111111111111';
  try {
    await client.request(`
      mutation InsertUser {
        insert_auth_users_one(object: {
          id: "${userId}",
          email: "demo@example.com",
          password_hash: "$2a$12$Zq.e/U75Z.nE11/0.6.uKe",
          display_name: "Demo User",
          locale: "en",
          default_role: "user"
        }, on_conflict: {constraint: users_pkey, update_columns: []}) {
          id
        }
      }
    `);
  } catch (e) {
    console.log('User might already exist (expected if re-running seed script).');
  }

  // 2. Call the createOrganization action
  let orgId: string, orgSlug: string;
  try {
    const res: any = await client.request(`
      mutation CreateOrg {
        createOrganization(name: "Demo Org", slug: "demo-org-${crypto.randomBytes(2).toString('hex')}") {
          org_id
        }
      }
    `);
    orgId = res.createOrganization.org_id;
    console.log('Created Org:', orgId);
  } catch(e) {
    console.error('Failed to create org:', e);
    process.exit(1);
  }

  // 3. Create a workflow
  let workflowId: string;
  try {
    const res: any = await client.request(`
      mutation CreateWorkflow($orgId: uuid!, $userId: uuid!) {
        insert_workflows_one(object: {
          org_id: $orgId,
          name: "Demo Customer Onboarding",
          description: "A sample workflow showing all features",
          created_by: $userId,
          is_active: true
        }) { id }
      }
    `, { orgId, userId });
    workflowId = res.insert_workflows_one.id;
    console.log('Created Workflow:', workflowId);
  } catch(e) {
    console.error('Failed to create workflow:', e);
    process.exit(1);
  }

  // 4. Create workflow steps
  let steps: any[] = [];
  try {
    const res: any = await client.request(`
      mutation InsertSteps($objects: [workflow_steps_insert_input!]!) {
        insert_workflow_steps(objects: $objects) { returning { id } }
      }
    `, {
      objects: [
        { workflow_id: workflowId, step_order: 1, step_type: 'llm_call', name: 'Generate Welcome Email', config: { prompt: 'Write a welcome email for a new user' } },
        { workflow_id: workflowId, step_order: 2, step_type: 'conditional_branch', name: 'Check Sentiment', config: { conditionField: 'sentiment', expectedValue: 'positive' } },
        { workflow_id: workflowId, step_order: 3, step_type: 'approval_gate', name: 'Manual Review', config: {} },
        { workflow_id: workflowId, step_order: 4, step_type: 'notify', name: 'Send Alert', config: { channel: 'slack', payload: { text: 'Negative sentiment detected' } } },
        { workflow_id: workflowId, step_order: 5, step_type: 'http_request', name: 'Send Email via API', config: { url: 'https://httpbin.org/post', method: 'POST' } }
      ]
    });
    steps = res.insert_workflow_steps.returning;
    console.log('Created Steps');
  } catch (e) {
    console.error('Failed to insert steps:', e);
  }

  // 5. Connect the edges
  if (steps.length === 5) {
    try {
      await client.request(`
        mutation InsertEdges($objects: [workflow_edges_insert_input!]!) {
          insert_workflow_edges(objects: $objects) { affected_rows }
        }
      `, {
        objects: [
          { workflow_id: workflowId, source_step_id: steps[0].id, target_step_id: steps[1].id, edge_type: 'default' },
          { workflow_id: workflowId, source_step_id: steps[1].id, target_step_id: steps[2].id, edge_type: 'if_true' },
          { workflow_id: workflowId, source_step_id: steps[1].id, target_step_id: steps[3].id, edge_type: 'if_false' },
          { workflow_id: workflowId, source_step_id: steps[2].id, target_step_id: steps[4].id, edge_type: 'default' }
        ]
      });
      console.log('Created Edges');
    } catch (e) {
      console.error('Failed to create edges:', e);
    }
  }

  console.log(`\n✅ Database seeded successfully!`);
  console.log(`User ID: ${userId}`);
  console.log(`Org ID: ${orgId}`);
  console.log(`Workflow ID: ${workflowId}`);
  console.log(`\nTo trigger a run, go to: http://localhost:3000/workflow/${workflowId}/run`);
}

run();
