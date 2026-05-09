import { useEffect } from "react";

const TEAL = "#00D1B2";
const BG = "#0A0A0A";

const privacyContent = [
  {
    title: "1. Introduction",
    text: `Welcome to Trivista Labs ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website.`,
  },
  {
    title: "2. Information We Collect",
    text: `We collect only the information you voluntarily provide to us through our contact forms, including:\n\n• Your full name\n• Your email address\n• Any message or inquiry you submit\n\nWe do not collect payment information, create user accounts, or track personal browsing behavior beyond standard analytics.`,
  },
  {
    title: "3. How We Use Your Information",
    text: `We use the information you provide solely to:\n\n• Respond to your inquiries and support requests\n• Improve our website and services\n• Send relevant communications you have requested\n\nWe do not sell, rent, or trade your personal information to any third party.`,
  },
  {
    title: "4. Cookies and Analytics",
    text: `Our website may use cookies and similar tracking technologies to enhance your browsing experience and gather aggregate usage statistics. You may configure your browser to refuse cookies; however, some features of the site may not function correctly as a result.`,
  },
  {
    title: "5. Data Security",
    text: `We take reasonable technical and organizational measures to protect your personal data against unauthorized access, loss, or misuse. All data you submit is handled with care and stored securely within our systems.`,
  },
  {
    title: "6. Third-Party Links",
    text: `Our website may contain links to third-party websites. We are not responsible for the privacy practices of those sites and encourage you to review their privacy policies separately.`,
  },
  {
    title: "7. International Users",
    text: `Our services are accessible worldwide. If you are accessing our website from outside Sri Lanka, please be aware that your information may be transferred to and processed in the country where our servers are located. By using our site, you consent to this transfer.`,
  },
  {
    title: "8. Your Rights",
    text: `Depending on your location, you may have the right to:\n\n• Access the personal data we hold about you\n• Request correction of inaccurate data\n• Request deletion of your personal data\n• Opt out of any marketing communications\n\nTo exercise any of these rights, please contact us at hello@trivistalabs.com.`,
  },
  {
    title: "9. Changes to This Policy",
    text: `We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the effective date at the top of this page. Continued use of our website constitutes acceptance of the revised policy.`,
  },
  {
    title: "10. Contact Us",
    text: `If you have questions or concerns about this Privacy Policy, please reach out to us:\n\nTrivista Labs\nEmail: hello@trivistalabs.com`,
  },
];

const termsContent = [
  {
    title: "1. Acceptance of Terms",
    text: `By accessing or using the Trivista Labs website (the "Site"), you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please discontinue use of the Site immediately.`,
  },
  {
    title: "2. About Us",
    text: `Trivista Labs is a multi-faceted company providing e-commerce products, software-as-a-service (SaaS) solutions, professional services, and digital content. Our offerings are accessible through our website and associated platforms.`,
  },
  {
    title: "3. Use of the Site",
    text: `You agree to use this Site only for lawful purposes and in a manner that does not:\n\n• Infringe upon the rights of others\n• Violate any applicable local, national, or international law or regulation\n• Introduce harmful software, viruses, or malicious code\n• Attempt unauthorized access to any part of our systems\n\nWe reserve the right to restrict or terminate access to the Site for users who violate these conditions.`,
  },
  {
    title: "4. Intellectual Property",
    text: `All content on this Site, including but not limited to text, graphics, logos, icons, images, and software, is the property of Trivista Labs and protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without our prior written consent.`,
  },
  {
    title: "5. Products and Services",
    text: `By purchasing products or engaging our services through the Site, you agree to:\n\n• Provide accurate and complete information during any transaction or inquiry\n• Comply with any additional terms specific to the product or service purchased\n• Use our SaaS platforms in accordance with their respective license agreements\n\nWe reserve the right to modify, suspend, or discontinue any product or service at any time without prior notice.`,
  },
  {
    title: "6. Disclaimer of Warranties",
    text: `The Site and its contents are provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. Trivista Labs does not warrant that the Site will be uninterrupted, error-free, or free of viruses or other harmful components.`,
  },
  {
    title: "7. Limitation of Liability",
    text: `To the maximum extent permitted by law, Trivista Labs shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of, or inability to use, the Site or its services, even if we have been advised of the possibility of such damages.`,
  },
  {
    title: "8. Third-Party Services",
    text: `Our Site may integrate or link to third-party services and platforms. These are subject to their own terms and conditions. We are not responsible for the content, availability, or practices of any third-party services.`,
  },
  {
    title: "9. Privacy",
    text: `Your use of the Site is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our data practices.`,
  },
  {
    title: "10. Governing Law",
    text: `These Terms shall be governed by and construed in accordance with the laws of Sri Lanka, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of Sri Lanka.`,
  },
  {
    title: "11. Changes to These Terms",
    text: `We reserve the right to update or modify these Terms at any time. Changes will be effective upon posting to the Site. Your continued use of the Site after any changes constitutes your acceptance of the new Terms.`,
  },
  {
    title: "12. Contact Us",
    text: `If you have any questions about these Terms and Conditions, please contact us:\n\nTrivista Labs\nEmail: hello@trivistalabs.com`,
  },
];

