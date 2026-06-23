import { AppError } from '../utils/error.js';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

const SCORE_WEIGHTS = Object.freeze({
  growthPotential: 25,
  financialHealth: 25,
  competitiveAdvantage: 20,
  marketSentiment: 15,
  riskAssessment: 15,
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
  "decision": "INVEST" | "PASS" | "INSUFFICIENT_DATA" | "INVALID_COMPANY",
  "reasoning": string
}

Scoring rubric:
- Growth Potential: 25
- Financial Health: 25
- Competitive Advantage: 20
- Market Sentiment: 15
- Risk Assessment: 15

Rules:
- Score must be out of 100.
- Higher is better.
- If score >= 70, decision must be INVEST.
- If score < 70, decision must be PASS.
- Use the rubric weights to guide the score.
- If the inputs contain insufficient data to calculate a score or assess key components, return decision as "INSUFFICIENT_DATA" and score as 0.
- If the inputs indicate that the company is invalid, fake, or not an active business entity, return decision as "INVALID_COMPANY" and score as 0.
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
    const decision = parsed.decision;
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

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new AppError('Missing Gemini API key. Set GEMINI_API_KEY in .env.', 500);
  }

  console.info(`[Decision Agent] Invoking ChatGoogleGenerativeAI for decision synthesis...`);

  try {
    const model = new ChatGoogleGenerativeAI({
      apiKey: apiKey,
      model: 'gemini-2.5-flash',
      temperature: 0.1,
    });

    const response = await model.invoke(prompt);
    const text = Array.isArray(response?.content)
      ? response.content.map((part) => (typeof part?.text === 'string' ? part.text : '')).join('')
      : typeof response?.content === 'string'
        ? response.content
        : '';

    console.info(`[Decision Agent] Raw response length: ${text.length} chars`);
    const result = parseDecisionPayload(text);

    return {
      score: result.score,
      decision: result.decision,
      reasoning: result.reasoning,
      scoreBreakdown: SCORE_WEIGHTS,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      `Decision agent failed: ${err?.message || 'Unknown error'}`,
      502,
      { cause: err?.message },
    );
  }
}

