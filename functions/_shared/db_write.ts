// functions/_shared/db_write.ts
export async function handler({ step, stepRunId, runId }) {
  // Simple DB write: insert a row into a user-provided table via Hasura mutation.
  // Expect config: { table: string, data: object }
  const { table, data } = step.config || {};
  if (!table || !data) {
    return { success: false, error: 'Missing table or data in config' };
  }
  const mutation = `
    mutation Insert($obj: ${table}_insert_input!) {
      insert_${table}_one(object: $obj) { id }
    }
  `;
  try {
    // Using adminGraphQL directly (imported inside function to avoid circular deps)
    const { adminGraphQL } = await import('./graphql-client');
    await adminGraphQL.request(mutation, { obj: data });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
