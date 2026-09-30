const test = require("node:test");
const assert = require("node:assert/strict");
const { escapeHtml } = require("../src/lib/escapeHtml");

test("escapes the five HTML-significant characters", () => {
  assert.equal(
    escapeHtml(`<a href="x" title='y'>Tom & Jerry</a>`),
    "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;Tom &amp; Jerry&lt;/a&gt;"
  );
});

test("leaves ordinary text unchanged", () => {
  assert.equal(escapeHtml("Hello, Colombo"), "Hello, Colombo");
});

test("escapes an existing entity again instead of trusting it", () => {
  assert.equal(escapeHtml("&amp;"), "&amp;amp;");
});

test("returns an empty string for null and undefined", () => {
  assert.equal(escapeHtml(null), "");
  assert.equal(escapeHtml(undefined), "");
});

test("converts numbers and other values to escaped strings", () => {
  assert.equal(escapeHtml(42), "42");
  assert.equal(escapeHtml(true), "true");
});
