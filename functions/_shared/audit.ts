import { adminGraphQL } from './graphql-client';

export async function audit(
  orgId: string | null,
  userId: string | null,
  action: string,
  resourceType: string | null,
  resourceId: string | null,
  metadata: Record<string, any>,
  ipAddress: string | null
) {
  const mutation = `
    mutation InsertAudit($obj: audit_log_insert_input!) {
      insert_audit_log_one(object: $obj) { id }
    }
  `;
  try {
    await adminGraphQL.request(mutation, {
      obj: {
        org_id: orgId,
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        metadata,
        ip_address: ipAddress,
      },
    });
  } catch (e) {
    console.error('Audit log failed:', e);
  }
}
