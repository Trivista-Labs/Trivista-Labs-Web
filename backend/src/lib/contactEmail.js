const { escapeHtml } = require("./escapeHtml");
const { PROJECT_TYPE_LABELS, TIMELINE_LABELS } = require("./options");

const NOT_GIVEN = "Not given";
const SUBJECT_MAX = 150;

const receivedFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Colombo",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const singleLine = (text) =>
  text
    .replace(/[‎‏‪-‮⁦-⁩]/g, "")
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

const labelFor = (labels, value) => (value && labels[value]) || NOT_GIVEN;

function buildSubject({ name, company }) {
  const subject = singleLine(`New enquiry from ${name}${company ? ` (${company})` : ""}`);
  return subject.length > SUBJECT_MAX ? `${subject.slice(0, SUBJECT_MAX - 1)}…` : subject;
}

function buildHtml(details, message, received) {
  const rows = details
    .map(
      ([label, value, href]) => `
          <tr>
            <td style="padding:8px 16px 8px 0;color:#676A6C;font-size:13px;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td>
            <td style="padding:8px 0;color:#16181A;font-size:15px;">${
              href ? `<a href="${escapeHtml(href)}" style="color:#006F60;">${escapeHtml(value)}</a>` : escapeHtml(value)
            }</td>
          </tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#F6F4EE;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #DDD9CE;">
      <div style="padding:20px 28px;border-bottom:1px solid #DDD9CE;">
        <p style="margin:0;color:#006F60;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">Trivista Labs website</p>
        <h1 style="margin:6px 0 0;color:#16181A;font-size:20px;">New project enquiry</h1>
      </div>
      <div style="padding:20px 28px;">
        <table role="presentation" style="border-collapse:collapse;width:100%;">${rows}
        </table>
        <p style="margin:24px 0 8px;color:#676A6C;font-size:13px;">Message</p>
        <div style="padding:16px;background:#F6F4EE;color:#16181A;font-size:15px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</div>
      </div>
      <p style="margin:0;padding:16px 28px;border-top:1px solid #DDD9CE;color:#676A6C;font-size:12px;">Received ${escapeHtml(received)} (Sri Lanka time). Reply to this email to answer the sender directly.</p>
    </div>
  </body>
</html>`;
}

/**
 * Build the notification email for a validated contact submission.
 * Every visitor-supplied value is escaped before it is placed in the HTML.
 * @param {{ name: string, email: string, company?: string, projectType?: string,
 *   timeline?: string, message: string }} contact
 * @param {{ from: string, to: string, receivedAt?: Date }} options
 */
function buildContactEmail(contact, { from, to, receivedAt = new Date() }) {
  const received = receivedFormat.format(receivedAt);
  const details = [
    ["Name", contact.name],
    ["Email", contact.email, `mailto:${contact.email}`],
    ["Company", contact.company || NOT_GIVEN],
    ["Project type", labelFor(PROJECT_TYPE_LABELS, contact.projectType)],
    ["Timeline", labelFor(TIMELINE_LABELS, contact.timeline)],
  ];

  const text = [
    "New project enquiry from the Trivista Labs website",
    "",
    ...details.map(([label, value]) => `${label}: ${value}`),
    "",
    "Message:",
    contact.message,
    "",
    `Received ${received} (Sri Lanka time).`,
  ].join("\n");

  return {
    from: { name: "Trivista Labs website", address: from },
    to,
    replyTo: { name: contact.name, address: contact.email },
    subject: buildSubject(contact),
    text,
    html: buildHtml(details, contact.message, received),
  };
}

module.exports = { buildContactEmail };
