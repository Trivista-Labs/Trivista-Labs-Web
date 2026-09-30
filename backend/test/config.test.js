const test = require("node:test");
const assert = require("node:assert/strict");
const { parseOrigins, DEFAULT_ORIGINS, parseTrustProxy } = require("../src/config");

test("uses the default origins when none are configured", () => {
  assert.deepEqual(parseOrigins(undefined), DEFAULT_ORIGINS);
  assert.deepEqual(parseOrigins(""), DEFAULT_ORIGINS);
  assert.deepEqual(parseOrigins(" , "), DEFAULT_ORIGINS);
});

test("parses a comma-separated origin list", () => {
  assert.deepEqual(parseOrigins("https://a.example, https://b.example ,"), [
    "https://a.example",
    "https://b.example",
  ]);
});

test("allows the production site and the local dev server by default", () => {
  assert.ok(DEFAULT_ORIGINS.includes("https://trivistalabs.io"));
  assert.ok(DEFAULT_ORIGINS.includes("http://localhost:4321"));
  assert.ok(!DEFAULT_ORIGINS.some((origin) => origin.startsWith("http://trivistalabs")));
});

test("trusts one proxy hop unless configured otherwise", () => {
  assert.equal(parseTrustProxy(undefined), 1);
  assert.equal(parseTrustProxy(""), 1);
  assert.equal(parseTrustProxy("2"), 2);
  assert.equal(parseTrustProxy("0"), 0);
});

test("rejects a trust proxy value that is not a small whole number", () => {
  assert.throws(() => parseTrustProxy("true"));
  assert.throws(() => parseTrustProxy("-1"));
  assert.throws(() => parseTrustProxy("1.5"));
});
