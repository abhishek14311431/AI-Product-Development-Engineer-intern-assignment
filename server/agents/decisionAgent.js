import { generateContent } from '../services/gemini.js';
import { AppError } from '../utils/error.js';

const SCORE_WEIGHTS = Object.freeze({
  growthPotential: 25,
  financialHealth: 25,
  competitiveAdvantage: 20,
  marketSentiment: 15,
  riskLevel: 15,
});

function normalizeText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function clampScore(value) {
  const score = Number(value);

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function extractJsonBlock(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  return trimmed;
}

function buildDecisionPrompt(input) {
  return `You are a disciplined investment decision engine.

Evaluate the following inputs and return a strict JSON object with this shape:
{
  "score": number,
  "decision": "INVEST" | "PASS",
  "reasoning": string
}

Scoring rubric:
- Growth Potential: 25
- Financial Health: 25
- Competitive Advantage: 20
- Market Sentiment: 15
- Risk Level: 15

Rules:
- Score must be out of 100.
- Higher is better.
- If score >= 70, decision must be INVEST.
- If score < 70, decision must be PASS.
- Use the rubric weights to guide the score.
- Keep reasoning concise and tied to the evidence.
- Return JSON only, no markdown, no commentary.

Inputs:
research: ${input.research}
financials: ${input.financials}
news: ${input.news}
competition: ${input.competition}
`;
}

function parseDecisionPayload(value) {
  const jsonText = extractJsonBlock(value);

  if (!jsonText) {
    throw new AppError('Decision agent did not return a usable response.', 502);
  }

  try {
    const parsed = JSON.parse(jsonText);
    const score = clampScore(parsed.score);
    const decision = score >= 70 ? 'INVEST' : 'PASS';
    const reasoning = normalizeText(parsed.reasoning);

    return {
      score,
      decision,
      reasoning: reasoning || 'Decision derived from the available research, financial, news, and competition signals.',
    };
  } catch (error) {
    throw new AppError('Decision agent returned invalid JSON.', 502, {
      error: error.message,
      response: jsonText,
    });
  }
}

export async function createInvestmentDecision(input = {}) {
  const research = normalizeText(input.research);
  const financials = normalizeText(input.financials);
  const news = normalizeText(input.news);
  const competition = normalizeText(input.competition);

  if (!research && !financials && !news && !competition) {
    throw new AppError('At least one analysis input is required for decision making.', 400);
  }

  const prompt = buildDecisionPrompt({
    research,
    financials,
    news,
    competition,
  });

  const response = await generateContent(prompt, {
    temperature: 0.1,
    topP: 0.9,
    maxOutputTokens: 500,
  });

  const result = parseDecisionPayload(response);

  return {
    score: result.score,
    decision: result.decision,
    reasoning: result.reasoning,
    weights: SCORE_WEIGHTS,
  };
}
