import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const PAGES = ["/", "/work/", "/capabilities/", "/company/", "/contact/", "/privacy/", "/terms/", "/404"];
// WCAG 2.2 AA rules, plus axe best practices such as heading order and unique landmarks.
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

// Transitions off, so contrast is never measured halfway through a colour change.
test.use({ reducedMotion: "reduce" });

// Never call the production API from tests. The contact page wakes it on load.
test.beforeEach(async ({ page }) => {
  await page.route("https://trivista-labs-api.onrender.com/**", (route) =>
    route.fulfill({ status: 200, json: { status: "ok" } })
  );
});

/** WCAG violations on the page, or only inside the given selector. */
async function violations(page: Page, within?: string) {
  const builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  const results = await (within ? builder.include(within) : builder).analyze();
  return results.violations.map(
    (violation) => `${violation.id} (${violation.impact}): ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`
  );
}

for (const path of PAGES) {
  test(`${path} meets WCAG 2.2 AA automated checks on desktop`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(path);
    expect(await violations(page)).toEqual([]);
  });

  test(`${path} meets WCAG 2.2 AA automated checks on a phone`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    expect(await violations(page)).toEqual([]);
  });
}

test("the contact form stays accessible while showing errors", async ({ page }) => {
  await page.goto("/contact/");
  await expect(page.getByRole("button", { name: "Send message" })).toBeEnabled();
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  expect(await violations(page)).toEqual([]);
});

test("the open mobile menu is accessible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.getByRole("button", { name: "Close" })).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#mobile-menu")).toBeVisible();
  // The menu and header only: the page underneath has its own scans, and checking the contrast of
  // every covered element behind the sheet is slow.
  expect(await violations(page, ".site-header")).toEqual([]);
});
