import { adminGraphQL } from './graphql-client';
import { audit } from './audit';
import { HANDLERS } from './handler-registry';

export async function executeFromStep(runId: string, startStepId: string | null) {
  // Mark run as running
  await adminGraphQL.request(`
    mutation StartRun($runId: uuid!) {
      update_workflow_runs_by_pk(pk_columns: {id: $runId}, _set: {status: "running"}) { id org_id }
    }
  `, { runId });

  // Load workflow definition: steps + edges
  const res: any = await adminGraphQL.request(`
    query GetWorkflow($runId: uuid!) {
      workflow_runs_by_pk(id: $runId) {
        workflow_id
        org_id
        workflow {
          workflow_steps(order_by: {step_order: asc}) {
            id
            step_type
            config
            step_order
          }
          workflow_edges {
            source_step_id
            target_step_id
            edge_type
          }
        }
      }
    }
  `, { runId });
  
  const run = res.workflow_runs_by_pk;
  if (!run?.workflow) throw new Error('Workflow not found');
  const orgId = run.org_id;

  // Build adjacency maps
  const nextMap: Record<string, string> = {};
  const trueMap: Record<string, string> = {};
  const falseMap: Record<string, string> = {};
  for (const edge of run.workflow.workflow_edges) {
    if (edge.edge_type === 'default') nextMap[edge.source_step_id] = edge.target_step_id;
    if (edge.edge_type === 'if_true') trueMap[edge.source_step_id] = edge.target_step_id;
    if (edge.edge_type === 'if_false') falseMap[edge.source_step_id] = edge.target_step_id;
  }

  const steps: Record<string, any> = {};
  run.workflow.workflow_steps.forEach((s: any) => (steps[s.id] = s));

  // Determine start step
  let currentStepId = startStepId;
  if (!currentStepId) {
    const incoming = new Set(
      Object.values(nextMap)
        .concat(Object.values(trueMap), Object.values(falseMap))
        .filter(Boolean)
    );
    for (const id of Object.keys(steps)) {
      if (!incoming.has(id as string)) { currentStepId = id as string; break; }
    }
  }

  let previousOutput: any = null;
  let stepCount = 0;
  const maxSteps = 100;
  let runTerminated = false; // tracks if we broke out due to failure/pause

  while (currentStepId) {
    if (stepCount++ > maxSteps) {
      await adminGraphQL.request(`
        mutation FailRun($runId: uuid!, $error: String!) {
          update_workflow_runs_by_pk(pk_columns: {id: $runId}, _set: {status: "failed", error: $error}) { id }
        }
      `, { runId, error: 'Maximum step execution limit exceeded – possible cycle' });
      runTerminated = true;
      break;
    }
    
    const step = steps[currentStepId];
    if (!step) break;

    // Insert step run
    const { insert_step_runs_one }: any = await adminGraphQL.request(`
      mutation InsertStepRun($obj: step_runs_insert_input!) {
        insert_step_runs_one(object: $obj) { id }
      }
    `, {
      obj: {
        workflow_run_id: runId,
        workflow_step_id: currentStepId,
        status: 'running',
        started_at: new Date().toISOString(),
      },
    });
    const stepRunId = insert_step_runs_one.id;

    // Resolve handler
    const handlerModule = HANDLERS[step.step_type];
    if (!handlerModule) {
      await adminGraphQL.request(`
        mutation FailRun($runId: uuid!, $error: String!) {
          update_workflow_runs_by_pk(pk_columns: {id: $runId}, _set: {status: "failed", error: $error}) { id }
        }
      `, { runId, error: `No handler for step_type: ${step.step_type}` });
      runTerminated = true;
      break;
    }

    // Execute with retry (3 attempts, exponential backoff)
    let attempts = 0;
    let result: any = null;
    while (attempts < 3) {
      try {
        result = await handlerModule.handler({ step, stepRunId, runId, previousOutput });
        break;
      } catch (e: any) {
        attempts++;
        if (attempts >= 3) {
          result = { success: false, error: e.message || 'Unknown error' };
        } else {
          await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempts - 1)));
        }
      }
    }

    // Determine step status
    let stepStatus: string;
    if (!result.success) stepStatus = 'failed';
    else if (result.pause) stepStatus = 'waiting_approval';
    else stepStatus = 'completed';

    // Update step run
    await adminGraphQL.request(`
      mutation UpdateStepRun($id: uuid!, $status: String!, $output: jsonb, $error: String, $completedAt: timestamptz) {
        update_step_runs_by_pk(pk_columns: {id: $id}, _set: {
          status: $status, output: $output, error: $error, 
          completed_at: $completedAt, attempt_count: ${attempts + 1}
        }) { id }
      }
    `, {
      id: stepRunId,
      status: stepStatus,
      output: result.output ?? null,
      error: result.error ?? null,
      completedAt: stepStatus !== 'waiting_approval' ? new Date().toISOString() : null,
    });

    // Handle failure
    if (!result.success) {
      await adminGraphQL.request(`
        mutation FailRun($runId: uuid!, $error: String!) {
          update_workflow_runs_by_pk(pk_columns: {id: $runId}, _set: {status: "failed", error: $error, completed_at: "now()"}) { id }
        }
      `, { runId, error: result.error ?? 'Step failed' });
      await audit(orgId, null, 'workflow.run.failed', 'workflow_run', runId, { step_id: currentStepId }, null);
      runTerminated = true;
      break;
    }

    // Handle pause (approval gate)
    if (result.pause) {
      await adminGraphQL.request(`
        mutation PauseRun($runId: uuid!) {
          update_workflow_runs_by_pk(pk_columns: {id: $runId}, _set: {status: "paused"}) { id }
        }
      `, { runId });
      await audit(orgId, null, 'workflow.run.paused', 'workflow_run', runId, { step_id: currentStepId }, null);
      runTerminated = true;
      break;
    }

    // Determine next step
    if (step.step_type === 'conditional_branch') {
      currentStepId = result.branch ? (trueMap[currentStepId] || null) : (falseMap[currentStepId] || null);
    } else {
      currentStepId = nextMap[currentStepId] || null;
    }

    previousOutput = result.output;
  }

  // If loop ended normally (not failure/pause), mark completed
  if (!runTerminated) {
    await adminGraphQL.request(`
      mutation CompleteRun($runId: uuid!) {
        update_workflow_runs_by_pk(pk_columns: {id: $runId}, _set: {status: "completed", completed_at: "now()"}) { id }
      }
    `, { runId });
    await audit(orgId, null, 'workflow.run.completed', 'workflow_run', runId, {}, null);
  }
}
