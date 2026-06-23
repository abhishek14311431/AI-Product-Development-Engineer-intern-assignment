import { AppError } from '../utils/error.js';

const DEFAULT_TAVILY_SEARCH_DEPTH = 'basic';
const TAVILY_API_URL = 'https://api.tavily.com/search';

function getTavilyApiKey() {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey || apiKey === 'your_tavily_api_key_here') {
    return null;
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
  if (!apiKey) {
    console.info(`[Tavily Service] Running in Mock/Demo mode for query: "${query}"`);
    const company = query.split(' ')[0] || 'Company';
    return {
      query: query.trim(),
      answer: `This is a mock search answer for "${query}".`,
      results: [
        {
          title: `Market Report: ${company} Business Trends`,
          url: `https://www.example.com/market-report-${company.toLowerCase()}`,
          content: `This is simulated search content for ${company} covering its product offerings, software suites, and enterprise subscriptions.`,
          score: 0.98,
          publishedAt: new Date().toISOString(),
        },
        {
          title: `Financial Health Analysis of ${company}`,
          url: `https://www.example.com/financials-${company.toLowerCase()}`,
          content: `Recent analyst reports indicate that ${company} is maintaining healthy margin lines, double-digit top-line growth, and a robust balance sheet position.`,
          score: 0.94,
          publishedAt: new Date().toISOString(),
        },
        {
          title: `Latest News and Sentiment for ${company}`,
          url: `https://www.example.com/news-${company.toLowerCase()}`,
          content: `Public coverage of ${company} remains highly positive following key developer conferences and new product announcements.`,
          score: 0.88,
          publishedAt: new Date().toISOString(),
        }
      ],
    };
  }

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

