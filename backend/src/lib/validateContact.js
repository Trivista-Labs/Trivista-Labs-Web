const { PROJECT_TYPE_LABELS, TIMELINE_LABELS } = require("./options");

const PROJECT_TYPES = Object.freeze(Object.keys(PROJECT_TYPE_LABELS));
const TIMELINES = Object.freeze(Object.keys(TIMELINE_LABELS));

const LIMITS = Object.freeze({
  name: 100,
  email: 254,
  company: 120,
  message: 5000,
  messageMin: 10,
});

// Deliberately conservative. Quotes, angle brackets, percent signs, spaces and non-ASCII
// characters are legal in rare addresses but far more common in abuse, so they are rejected.
const EMAIL_PATTERN = /^[A-Za-z0-9._+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

/** People never see this field. Automated senders tend to fill it. */
const HONEYPOT_FIELD = "contact_ref";

const CONTROL_CHARS = /[\u0000-\u001F\u007F]+/g;
const CONTROL_CHARS_EXCEPT_NEWLINE_AND_TAB = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
// Direction overrides can make text display in a misleading order. The zero-width
// joiners (U+200C, U+200D) are kept because Sinhala script needs them.
const BIDI_CONTROLS = /[‎‏‪-‮⁦-⁩]/g;

const toSingleLine = (text) =>
  text.replace(BIDI_CONTROLS, "").replace(CONTROL_CHARS, " ").replace(/\s{2,}/g, " ").trim();
const toMultiLine = (text) =>
  text
    .replace(BIDI_CONTROLS, "")
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHARS_EXCEPT_NEWLINE_AND_TAB, "")
    .trim();

/**
 * Read an optional or required text field.
 * @returns {{ value?: string, error?: string }}
 */
function readText(raw, { label, required, max, multiline = false }) {
  if (raw === undefined || raw === null) {
    return required ? { error: `Please enter ${label}.` } : {};
  }
  if (typeof raw !== "string") {
    return { error: `Please enter ${label} as text.` };
  }
  const value = multiline ? toMultiLine(raw) : toSingleLine(raw);
  if (value === "") {
    return required ? { error: `Please enter ${label}.` } : {};
  }
  if (value.length > max) {
    return { error: `Please keep ${label} under ${max.toLocaleString("en-US")} characters.` };
  }
  return { value };
}

function readChoice(raw, allowed, message) {
  if (raw === undefined || raw === null || raw === "") return {};
  if (typeof raw !== "string" || !allowed.includes(raw)) return { error: message };
  return { value: raw };
}

function isHoneypotFilled(raw) {
  if (raw === undefined || raw === null) return false;
  if (typeof raw === "string") return raw.trim() !== "";
  return true;
}

/**
 * Validate a contact form submission.
 * @param {unknown} body
 * @returns {{ ok: true, isSpam: boolean, value: {
 *   name: string, email: string, company?: string,
 *   projectType?: string, timeline?: string, message: string } }
 *   | { ok: false, errors: Record<string, string> }}
 */
function validateContact(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, errors: { form: "The request could not be read." } };
  }

  const name = readText(body.name, { label: "your name", required: true, max: LIMITS.name });
  const email = readText(body.email, { label: "your email address", required: true, max: LIMITS.email });
  const company = readText(body.company, { label: "the company name", required: false, max: LIMITS.company });
  const message = readText(body.message, {
    label: "a message about your project",
    required: true,
    max: LIMITS.message,
    multiline: true,
  });
  const projectType = readChoice(body.projectType, PROJECT_TYPES, "Please choose a project type from the list.");
  const timeline = readChoice(body.timeline, TIMELINES, "Please choose a timeline from the list.");

  const errors = {};
  if (name.error) errors.name = name.error;
  if (email.error) {
    errors.email = email.error;
  } else if (!EMAIL_PATTERN.test(email.value)) {
    errors.email = "Please enter a valid email address.";
  }
  if (company.error) errors.company = company.error;
  if (projectType.error) errors.projectType = projectType.error;
  if (timeline.error) errors.timeline = timeline.error;
  if (message.error) {
    errors.message = message.error;
  } else if (message.value.length < LIMITS.messageMin) {
    errors.message = `Please add a little more detail (at least ${LIMITS.messageMin} characters).`;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    isSpam: isHoneypotFilled(body[HONEYPOT_FIELD]),
    value: {
      name: name.value,
      email: email.value,
      company: company.value,
      projectType: projectType.value,
      timeline: timeline.value,
      message: message.value,
    },
  };
}

module.exports = { validateContact, PROJECT_TYPES, TIMELINES, LIMITS, HONEYPOT_FIELD };
