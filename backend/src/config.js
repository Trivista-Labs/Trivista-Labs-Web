const DEFAULT_ORIGINS = Object.freeze([
  "https://trivistalabs.io",
  "https://www.trivistalabs.io",
  "https://trivistalabs.lk",
  "https://www.trivistalabs.lk",
  "http://localhost:4321",
  "http://127.0.0.1:4321",
]);

const MAX_PROXY_HOPS = 10;

/**
 * Parse CORS_ORIGINS, a comma-separated list. Falls back to the defaults when empty.
 * @param {string | undefined} raw
 * @returns {string[]}
 */
function parseOrigins(raw) {
  const origins = (raw ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return origins.length > 0 ? origins : [...DEFAULT_ORIGINS];
}

/**
 * Parse TRUST_PROXY_HOPS: how many proxies sit in front of the API. Render uses one.
 * @param {string | undefined} raw
 * @returns {number}
 */
function parseTrustProxy(raw) {
  if (raw === undefined || raw.trim() === "") return 1;
  const value = raw.trim();
  if (!/^\d+$/.test(value) || Number(value) > MAX_PROXY_HOPS) {
    throw new Error(`TRUST_PROXY_HOPS must be a whole number from 0 to ${MAX_PROXY_HOPS}, got "${raw}".`);
  }
  return Number(value);
}

module.exports = { DEFAULT_ORIGINS, parseOrigins, parseTrustProxy };
