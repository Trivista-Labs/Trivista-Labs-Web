// Sends email through Resend's HTTPS API. Render's plan blocks outgoing SMTP, which is how Gmail
// sending works, but allows HTTPS. Takes the same mail object as nodemailer's sendMail.

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_TIMEOUT_MS = 10_000;

/** @param {{ name?: string, address: string }} sender */
const formatSender = ({ name, address }) => (name ? `${name} <${address}>` : address);

/** @param {string | { address: string } | Array<string | { address: string }>} value */
const addresses = (value) =>
  (Array.isArray(value) ? value : [value]).map((entry) => (typeof entry === "string" ? entry : entry.address));

/**
 * @param {{ apiKey: string, fetchImpl?: typeof fetch, timeoutMs?: number }} options
 * @returns {(mail: {
 *   from: { name?: string, address: string },
 *   to: string | string[],
 *   replyTo?: { name?: string, address: string },
 *   subject: string,
 *   text: string,
 *   html: string,
 * }) => Promise<unknown>}
 */
function createResendMailer({ apiKey, fetchImpl = fetch, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  if (!apiKey) throw new Error("RESEND_API_KEY is needed to send email through Resend.");

  return async function sendMail(mail) {
    const payload = {
      from: formatSender(mail.from),
      to: addresses(mail.to),
      // Only the address: the visitor's name never goes into a mail header.
      ...(mail.replyTo ? { reply_to: addresses(mail.replyTo) } : {}),
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    };

    const response = await fetchImpl(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      const reason = body && typeof body.message === "string" ? `: ${body.message}` : "";
      throw new Error(`Resend refused the email (${response.status})${reason}`);
    }
    return body;
  };
}

module.exports = { createResendMailer, RESEND_ENDPOINT };
