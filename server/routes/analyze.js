import { runInvestmentGraph } from '../graph/investmentGraph.js';
import { sendJson, readJsonBody } from '../utils/http.js';
import { createValidationError } from '../utils/error.js';

export async function analyzeRoute(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const body = await readJsonBody(req).catch(() => {
    throw createValidationError('Invalid JSON body');
  });

  const company = typeof body?.company === 'string' ? body.company.trim() : '';

  if (!company) {
    throw createValidationError('company is required');
  }

  const result = await runInvestmentGraph({ company });

  sendJson(res, 200, {
    company: result.company,
    research: result.research,
    financialAnalysis: result.financialAnalysis,
    newsAnalysis: result.newsAnalysis,
    competitionAnalysis: result.competitionAnalysis,
    score: result.score,
    decision: result.decision,
    reasoning: result.reasoning,
  });
}
