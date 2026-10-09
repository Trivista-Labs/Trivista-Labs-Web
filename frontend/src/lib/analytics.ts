// Click and form events, sent to Google Analytics when it is loaded. It loads only on the live site
// (see src/lib/googleAnalytics.ts), so in previews and tests these calls do nothing.

export type EventProps = Record<string, string | number | boolean>;

type AnalyticsWindow = { gtag?: (...args: unknown[]) => void };

const GA_EVENT_NAME_MAX = 40;

/**
 * Google Analytics event names may use only letters, digits and underscores, must start with a
 * letter and are at most 40 characters: "Start a project clicked" becomes "start_a_project_clicked".
 */
export function toGaEventName(event: string): string {
  const name = event
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const leading = /^[a-z]/.test(name) ? name : `event_${name}`;
  return leading.slice(0, GA_EVENT_NAME_MAX);
}

export function track(event: string, props: EventProps = {}): void {
  if (typeof window === "undefined" || window === null) return;
  const { gtag } = window as unknown as AnalyticsWindow;
  if (typeof gtag === "function") gtag("event", toGaEventName(event), props);
}
