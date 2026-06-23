import { AppError } from '../utils/error.js';

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new AppError('Missing Gemini API key. Set GEMINI_API_KEY in .env.', 500);
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
