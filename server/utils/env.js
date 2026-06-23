export function getEnv(name, fallback = '') {
  const value = process.env[name];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

export function getPort() {
  const value = Number.parseInt(getEnv('PORT', '3001'), 10);
  return Number.isNaN(value) ? 3001 : value;
}
