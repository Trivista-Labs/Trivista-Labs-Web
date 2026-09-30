const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { createApp } = require("../src/app");

const silentLogger = { info() {}, warn() {}, error() {} };

const valid = {
  name: "Nimali Perera",
  email: "nimali@example.com",
  message: "We need a booking system for three branches.",
};

function setup(overrides = {}) {
  const sent = [];
  const app = createApp({
    sendMail: async (mail) => {
      sent.push(mail);
      return { messageId: "test-message" };
    },
    mailFrom: "website@example.com",
    mailTo: "team@example.com",
    allowedOrigins: ["https://trivistalabs.io"],
    trustProxyHops: 1,
    rateLimit: {
      perVisitor: { windowMs: 60_000, limit: 100 },
      overall: { windowMs: 60_000, limit: 1000 },
    },
    logger: silentLogger,
    ...overrides,
  });
  return { app, sent };
}

const limits = (perVisitor, overall = 1000) => ({
  rateLimit: {
    perVisitor: { windowMs: 60_000, limit: perVisitor },
    overall: { windowMs: 60_000, limit: overall },
  },
});

test("reports health", async () => {
  const { app } = setup();
  const res = await request(app).get("/api/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.status, "ok");
});

test("does not advertise the framework in response headers", async () => {
  const { app } = setup();
  const res = await request(app).get("/api/health");
  assert.equal(res.headers["x-powered-by"], undefined);
});

test("sends a valid enquiry and confirms it", async () => {
  const { app, sent } = setup();
  const res = await request(app).post("/api/contact").send(valid);
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(typeof res.body.message, "string");
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "team@example.com");
  assert.deepEqual(sent[0].replyTo, { name: "Nimali Perera", address: "nimali@example.com" });
});

test("passes the new optional fields through to the email", async () => {
  const { app, sent } = setup();
  const res = await request(app)
    .post("/api/contact")
    .send({ ...valid, company: "Perera Salons", projectType: "business-system", timeline: "asap" });
  assert.equal(res.status, 200);
  assert.ok(sent[0].text.includes("Company: Perera Salons"));
  assert.ok(sent[0].text.includes("Project type: Business system"));
});

test("escapes hostile input before it reaches the email", async () => {
  const { app, sent } = setup();
  await request(app)
    .post("/api/contact")
    .send({ ...valid, name: "<b>Bold</b>", message: `<a href="https://phish.example">Click here</a> now` });
  assert.equal(sent.length, 1);
  assert.ok(!sent[0].html.includes("<b>Bold</b>"));
  assert.ok(!sent[0].html.includes('<a href="https://phish.example">'));
});

test("rejects an invalid enquiry with field errors and sends nothing", async () => {
  const { app, sent } = setup();
  const res = await request(app).post("/api/contact").send({ ...valid, email: "not-an-email" });
  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.equal(typeof res.body.error, "string");
  assert.ok(res.body.fields.email);
  assert.equal(sent.length, 0);
});

test("accepts honeypot submissions quietly without sending anything", async () => {
  const { app, sent } = setup();
  const res = await request(app).post("/api/contact").send({ ...valid, contact_ref: "https://spam.example" });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(sent.length, 0);
});

test("returns a JSON error when email delivery fails", async () => {
  const { app } = setup({
    sendMail: async () => {
      throw new Error("SMTP unavailable");
    },
  });
  const res = await request(app).post("/api/contact").send(valid);
  assert.equal(res.status, 502);
  assert.equal(res.body.success, false);
  assert.ok(!JSON.stringify(res.body).includes("SMTP unavailable"));
});

test("returns a JSON error for malformed JSON", async () => {
  const { app } = setup();
  const res = await request(app)
    .post("/api/contact")
    .set("Content-Type", "application/json")
    .send('{"name": "broken"');
  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.match(res.headers["content-type"], /application\/json/);
});

test("rejects request bodies over 32 KB", async () => {
  const { app, sent } = setup();
  const res = await request(app).post("/api/contact").send({ ...valid, message: "x".repeat(33 * 1024) });
  assert.equal(res.status, 413);
  assert.equal(res.body.success, false);
  assert.equal(sent.length, 0);
});

test("accepts a full-length message in Sinhala, which needs three bytes per character", async () => {
  const { app, sent } = setup();
  const res = await request(app).post("/api/contact").send({ ...valid, message: "අ".repeat(5000) });
  assert.equal(res.status, 200);
  assert.equal(sent.length, 1);
});

test("answers other client errors with their own status instead of a server error", async () => {
  const errors = [];
  const { app } = setup({ logger: { ...silentLogger, error: (...args) => errors.push(args) } });
  const res = await request(app)
    .post("/api/contact")
    .set("Content-Type", "application/json")
    .set("Content-Encoding", "br")
    .send(JSON.stringify(valid));
  assert.equal(res.status, 415);
  assert.equal(res.body.success, false);
  assert.equal(errors.length, 0);
});

test("limits submissions per visitor rather than per proxy", async () => {
  const { app } = setup(limits(2));
  const from = (ip) => request(app).post("/api/contact").set("X-Forwarded-For", ip).send(valid);

  assert.equal((await from("203.0.113.1")).status, 200);
  assert.equal((await from("203.0.113.1")).status, 200);

  const limited = await from("203.0.113.1");
  assert.equal(limited.status, 429);
  assert.equal(limited.body.success, false);

  assert.equal((await from("203.0.113.2")).status, 200);
});

test("cannot be bypassed by forging extra X-Forwarded-For entries", async () => {
  const { app } = setup(limits(2));
  // The proxy appends the real address last. Forged entries in front must not matter.
  const forged = (fake) =>
    request(app).post("/api/contact").set("X-Forwarded-For", `${fake}, 203.0.113.9`).send(valid);

  assert.equal((await forged("198.51.100.1")).status, 200);
  assert.equal((await forged("198.51.100.2")).status, 200);
  assert.equal((await forged("198.51.100.3")).status, 429);
});

test("treats addresses from one IPv6 allocation as one visitor", async () => {
  const { app } = setup(limits(2));
  const from = (ip) => request(app).post("/api/contact").set("X-Forwarded-For", ip).send(valid);

  assert.equal((await from("2001:db8:abcd:1200::1")).status, 200);
  assert.equal((await from("2001:db8:abcd:1201::2")).status, 200);
  assert.equal((await from("2001:db8:abcd:12ff::3")).status, 429);
  assert.equal((await from("2001:db8:ffff::1")).status, 200);
});

test("caps the total number of messages from everyone", async () => {
  const { app, sent } = setup(limits(100, 3));
  const from = (ip) => request(app).post("/api/contact").set("X-Forwarded-For", ip).send(valid);

  for (const ip of ["203.0.113.1", "203.0.113.2", "203.0.113.3"]) {
    assert.equal((await from(ip)).status, 200);
  }
  const capped = await from("203.0.113.4");
  assert.equal(capped.status, 429);
  assert.equal(capped.body.success, false);
  assert.equal(sent.length, 3);
});

test("allows the site origin through CORS and ignores others", async () => {
  const { app } = setup();
  const allowed = await request(app).get("/api/health").set("Origin", "https://trivistalabs.io");
  assert.equal(allowed.headers["access-control-allow-origin"], "https://trivistalabs.io");

  const other = await request(app).get("/api/health").set("Origin", "https://evil.example");
  assert.equal(other.headers["access-control-allow-origin"], undefined);
});

test("answers unknown routes with a JSON 404", async () => {
  const { app } = setup();
  const res = await request(app).get("/api/nope");
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
});
