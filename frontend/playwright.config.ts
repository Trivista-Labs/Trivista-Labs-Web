import { defineConfig, devices } from "@playwright/test";

// A port of its own, so tests never run against `astro dev` or a stale preview.
// Astro allows one preview server per project: stop any `npm run preview` first.
const PORT = 4322;
const isCI = Boolean(process.env.CI);

// Runs against the production build: `npm run build` first.
export default defineConfig({
  testDir: "tests/e2e",
  // Accessibility scans take several seconds each on a busy machine.
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      // Locally, use the installed Chrome instead of downloading a browser.
      use: { ...devices["Desktop Chrome"], channel: isCI ? undefined : "chrome" },
    },
  ],
  webServer: {
    command: `npm run preview -- --port ${PORT} --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
