const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE_URL = rawApiBaseUrl.endsWith('/') ? rawApiBaseUrl.slice(0, -1) : rawApiBaseUrl;

const WARMUP_MAX_RETRIES = 10;       // try for up to ~50 seconds
const WARMUP_RETRY_DELAY_MS = 5000;  // 5 seconds between pings
const REQUEST_TIMEOUT_MS = 90000;    // 90s timeout for the actual analyze call

function withTimeout(promise, ms, label) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      timer && controller.signal.addEventListener('abort', () =>
        reject(new Error(`${label} timed out after ${ms / 1000}s`))
      )
    ),
  ]).finally(() => clearTimeout(timer));
}

/**
 * Pings /health until the backend responds OK.
 * Needed because Render free tier cold-starts can take 30-60s.
 * @param {(attempt: number) => void} onRetry - called on each retry
 */
export async function warmupBackend(onRetry) {
  for (let attempt = 0; attempt < WARMUP_MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000); // 7s per ping
      const res = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) return true;
    } catch {
      // backend not ready yet, retry
    }
    if (onRetry) onRetry(attempt + 1);
    await new Promise(r => setTimeout(r, WARMUP_RETRY_DELAY_MS));
  }
  return false; // backend never responded — let the analyze call fail naturally
}

async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return { error: await response.text() };
}

export async function analyzeCompany(company, { onWarmupRetry } = {}) {
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
    // Network error — likely backend is sleeping. Warm it up and retry once.
    if (onWarmupRetry) onWarmupRetry(0);
    const isUp = await warmupBackend(onWarmupRetry);
    if (!isUp) {
      throw new Error(
        'Backend server is starting up (Render free tier cold start). Please wait ~30 seconds and try again.'
      );
    }
    // Retry the actual request after warmup
    const controller2 = new AbortController();
    const timer2 = setTimeout(() => controller2.abort(), REQUEST_TIMEOUT_MS);
    try {
      response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company }),
        signal: controller2.signal,
      });
    } finally {
      clearTimeout(timer2);
    }
  } finally {
    clearTimeout(timer);
  }

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      payload?.error || `Server returned ${response.status}. Please try again.`
    );
  }

  return payload;
}
