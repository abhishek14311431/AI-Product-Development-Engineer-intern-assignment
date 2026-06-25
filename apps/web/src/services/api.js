const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE_URL = rawApiBaseUrl.endsWith('/') ? rawApiBaseUrl.slice(0, -1) : rawApiBaseUrl;

// 120-second timeout — enough for Render cold start (30-60s) + analysis (20-40s)
const REQUEST_TIMEOUT_MS = 120000;

async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return { error: await response.text() };
}

/**
 * Analyze a company. On Render free tier, the first call may take up to 90 seconds
 * as the server cold-starts. The 120s timeout handles this transparently.
 */
export async function analyzeCompany(company) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company }),
      signal: controller.signal,
    });
  } catch (fetchErr) {
    clearTimeout(timer);
    const isAbort = fetchErr?.name === 'AbortError';
    if (isAbort) {
      throw new Error(
        'Request timed out after 2 minutes. The backend server may be overloaded — please try again.'
      );
    }
    throw new Error(
      'Could not reach the backend server. Please check your connection and try again.'
    );
  } finally {
    clearTimeout(timer);
  }

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(payload?.error || `Server error (${response.status}) — please try again.`);
  }

  return payload;
}
