import { adminGraphQL } from './_shared/graphql-client';
import { audit } from './_shared/audit';

export async function handler(event: any) {
  const { name, slug } = event.input;
  // Admin secret is used; no permission checks needed for bootstrap.
  const createOrg = `
    mutation InsertOrg($obj: organizations_insert_input!) {
      insert_organizations_one(object: $obj) {
        id
      }
    }
  `;
  const orgRes: any = await adminGraphQL.request(createOrg, {
    obj: { name, slug },
  });
  const orgId = orgRes.insert_organizations_one.id;

  // Insert owner into org_members (role = owner)
  const createMember = `
    mutation InsertMember($obj: org_members_insert_input!) {
      insert_org_members_one(object: $obj) {
        id
      }
    }
  `;
  const memberRes: any = await adminGraphQL.request(createMember, {
    obj: {
      org_id: orgId,
      user_id: event.session_variables['x-hasura-user-id'],
      role: 'owner',
    },
  });

  // Audit log
  await audit(orgId, event.session_variables['x-hasura-user-id'], 'org.create', 'org', orgId, { name, slug }, null);

  return { org_id: orgId, org_member_id: memberRes.insert_org_members_one.id };
}
