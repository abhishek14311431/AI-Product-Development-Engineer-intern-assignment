import { AppError } from '../utils/error.js';

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null;
  }

  return apiKey;
}

function cleanTextOutput(value) {
  const text = typeof value === 'string' ? value : '';
  const trimmed = text.trim();

  if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
    return trimmed
      .replace(/^```(?:text|markdown|md)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }

  return trimmed;
}

function extractResponseText(payload) {
  const candidate = payload?.candidates?.[0];
  const parts = candidate?.content?.parts;

  if (Array.isArray(parts)) {
    const text = parts
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('');

    if (text.trim()) {
      return cleanTextOutput(text);
    }
  }

  const fallbackText = payload?.text;
  return cleanTextOutput(fallbackText);
}

function extractCompany(prompt) {
  const companyMatch = prompt.match(/Company:\s*([^\n]+)/i);
  return companyMatch ? companyMatch[1].trim() : 'the company';
}

function generateMockContent(prompt) {
  const company = extractCompany(prompt);

  if (prompt.includes('senior investment research analyst')) {
    return `- Business Model
${company} operates a high-margin, scalable business model focusing on innovative technology and digital service delivery. They monetize through a mix of subscription plans, direct sales, and ecosystem partnerships.

- Revenue Drivers
Primary drivers include core product sales volume, expansion of subscription services, and recurring licensing revenues. Secondary drivers are international market penetration and upselling to existing enterprise clients.

- Products & Services
Flagship hardware and software products, cloud integration services, and developer ecosystem platforms. They regularly release firmware updates and feature expansions to maintain product value.

- Market Position
A market leader in its core segments, characterized by strong brand loyalty and high customer retention. They hold significant market share but face intense competition from legacy players and nimble startups.

- Industry Trends
Growing adoption of AI and cloud automation, shift toward subscription-oriented billing, and increased regulatory focus on data privacy and environmental sustainability.

- Growth Opportunities
Expansion into emerging markets, integration of advanced machine learning capabilities across product suites, and strategic mergers and acquisitions to capture adjacent markets.

- Key Risks
Supply chain dependencies, intense competitive pricing pressure, talent acquisition challenges, and macroeconomic headwinds affecting customer enterprise budgets.`;
  }

  if (prompt.includes('senior equity research analyst')) {
    return `- Revenue Growth
Double-digit year-over-year revenue growth driven by sustained demand for core products and accelerated subscription adoption. International segment growth is outpacing domestic markets.

- Profitability
Operating margins remain strong at 22%, driven by scale efficiencies and high-margin software services. Gross margins are stable at 65% despite rising supply chain costs.

- Debt Position
Solid balance sheet with a low debt-to-equity ratio of 0.25. High interest coverage ratio ensures obligations are easily met.

- Cash Flow Strength
Robust free cash flow generation, representing 18% of revenue. Strong cash conversion cycle allows for continuous reinvestment and share buybacks.

- Financial Stability
Cash and cash equivalents of over $5B provide a massive cushion against market downturns and support long-term strategic initiatives.

- Strengths
1. Excellent liquidity and low leverage.
2. High recurring revenue mix (45% of total).
3. Strong return on invested capital (ROIC) of 18%.

- Weaknesses
1. Vulnerability to high component cost inflation.
2. Increased research and development (R&D) spending required to maintain competitive edge.`;
  }

  if (prompt.includes('market intelligence analyst writing a company-specific news brief')) {
    return `- Positive Signals
* Announced a major strategic partnership to integrate advanced AI into their product lineup.
* Reported record-breaking quarterly deliveries, beating analyst estimates by 4%.
* Received regulatory approvals for expansion into key European markets.

- Negative Signals
* Faced temporary supply chain bottlenecks in key manufacturing hubs.
* A competitor announced a lower-priced alternative, potentially threatening mid-tier market share.
* Minor patent dispute filed by a patent holding company, though legal teams expect a favorable outcome.

- Overall Market Sentiment
Market sentiment is bullish, with strong institutional buying and favorable analyst coverage citing long-term growth tailwinds.`;
  }

  if (prompt.includes('competitive intelligence analyst comparing')) {
    return `- Strengths
* Industry-leading brand equity and customer loyalty.
* High R&D efficiency leading to rapid product cycles.
* Vertically integrated supply chain mitigating external disruptions.

- Weaknesses
* Premium pricing makes it vulnerable to low-cost competitors during economic downturns.
* High dependence on a few key suppliers for proprietary components.

- Competitive Position
${company} occupies a premium leader position in the quadrant. While low-cost alternatives are expanding their features, ${company} maintains a technological lead of 12-18 months, securing its high margin profile.`;
  }

  return `Mock response for ${company}. No matching template found.`;
}

async function readErrorBody(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    return await response.text();
  } catch {
    return null;
  }
}

export async function generateContent(prompt, options = {}) {
  if (typeof prompt !== 'string' || !prompt.trim()) {
    throw new AppError('Prompt is required for Gemini generation.', 400);
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.info(`[Gemini Service] Running in Mock/Demo mode for: ${extractCompany(prompt)}`);
    return generateMockContent(prompt);
  }

  const model = options.model || DEFAULT_GEMINI_MODEL;
  const url = `${GEMINI_API_BASE_URL}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: options.temperature ?? 0.2,
        topP: options.topP ?? 0.95,
        maxOutputTokens: options.maxOutputTokens ?? 1024,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await readErrorBody(response);
    throw new AppError('Gemini API request failed.', 502, {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });
  }

  const payload = await response.json();
  const text = extractResponseText(payload);

  if (!text) {
    throw new AppError('Gemini response did not include text output.', 502, {
      payload,
      });
    }

    return text;
  }

