const test = require("node:test");
const assert = require("node:assert/strict");
const { buildContactEmail } = require("../src/lib/contactEmail");

const contact = {
  name: "Nimali Perera",
  email: "nimali@example.com",
  company: "Perera Salons",
  projectType: "business-system",
  timeline: "within-3-months",
  message: "We need a booking system.\nThree branches.",
};

const options = {
  from: "website@example.com",
  to: "team@example.com",
  receivedAt: new Date("2026-09-30T04:30:00Z"),
};

test("addresses the email to the team and replies to the sender", () => {
  const mail = buildContactEmail(contact, options);
  assert.deepEqual(mail.from, { name: "Trivista Labs website", address: "website@example.com" });
  assert.equal(mail.to, "team@example.com");
  assert.deepEqual(mail.replyTo, { name: "Nimali Perera", address: "nimali@example.com" });
});

test("puts the sender and company in the subject", () => {
  const mail = buildContactEmail(contact, options);
  assert.equal(mail.subject, "New enquiry from Nimali Perera (Perera Salons)");
});

test("leaves the company out of the subject when it was not given", () => {
  const mail = buildContactEmail({ ...contact, company: undefined }, options);
  assert.equal(mail.subject, "New enquiry from Nimali Perera");
});

test("strips text-direction overrides from the subject", () => {
  const mail = buildContactEmail({ ...contact, name: "Nimali‮omed", company: undefined }, options);
  assert.equal(mail.subject, "New enquiry from Nimaliomed");
});

test("keeps the subject on one line and within 150 characters", () => {
  const mail = buildContactEmail({ ...contact, name: `A\r\nB${"c".repeat(300)}` }, options);
  assert.ok(!/[\r\n]/.test(mail.subject));
  assert.ok(mail.subject.length <= 150);
});

test("escapes every visitor-supplied value in the HTML body", () => {
  const hostile = {
    name: `<img src=x onerror=alert(1)>`,
    email: "nimali@example.com",
    company: `"><a href="https://phish.example">Reset your password</a>`,
    projectType: undefined,
    timeline: undefined,
    message: `<script>alert("x")</script> & more`,
  };
  const mail = buildContactEmail(hostile, options);
  assert.ok(!mail.html.includes("<img src=x"));
  assert.ok(!mail.html.includes('<a href="https://phish.example">'));
  assert.ok(!mail.html.includes("<script>"));
  assert.ok(mail.html.includes("&lt;img src=x onerror=alert(1)&gt;"));
  assert.ok(mail.html.includes("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; more"));
});

test("shows readable labels for project type and timeline", () => {
  const mail = buildContactEmail(contact, options);
  assert.ok(mail.html.includes("Business system"));
  assert.ok(mail.html.includes("Within 3 months"));
  assert.ok(mail.text.includes("Project type: Business system"));
  assert.ok(mail.text.includes("Timeline: Within 3 months"));
});

test("marks optional fields that were left empty", () => {
  const mail = buildContactEmail(
    { ...contact, company: undefined, projectType: undefined, timeline: undefined },
    options
  );
  assert.ok(mail.text.includes("Company: Not given"));
  assert.ok(mail.text.includes("Project type: Not given"));
  assert.ok(mail.text.includes("Timeline: Not given"));
});

test("includes a plain-text version with the full message", () => {
  const mail = buildContactEmail(contact, options);
  assert.ok(mail.text.includes("We need a booking system.\nThree branches."));
  assert.ok(mail.text.includes("Email: nimali@example.com"));
});

test("stamps the time of receipt in Sri Lanka time", () => {
  const mail = buildContactEmail(contact, options);
  assert.ok(mail.text.includes("30 Sept 2026, 10:00"), mail.text);
});
