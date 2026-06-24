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
  "scoreBreakdown": {
    "growthPotential": number,      // Score out of 25 (higher is better growth prospects)
    "financialHealth": number,      // Score out of 25 (higher is stronger balance sheet/margins)
    "competitiveAdvantage": number, // Score out of 20 (higher is stronger moat)
    "marketSentiment": number,      // Score out of 15 (higher is more positive sentiment/news)
    "riskAssessment": number        // Score out of 15 (higher is lower risk / safer profile)
  },
  "decision": "INVEST" | "PASS" | "INSUFFICIENT_DATA" | "INVALID_COMPANY",
  "reasoning": string
}

Scoring Rubric:
- Growth Potential: max 25 points
- Financial Health: max 25 points
- Competitive Advantage: max 20 points
- Market Sentiment: max 15 points
- Risk Assessment: max 15 points
Total possible score = 100.

Rules:
- If the inputs indicate that the company is invalid, fake, or not an active business entity, return decision "INVALID_COMPANY" and set all scoreBreakdown values to 0.
- If the inputs contain insufficient public financial or market information to evaluate the key components, return decision "INSUFFICIENT_DATA" and set all scoreBreakdown values to 0.
- Otherwise, score the five categories honestly based on the evidence. The total score will be the sum of these five categories.
- If the total score >= 70, the decision must be "INVEST".
- If the total score < 70, the decision must be "PASS".
- Keep reasoning concise and directly tied to the evidence in the inputs.
- Return ONLY the raw JSON block. No markdown, no formatting, no extra explanation text.

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
    const decision = parsed.decision?.trim() || 'PASS';
    const reasoning = normalizeText(parsed.reasoning) || 'Decision derived from available evidence.';

    if (decision === 'INVALID_COMPANY' || decision === 'INSUFFICIENT_DATA') {
      return {
        score: 0,
        decision,
        reasoning,
        scoreBreakdown: {
          growthPotential: 0,
          financialHealth: 0,
          competitiveAdvantage: 0,
          marketSentiment: 0,
          riskAssessment: 0,
        },
      };
    }

    const breakdown = parsed.scoreBreakdown || {};
    const growthPotential = Math.max(0, Math.min(25, Math.round(Number(breakdown.growthPotential || 0))));
    const financialHealth = Math.max(0, Math.min(25, Math.round(Number(breakdown.financialHealth || 0))));
    const competitiveAdvantage = Math.max(0, Math.min(20, Math.round(Number(breakdown.competitiveAdvantage || 0))));
    const marketSentiment = Math.max(0, Math.min(15, Math.round(Number(breakdown.marketSentiment || 0))));
    const riskAssessment = Math.max(0, Math.min(15, Math.round(Number(breakdown.riskAssessment || 0))));

    const totalScore = growthPotential + financialHealth + competitiveAdvantage + marketSentiment + riskAssessment;
    const finalDecision = totalScore >= 70 ? 'INVEST' : 'PASS';

    return {
      score: totalScore,
      decision: finalDecision,
      reasoning,
      scoreBreakdown: {
        growthPotential,
        financialHealth,
        competitiveAdvantage,
        marketSentiment,
        riskAssessment,
      },
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
      model: 'gemini-3.1-flash-lite',
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
      scoreBreakdown: result.scoreBreakdown,
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
