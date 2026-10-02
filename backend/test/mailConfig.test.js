const test = require("node:test");
const assert = require("node:assert/strict");
const { readMailConfig } = require("../src/lib/mailConfig");

test("uses Resend when an API key is set", () => {
  const result = readMailConfig({
    RESEND_API_KEY: "re_test",
    MAIL_FROM: "website@example.com",
    CONTACT_TO: "team@example.com",
  });
  assert.deepEqual(result, {
    ok: true,
    config: { provider: "resend", apiKey: "re_test", from: "website@example.com", to: "team@example.com" },
  });
});

test("Resend needs a sender and a recipient", () => {
  assert.deepEqual(readMailConfig({ RESEND_API_KEY: "re_test" }), { ok: false, missing: ["MAIL_FROM", "CONTACT_TO"] });
});

test("Resend wins even if the Gmail settings are still there", () => {
  const result = readMailConfig({
    RESEND_API_KEY: "re_test",
    MAIL_FROM: "website@example.com",
    CONTACT_TO: "team@example.com",
    EMAIL_USER: "old@gmail.com",
    EMAIL_PASS: "app-password",
  });
  assert.equal(result.ok && result.config.provider, "resend");
});

test("falls back to Gmail, sending from and to the Gmail account by default", () => {
  assert.deepEqual(readMailConfig({ EMAIL_USER: "team@gmail.com", EMAIL_PASS: "app-password" }), {
    ok: true,
    config: { provider: "smtp", user: "team@gmail.com", pass: "app-password", from: "team@gmail.com", to: "team@gmail.com" },
  });
});

test("Gmail delivers to CONTACT_TO when it is set", () => {
  const result = readMailConfig({ EMAIL_USER: "team@gmail.com", EMAIL_PASS: "app-password", CONTACT_TO: "contact@example.com" });
  assert.equal(result.ok && result.config.to, "contact@example.com");
});

test("names what is missing when nothing is set", () => {
  assert.deepEqual(readMailConfig({}), { ok: false, missing: ["RESEND_API_KEY (or EMAIL_USER and EMAIL_PASS)"] });
});

test("treats blank values as missing", () => {
  assert.deepEqual(readMailConfig({ RESEND_API_KEY: "re_test", MAIL_FROM: "  ", CONTACT_TO: "team@example.com" }), {
    ok: false,
    missing: ["MAIL_FROM"],
  });
});
