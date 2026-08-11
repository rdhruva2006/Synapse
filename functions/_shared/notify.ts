export async function handler({ step, stepRunId, runId }: any) {
  const { channel = 'log', payload = {} } = step.config || {};
  try {
    const { adminGraphQL } = await import('./graphql-client');
    // Get org_id from the workflow run
    const runRes: any = await adminGraphQL.request(`
      query GetRunOrg($runId: uuid!) {
        workflow_runs_by_pk(id: $runId) { org_id }
      }
    `, { runId });
    const orgId = runRes.workflow_runs_by_pk?.org_id;
    if (!orgId) return { success: false, error: 'Could not determine org_id' };
    
    await adminGraphQL.request(`
      mutation InsertNotification($obj: notifications_insert_input!) {
        insert_notifications_one(object: $obj) { id }
      }
    `, {
      obj: { org_id: orgId, step_run_id: stepRunId, channel, payload },
    });
    return { success: true, output: { notified: true, channel } };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
