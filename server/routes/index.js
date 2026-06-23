import { healthRoute } from './health.js';
import { researchRoutes } from './research.js';
import { analyzeRoute } from './analyze.js';
import { sendJson } from '../utils/http.js';

export async function routeRequest(req, res, urlParts) {
  if (req.method === 'GET' && urlParts[0] === 'health') {
    healthRoute(req, res);
    return;
  }

  if (urlParts[0] === 'research') {
    await researchRoutes(req, res, urlParts);
    return;
  }

  if (urlParts[0] === 'analyze') {
    await analyzeRoute(req, res);
    return;
  }

  sendJson(res, 404, { error: 'Route not found' });
}
