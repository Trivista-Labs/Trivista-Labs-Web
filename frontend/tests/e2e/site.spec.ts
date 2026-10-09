import { gzipSync } from "node:zlib";
import { expect, test } from "@playwright/test";
import { CASE_STUDY_PAGES, OPEN_JOBS, OPEN_JOB_PAGES, WORK_ENTRIES } from "./content-entries";

const PAGES = ["/", "/work/", "/capabilities/", "/company/", "/contact/", "/privacy/", "/terms/", "/careers/", ...CASE_STUDY_PAGES, ...OPEN_JOB_PAGES];
// The widths the briefs ask to check: desktop and tablet, then the common phone widths.
const WIDTHS = [1440, 1280, 1024, 768, 430, 412, 393, 390, 375, 360];

// Never call the production API from tests. The contact page wakes it on load.
test.beforeEach(async ({ page }) => {
  await page.route("https://trivista-labs-api.onrender.com/**", (route) =>
    route.fulfill({ status: 200, json: { status: "ok" } })
  );
});

test.describe("layout", () => {
  // Each test loads every page, case studies included, so it needs longer than one page's timeout.
  test.describe.configure({ timeout: 180_000 });
  for (const width of WIDTHS) {
    test(`no page scrolls sideways at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of PAGES) {
        await page.goto(path);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        expect(overflow, `${path} overflows by ${overflow}px`).toBeLessThanOrEqual(0);
      }
    });
  }
});

test.describe("pages", () => {
  for (const path of PAGES) {
    test(`${path} has one h1, metadata, share tags, a CSP and no console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));

      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page).toHaveTitle(/Trivista Labs/);

      const description = await page.locator('meta[name="description"]').getAttribute("content");
      expect(description?.length ?? 0).toBeGreaterThan(50);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://trivistalabs.io${path}`);
      // The default share image, or a page's own, such as a hiring poster for an open role.
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        "content",
        /^https:\/\/trivistalabs\.io\/og\/[\w-]+\.(png|jpg)$/
      );
      await expect(page.locator('meta[http-equiv="content-security-policy"]')).toHaveCount(1);
      expect(errors).toEqual([]);
    });
  }

  test("the home page describes the organisation in structured data", async ({ page }) => {
    await page.goto("/");
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = blocks.map((text) => (JSON.parse(text) as { "@type": string })["@type"]);
    expect(types).toEqual(expect.arrayContaining(["Organization", "WebSite"]));
  });

  test("unknown addresses get the 404 page", async ({ page }) => {
    const response = await page.goto("/does-not-exist/");
    expect(response?.status()).toBe(404);
    await expect(page.locator("h1")).toHaveText(/doesn’t exist/);
  });

  test("draft projects appear nowhere on the published site", async ({ page }) => {
    const drafts = WORK_ENTRIES.filter((entry) => entry.draft);
    for (const path of ["/", "/work/", "/capabilities/"]) {
      await page.goto(path);
      await expect(page.getByText("Draft", { exact: true })).toHaveCount(0);
      for (const draft of drafts) {
        await expect(page.getByText(draft.title, { exact: true }), `${draft.title} on ${path}`).toHaveCount(0);
      }
    }
    for (const draft of drafts) {
      const response = await page.goto(`/work/${draft.slug}/`);
      expect(response?.status(), draft.slug).toBe(404);
    }
  });

  test("the home page ships under 10 KB of its own compressed JavaScript, as it claims", async ({ page, baseURL }) => {
    const bodies: Promise<Buffer>[] = [];
    page.on("response", (response) => {
      // Our scripts only: Google Analytics is counted separately in the claim, and loads after the page.
      const ours = new URL(response.url()).origin === new URL(baseURL ?? "").origin;
      if (ours && response.request().resourceType() === "script") bodies.push(response.body());
    });
    await page.goto("/", { waitUntil: "networkidle" });
    const scripts = await Promise.all(bodies);
    const compressed = scripts.reduce((total, body) => total + gzipSync(body).length, 0);
    expect(scripts.length).toBeGreaterThan(0);
    expect(compressed).toBeLessThan(10 * 1024);
  });

  test("links to a section land on that section", async ({ page }) => {
    await page.goto("/capabilities/#infrastructure");
    await expect(page.getByRole("heading", { level: 2, name: "Infrastructure that stays up" })).toBeInViewport();
  });

  test("robots.txt points to the sitemap", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBe(true);
    expect(await robots.text()).toContain("Sitemap: https://trivistalabs.io/sitemap-index.xml");
    const sitemap = await request.get("/sitemap-0.xml");
    const urls = await sitemap.text();
    expect(urls).toContain("<loc>https://trivistalabs.io/capabilities/</loc>");
    expect(urls).toContain("<loc>https://trivistalabs.io/careers/</loc>");
  });
});

