import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type ReactNode,
  type SubmitEvent,
} from "react";
import { track } from "../lib/analytics";
import {
  EMPTY_FIELDS,
  FIELD_NAMES,
  LIMITS,
  PROJECT_TYPES,
  TIMELINES,
  parseResponse,
  toPayload,
  validateContactFields,
  type ContactFields,
  type FieldErrors,
  type FieldName,
} from "../lib/contact";
import "../styles/forms.css";

type Status = "idle" | "sending" | "slow" | "sent" | "failed";

type Props = {
  /** Base URL of the contact API, without a trailing slash. */
  apiUrl: string;
  /** Address to offer when sending fails. */
  email: string;
  /** How soon the team replies, for example "within 24 hours". */
  responseTime: string;
};

type Recipient = { firstName: string; email: string };

/** After this long the form explains that the server may be starting up. */
const SLOW_AFTER_MS = 6_000;
/** The API can take around 25 seconds to wake after a quiet period. */
const TIMEOUT_MS = 45_000;

const FIELD_LABELS: Readonly<Record<FieldName, string>> = {
  name: "Name",
  email: "Email",
  company: "Company",
  projectType: "Project type",
  timeline: "Timeline",
  message: "About your project",
};

const noopSubscribe = () => () => {};
/** False in the server-rendered HTML, true once React has hydrated in the browser. */
const useHydrated = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );

const fieldId = (name: FieldName) => `contact-${name}`;
const errorId = (name: FieldName) => `contact-${name}-error`;
const hintId = (name: FieldName) => `contact-${name}-hint`;

const withoutField = (errors: FieldErrors, name: string): FieldErrors =>
  Object.fromEntries(Object.entries(errors).filter(([key]) => key !== name)) as FieldErrors;

