export async function handler({ step, stepRunId, runId }: any) {
  // Approval gate: always pause and wait for manual approval via approveStep action
  return { success: true, pause: true };
}