test.describe("3D scenes", () => {
  test("the hero drawing comes to life on a canvas", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-scene-surface].is-live > canvas.scene-canvas")).toHaveCount(1);
  });

  test("a device too slow to animate keeps a still frame instead", async ({ page }) => {
    // Simulate a slow device: the clock moves 20 ms on every reading, so each frame appears to take
    // at least that long. CPU throttling would do the same, but its effect depends on the machine.
    await page.addInitScript(() => {
      const now = performance.now.bind(performance);
      let skew = 0;
      performance.now = () => now() + (skew += 20);
    });
    await page.goto("/");
    await expect(page.locator(".system")).toHaveAttribute("data-scene-motion", "paused");
    await expect(page.locator(".system canvas.scene-canvas")).toHaveCount(1);
  });

  test("pages without a scene never download the 3D code", async ({ page }) => {
    const scripts: string[] = [];
    page.on("request", (request) => {
      if (request.resourceType() === "script") scripts.push(request.url());
    });
    await page.goto("/privacy/", { waitUntil: "networkidle" });
    expect(scripts.length).toBeGreaterThan(0);
    expect(scripts.filter((url) => /\/scene\.[\w-]+\.js$/.test(url))).toEqual([]);
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("the still drawing stays, and no canvas is started", async ({ page }) => {
      await page.goto("/", { waitUntil: "networkidle" });
      await expect(page.locator("[data-scene-poster]").first()).toBeVisible();
      await expect(page.locator("canvas.scene-canvas")).toHaveCount(0);
    });
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the 3D stack is explained by tapping numbered hotspots on its plates", async ({ page }) => {
    await page.goto("/");
    const hotspots = page.locator("[data-layer-hotspot]");
    const shown = page.locator("[data-layer-item]:not([hidden])");
    await expect(hotspots).toHaveCount(4);
    await expect(hotspots.first()).toBeVisible();
    // On phones the panel replaces the list that the desktop callouts point to.
    await expect(page.locator(".system__layers")).toBeHidden();
    await expect(shown).toContainText("Web and mobile apps");

    await hotspots.nth(2).tap();
    await expect(hotspots.nth(2)).toHaveAttribute("aria-pressed", "true");
    await expect(shown).toContainText("Hardware and IoT");

    await page.getByRole("button", { name: "Next layer" }).tap();
    await expect(shown).toContainText("Cloud and IT");
    await expect(shown.getByRole("link", { name: "See this layer" })).toHaveAttribute("href", "/capabilities/#infrastructure");
  });

  test("hotspots are large enough to tap", async ({ page }) => {
    await page.goto("/");
    for (const box of await page.locator("[data-layer-hotspot]").evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()))) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("the capability layers swipe sideways, and the pager follows", async ({ page }) => {
    await page.goto("/");
    const track = page.locator("[data-carousel]");
    await track.scrollIntoViewIfNeeded();
    await expect(page.locator("[data-carousel-current]")).toHaveText("01");
    await track.evaluate((el) => el.scrollBy({ left: el.clientWidth, behavior: "instant" }));
    await expect(page.locator("[data-carousel-current]")).toHaveText("02");
  });

  test("the open menu holds the page still and closes on a link", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).tap();
    await expect(page.locator("#mobile-menu")).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe("hidden");
    await page.locator("#mobile-menu").getByRole("link", { name: "Company" }).tap();
    await expect(page).toHaveURL(/\/company\/$/);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe("hidden");
  });
});

