import 'dotenv/config';
import http from 'node:http';
import { routeRequest } from './routes/index.js';
import { applyCors } from './utils/cors.js';
import { getEnv, getPort } from './utils/env.js';
import { AppError, createNotFoundError } from './utils/error.js';

const port = getPort();
const corsOrigin = getEnv('CORS_ORIGIN', '*');

const server = http.createServer(async (req, res) => {
  try {
    applyCors(res, corsOrigin);

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const urlParts = url.pathname.split('/').filter(Boolean);

    if (urlParts.length === 0) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: true, message: 'Investment Research Server is running' }));
      return;
    }

    await routeRequest(req, res, urlParts);
  } catch (error) {
    console.error('[server error]', error?.stack || error);
    const appError = error instanceof AppError
      ? error
      : new AppError(error?.message || 'Internal server error', 500);
    res.statusCode = appError.statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    let safeDetails;
    try {
      safeDetails = appError.details ? JSON.parse(JSON.stringify(appError.details)) : undefined;
    } catch {
      safeDetails = { raw: String(appError.details) };
    }

    res.end(JSON.stringify({
      success: false,
      error: appError.message,
      ...(safeDetails !== undefined && { details: safeDetails }),
    }));
  }
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
