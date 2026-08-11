// functions/_shared/http_request.ts
export async function handler({ step, stepRunId, runId }) {
  const { url, method = 'GET', headers = {}, body } = step.config || {};
  if (!url) return { success: false, error: 'Missing URL' };
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    return { success: true, output: data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
