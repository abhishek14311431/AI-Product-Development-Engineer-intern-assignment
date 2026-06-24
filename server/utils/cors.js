export function applyCors(res, origin) {
  const allowedOrigin = origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (allowedOrigin !== '*') {
    res.setHeader('Vary', 'Origin');
  }
}
