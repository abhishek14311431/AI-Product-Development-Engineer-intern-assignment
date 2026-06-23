const BASE_INVESTMENT_STATE = Object.freeze({
  company: '',
  research: '',
  financials: '',
  news: '',
  competition: '',
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

export function createInvestmentState(overrides = {}) {
  return {
    ...BASE_INVESTMENT_STATE,
    company: toText(overrides.company),
    research: toText(overrides.research),
    financials: toText(overrides.financials),
    news: toText(overrides.news),
    competition: toText(overrides.competition),
    score: toScore(overrides.score),
    decision: toText(overrides.decision),
    reasoning: toText(overrides.reasoning),
  };
}

export const investmentStateFields = Object.freeze([
  'company',
  'research',
  'financials',
  'news',
  'competition',
  'score',
  'decision',
  'reasoning',
]);

export const initialInvestmentState = BASE_INVESTMENT_STATE;
