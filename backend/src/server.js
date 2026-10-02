require("dotenv").config();
const nodemailer = require("nodemailer");
const { createApp } = require("./app");
const { parseOrigins, parseTrustProxy } = require("./config");
const { readMailConfig } = require("./lib/mailConfig");
const { createResendMailer } = require("./lib/resendMailer");

const mail = readMailConfig(process.env);
if (!mail.ok) {
  console.error(`Missing required environment variables: ${mail.missing.join(", ")}. See backend/.env.example.`);
  process.exit(1);
}
const { config } = mail;

// Give up quickly if the mail server cannot be reached. Nodemailer's defaults wait up to two minutes,
// far longer than the website waits, so visitors saw a timeout instead of the "email us directly" reply.
const SMTP_TIMEOUTS = { connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000 };

/** Resend over HTTPS on Render, where outgoing SMTP is blocked; Gmail over SMTP elsewhere. */
function createSender() {
  if (config.provider === "resend") {
    console.info("Sending email through Resend.");
    return createResendMailer({ apiKey: config.apiKey });
  }
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: config.user, pass: config.pass },
    ...SMTP_TIMEOUTS,
  });
  transporter
    .verify()
    .then(() => console.info("Sending email through Gmail: transport ready."))
    .catch((error) => console.error("Gmail transport check failed:", error.message));
  return (message) => transporter.sendMail(message);
}

const app = createApp({
  sendMail: createSender(),
  mailFrom: config.from,
  mailTo: config.to,
  allowedOrigins: parseOrigins(process.env.CORS_ORIGINS),
  trustProxyHops: parseTrustProxy(process.env.TRUST_PROXY_HOPS),
});

const port = Number(process.env.PORT) || 5000;
app.listen(port, () => {
  console.info(`Trivista Labs API listening on port ${port}.`);
});
