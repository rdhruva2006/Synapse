import { adminGraphQL } from './_shared/graphql-client';
import { audit } from './_shared/audit';
import { executeFromStep } from './_shared/workflow-engine';

export async function handler(event: any) {
  const { step_run_id } = event.input;
  const orgId = event.session_variables['x-hasura-org-id'];
  const userId = event.session_variables['x-hasura-user-id'];

  // Role check: query org_members for the caller's org role
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
    throw new Error('Permission denied: only owners or editors can approve steps');
  }

  // Load the step run
  const res: any = await adminGraphQL.request(`
    query GetStepRun($id: uuid!) {
      step_runs_by_pk(id: $id) {
        id
        workflow_run_id
        workflow_step_id
        status
        workflow_step {
          step_type
          config
        }
        workflow_run {
          workflow_id
          org_id
        }
      }
    }
  `, { id: step_run_id });
  
  const stepRun = res.step_runs_by_pk;
  if (!stepRun) throw new Error('Step run not found');
  if (stepRun.status !== 'waiting_approval') throw new Error('Step is not awaiting approval');
  if (stepRun.workflow_run.org_id !== orgId) throw new Error('Step does not belong to your organization');

  // Update step run to approved
  await adminGraphQL.request(`
    mutation ApproveStep($id: uuid!, $userId: uuid!) {
      update_step_runs_by_pk(pk_columns: {id: $id}, _set: {
        status: "approved", approved_by: $userId, approved_at: "now()"
      }) { id }
    }
  `, { id: step_run_id, userId });

  await audit(orgId, userId, 'workflow.step.approved', 'step_run', step_run_id, {}, null);

  // Find the next step after this approval gate via edges
  const edgesRes: any = await adminGraphQL.request(`
    query GetEdges($stepId: uuid!) {
      workflow_edges(where: {source_step_id: {_eq: $stepId}, edge_type: {_eq: "default"}}) {
        target_step_id
      }
    }
  `, { stepId: stepRun.workflow_step_id });
  
  const nextStepId = edgesRes.workflow_edges[0]?.target_step_id || null;
  const runId = stepRun.workflow_run_id;

  // Resume execution from the next step
  if (nextStepId) {
    // Set run back to running
    await adminGraphQL.request(`
      mutation ResumeRun($runId: uuid!) {
        update_workflow_runs_by_pk(pk_columns: {id: $runId}, _set: {status: "running"}) { id }
      }
    `, { runId });
    
    // Fire-and-forget resume
    executeFromStep(runId, nextStepId).catch((e: any) => console.error('Resume error:', e));
  } else {
    // No next step — mark run completed
    await adminGraphQL.request(`
      mutation CompleteRun($runId: uuid!) {
        update_workflow_runs_by_pk(pk_columns: {id: $runId}, _set: {status: "completed", completed_at: "now()"}) { id }
      }
    `, { runId });
  }

  return { success: true, message: 'Step approved and workflow resumed' };
}
