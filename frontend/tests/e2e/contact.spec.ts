import { expect, test, type Page } from "@playwright/test";

// The contact API is mocked. These tests cover the form, not the server.
const API = "https://trivista-labs-api.onrender.com";

async function openForm(page: Page) {
  await page.goto("/contact/");
  // The button is disabled until React has hydrated the form.
  await expect(page.getByRole("button", { name: "Send message" })).toBeEnabled();
}

const field = (page: Page, label: string) => page.getByLabel(label, { exact: true });

async function fillForm(page: Page) {
  await field(page, "Name").fill("Nimali Perera");
  await field(page, "Email").fill("nimali@example.com");
  await field(page, "Company (optional)").fill("Perera Salons");
  await field(page, "Project type").selectOption("business-system");
  await field(page, "About your project").fill("We need a booking system for three branches.");
}

test.beforeEach(async ({ page }) => {
  await page.route(`${API}/api/health`, (route) => route.fulfill({ status: 200, json: { status: "ok" } }));
});

test("wakes the API when the page opens", async ({ page }) => {
  const health = page.waitForRequest(`${API}/api/health`);
  await page.goto("/contact/");
  await health;
});

test("lists missing fields and moves focus to the list", async ({ page }) => {
  await openForm(page);
  await page.getByRole("button", { name: "Send message" }).click();

  const alert = page.getByRole("alert");
  await expect(alert).toBeFocused();
  await expect(alert).toContainText("Please check these 4 fields");
  await expect(field(page, "Name")).toHaveAttribute("aria-invalid", "true");
  await expect(field(page, "Company (optional)")).not.toHaveAttribute("aria-invalid", "true");
});

test("clears the error list once every field is fixed", async ({ page }) => {
  await openForm(page);
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("alert")).toBeVisible();

  await fillForm(page);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("sends a valid enquiry and confirms it", async ({ page }) => {
  let body: unknown;
  await page.route(`${API}/api/contact`, async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ status: 200, json: { success: true, message: "Thanks." } });
  });

  await openForm(page);
  await fillForm(page);
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.getByRole("heading", { name: /Thanks, Nimali/ })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Message sent" })).toBeFocused();
  expect(body).toMatchObject({
    name: "Nimali Perera",
    email: "nimali@example.com",
    company: "Perera Salons",
    projectType: "business-system",
    message: "We need a booking system for three branches.",
    contact_ref: "",
  });
});

test("shows the field errors the API returns", async ({ page }) => {
  await page.route(`${API}/api/contact`, (route) =>
    route.fulfill({
      status: 400,
      json: {
        success: false,
        error: "Please enter a valid email address.",
        fields: { email: "Please enter a valid email address." },
      },
    })
  );

  await openForm(page);
  await fillForm(page);
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.getByRole("alert")).toContainText("Email: Please enter a valid email address.");
  await expect(field(page, "Email")).toHaveAttribute("aria-invalid", "true");
});

test("offers the email address when the server cannot be reached", async ({ page }) => {
  await page.route(`${API}/api/contact`, (route) => route.abort("failed"));

  await openForm(page);
  await fillForm(page);
  await page.getByRole("button", { name: "Send message" }).click();

  const alert = page.getByRole("alert");
  await expect(alert).toContainText("couldn’t reach our server");
  await expect(alert).toBeFocused();
  await expect(alert.getByRole("link", { name: "contact@trivistalabs.lk" })).toBeVisible();
});

test("explains a slow reply while the server wakes up", async ({ page }) => {
  let release: () => void = () => undefined;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`${API}/api/contact`, async (route) => {
    await released;
    await route.fulfill({ status: 200, json: { success: true } });
  });

  await openForm(page);
  await fillForm(page);
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.getByRole("button", { name: "Sending…" })).toBeDisabled();
  await expect(page.getByText(/can take up to half a minute/)).toBeVisible({ timeout: 10_000 });

  release();
  await expect(page.getByRole("heading", { name: /Thanks, Nimali/ })).toBeVisible();
});
