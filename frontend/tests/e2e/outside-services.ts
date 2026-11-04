import type { Page } from "@playwright/test";

/** A transparent 1×1 PNG. */
const BLANK_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
);

/**
 * Answer requests for the footer's DMCA.com badge locally. Loading the real image would ask DMCA's crawler
 * to visit a local copy of the site, and would fail the tests whenever DMCA's servers are slow.
 */
export async function stubDmcaBadge(page: Page) {
  await page.route("https://images.dmca.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "image/png", body: BLANK_PNG })
  );
}