test("on wide screens the 3D stack keeps its labelled list and no hotspots", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(page.locator(".system__layers")).toBeVisible();
  await expect(page.locator("[data-layer-hotspots]")).toBeHidden();
});

test.describe("navigation", () => {
  test("the mobile menu opens, closes with Escape and navigates", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const toggle = page.getByRole("button", { name: "Menu" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();

    const menu = page.locator("#mobile-menu");
    await expect(menu).toBeVisible();
    await expect(page.getByRole("button", { name: "Close" })).toHaveAttribute("aria-expanded", "true");

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(page.getByRole("button", { name: "Menu" })).toBeFocused();

    await page.getByRole("button", { name: "Menu" }).click();
    await menu.getByRole("link", { name: "Capabilities" }).click();
    await expect(page).toHaveURL(/\/capabilities\/$/);
  });

  test("the desktop navigation marks the current page", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/company/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "Company" })).toHaveAttribute("aria-current", "page");
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("the menu link leads to the footer navigation", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/");
      const menu = page.getByRole("link", { name: "Menu", exact: true });
      await expect(menu).toHaveAttribute("href", "#site-footer-nav");
      await menu.click();
      await expect(page.locator("#site-footer-nav")).toBeInViewport();
    });

    test("the hero shows its 3D drawing as a still image", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator(".hero [data-scene-poster]")).toBeVisible();
      await expect(page.locator("canvas")).toHaveCount(0);
    });

    test("the contact page offers email instead of a form that cannot send", async ({ page }) => {
      await page.goto("/contact/");
      // Chromium still parses <noscript> as if scripts ran when tests switch JavaScript
      // off, so check that the fallback is in the page rather than that it renders.
      expect(await page.locator("noscript").first().textContent()).toContain("This form needs JavaScript");
      await expect(page.getByRole("button", { name: "Send message" })).toBeDisabled();
      await expect(page.getByRole("link", { name: "contact@trivistalabs.lk" }).first()).toBeVisible();
    });
  });

  test("the skip link moves focus to the main content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();
  });
});

test.describe("careers", () => {
  const CAREERS_EMAIL = "careers@trivistalabs.lk";

  test("Careers is in the main navigation on wide screens and in the phone menu", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/careers/");
    const nav = page.getByRole("navigation", { name: "Main" }).first();
    await expect(nav.getByRole("link", { name: "Careers" })).toHaveAttribute("aria-current", "page");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Menu" }).click();
    const menuLink = page.locator("#mobile-menu").getByRole("link", { name: "Careers" });
    await expect(menuLink).toBeVisible();
    await expect(menuLink).toHaveAttribute("aria-current", "page");
  });

  test("the page lists exactly the open roles, and says so plainly when there are none", async ({ page }) => {
    await page.goto("/careers/");
    const roleLinks = page.locator('main a[href^="/careers/"]');
    const postings = await page.locator('script[type="application/ld+json"]').allTextContents();
    // The listing never carries vacancy data; only a role's own page does.
    expect(postings.join("")).not.toContain("JobPosting");

    if (OPEN_JOBS.length === 0) {
      await expect(page.getByRole("heading", { level: 2, name: "No open positions right now." })).toBeVisible();
      await expect(page.getByText("No open roles right now")).toBeVisible();
      await expect(roleLinks).toHaveCount(0);
    } else {
      for (const job of OPEN_JOBS) {
        await expect(page.getByRole("heading", { level: 3, name: job.title })).toBeVisible();
      }
      await expect(page.getByText(`${OPEN_JOBS.length} open role`)).toBeVisible();
    }
  });

  test("every application link on the careers pages goes to the careers inbox", async ({ page }) => {
    for (const path of ["/careers/", ...OPEN_JOB_PAGES]) {
      await page.goto(path);
      // Inside the page itself: the shared header and footer keep the general contact address.
      const hrefs = await page.locator('main a[href^="mailto:"]').evaluateAll((links) =>
        links.map((link) => link.getAttribute("href") ?? "")
      );
      expect(hrefs.length, path).toBeGreaterThan(0);
      for (const href of hrefs) {
        expect(href.startsWith(`mailto:${CAREERS_EMAIL}?subject=`), `${path}: ${href}`).toBe(true);
        expect(decodeURIComponent(href.split("subject=")[1]), path).toMatch(/— \[Your Name\]$/);
      }
    }
  });

  test("each open role has a page with JobPosting data, and no other role does", async ({ page, request }) => {
    for (const job of OPEN_JOBS) {
      await page.goto(`/careers/${job.slug}/`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(job.title);
      const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(blocks.map((text) => (JSON.parse(text) as { "@type": string })["@type"])).toContain("JobPosting");
    }
    const sitemap = await (await request.get("/sitemap-0.xml")).text();
    const rolePages = sitemap.match(/careers\/[^<]+\/<\/loc>/g) ?? [];
    expect(rolePages).toHaveLength(OPEN_JOBS.length);
  });
});

