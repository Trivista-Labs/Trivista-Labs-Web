// Google Analytics, loaded only on the live site. Consent is set before anything is measured:
// advertising features are off everywhere, and in the EEA, the UK and Switzerland analytics cookies
// stay off too (Google's consent mode), because the site asks no one to accept cookies.
// Kept free of browser globals so it can be tested; src/scripts/google-analytics.ts runs it.

/** EU countries, plus Iceland, Liechtenstein and Norway (the rest of the EEA), the UK and Switzerland. */
export const CONSENT_REGIONS_DENIED: readonly string[] = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  "IS", "LI", "NO",
  "GB", "CH",
];

type ScriptElement = { async: boolean; src: string };

export interface GaEnvironment {
  readonly hostname: string;
  readonly window: { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
  readonly document: {
    createElement(tag: "script"): ScriptElement;
    readonly head: { appendChild(element: ScriptElement): unknown };
  };
}

/**
 * Queue Google's consent defaults and configuration, then load its tag. Returns false, and does
 * nothing, anywhere but the live site, so local copies, previews and tests are never counted.
 */
export function startGoogleAnalytics(measurementId: string, productionHost: string, env: GaEnvironment): boolean {
  if (env.hostname !== productionHost) return false;

  const dataLayer = (env.window.dataLayer ??= []);
  // gtag.js reads each command as an `arguments` object, so this cannot use rest parameters.
  env.window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    dataLayer.push(arguments);
  };
  const gtag = env.window.gtag;

  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "granted",
  });
  gtag("consent", "default", { analytics_storage: "denied", region: CONSENT_REGIONS_DENIED });
  gtag("js", new Date());
  gtag("config", measurementId);

  const script = env.document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  env.document.head.appendChild(script);
  return true;
}
