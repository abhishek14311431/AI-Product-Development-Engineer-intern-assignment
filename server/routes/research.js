import { createResearchJob, getResearchJob, getResearchReport, rerunResearchJob } from '../services/researchService.js';
import { sendJson, readJsonBody } from '../utils/http.js';
import { createValidationError } from '../utils/error.js';

export async function researchRoutes(req, res, urlParts) {
  const [resource, jobId, action] = urlParts;

  if (req.method === 'POST' && resource === 'research' && !jobId) {
    const body = await readJsonBody(req).catch(() => {
      throw createValidationError('Invalid JSON body');
    });

    const job = createResearchJob(body);
    sendJson(res, 202, job);
    return;
  }

  if (!jobId) {
    sendJson(res, 404, { error: 'Route not found' });
    return;
  }

  if (req.method === 'GET' && action === undefined) {
    sendJson(res, 200, getResearchJob(jobId));
    return;
  }

  if (req.method === 'GET' && action === 'report') {
    sendJson(res, 200, getResearchReport(jobId));
    return;
  }

  if (req.method === 'POST' && action === 'rerun') {
    const body = await readJsonBody(req).catch(() => {
      throw createValidationError('Invalid JSON body');
    });

    sendJson(res, 202, rerunResearchJob(jobId, body));
    return;
  }

  sendJson(res, 404, { error: 'Route not found' });
}
