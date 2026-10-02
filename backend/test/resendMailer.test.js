const test = require("node:test");
const assert = require("node:assert/strict");
const { createResendMailer, RESEND_ENDPOINT } = require("../src/lib/resendMailer");

const mail = {
  from: { name: "Trivista Labs website", address: "website@example.com" },
  to: "team@example.com",
  replyTo: { name: "Nimali Perera", address: "nimali@example.com" },
  subject: "New enquiry",
  text: "Plain text",
  html: "<p>HTML</p>",
};

/** A stand-in for fetch that records the request and answers with the given status and body. */
function fakeFetch(status, body) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init, payload: JSON.parse(init.body) });
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  };
  return { calls, fetchImpl };
}

test("sends the email to Resend with the API key", async () => {
  const { calls, fetchImpl } = fakeFetch(200, { id: "email-1" });
  const sendMail = createResendMailer({ apiKey: "re_test", fetchImpl });

  const result = await sendMail(mail);

  assert.deepEqual(result, { id: "email-1" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, RESEND_ENDPOINT);
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers.Authorization, "Bearer re_test");
  assert.equal(calls[0].init.headers["Content-Type"], "application/json");
});

test("translates the email into Resend's fields", async () => {
  const { calls, fetchImpl } = fakeFetch(200, { id: "email-1" });
  await createResendMailer({ apiKey: "re_test", fetchImpl })(mail);

  assert.deepEqual(calls[0].payload, {
    from: "Trivista Labs website <website@example.com>",
    to: ["team@example.com"],
    // Only the address: the visitor's name never goes into a mail header.
    reply_to: ["nimali@example.com"],
    subject: "New enquiry",
    text: "Plain text",
    html: "<p>HTML</p>",
  });
});

test("reports Resend's own error message when it refuses", async () => {
  const { fetchImpl } = fakeFetch(403, { name: "validation_error", message: "The domain is not verified." });
  const sendMail = createResendMailer({ apiKey: "re_test", fetchImpl });

  await assert.rejects(sendMail(mail), /Resend refused the email \(403\): The domain is not verified\./);
});

test("reports a refusal even when Resend's reply is not JSON", async () => {
  const fetchImpl = async () => ({ ok: false, status: 500, json: async () => { throw new SyntaxError("bad json"); } });
  await assert.rejects(createResendMailer({ apiKey: "re_test", fetchImpl })(mail), /Resend refused the email \(500\)/);
});

test("gives up when Resend does not answer in time", async () => {
  // A Resend that never answers. Its own timer keeps the test process alive, as the server would,
  // because the timeout signal's timer does not.
  const fetchImpl = (url, init) =>
    new Promise((resolve, reject) => {
      const neverAnswers = setTimeout(resolve, 5_000);
      init.signal.addEventListener("abort", () => {
        clearTimeout(neverAnswers);
        reject(init.signal.reason);
      });
    });
  const sendMail = createResendMailer({ apiKey: "re_test", fetchImpl, timeoutMs: 20 });

  await assert.rejects(sendMail(mail), (error) => error.name === "TimeoutError");
});

test("needs an API key", () => {
  assert.throws(() => createResendMailer({ apiKey: "" }), /RESEND_API_KEY/);
});
