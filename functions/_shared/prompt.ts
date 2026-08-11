// functions/_shared/prompt.ts
export async function handler({ step, stepRunId, runId }) {
  // In a real implementation, you'd call an LLM with step.config.prompt etc.
  // Here we simulate a successful LLM response.
  const simulatedOutput = {
    text: `Simulated response for prompt step ${step.id}`,
    // You could include token usage, etc.
  };
  return { success: true, output: simulatedOutput };
}