const styles = `
  .legal-page {
    position: fixed;
    inset: 0;
    background: ${BG};
    z-index: 9999;
    overflow-y: auto;
    animation: legalFadeIn 400ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  @keyframes legalFadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .legal-header {
    position: sticky;
    top: 0;
    background: rgba(10, 10, 10, 0.92);
    backdrop-filter: blur(16px) saturate(160%);
    border-bottom: 1px solid rgba(107, 107, 107, 0.2);
    padding: 16px 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 10;
  }
  .legal-back-btn {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: ${TEAL};
    background: none;
    border: 1px solid rgba(0, 209, 178, 0.3);
    padding: 8px 20px;
    border-radius: 100px;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .legal-back-btn:hover {
    background: rgba(0, 209, 178, 0.08);
    border-color: ${TEAL};
  }
  .legal-header-title {
    font-family: 'Syne', sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: #E5E5E5;
    letter-spacing: 0.02em;
  }
  .legal-container {
    max-width: 780px;
    margin: 0 auto;
    padding: 64px 48px 120px;
  }
  .legal-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.14em;
    color: ${TEAL};
    text-transform: uppercase;
    margin-bottom: 20px;
  }
  .legal-main-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(32px, 5vw, 48px);
    font-weight: 800;
    color: #FFFFFF;
    line-height: 1.1;
    margin-bottom: 12px;
  }
  .legal-effective {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: #6B6B6B;
    margin-bottom: 48px;
    padding-bottom: 32px;
    border-bottom: 1px solid rgba(107, 107, 107, 0.2);
  }
  .legal-section {
    margin-bottom: 36px;
  }
  .legal-section-title {
    font-family: 'Syne', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: #FFFFFF;
    margin-bottom: 12px;
  }
  .legal-section-text {
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    color: #B0B0B0;
    line-height: 1.75;
    white-space: pre-line;
  }
  @media (max-width: 768px) {
    .legal-header { padding: 14px 20px; }
    .legal-container { padding: 40px 20px 80px; }
    .legal-main-title { font-size: clamp(26px, 7vw, 36px); }
    .legal-section-title { font-size: 17px; }
    .legal-section-text { font-size: 14px; }
    .legal-back-btn { font-size: 13px; padding: 7px 16px; }
    .legal-header-title { font-size: 14px; }
  }
  @media (max-width: 480px) {
    .legal-header { padding: 12px 14px; }
    .legal-container { padding: 32px 14px 60px; }
    .legal-main-title { font-size: clamp(22px, 7vw, 30px); }
    .legal-section-title { font-size: 16px; }
    .legal-section-text { font-size: 13px; line-height: 1.65; }
    .legal-header-title { font-size: 13px; }
  }
`;

const ArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
  </svg>
);

export default function LegalPage({ type = "privacy", onClose }) {
  const isPrivacy = type === "privacy";
  const content = isPrivacy ? privacyContent : termsContent;
  const title = isPrivacy ? "Privacy Policy" : "Terms & Conditions";

  useEffect(() => {
    // Scroll to top when page opens
    const el = document.querySelector(".legal-page");
    if (el) el.scrollTop = 0;
    // Prevent body scroll
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [type]);

  return (
    <>
      <style>{styles}</style>
      <div className="legal-page">
        <div className="legal-header">
          <button className="legal-back-btn" onClick={onClose}>
            <ArrowLeft /> Back
          </button>
          <span className="legal-header-title">Trivista Labs</span>
          <div style={{ width: 80 }} />
        </div>
        <div className="legal-container">
          <div className="legal-label">LEGAL</div>
          <h1 className="legal-main-title">{title}</h1>
          <p className="legal-effective">Effective Date: May 9, 2025</p>
          {content.map((section, i) => (
            <div className="legal-section" key={i}>
              <h2 className="legal-section-title">{section.title}</h2>
              <p className="legal-section-text">{section.text}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
