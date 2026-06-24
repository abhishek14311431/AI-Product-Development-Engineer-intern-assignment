const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE_URL = rawApiBaseUrl.endsWith('/') ? rawApiBaseUrl.slice(0, -1) : rawApiBaseUrl;

async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return { error: await response.text() };
}

export async function analyzeCompany(company) {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ company }),
  });

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to analyze company');
  }

  return payload;
}
