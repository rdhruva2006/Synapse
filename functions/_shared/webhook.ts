// functions/_shared/webhook.ts
export async function handler({ step, stepRunId, runId }) {
  // For demo, simply POST the configured URL with a static payload.
  const url = step.config?.url;
  const payload = step.config?.payload ?? {};
  if (!url) {
    return { success: false, error: 'No URL configured' };
  }
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return { success: true, output: data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
