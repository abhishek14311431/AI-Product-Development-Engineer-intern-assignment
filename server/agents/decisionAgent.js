import { AppError } from '../utils/error.js';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';

const SCORE_WEIGHTS = Object.freeze({
  growthPotential: 25,
  financialHealth: 25,
  competitiveAdvantage: 20,
  marketSentiment: 15,
  riskLevel: 15,
});

const decisionSchema = z.object({
  score: z.number().min(0).max(100),
  decision: z.enum(['INVEST', 'PASS']),
  reasoning: z.string().min(1),
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
score guidance: Use the evidence across all previous agents. Do not invent positive signals or penalize the company without supporting evidence.
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

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.info(`[Decision Agent] Running in Mock/Demo mode.`);
    const score = 78;
    return {
      score: score,
      decision: 'INVEST',
      reasoning: `Based on mock analysis, this entity demonstrates robust fundamentals, solid profit margins of 22%, and leading competitive advantage in R&D that outpace minor supply chain headwinds. (Mock results for display purposes).`,
      scoreBreakdown: SCORE_WEIGHTS,
    };
  }

  const model = new ChatGoogleGenerativeAI({
    apiKey: apiKey,
    model: 'gemini-2.5-flash',
    temperature: 0.1,
  });

  const parser = StructuredOutputParser.fromZodSchema(decisionSchema);
  const parserInstructions = parser.getFormatInstructions();

  const response = await model.invoke(`${prompt}\n\n${parserInstructions}`);
  const text = Array.isArray(response?.content)
    ? response.content.map((part) => (typeof part?.text === 'string' ? part.text : '')).join('')
    : typeof response?.content === 'string'
      ? response.content
      : '';
  const result = parseDecisionPayload(text);

  return {
    score: result.score,
    decision: result.decision,
    reasoning: result.reasoning,
    scoreBreakdown: SCORE_WEIGHTS,
  };
}
