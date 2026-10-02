require("dotenv").config();
const nodemailer = require("nodemailer");
const { createApp } = require("./app");
const { parseOrigins, parseTrustProxy } = require("./config");

const REQUIRED_ENV = ["EMAIL_USER", "EMAIL_PASS"];
const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(", ")}. See backend/.env.example.`);
  process.exit(1);
}

// Give up quickly if the mail server cannot be reached. Nodemailer's defaults wait up to two minutes,
// far longer than the website waits, so visitors saw a timeout instead of the "email us directly" reply.
const SMTP_TIMEOUTS = { connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000 };

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  ...SMTP_TIMEOUTS,
});

transporter
  .verify()
  .then(() => console.info("Email transport ready."))
  .catch((error) => console.error("Email transport check failed:", error.message));

const app = createApp({
  sendMail: (mail) => transporter.sendMail(mail),
  mailFrom: process.env.EMAIL_USER,
  mailTo: process.env.CONTACT_TO || process.env.EMAIL_USER,
  allowedOrigins: parseOrigins(process.env.CORS_ORIGINS),
  trustProxyHops: parseTrustProxy(process.env.TRUST_PROXY_HOPS),
});

const port = Number(process.env.PORT) || 5000;
app.listen(port, () => {
  console.info(`Trivista Labs API listening on port ${port}.`);
});
