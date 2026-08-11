import { adminGraphQL } from './_shared/graphql-client';
import { HANDLERS } from './_shared/handler-registry';

/**
 * Action that executes a single step within an existing workflow run.
 * Used by external triggers (e.g., webhook callbacks) or by the engine when stepping through a run.
 */
export async function handler(event: any) {
  const { workflow_run_id, step_id } = event.input;

  // Load step definition
  const stepQuery = `
    query GetStep($stepId: uuid!) {
      workflow_steps_by_pk(id: $stepId) {
        id
        step_type
        config
      }
    }
  `;
  const { workflow_steps_by_pk: step }: any = await adminGraphQL.request(stepQuery, { stepId: step_id });
  if (!step) throw new Error('Step not found');

  // Insert a step run record
  const insertRun = `
    mutation InsertStepRun($obj: step_runs_insert_input!) {
      insert_step_runs_one(object: $obj) {
        id
      }
    }
  `;
  const { insert_step_runs_one: stepRun }: any = await adminGraphQL.request(insertRun, {
    obj: {
      workflow_run_id,
      workflow_step_id: step_id,
      status: 'running',
    },
  });

  // Resolve handler
  const handlerModule = HANDLERS[step.step_type];
  if (!handlerModule) {
    throw new Error(`No handler for step_type: ${step.step_type}`);
  }

  // Execute with simple retry (max 3 attempts)
  let attempts = 0;
  let result: any = null;
  while (attempts < 3) {
    try {
      result = await handlerModule.handler({ step, stepRunId: stepRun.id, runId: workflow_run_id });
      break; // success
    } catch (e: any) {
      attempts++;
      if (attempts >= 3) {
        result = { success: false, error: e.message };
      } else {
        // exponential backoff: 500ms * 2^(attempts-1)
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempts - 1)));
      }
    }
  }

  // Update step run status
  const updateRun = `
    mutation UpdateStepRun($id: uuid!, $status: String!, $output: jsonb) {
      update_step_runs_by_pk(pk_columns: {id: $id}, _set: {status: $status, output: $output}) {
        id
      }
    }
  `;
  await adminGraphQL.request(updateRun, {
    id: stepRun.id,
    status: result.success ? 'completed' : 'failed',
    output: result.output ?? null,
  });

  return { step_run_id: stepRun.id, status: result.success ? 'completed' : 'failed' };
}
