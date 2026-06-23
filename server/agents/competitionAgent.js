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
        lines.push(`- Competition Source ${index + 1}: ${title}`);
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

function buildPeerComparison(results) {
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

function buildCompetitionSummaryPrompt(companyName, searchPayload) {
  const results = searchPayload.results || [];
  const searchContext = formatSearchResults(results);
  const evidenceNotes = buildEvidenceNotes(results);
  const peerComparison = buildPeerComparison(results);

  return `You are a competitive intelligence analyst comparing ${companyName} against its direct rivals.

Company: ${companyName}

Use only the supplied research evidence. Avoid generic market commentary. Ground every statement in the search results.

Return the analysis with these sections exactly:
- Strengths
- Weaknesses
- Competitive Position

What to identify:
- Top competitors
- Market leaders
- Competitive advantages
- Competitive weaknesses
- Company vs competitors comparison

Rules:
- Prefer concrete names, product categories, market segments, or positioning claims from the evidence.
- If evidence is weak, say "No clear evidence found" rather than guessing.
- Keep the answer concise, specific, and evidence-based.
- Use bullet points or short labeled sentences.

Evidence:
${searchContext || 'No search results were returned.'}

Evidence Notes:
${evidenceNotes || 'No concrete evidence notes could be extracted.'}

Peer Comparison Candidates:
${peerComparison || 'No peer comparison candidates could be extracted.'}
`;
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
  const prompt = buildCompetitionSummaryPrompt(normalizedCompanyName, evidence);
  const summary = await generateContent(prompt, {
    model: options.model,
    temperature: options.temperature ?? 0.2,
    topP: options.topP ?? 0.95,
    maxOutputTokens: options.maxOutputTokens ?? 1200,
  });

  return {
    company: normalizedCompanyName,
    competition: buildStructuredFindings(summary, evidence.results).summary,
    sources: evidence.results,
    answer: evidence.answer,
  };
}
