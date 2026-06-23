import { searchTavily } from '../services/tavily.js';
import { generateContent } from '../services/gemini.js';
import { AppError } from '../utils/error.js';

const DEFAULT_MAX_RESULTS = 6;

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

function buildEvidenceNotes(results) {
  return results
    .map((result, index) => {
      const title = typeof result?.title === 'string' ? result.title.trim() : '';
      const content = typeof result?.content === 'string' ? result.content.trim() : '';
      const url = typeof result?.url === 'string' ? result.url.trim() : '';

      const parts = [];

      if (title) {
        parts.push(`- Source ${index + 1}: ${title}`);
      }

      if (content) {
        const snippet = content.replace(/\s+/g, ' ').slice(0, 240);
        parts.push(`  Evidence: ${snippet}${content.length > 240 ? '...' : ''}`);
      }

      if (url) {
        parts.push(`  Link: ${url}`);
      }

      return parts.join('\n');
    })
    .filter(Boolean)
    .join('\n');
}

function buildResearchPrompt(companyName, searchPayload) {
  const results = searchPayload.results || [];
  const searchContext = formatSearchResults(results);
  const evidenceNotes = buildEvidenceNotes(results);

  return `You are a senior investment research analyst.

Company: ${companyName}

Use the evidence below to produce company-specific findings.
Avoid generic statements like "the company operates in a competitive market" unless you tie them to the evidence.

Return a concise structured summary with these sections exactly:
- Business Model
- Revenue Drivers
- Products & Services
- Market Position
- Industry Trends
- Growth Opportunities
- Key Risks

Guidelines:
- Use only the supplied evidence and careful reasoning.
- Anchor each section to at least one concrete detail from the sources.
- Mention product names, customer types, segment names, markets, or initiatives when available.
- If evidence is weak or conflicting, say so explicitly.
- Keep the output clean and plain text.
- Prefer short labeled paragraphs or bullets.

Evidence:
${searchContext || 'No search results were returned.'}

Evidence Notes:
${evidenceNotes || 'No concrete evidence notes could be extracted.'}
`;
}

function cleanSummary(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/\n{3,}/g, '\n\n');
}

async function gatherCompanyEvidence(companyName, options = {}) {
  const query = `${companyName} business model products services industry position growth opportunities`;

  return searchTavily(query, {
    maxResults: options.maxResults ?? DEFAULT_MAX_RESULTS,
    searchDepth: options.searchDepth || 'basic',
    topic: options.topic || 'general',
    includeAnswer: false,
    includeRawContent: options.includeRawContent ?? false,
  });
}

export async function createResearchSummary(companyName, options = {}) {
  const normalizedCompanyName = normalizeCompanyName(companyName);

  if (!normalizedCompanyName) {
    throw new AppError('company name is required for research.', 400);
  }

  const evidence = await gatherCompanyEvidence(normalizedCompanyName, options);
  const prompt = buildResearchPrompt(normalizedCompanyName, evidence);
  const summary = await generateContent(prompt, {
    model: options.model,
    temperature: options.temperature ?? 0.2,
    topP: options.topP ?? 0.95,
    maxOutputTokens: options.maxOutputTokens ?? 1200,
  });

  return {
    company: normalizedCompanyName,
    research: cleanSummary(summary),
    sources: evidence.results,
    answer: evidence.answer,
  };
}
