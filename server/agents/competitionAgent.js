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

function buildCompetitionPrompt(companyName, searchPayload) {
  const searchContext = formatSearchResults(searchPayload.results || []);

  return `You are a senior competitive intelligence analyst.

Company: ${companyName}

Use the evidence below to produce a concise competition analysis summary.
Focus on these sections:
- Find competitors
- Compare strengths
- Compare weaknesses
- Assess market position

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

async function gatherCompetitionEvidence(companyName, options = {}) {
  const query = `${companyName} competitors strengths weaknesses market position competitive landscape`;

  return searchTavily(query, {
    maxResults: options.maxResults ?? DEFAULT_MAX_RESULTS,
    searchDepth: options.searchDepth || 'advanced',
    topic: options.topic || 'general',
    includeAnswer: false,
    includeRawContent: options.includeRawContent ?? false,
  });
}

export async function createCompetitionAnalysis(companyName, options = {}) {
  const normalizedCompanyName = normalizeCompanyName(companyName);

  if (!normalizedCompanyName) {
    throw new AppError('company name is required for competition analysis.', 400);
  }

  const evidence = await gatherCompetitionEvidence(normalizedCompanyName, options);
  const prompt = buildCompetitionPrompt(normalizedCompanyName, evidence);
  const summary = await generateContent(prompt, {
    model: options.model,
    temperature: options.temperature ?? 0.2,
    topP: options.topP ?? 0.95,
    maxOutputTokens: options.maxOutputTokens ?? 1200,
  });

  return {
    company: normalizedCompanyName,
    competition: cleanSummary(summary),
    sources: evidence.results,
    answer: evidence.answer,
  };
}
