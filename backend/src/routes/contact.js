const express = require("express");
const rateLimit = require("express-rate-limit");
const { sendContactEmail } = require("../controllers/contact");

const router = express.Router();

// Rate limit: max 5 submissions per IP per 15 minutes (anti-spam)
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: "Too many messages sent. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/", contactLimiter, sendContactEmail);

module.exports = router;
