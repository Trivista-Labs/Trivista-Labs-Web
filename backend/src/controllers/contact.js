const { validateContact } = require("../lib/validateContact");
const { buildContactEmail } = require("../lib/contactEmail");

const SUCCESS_MESSAGE = "Thanks. Your message is with our team, and we'll reply within 24 hours.";
const DELIVERY_ERROR = "We couldn't send your message just now. Please try again, or email us directly.";

/**
 * Handle a contact form submission.
 * @param {{
 *   sendMail: (mail: object) => Promise<unknown>,
 *   mailFrom: string,
 *   mailTo: string,
 *   logger?: Pick<Console, "info" | "warn" | "error">,
 *   now?: () => Date,
 * }} dependencies
 */
function createContactHandler({ sendMail, mailFrom, mailTo, logger = console, now = () => new Date() }) {
  return async function handleContact(req, res) {
    const result = validateContact(req.body);

    if (!result.ok) {
      const [firstError] = Object.values(result.errors);
      return res.status(400).json({ success: false, error: firstError, fields: result.errors });
    }

    if (result.isSpam) {
      // Answer as if it worked so automated senders get no signal.
      logger.warn("Contact form: discarded a submission that filled the honeypot field.");
      return res.status(200).json({ success: true, message: SUCCESS_MESSAGE });
    }

    const mail = buildContactEmail(result.value, { from: mailFrom, to: mailTo, receivedAt: now() });

    try {
      await sendMail(mail);
      logger.info("Contact form: enquiry delivered.");
      return res.status(200).json({ success: true, message: SUCCESS_MESSAGE });
    } catch (error) {
      logger.error(
        "Contact form: email delivery failed:",
        error instanceof Error ? error.message : String(error)
      );
      return res.status(502).json({ success: false, error: DELIVERY_ERROR });
    }
  };
}

module.exports = { createContactHandler, SUCCESS_MESSAGE };
