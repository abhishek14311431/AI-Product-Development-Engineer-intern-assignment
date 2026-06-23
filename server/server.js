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
      throw createNotFoundError();
    }

    await routeRequest(req, res, urlParts);
  } catch (error) {
    console.error('[server error]', error);
    const appError = error instanceof AppError ? error : new AppError('Internal server error', 500);
    res.statusCode = appError.statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({
      error: appError.message,
      details: appError.details || undefined,
    }));
  }
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
