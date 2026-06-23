import { createInvestmentState } from '../state/investmentState.js';
import { createResearchSummary } from '../agents/researchAgent.js';
import { createFinancialAnalysis } from '../agents/financialAgent.js';
import { createNewsAnalysis } from '../agents/newsAgent.js';
import { createCompetitionAnalysis } from '../agents/competitionAgent.js';
import { createInvestmentDecision } from '../agents/decisionAgent.js';
import { AppError } from '../utils/error.js';

function logStep(step, details) {
  console.info(`[investmentGraph] ${step}`, details);
}

function logError(step, error) {
  console.error(`[investmentGraph] ${step} failed`, error);
}

async function runNode(step, state, handler) {
  logStep(step, { company: state.company });

  try {
    return await handler(state);
  } catch (error) {
    logError(step, error);
    throw error instanceof AppError
      ? error
      : new AppError(`${step} failed`, 502, { cause: error.message });
  }
}

export async function runInvestmentGraph(input = {}) {
  const state = createInvestmentState(input);

  if (!state.company) {
    throw new AppError('company is required to run the investment graph.', 400);
  }

  const researchResult = await runNode('research-agent', state, async (currentState) => {
    const result = await createResearchSummary(currentState.company);
    return {
      ...currentState,
      research: result.research,
      researchSources: result.sources,
    };
  });

  const financialResult = await runNode('financial-agent', researchResult, async (currentState) => {
    const result = await createFinancialAnalysis(currentState.company, {
      researchSummary: currentState.research,
      researchSources: currentState.researchSources || [],
    });
    return {
      ...currentState,
      financials: result.financials,
    };
  });

  const newsResult = await runNode('news-agent', financialResult, async (currentState) => {
    const result = await createNewsAnalysis(currentState.company);
    return {
      ...currentState,
      news: result.news,
    };
  });

  const competitionResult = await runNode('competition-agent', newsResult, async (currentState) => {
    const result = await createCompetitionAnalysis(currentState.company);
    return {
      ...currentState,
      competition: result.competition,
    };
  });

  const decisionResult = await runNode('decision-agent', competitionResult, async (currentState) => {
    const result = await createInvestmentDecision({
      research: currentState.research,
      financials: currentState.financials,
      news: currentState.news,
      competition: currentState.competition,
    });

    return {
      ...currentState,
      score: result.score,
      decision: result.decision,
      reasoning: result.reasoning,
    };
  });

  logStep('workflow-complete', {
    company: decisionResult.company,
    score: decisionResult.score,
    decision: decisionResult.decision,
  });

  return {
    company: decisionResult.company,
    research: decisionResult.research,
    financialAnalysis: decisionResult.financials,
    newsAnalysis: decisionResult.news,
    competitionAnalysis: decisionResult.competition,
    score: decisionResult.score,
    decision: decisionResult.decision,
    reasoning: decisionResult.reasoning,
  };
}

export const investmentGraph = Object.freeze({
  name: 'investmentGraph',
  nodes: [
    'research-agent',
    'financial-agent',
    'news-agent',
    'competition-agent',
    'decision-agent',
  ],
  run: runInvestmentGraph,
});
