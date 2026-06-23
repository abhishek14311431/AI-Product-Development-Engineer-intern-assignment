import { searchTavily } from '../services/tavily.js';
import { generateContent } from '../services/gemini.js';
import { AppError } from '../utils/error.js';

const DEFAULT_MAX_RESULTS = 8;

function normalizeCompanyName(companyName) {
  if (typeof companyName !== 'string') {
    return '';
  }

  return companyName.trim();
}

function formatSearchResults(results) {
  return results
    .map((result, index) => {
      const lines = [
        `Result ${index + 1}:`,
        result.title ? `Title: ${result.title}` : null,
        result.url ? `URL: ${result.url}` : null,
        result.publishedAt ? `Published At: ${result.publishedAt}` : null,
        result.content ? `Content: ${result.content}` : null,
      ].filter(Boolean);

      return lines.join('\n');
    })
    .join('\n\n');
}

function buildNewsPrompt(companyName, searchPayload) {
  const searchContext = formatSearchResults(searchPayload.results || []);

  return `You are a senior market intelligence analyst.

Company: ${companyName}

Use the evidence below to produce a concise news analysis summary.
Focus on these sections:
- Recent developments
- Positive news
- Negative news
- Legal issues
- Risks

Guidelines:
- Use only the supplied evidence and careful reasoning.
- If evidence is limited or conflicting, say so explicitly.
- Keep the output clean and plain text.
- Organize the answer using short labeled paragraphs.

Evidence:
${searchContext || 'No search results were returned.'}
`;
}

function cleanSummary(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/\n{3,}/g, '\n\n');
}

async function gatherNewsEvidence(companyName, options = {}) {
  const query = `${companyName} latest news recent developments legal issues risks positive news negative news`;

  return searchTavily(query, {
    maxResults: options.maxResults ?? DEFAULT_MAX_RESULTS,
    searchDepth: options.searchDepth || 'advanced',
    topic: options.topic || 'news',
    includeAnswer: false,
    includeRawContent: options.includeRawContent ?? false,
  });
}

export async function createNewsAnalysis(companyName, options = {}) {
  const normalizedCompanyName = normalizeCompanyName(companyName);

  if (!normalizedCompanyName) {
    throw new AppError('company name is required for news analysis.', 400);
  }

  const evidence = await gatherNewsEvidence(normalizedCompanyName, options);
  const prompt = buildNewsPrompt(normalizedCompanyName, evidence);
  const summary = await generateContent(prompt, {
    model: options.model,
    temperature: options.temperature ?? 0.2,
    topP: options.topP ?? 0.95,
    maxOutputTokens: options.maxOutputTokens ?? 1200,
  });

  return {
    company: normalizedCompanyName,
    news: cleanSummary(summary),
    sources: evidence.results,
    answer: evidence.answer,
  };
}
