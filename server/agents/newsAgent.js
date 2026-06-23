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

function buildStructuredFindings(summary, sources) {
  const structuredText = cleanSummary(summary);
  const sourceList = Array.isArray(sources) ? sources : [];

  return {
    summary: structuredText,
    sources: sourceList,
  };
}

function buildEvidenceNotes(results) {
  return results
    .map((result, index) => {
      const title = typeof result?.title === 'string' ? result.title.trim() : '';
      const content = typeof result?.content === 'string' ? result.content.trim() : '';
      const url = typeof result?.url === 'string' ? result.url.trim() : '';

      const lines = [];

      if (title) {
        lines.push(`- News Source ${index + 1}: ${title}`);
      }

      if (content) {
        const snippet = content.replace(/\s+/g, ' ').slice(0, 220);
        lines.push(`  Evidence: ${snippet}${content.length > 220 ? '...' : ''}`);
      }

      if (url) {
        lines.push(`  Link: ${url}`);
      }

      return lines.join('\n');
    })
    .filter(Boolean)
    .join('\n');
}

function buildSignalList(results) {
  return results
    .map((result) => {
      const title = typeof result?.title === 'string' ? result.title.trim() : '';
      const content = typeof result?.content === 'string' ? result.content.trim() : '';
      if (!title && !content) {
        return '';
      }

      return `${title || 'Untitled source'}: ${content.replace(/\s+/g, ' ').slice(0, 180)}`;
    })
    .filter(Boolean)
    .join('\n');
}

function buildNewsSummaryPrompt(companyName, searchPayload) {
  const results = searchPayload.results || [];
  const searchContext = formatSearchResults(results);
  const evidenceNotes = buildEvidenceNotes(results);
  const signalList = buildSignalList(results);

  return `You are a market intelligence analyst writing a company-specific news brief.

Company: ${companyName}

Use only the supplied search evidence. Avoid generic statements. Every claim must be grounded in the evidence.

Return the analysis with these sections exactly:
- Positive Signals
- Negative Signals
- Overall Market Sentiment

Rules:
- Extract concrete evidence from the search results.
- Classify product launches, partnerships, regulatory items, legal risks, and strategic developments into the correct section.
- If evidence is weak, say "No clear evidence found" rather than guessing.
- Keep the output concise and specific to the company.
- Use bullet points or short labeled sentences.

Evidence:
${searchContext || 'No search results were returned.'}

Evidence Notes:
${evidenceNotes || 'No concrete evidence notes could be extracted.'}

Signal Candidates:
${signalList || 'No signal candidates could be extracted.'}
`;
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
  const prompt = buildNewsSummaryPrompt(normalizedCompanyName, evidence);
  const summary = await generateContent(prompt, {
    model: options.model,
    temperature: options.temperature ?? 0.2,
    topP: options.topP ?? 0.95,
    maxOutputTokens: options.maxOutputTokens ?? 1200,
  });

  return {
    company: normalizedCompanyName,
    news: buildStructuredFindings(summary, evidence.results).summary,
    sources: evidence.results,
    answer: evidence.answer,
  };
}
