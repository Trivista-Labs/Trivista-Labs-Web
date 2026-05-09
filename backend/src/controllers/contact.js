const nodemailer = require("nodemailer");

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection on startup
transporter.verify()
  .then(() => console.log("📧 Email transporter ready"))
  .catch((err) => console.error("❌ Email config error:", err.message));

/**
 * Handle contact form submission
 */
const sendContactEmail = async (req, res) => {
  const { name, email, message } = req.body;

  // Validation
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      error: "All fields are required (name, email, message).",
    });
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: "Please provide a valid email address.",
    });
  }

  // Compose the email
  const mailOptions = {
    from: `"Trivista Labs Website" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    replyTo: email,
    subject: `🔔 New Inquiry from ${name} — Trivista Labs`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; border-radius: 12px; overflow: hidden; border: 1px solid #222;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #00D1B2 0%, #009B84 100%); padding: 28px 32px;">
          <h1 style="margin: 0; color: #0a0a0a; font-size: 20px; font-weight: 700; letter-spacing: 0.02em;">
            Trivista Labs — New Contact Inquiry
          </h1>
        </div>
        
        <!-- Body -->
        <div style="padding: 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; color: #00D1B2; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; vertical-align: top; width: 120px;">
                NAME
              </td>
              <td style="padding: 12px 0; color: #E5E5E5; font-size: 15px;">
                ${name}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #00D1B2; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; vertical-align: top;">
                EMAIL
              </td>
              <td style="padding: 12px 0;">
                <a href="mailto:${email}" style="color: #E5E5E5; font-size: 15px; text-decoration: none;">
                  ${email}
                </a>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 20px 0 8px; color: #00D1B2; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">
                MESSAGE
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 0;">
                <div style="background: #141414; border: 1px solid #333; border-radius: 8px; padding: 20px; color: #E5E5E5; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
${message}
                </div>
              </td>
            </tr>
          </table>
        </div>
        
        <!-- Footer -->
        <div style="padding: 16px 32px; border-top: 1px solid #222; text-align: center;">
          <p style="margin: 0; color: #6B6B6B; font-size: 11px;">
            Sent from trivistalabs.com contact form • ${new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" })}
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️  Email sent — from: ${name} <${email}>`);
    return res.status(200).json({
      success: true,
      message: "Message sent successfully! We'll get back to you within 24 hours.",
    });
  } catch (error) {
    console.error("❌ Email send error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to send message. Please try again later.",
    });
  }
};

module.exports = { sendContactEmail };
