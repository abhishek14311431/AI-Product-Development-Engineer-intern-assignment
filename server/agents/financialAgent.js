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

function buildResearchEvidenceNotes(results) {
  return (results || [])
    .map((result, index) => {
      const title = typeof result?.title === 'string' ? result.title.trim() : '';
      const content = typeof result?.content === 'string' ? result.content.trim() : '';

      const lines = [];

      if (title) {
        lines.push(`- Research Source ${index + 1}: ${title}`);
      }

      if (content) {
        const snippet = content.replace(/\s+/g, ' ').slice(0, 180);
        lines.push(`  Evidence: ${snippet}${content.length > 180 ? '...' : ''}`);
      }

      return lines.join('\n');
    })
    .filter(Boolean)
    .join('\n');
}

function buildFinancialPrompt(companyName, searchPayload, researchContext = '') {
  const results = searchPayload.results || [];
  const searchContext = formatSearchResults(results);
  const evidenceNotes = buildEvidenceNotes(results);

  return `You are a senior equity research analyst.

Company: ${companyName}

Use the upstream research summary and the financial evidence below to produce analyst-style findings.
Avoid generic language. Be specific about the company's revenue model, margin profile, leverage, and cash generation.

Return the output in this exact structure:
- Revenue Growth
- Profitability
- Debt Position
- Cash Flow Strength
- Financial Stability
- Strengths
- Weaknesses

Guidelines:
- Use the research summary as context and the financial evidence as primary support.
- Mention specific business segments, operating trends, capital structure details, or cash flow signals when present.
- Highlight strengths and weaknesses separately.
- If evidence is incomplete or conflicting, say so explicitly.
- Keep the output concise and evidence-based.
- Prefer short labeled paragraphs or bullets.

Upstream Research Summary:
${researchContext || 'No research summary was provided.'}

Upstream Research Evidence:
${buildResearchEvidenceNotes((searchPayload?.researchSources) || []) || 'No upstream research evidence was provided.'}

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

async function gatherFinancialEvidence(companyName, options = {}) {
  const query = `${companyName} revenue growth profitability cash flow debt financial stability annual report earnings`;

  return searchTavily(query, {
    maxResults: options.maxResults ?? DEFAULT_MAX_RESULTS,
    searchDepth: options.searchDepth || 'basic',
    topic: options.topic || 'general',
    includeAnswer: false,
    includeRawContent: options.includeRawContent ?? false,
  });
}

export async function createFinancialAnalysis(companyName, options = {}) {
  const normalizedCompanyName = normalizeCompanyName(companyName);

  if (!normalizedCompanyName) {
    throw new AppError('company name is required for financial analysis.', 400);
  }

  const evidence = await gatherFinancialEvidence(normalizedCompanyName, options);
  const promptPayload = {
    ...evidence,
    researchSources: options.researchSources || [],
  };

  const prompt = buildFinancialPrompt(normalizedCompanyName, promptPayload, options.researchSummary || '');
  const summary = await generateContent(prompt, {
    model: options.model,
    temperature: options.temperature ?? 0.2,
    topP: options.topP ?? 0.95,
    maxOutputTokens: options.maxOutputTokens ?? 1200,
  });

  return {
    company: normalizedCompanyName,
    financials: cleanSummary(summary),
    sources: evidence.results,
    answer: evidence.answer,
  };
}
