const test = require("node:test");
const assert = require("node:assert/strict");
const { validateContact, PROJECT_TYPES, TIMELINES, LIMITS } = require("../src/lib/validateContact");

const valid = {
  name: "Nimali Perera",
  email: "nimali@example.com",
  message: "We need a booking system for three branches.",
};

test("accepts the minimal fields the original site sent", () => {
  const result = validateContact(valid);
  assert.equal(result.ok, true);
  assert.equal(result.isSpam, false);
  assert.deepEqual(result.value, {
    name: "Nimali Perera",
    email: "nimali@example.com",
    company: undefined,
    projectType: undefined,
    timeline: undefined,
    message: "We need a booking system for three branches.",
  });
});

test("accepts every optional field when it is valid", () => {
  const result = validateContact({
    ...valid,
    company: "Perera Salons",
    projectType: "business-system",
    timeline: "within-3-months",
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.company, "Perera Salons");
  assert.equal(result.value.projectType, "business-system");
  assert.equal(result.value.timeline, "within-3-months");
});

test("trims surrounding whitespace and treats blank optional fields as missing", () => {
  const result = validateContact({
    name: "  Nimali  ",
    email: " nimali@example.com ",
    company: "   ",
    projectType: "",
    timeline: "",
    message: "  We need a booking system.  ",
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.name, "Nimali");
  assert.equal(result.value.email, "nimali@example.com");
  assert.equal(result.value.company, undefined);
  assert.equal(result.value.projectType, undefined);
  assert.equal(result.value.timeline, undefined);
  assert.equal(result.value.message, "We need a booking system.");
});

test("reports every missing required field", () => {
  const result = validateContact({});
  assert.equal(result.ok, false);
  assert.ok(result.errors.name);
  assert.ok(result.errors.email);
  assert.ok(result.errors.message);
});

test("rejects a request body that is not an object", () => {
  for (const body of [null, undefined, "text", 42, ["a"]]) {
    const result = validateContact(body);
    assert.equal(result.ok, false, `expected ${JSON.stringify(body)} to be rejected`);
    assert.ok(result.errors.form);
  }
});

test("rejects fields that are not text", () => {
  const result = validateContact({ name: ["x"], email: { a: 1 }, message: 123 });
  assert.equal(result.ok, false);
  assert.ok(result.errors.name);
  assert.ok(result.errors.email);
  assert.ok(result.errors.message);
});

test("rejects malformed and unsafe email addresses", () => {
  const bad = [
    "plainaddress",
    "no-at.example.com",
    "two@@example.com",
    "space in@example.com",
    "quote\"@example.com",
    "angle<script>@example.com",
    "missing-tld@example",
    "a@b.c",
  ];
  for (const email of bad) {
    const result = validateContact({ ...valid, email });
    assert.equal(result.ok, false, `expected ${email} to be rejected`);
    assert.ok(result.errors.email);
  }
});

test("accepts common real-world email formats", () => {
  for (const email of ["first.last@example.co.uk", "name+tag@example.lk", "a_b-c@sub.example.io"]) {
    const result = validateContact({ ...valid, email });
    assert.equal(result.ok, true, `expected ${email} to be accepted`);
  }
});

test("enforces the length limits", () => {
  const tooLong = (n) => "x".repeat(n + 1);
  assert.ok(validateContact({ ...valid, name: tooLong(LIMITS.name) }).errors.name);
  assert.ok(validateContact({ ...valid, company: tooLong(LIMITS.company) }).errors.company);
  assert.ok(validateContact({ ...valid, message: tooLong(LIMITS.message) }).errors.message);
  assert.ok(
    validateContact({ ...valid, email: `${"x".repeat(LIMITS.email)}@example.com` }).errors.email
  );
});

test("asks for a little more detail when the message is very short", () => {
  const result = validateContact({ ...valid, message: "Hi there" });
  assert.equal(result.ok, false);
  assert.ok(result.errors.message);
});

test("only accepts known project types and timelines", () => {
  for (const projectType of PROJECT_TYPES) {
    assert.equal(validateContact({ ...valid, projectType }).ok, true);
  }
  for (const timeline of TIMELINES) {
    assert.equal(validateContact({ ...valid, timeline }).ok, true);
  }
  assert.ok(validateContact({ ...valid, projectType: "rocket-science" }).errors.projectType);
  assert.ok(validateContact({ ...valid, timeline: "yesterday" }).errors.timeline);
});

test("flags a filled honeypot field as spam without failing validation", () => {
  const result = validateContact({ ...valid, contact_ref: "https://spam.example" });
  assert.equal(result.ok, true);
  assert.equal(result.isSpam, true);
});

test("does not treat a website field as the honeypot, since browsers autofill it", () => {
  const result = validateContact({ ...valid, website: "https://perera.example" });
  assert.equal(result.ok, true);
  assert.equal(result.isSpam, false);
});

test("collapses line breaks in single-line fields", () => {
  const result = validateContact({ ...valid, name: "Nimali\r\nBcc: x@example.com" });
  assert.equal(result.ok, true);
  assert.equal(result.value.name, "Nimali Bcc: x@example.com");
});

test("replaces every lone control character in single-line fields", () => {
  for (const control of ["\n", "\r", "\0", "\t", "\u007f"]) {
    const result = validateContact({ ...valid, name: `Nimali${control}Perera` });
    assert.equal(result.ok, true);
    assert.equal(result.value.name, "Nimali Perera", JSON.stringify(control));
  }
});

test("removes text-direction override characters", () => {
  const result = validateContact({
    ...valid,
    name: "Nimali‮omed",
    company: "⁦Perera⁩ Salons",
    message: "Please call ‭us‬ about the booking system.",
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.name, "Nimaliomed");
  assert.equal(result.value.company, "Perera Salons");
  assert.equal(result.value.message, "Please call us about the booking system.");
});

test("keeps the joiners that Sinhala script needs", () => {
  const sriLanka = "ශ්‍රී ලංකා";
  const result = validateContact({ ...valid, name: sriLanka });
  assert.equal(result.ok, true);
  assert.equal(result.value.name, sriLanka);
});

test("rejects percent signs in email addresses", () => {
  const result = validateContact({ ...valid, email: "a%0D%0ABcc%3Ax%40evil.com@example.com" });
  assert.equal(result.ok, false);
  assert.ok(result.errors.email);
});
