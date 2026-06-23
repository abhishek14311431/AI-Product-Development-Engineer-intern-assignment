import { AppError } from '../utils/error.js';

const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
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

async function fetchWithRetry(url, fetchOptions, retries = 4, delay = 2000) {
  let lastResponse;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, fetchOptions);

      if ((response.status === 503 || response.status === 429) && i < retries - 1) {
        // Try to honour the Retry-After / retry delay from the API response
        let waitMs = delay;
        const retryAfterHeader = response.headers.get('retry-after') || response.headers.get('x-ratelimit-reset-after');
        if (retryAfterHeader) {
          const secs = parseFloat(retryAfterHeader);
          if (Number.isFinite(secs) && secs > 0) waitMs = Math.ceil(secs * 1000) + 500;
        }

        console.warn(`[Gemini API] Received status ${response.status}. Retrying in ${waitMs}ms... (Attempt ${i + 1}/${retries})`);
        lastResponse = response;
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        delay *= 2;
        continue;
      }

      return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`[Gemini API] Network error: ${err.message}. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  // All retries exhausted on rate-limit/service-unavailable
  throw new AppError(
    `Gemini API unavailable after ${retries} retries (last status: ${lastResponse?.status ?? 'unknown'}).`,
    503,
  );
}

export async function generateContent(prompt, options = {}) {
  if (typeof prompt !== 'string' || !prompt.trim()) {
    throw new AppError('Prompt is required for Gemini generation.', 400);
  }

  const apiKey = getGeminiApiKey();
  const model = options.model || DEFAULT_GEMINI_MODEL;
  const url = `${GEMINI_API_BASE_URL}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  console.info(`[Gemini Request] Model: ${model}, Prompt Length: ${prompt.length} chars`);

  const response = await fetchWithRetry(url, {
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
    console.error(`[Gemini Request Failed] Status: ${response.status}`, errorBody);
    throw new AppError('Gemini API request failed.', 502, {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });
  }

  const payload = await response.json();
  const text = extractResponseText(payload);

  if (!text) {
    console.error('[Gemini Response Failed] No text returned', payload);
    throw new AppError('Gemini response did not include text output.', 502, {
      payload,
    });
  }

  console.info(`[Gemini Response] Output Length: ${text.length} chars`);
  return text;
}


