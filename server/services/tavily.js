import { AppError } from '../utils/error.js';

const DEFAULT_TAVILY_SEARCH_DEPTH = 'basic';
const TAVILY_API_URL = 'https://api.tavily.com/search';

function getTavilyApiKey() {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new AppError('Missing Tavily API key. Set TAVILY_API_KEY in .env.', 500);
  }

  return apiKey;
}

function normalizeResult(result) {
  return {
    title: typeof result?.title === 'string' ? result.title.trim() : '',
    url: typeof result?.url === 'string' ? result.url.trim() : '',
    content: typeof result?.content === 'string' ? result.content.trim() : '',
    score: typeof result?.score === 'number' ? result.score : null,
    publishedAt: typeof result?.published_at === 'string' ? result.published_at : null,
  };
}

async function readErrorBody(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    return await response.text();
  } catch {
    return null;
  }
}

export async function searchTavily(query, options = {}) {
  if (typeof query !== 'string' || !query.trim()) {
    throw new AppError('Search query is required for Tavily search.', 400);
  }

  const apiKey = getTavilyApiKey();
  const response = await fetch(TAVILY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query: query.trim(),
      search_depth: options.searchDepth || DEFAULT_TAVILY_SEARCH_DEPTH,
      max_results: options.maxResults ?? 5,
      include_answer: options.includeAnswer ?? false,
      include_raw_content: options.includeRawContent ?? false,
      topic: options.topic || 'general',
    }),
  });

  if (!response.ok) {
    const errorBody = await readErrorBody(response);
    throw new AppError('Tavily API request failed.', 502, {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });
  }

  const payload = await response.json();
  const results = Array.isArray(payload?.results) ? payload.results : [];

  return {
    query: query.trim(),
    answer: typeof payload?.answer === 'string' ? payload.answer.trim() : '',
    results: results.map(normalizeResult).filter((result) => result.title || result.url || result.content),
  };
}