test("the office address and its Google Maps link are in the footer and the structured data", async ({ page }) => {
  await page.goto("/contact/");
  const footer = page.locator(".site-footer address");
  await expect(footer).toContainText("35 Edward Ln");
  await expect(footer).toContainText("Colombo 03, Sri Lanka");
  const map = footer.getByRole("link", { name: /Open in Google Maps/ });
  await expect(map).toHaveAttribute("href", "https://maps.app.goo.gl/S3hWd6dekfDx5goU8");
  await expect(map).toHaveAttribute("target", "_blank");
  // A link, never an embedded map, so the site keeps its no-cookies promise.
  await expect(page.locator("iframe")).toHaveCount(0);

  await page.goto("/");
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const organization = blocks.map((text) => JSON.parse(text) as Record<string, unknown>).find((block) => block["@type"] === "Organization");
  expect(organization).toMatchObject({
    address: { streetAddress: "35 Edward Ln, Colombo 03", addressLocality: "Colombo", addressCountry: "LK" },
    location: { hasMap: "https://maps.app.goo.gl/S3hWd6dekfDx5goU8" },
  });
});

test("the Salon Booking System's old address still leads to its page", async ({ page }) => {
  await page.goto("/work/the-beauty-room/");
  await expect(page).toHaveURL(/\/work\/salon-booking-system\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Salon Booking System");
});

test("every page's share image exists", async ({ page, request }) => {
  for (const path of PAGES) {
    await page.goto(path);
    const image = await page.locator('meta[property="og:image"]').getAttribute("content");
    const response = await request.get(new URL(image ?? "", "https://trivistalabs.io").pathname);
    expect(response.status(), `${path}: ${image}`).toBe(200);
  }
});

test.describe("Google Analytics", () => {
  const MEASUREMENT_ID = "G-Y8H2QNC50C";

  test("never loads on a local copy, so tests and previews are not counted", async ({ page }) => {
    const googleRequests: string[] = [];
    page.on("request", (request) => {
      if (/google(tagmanager|-analytics)\.com/.test(request.url())) googleRequests.push(request.url());
    });
    await page.goto("/", { waitUntil: "networkidle" });
    expect(googleRequests).toEqual([]);
    expect(await page.evaluate(() => "gtag" in window)).toBe(false);
  });

  test("loads on the live site, after consent defaults, and the security policy lets it run", async ({ page, baseURL }) => {
    // Serve this build as if it were trivistalabs.io, and stand in for Google's script.
    await page.route("https://trivistalabs.io/**", async (route) => {
      const local = route.request().url().replace("https://trivistalabs.io", baseURL ?? "");
      await route.fulfill({ response: await route.fetch({ url: local }) });
    });
    const tagRequests: string[] = [];
    await page.route("https://www.googletagmanager.com/**", async (route) => {
      tagRequests.push(route.request().url());
      await route.fulfill({ contentType: "text/javascript", body: "window.__googleTagRan = true;" });
    });

    await page.goto("https://trivistalabs.io/");
    await expect.poll(() => page.evaluate(() => (window as { __googleTagRan?: boolean }).__googleTagRan)).toBe(true);

    expect(tagRequests).toEqual([`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`]);
    const queued = await page.evaluate(() =>
      ((window as unknown as { dataLayer: ArrayLike<unknown>[] }).dataLayer ?? []).map((entry) => Array.from(entry)[0])
    );
    expect(queued.slice(0, 4)).toEqual(["consent", "consent", "js", "config"]);
  });
});
