import { startGoogleAnalytics } from "../lib/googleAnalytics";

// Starts Google Analytics on the live site once the page has loaded, so it never delays the page.
// The measurement ID and the live host come from <body> (set in BaseLayout from src/data/site.ts),
// which keeps the site data out of this bundle.
function start(): void {
  const { gaId, liveHost } = document.body.dataset;
  if (!gaId || !liveHost) return;
  startGoogleAnalytics(gaId, liveHost, {
    hostname: window.location.hostname,
    window: window as unknown as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void },
    document: {
      createElement: () => document.createElement("script"),
      head: { appendChild: (element) => document.head.appendChild(element as HTMLScriptElement) },
    },
  });
}

if (document.readyState === "complete") start();
else window.addEventListener("load", start, { once: true });
