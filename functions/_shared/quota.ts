// functions/_shared/quota.ts
/**
 * Simple quota utility – checks the organization's quota and increments usage.
 * Returns true if quota allows the operation, otherwise throws.
 */
export async function consumeQuota(orgId: string, cost: number = 1) {
  const query = `
    query GetQuota($orgId: uuid!) {
      organizations_by_pk(id: $orgId) { quota_limit quota_used }
    }
  `;
  const { adminGraphQL } = await import('./graphql-client');
  const res: any = await adminGraphQL.request(query, { orgId });
  const org = res.organizations_by_pk;
  if (!org) throw new Error('Organization not found');

  if (org.quota_used + cost > org.quota_limit) {
    throw new Error('Organization quota exceeded');
  }

  const mutation = `
    mutation UpdateQuota($orgId: uuid!, $newUsed: Int!) {
      update_organizations_by_pk(pk_columns: {id: $orgId}, _set: {quota_used: $newUsed}) { id }
    }
  `;
  await adminGraphQL.request(mutation, { orgId, newUsed: org.quota_used + cost });
  return true;
}
