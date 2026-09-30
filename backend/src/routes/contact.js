const express = require("express");
const { rateLimit } = require("express-rate-limit");

const minutesIn = (windowMs) => Math.max(1, Math.ceil(windowMs / 60_000));

/**
 * Contact routes behind two limits: one per visitor, and one across all visitors so a
 * flood from many addresses cannot exhaust the mail account's sending quota.
 * IPv6 visitors are grouped by /56, the usual size of one customer's allocation.
 * @param {{
 *   handler: import("express").RequestHandler,
 *   perVisitor: { windowMs: number, limit: number },
 *   overall: { windowMs: number, limit: number },
 * }} options
 */
function createContactRouter({ handler, perVisitor, overall }) {
  const visitorLimiter = rateLimit({
    windowMs: perVisitor.windowMs,
    limit: perVisitor.limit,
    ipv6Subnet: 56,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      success: false,
      error: `Too many messages from this connection. Please try again in ${minutesIn(perVisitor.windowMs)} minutes, or email us directly.`,
    },
  });

  const overallLimiter = rateLimit({
    windowMs: overall.windowMs,
    limit: overall.limit,
    keyGenerator: () => "all-visitors",
    standardHeaders: false,
    legacyHeaders: false,
    message: {
      success: false,
      error: "We are receiving an unusual number of messages right now. Please email us directly.",
    },
  });

  const router = express.Router();
  router.post("/", visitorLimiter, overallLimiter, handler);
  return router;
}

module.exports = { createContactRouter };
