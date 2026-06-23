const BASE_INVESTMENT_STATE = Object.freeze({
  company: '',
  research: '',
  researchSources: [],
  financials: '',
  financialSources: [],
  news: '',
  newsSources: [],
  competition: '',
  competitionSources: [],
  score: 0,
  decision: '',
  reasoning: '',
});

function toText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function toScore(value) {
  const score = Number(value);
  return Number.isFinite(score) ? score : 0;
}

function toList(value) {
  return Array.isArray(value) ? value : [];
}

export function createInvestmentState(overrides = {}) {
  return {
    ...BASE_INVESTMENT_STATE,
    company: toText(overrides.company),
    research: toText(overrides.research),
    researchSources: toList(overrides.researchSources),
    financials: toText(overrides.financials),
    financialSources: toList(overrides.financialSources),
    news: toText(overrides.news),
    newsSources: toList(overrides.newsSources),
    competition: toText(overrides.competition),
    competitionSources: toList(overrides.competitionSources),
    score: toScore(overrides.score),
    decision: toText(overrides.decision),
    reasoning: toText(overrides.reasoning),
  };
}

export const investmentStateFields = Object.freeze([
  'company',
  'research',
  'researchSources',
  'financials',
  'financialSources',
  'news',
  'newsSources',
  'competition',
  'competitionSources',
  'score',
  'decision',
  'reasoning',
]);

export const initialInvestmentState = BASE_INVESTMENT_STATE;