function describedBy(name: FieldName, errors: FieldErrors, hasHint = false): string | undefined {
  const ids = [hasHint ? hintId(name) : undefined, errors[name] ? errorId(name) : undefined].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

type FieldProps = {
  name: FieldName;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
};

function Field({ name, error, hint, optional = false, children }: FieldProps) {
  return (
    <div className={error ? "field field--invalid" : "field"}>
      <label className="field__label" htmlFor={fieldId(name)}>
        {FIELD_LABELS[name]}
        {optional && <span className="field__optional"> (optional)</span>}
      </label>
      {hint && (
        <p className="field__hint" id={hintId(name)}>
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p className="field__error" id={errorId(name)}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function ContactForm({ apiUrl, email, responseTime }: Props) {
  const [values, setValues] = useState<ContactFields>(EMPTY_FIELDS);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [failure, setFailure] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const sentRef = useRef<HTMLDivElement>(null);
  // Until React takes over, a native submit would put the answers in the URL.
  const hydrated = useHydrated();

  useEffect(() => {
    // Wake the API while the visitor is still typing. This is best effort: if it
    // fails, the real submission reports its own error.
    const controller = new AbortController();
    fetch(`${apiUrl}/api/health`, { signal: controller.signal, cache: "no-store" }).catch(() => undefined);
    return () => controller.abort();
  }, [apiUrl]);

  // Move focus after React has rendered the new state, so the target exists.
  useEffect(() => {
    if (failedAttempts > 0) alertRef.current?.focus();
  }, [failedAttempts]);

  useEffect(() => {
    if (status === "sent") sentRef.current?.focus();
  }, [status]);

  const busy = status === "sending" || status === "slow";

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => (name in current ? withoutField(current, name) : current));
  };

  const fail = (message: string, fieldErrors: FieldErrors = {}) => {
    setErrors(fieldErrors);
    setFailure(message);
    setStatus("failed");
    setFailedAttempts((count) => count + 1);
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;

    const found = validateContactFields(values);
    if (Object.keys(found).length > 0) {
      fail("", found);
      return;
    }

    const payload = toPayload(values);
    setErrors({});
    setFailure("");
    setStatus("sending");

    const controller = new AbortController();
    const slowTimer = window.setTimeout(() => setStatus("slow"), SLOW_AFTER_MS);
    const timeoutTimer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${apiUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      // A reply that is not JSON (for example a proxy error page) is treated as a failure.
      const result = parseResponse(await response.json().catch(() => null));

      if (response.ok && result.success) {
        setRecipient({ firstName: payload.name.split(/\s+/)[0], email: payload.email });
        setStatus("sent");
        track("Contact form sent", { projectType: payload.projectType ?? "not given" });
        return;
      }
      fail(result.error ?? "We couldn’t send your message. Please try again.", result.fields ?? {});
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "AbortError";
      fail(
        timedOut
          ? "Our server took too long to respond. Please try again."
          : "We couldn’t reach our server. Please check your connection and try again."
      );
    } finally {
      window.clearTimeout(slowTimer);
      window.clearTimeout(timeoutTimer);
    }
  };

  if (status === "sent" && recipient) {
    return (
      <div className="form-sent" ref={sentRef} tabIndex={-1} role="status">
        <p className="form-sent__label">Message sent</p>
        <h2 className="form-sent__title">Thanks, {recipient.firstName}. Your message is with our team.</h2>
        <p>
          We’ll reply to <strong>{recipient.email}</strong> {responseTime}. If anything changes in the meantime, email
          us at <a href={`mailto:${email}`}>{email}</a>.
        </p>
      </div>
    );
  }

  const invalidFields = FIELD_NAMES.filter((name) => errors[name]);
  const showAlert = status === "failed" && (invalidFields.length > 0 || failure !== "");

  return (
    <form className="contact-form" noValidate onSubmit={handleSubmit}>
      {showAlert && (
        <div className="form-alert" role="alert" tabIndex={-1} ref={alertRef}>
          {invalidFields.length > 0 ? (
            <>
              <p className="form-alert__title">
                Please check {invalidFields.length === 1 ? "this field" : `these ${invalidFields.length} fields`}:
              </p>
              <ul>
                {invalidFields.map((name) => (
                  <li key={name}>
                    <a href={`#${fieldId(name)}`}>
                      {FIELD_LABELS[name]}: {errors[name]}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p>{failure}</p>
              <p>
                Email: <a href={`mailto:${email}`}>{email}</a>
              </p>
            </>
          )}
        </div>
      )}

      <fieldset className="contact-form__fields" disabled={busy}>
        <legend className="visually-hidden">Your project</legend>

        <Field name="name" error={errors.name}>
          <input
            id={fieldId("name")}
            name="name"
            type="text"
            autoComplete="name"
            maxLength={LIMITS.name}
            required
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("name", errors)}
            value={values.name}
            onChange={handleChange}
          />
        </Field>

        <Field name="email" error={errors.email}>
          <input
            id={fieldId("email")}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            maxLength={LIMITS.email}
            required
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy("email", errors)}
            value={values.email}
            onChange={handleChange}
          />
        </Field>

        <Field name="company" error={errors.company} optional>
          <input
            id={fieldId("company")}
            name="company"
            type="text"
            autoComplete="organization"
            maxLength={LIMITS.company}
            aria-invalid={errors.company ? true : undefined}
            aria-describedby={describedBy("company", errors)}
            value={values.company}
            onChange={handleChange}
          />
        </Field>

        <div className="field-row">
          <Field name="projectType" error={errors.projectType}>
            <select
              id={fieldId("projectType")}
              name="projectType"
              required
              aria-invalid={errors.projectType ? true : undefined}
              aria-describedby={describedBy("projectType", errors)}
              value={values.projectType}
              onChange={handleChange}
            >
              <option value="" disabled>
                Choose one
              </option>
              {PROJECT_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field name="timeline" error={errors.timeline} optional>
            <select
              id={fieldId("timeline")}
              name="timeline"
              aria-invalid={errors.timeline ? true : undefined}
              aria-describedby={describedBy("timeline", errors)}
              value={values.timeline}
              onChange={handleChange}
            >
              <option value="">Not decided</option>
              {TIMELINES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field name="message" error={errors.message} hint="What are you building, and where do you need help?">
          <textarea
            id={fieldId("message")}
            name="message"
            rows={6}
            maxLength={LIMITS.message}
            required
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={describedBy("message", errors, true)}
            value={values.message}
            onChange={handleChange}
          />
        </Field>

        <div className="form-honeypot" aria-hidden="true">
          <label htmlFor="contact-honeypot">Leave this field empty</label>
          <input
            id="contact-honeypot"
            name="honeypot"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={values.honeypot}
            onChange={handleChange}
          />
        </div>
      </fieldset>

      <div className="form-actions">
        <button className="button button--primary" type="submit" disabled={busy || !hydrated}>
          {busy ? "Sending…" : "Send message"}
        </button>
        <p className="form-progress" role="status" aria-live="polite">
          {status === "sending" && "Sending your message."}
          {status === "slow" &&
            "Still sending. Our server can take up to half a minute to wake up, so please keep this page open."}
        </p>
      </div>

      <p className="form-privacy">
        We use these details only to reply to you. Read our <a href="/privacy/">privacy policy</a>.
      </p>
    </form>
  );
}
