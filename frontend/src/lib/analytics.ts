// Privacy-friendly event tracking. Nothing is sent until a provider script
// (Plausible or Umami, both cookie-free) is added to the site and allowed by the CSP.

export type EventProps = Record<string, string | number | boolean>;

type AnalyticsWindow = {
  plausible?: (event: string, options?: { props?: EventProps }) => void;
  umami?: { track?: (event: string, props?: EventProps) => void };
};

export function track(event: string, props?: EventProps): void {
  if (typeof window === "undefined" || window === null) return;
  const analytics = window as unknown as AnalyticsWindow;

  if (typeof analytics.plausible === "function") {
    analytics.plausible(event, props ? { props } : undefined);
    return;
  }
  if (typeof analytics.umami?.track === "function") {
    analytics.umami.track(event, props);
  }
}
