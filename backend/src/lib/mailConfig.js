// Chooses how the API sends email, from its environment variables.
// Resend (over HTTPS) when RESEND_API_KEY is set, which is what runs on Render. Otherwise Gmail over
// SMTP, which still works for local development.

/** @param {Record<string, string | undefined>} env @param {string} name */
const read = (env, name) => (env[name] ?? "").trim();

/**
 * @param {Record<string, string | undefined>} env
 * @returns {{ ok: true, config:
 *     | { provider: "resend", apiKey: string, from: string, to: string }
 *     | { provider: "smtp", user: string, pass: string, from: string, to: string } }
 *   | { ok: false, missing: string[] }}
 */
function readMailConfig(env) {
  const apiKey = read(env, "RESEND_API_KEY");
  if (apiKey) {
    const from = read(env, "MAIL_FROM");
    const to = read(env, "CONTACT_TO");
    const missing = [!from && "MAIL_FROM", !to && "CONTACT_TO"].filter(Boolean);
    return missing.length > 0 ? { ok: false, missing } : { ok: true, config: { provider: "resend", apiKey, from, to } };
  }

  const user = read(env, "EMAIL_USER");
  const pass = read(env, "EMAIL_PASS");
  if (!user && !pass) return { ok: false, missing: ["RESEND_API_KEY (or EMAIL_USER and EMAIL_PASS)"] };
  const missing = [!user && "EMAIL_USER", !pass && "EMAIL_PASS"].filter(Boolean);
  if (missing.length > 0) return { ok: false, missing };
  return { ok: true, config: { provider: "smtp", user, pass, from: user, to: read(env, "CONTACT_TO") || user } };
}

module.exports = { readMailConfig };
