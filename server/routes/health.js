import { sendJson } from '../utils/http.js';

export function healthRoute(_req, res) {
  sendJson(res, 200, {
    ok: true,
    service: 'investment-research-server',
    timestamp: new Date().toISOString(),
  });
}
