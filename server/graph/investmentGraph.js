import { createInvestmentState } from '../state/investmentState.js';
import { createResearchSummary } from '../agents/researchAgent.js';
import { createFinancialAnalysis } from '../agents/financialAgent.js';
import { createNewsAnalysis } from '../agents/newsAgent.js';
import { createCompetitionAnalysis } from '../agents/competitionAgent.js';
import { createInvestmentDecision } from '../agents/decisionAgent.js';
import { AppError } from '../utils/error.js';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { searchTavily } from '../services/tavily.js';
import { generateContent } from '../services/gemini.js';

const InvestmentState = Annotation.Root({
  company: Annotation({ reducer: (_current, next) => next ?? '', default: () => '' }),
  research: Annotation({ reducer: (_current, next) => next ?? '', default: () => '' }),
  researchSources: Annotation({ reducer: (_current, next) => next ?? [], default: () => [] }),
  financials: Annotation({ reducer: (_current, next) => next ?? '', default: () => '' }),
  financialSources: Annotation({ reducer: (_current, next) => next ?? [], default: () => [] }),
  news: Annotation({ reducer: (_current, next) => next ?? '', default: () => '' }),
  newsSources: Annotation({ reducer: (_current, next) => next ?? [], default: () => [] }),
  competition: Annotation({ reducer: (_current, next) => next ?? '', default: () => '' }),
  competitionSources: Annotation({ reducer: (_current, next) => next ?? [], default: () => [] }),
  score: Annotation({ reducer: (_current, next) => next ?? 0, default: () => 0 }),
  decision: Annotation({ reducer: (_current, next) => next ?? '', default: () => '' }),
  reasoning: Annotation({ reducer: (_current, next) => next ?? '', default: () => '' }),
  scoreBreakdown: Annotation({ reducer: (_current, next) => next ?? {}, default: () => ({}) }),
});

function logStep(step, details) {
  console.info(`[investmentGraph] ${step}`, details);
}

function logError(step, error) {
  console.error(`[investmentGraph] ${step} failed`, error);
}

export async function runInvestmentGraph(input = {}) {
  const state = createInvestmentState(input);

  if (!state.company) {
    throw new AppError('company is required to run the investment graph.', 400);
  }

  console.info(`[Validation] Validating company: "${state.company}"`);

  // 1. Tavily Search Validation
  let validationSearch;
  try {
    validationSearch = await searchTavily(`${state.company} company financials business overview products`, { maxResults: 3 });
  } catch (err) {
    console.error(`[Validation Failed] Tavily search error`, err);
    throw new AppError('Company not found or insufficient market information available.', 400);
  }

  if (!validationSearch.results || validationSearch.results.length === 0) {
    console.warn(`[Validation Failed] No search results for "${state.company}"`);
    throw new AppError('Company not found or insufficient market information available.', 400);
  }

  // 2. Gemini verification check
  const verificationPrompt = `Verify if the company "${state.company}" exists as a real, verifiable operating business entity with sufficient public market/financial info available based on these search snippets:
${validationSearch.results.map(r => `Title: ${r.title}\nContent: ${r.content}`).join('\n\n')}

Strict Rule: Respond with ONLY "YES" if it is a real operating company with sufficient public information. Respond with ONLY "NO" if it is not a real company, has insufficient public information, or is a fake/random query. Do not add any punctuation or extra text.`;

  let verificationResult;
  try {
    verificationResult = await generateContent(verificationPrompt, { temperature: 0.0 });
  } catch (err) {
    console.error(`[Validation Failed] Gemini verification error`, err);
    throw new AppError('Company not found or insufficient market information available.', 400);
  }

  const cleanVerify = verificationResult.trim().toUpperCase();
  console.info(`[Validation Result] Company: "${state.company}", Verifiable: ${cleanVerify}`);

  if (cleanVerify !== 'YES') {
    throw new AppError('Company not found or insufficient market information available.', 400);
  }


  const graph = new StateGraph(InvestmentState)
    .addNode('researchNode', async (currentState) => {
      logStep('research-agent', { company: currentState.company });

      try {
        const result = await createResearchSummary(currentState.company);
        return {
          research: result.research,
          researchSources: result.sources,
        };
      } catch (error) {
        logError('research-agent', error);
        throw error instanceof AppError ? error : new AppError('research-agent failed', 502, { cause: error.message });
      }
    })
    .addNode('financialNode', async (currentState) => {
      logStep('financial-agent', { company: currentState.company });

      try {
        const result = await createFinancialAnalysis(currentState.company, {
          researchSummary: currentState.research,
          researchSources: currentState.researchSources || [],
        });

        return {
          financials: result.financials,
          financialSources: result.sources,
        };
      } catch (error) {
        logError('financial-agent', error);
        throw error instanceof AppError ? error : new AppError('financial-agent failed', 502, { cause: error.message });
      }
    })
    .addNode('newsNode', async (currentState) => {
      logStep('news-agent', { company: currentState.company });

      try {
        const result = await createNewsAnalysis(currentState.company);
        return {
          news: result.news,
          newsSources: result.sources,
        };
      } catch (error) {
        logError('news-agent', error);
        throw error instanceof AppError ? error : new AppError('news-agent failed', 502, { cause: error.message });
      }
    })
    .addNode('competitionNode', async (currentState) => {
      logStep('competition-agent', { company: currentState.company });

      try {
        const result = await createCompetitionAnalysis(currentState.company);
        return {
          competition: result.competition,
          competitionSources: result.sources,
        };
      } catch (error) {
        logError('competition-agent', error);
        throw error instanceof AppError ? error : new AppError('competition-agent failed', 502, { cause: error.message });
      }
    })
    .addNode('decisionNode', async (currentState) => {
      logStep('decision-agent', { company: currentState.company });

      try {
        const result = await createInvestmentDecision({
          research: currentState.research,
          financials: currentState.financials,
          news: currentState.news,
          competition: currentState.competition,
        });

        return {
          score: result.score,
          decision: result.decision,
          reasoning: result.reasoning,
          scoreBreakdown: result.scoreBreakdown,
        };
      } catch (error) {
        logError('decision-agent', error);
        throw error instanceof AppError ? error : new AppError('decision-agent failed', 502, { cause: error.message });
      }
    })
    .addEdge(START, 'researchNode')
    .addEdge('researchNode', 'financialNode')
    .addEdge('financialNode', 'newsNode')
    .addEdge('newsNode', 'competitionNode')
    .addEdge('competitionNode', 'decisionNode')
    .addEdge('decisionNode', END);

  const app = graph.compile();
  const decisionResult = await app.invoke(state);

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
    scoreBreakdown: decisionResult.scoreBreakdown,
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
