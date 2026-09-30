const express = require("express");
const cors = require("cors");
const { createContactHandler } = require("./controllers/contact");
const { createContactRouter } = require("./routes/contact");

const DEFAULT_RATE_LIMIT = Object.freeze({
  perVisitor: Object.freeze({ windowMs: 15 * 60 * 1000, limit: 5 }),
  overall: Object.freeze({ windowMs: 60 * 60 * 1000, limit: 60 }),
});
// Room for a 5,000-character message in scripts that use three bytes per character.
const BODY_LIMIT = "32kb";

/**
 * Build the API. Dependencies are passed in so tests can replace email delivery.
 * @param {{
 *   sendMail: (mail: object) => Promise<unknown>,
 *   mailFrom: string,
 *   mailTo: string,
 *   allowedOrigins: string[],
 *   trustProxyHops?: number,
 *   rateLimit?: {
 *     perVisitor: { windowMs: number, limit: number },
 *     overall: { windowMs: number, limit: number },
 *   },
 *   logger?: Pick<Console, "info" | "warn" | "error">,
 * }} options
 */
function createApp({
  sendMail,
  mailFrom,
  mailTo,
  allowedOrigins,
  trustProxyHops = 1,
  rateLimit = DEFAULT_RATE_LIMIT,
  logger = console,
}) {
  if (typeof sendMail !== "function") {
    throw new TypeError("createApp needs a sendMail function.");
  }

  const app = express();
  app.disable("x-powered-by");
  // Render puts a proxy in front of the app. Trusting that hop lets the rate
  // limiter see each visitor's address instead of the proxy's.
  app.set("trust proxy", trustProxyHops);

  app.use(cors({ origin: allowedOrigins, methods: ["GET", "POST"] }));
  app.use(express.json({ limit: BODY_LIMIT }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const handler = createContactHandler({ sendMail, mailFrom, mailTo, logger });
  app.use("/api/contact", createContactRouter({ handler, ...rateLimit }));

  app.use((req, res) => {
    res.status(404).json({ success: false, error: "Not found." });
  });

  // Express treats a four-argument middleware as the error handler.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ success: false, error: "The request body must be valid JSON." });
    }
    if (err.type === "entity.too.large") {
      return res.status(413).json({ success: false, error: "The message is too long." });
    }
    // Other client errors from the body parser, such as an unsupported encoding.
    if (Number.isInteger(err.status) && err.status >= 400 && err.status < 500) {
      return res.status(err.status).json({ success: false, error: "The request could not be processed." });
    }
    logger.error("Unhandled request error:", err.message);
    return res.status(500).json({ success: false, error: "Something went wrong. Please try again later." });
  });

  return app;
}

module.exports = { createApp };
