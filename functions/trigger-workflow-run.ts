import { adminGraphQL } from './_shared/graphql-client';
import { audit } from './_shared/audit';
import { consumeQuota } from './_shared/quota';

export async function handler(event: any) {
  const { workflow_id, idempotency_key } = event.input;
  const userId = event.session_variables['x-hasura-user-id'];
  const orgId = event.session_variables['x-hasura-org-id'];

  // Role check: query org_members
  const roleQuery: any = await adminGraphQL.request(`
    query GetRole($userId: uuid!, $orgId: uuid!) {
      org_members(where: {user_id: {_eq: $userId}, org_id: {_eq: $orgId}}) {
        role
      }
    }
  `, { userId, orgId });
  
  const membership = roleQuery.org_members[0];
  if (!membership) throw new Error('Not a member of this organization');
  if (!['owner', 'editor'].includes(membership.role)) {
    throw new Error('Permission denied: only owners or editors can trigger workflow runs');
  }

  // Quota check
  await consumeQuota(orgId, 1);

  // Idempotency
  if (idempotency_key) {
    const existing: any = await adminGraphQL.request(`
      query ExistingRun($key: String!) {
        workflow_runs(where: {idempotency_key: {_eq: $key}}) { id }
      }
    `, { key: idempotency_key });
    if (existing.workflow_runs.length > 0) {
      return { workflow_run_id: existing.workflow_runs[0].id, status: 'existing', message: 'Returned existing run' };
    }
  }

  // Create run
  const { insert_workflow_runs_one }: any = await adminGraphQL.request(`
    mutation InsertRun($obj: workflow_runs_insert_input!) {
      insert_workflow_runs_one(object: $obj) { id }
    }
  `, {
    obj: {
      workflow_id, org_id: orgId, status: 'pending',
      triggered_by: 'manual', started_by: userId,
      idempotency_key: idempotency_key || null,
    },
  });
  const runId = insert_workflow_runs_one.id;

  await audit(orgId, userId, 'workflow.run.triggered', 'workflow_run', runId, { workflow_id }, null);

  // Fire-and-forget engine start
  const engine = await import('./_shared/workflow-engine');
  engine.executeFromStep(runId, null).catch(e => console.error('Engine error', e));

  return { workflow_run_id: runId, status: 'queued', message: 'Workflow run created' };
}
