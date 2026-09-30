// Client-side rules for the contact form. They mirror backend/src/lib/validateContact.js,
// which stays the source of truth; tests/unit/contact.test.ts checks the option lists match.

export type Option = { readonly value: string; readonly label: string };

export const PROJECT_TYPES: readonly Option[] = [
  { value: "web-mobile", label: "Web or mobile app" },
  { value: "business-system", label: "Business system" },
  { value: "hardware-iot", label: "Hardware or IoT" },
  { value: "infrastructure", label: "Infrastructure or IT" },
  { value: "not-sure", label: "Not sure yet" },
];

export const TIMELINES: readonly Option[] = [
  { value: "asap", label: "As soon as possible" },
  { value: "within-3-months", label: "Within 3 months" },
  { value: "later", label: "Later" },
  { value: "exploring", label: "Just exploring" },
];

export const LIMITS = {
  name: 100,
  email: 254,
  company: 120,
  message: 5000,
  messageMin: 10,
} as const;

const EMAIL_PATTERN = /^[A-Za-z0-9._+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export type ContactFields = {
  name: string;
  email: string;
  company: string;
  projectType: string;
  timeline: string;
  message: string;
  /**
   * Honeypot. People never see it; automated senders tend to fill it. Its name avoids
   * words like "website" that browsers and password managers autofill.
   */
  honeypot: string;
};

export type FieldName = Exclude<keyof ContactFields, "honeypot">;
export type FieldErrors = Partial<Record<FieldName, string>>;

export type ContactPayload = {
  name: string;
  email: string;
  company?: string;
  projectType?: string;
  timeline?: string;
  message: string;
  /** The API's honeypot field. */
  contact_ref: string;
};

export type ContactResponse = {
  success: boolean;
  message?: string;
  error?: string;
  fields?: FieldErrors;
};

export const FIELD_NAMES: readonly FieldName[] = ["name", "email", "company", "projectType", "timeline", "message"];

export const EMPTY_FIELDS: Readonly<ContactFields> = Object.freeze({
  name: "",
  email: "",
  company: "",
  projectType: "",
  timeline: "",
  message: "",
  honeypot: "",
});

const isOption = (options: readonly Option[], value: string) => options.some((option) => option.value === value);

export function validateContactFields(values: ContactFields): FieldErrors {
  const name = values.name.trim();
  const email = values.email.trim();
  const company = values.company.trim();
  const message = values.message.trim();

  const nameError = !name
    ? "Please enter your name."
    : name.length > LIMITS.name
      ? `Please keep your name under ${LIMITS.name} characters.`
      : undefined;

  const emailError = !email
    ? "Please enter your email address."
    : email.length > LIMITS.email || !EMAIL_PATTERN.test(email)
      ? "Please enter a valid email address, like name@company.com."
      : undefined;

  const companyError =
    company.length > LIMITS.company ? `Please keep the company name under ${LIMITS.company} characters.` : undefined;

  const projectTypeError = !values.projectType
    ? "Please choose the kind of project."
    : !isOption(PROJECT_TYPES, values.projectType)
      ? "Please choose a project type from the list."
      : undefined;

  const timelineError =
    values.timeline && !isOption(TIMELINES, values.timeline) ? "Please choose a timeline from the list." : undefined;

  const messageError = !message
    ? "Please tell us about your project."
    : message.length < LIMITS.messageMin
      ? `Please add a little more detail (at least ${LIMITS.messageMin} characters).`
      : message.length > LIMITS.message
        ? `Please keep your message under ${LIMITS.message.toLocaleString("en-US")} characters.`
        : undefined;

  const entries: [FieldName, string | undefined][] = [
    ["name", nameError],
    ["email", emailError],
    ["company", companyError],
    ["projectType", projectTypeError],
    ["timeline", timelineError],
    ["message", messageError],
  ];
  return Object.fromEntries(entries.filter(([, error]) => error !== undefined)) as FieldErrors;
}

export function toPayload(values: ContactFields): ContactPayload {
  const company = values.company.trim();
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    ...(company ? { company } : {}),
    ...(values.projectType ? { projectType: values.projectType } : {}),
    ...(values.timeline ? { timeline: values.timeline } : {}),
    message: values.message.trim(),
    contact_ref: values.honeypot,
  };
}

function readFieldErrors(raw: unknown): FieldErrors | undefined {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return undefined;
  const entries = Object.entries(raw).filter(
    ([key, value]) => (FIELD_NAMES as readonly string[]).includes(key) && typeof value === "string"
  );
  return entries.length > 0 ? (Object.fromEntries(entries) as FieldErrors) : undefined;
}

/** Read the API's JSON reply without trusting its shape. */
export function parseResponse(data: unknown): ContactResponse {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return { success: false };
  const record = data as Record<string, unknown>;

  if (record.success === true) {
    return typeof record.message === "string" ? { success: true, message: record.message } : { success: true };
  }

  const error = typeof record.error === "string" ? record.error : undefined;
  const fields = readFieldErrors(record.fields);
  return { success: false, ...(error ? { error } : {}), ...(fields ? { fields } : {}) };
}
