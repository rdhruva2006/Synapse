export async function handler({ step, stepRunId, runId, previousOutput }: any) {
  const conditionField = step.config?.conditionField; // e.g., 'sentiment'
  const expectedValue = step.config?.expectedValue;   // e.g., 'positive'
  const condition = step.config?.condition;            // simple boolean fallback
  
  let branchResult = false;
  
  if (conditionField && previousOutput) {
    // Evaluate against previous step's output
    const actual = conditionField.split('.').reduce((o: any, k: string) => o?.[k], previousOutput);
    branchResult = actual === expectedValue;
  } else if (typeof condition === 'boolean') {
    branchResult = condition;
  } else if (typeof condition === 'string') {
    branchResult = condition.toLowerCase() === 'true';
  }
  
  return { success: true, branch: branchResult, output: { branch: branchResult, conditionField, expectedValue } };
}
