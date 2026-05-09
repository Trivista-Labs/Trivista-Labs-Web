import { useState, useEffect, useRef, useCallback } from "react";
import Hero3D from "./components/Hero3D";
import LoadingScreen from "./components/LoadingScreen";
import BackgroundLayers from "./components/BackgroundLayers";
import { useScrollAnimations, useActiveSection } from "./hooks/useAnimations";
import trivistaLogo from "./assets/logo.png";

const TEAL = "#00D1B2";
const BG = "#0A0A0A";
const CARD = "#141414";
const BORDER = "#6B6B6B";
const TEXT_SUBTLE = "#E5E5E5";
const TEXT_BODY = "#FFFFFF";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: ${BG};
    color: ${TEXT_BODY};
    font-family: 'DM Sans', sans-serif;
    overflow-x: hidden;
    cursor: none;
  }

  .cursor-dot {
    position: fixed;
    width: 6px;
    height: 6px;
    background: ${TEAL};
    border-radius: 50%;
    pointer-events: none;
    z-index: 99999;
    transform: translate(-50%, -50%);
    transition: opacity 0.2s, transform 0.2s;
  }
  .cursor-ring {
    position: fixed;
    width: 36px;
    height: 36px;
    border: 1px solid ${TEAL};
    border-radius: 50%;
    pointer-events: none;
    z-index: 99998;
    transform: translate(-50%, -50%);
    transition: width 0.3s cubic-bezier(0.34,1.56,0.64,1), height 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s, background 0.3s;
    opacity: 0.5;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cursor-ring.hovered {
    width: 64px;
    height: 64px;
    opacity: 0.9;
    background: rgba(0,209,178,0.08);
  }
  .cursor-ring.hovered .cursor-label {
    opacity: 1;
  }
  .cursor-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    color: ${TEAL};
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
  }

  /* NAVBAR */
  .navbar {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 1000;
    padding: 0 48px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 380ms cubic-bezier(0.4,0,0.2,1);
  }
  .navbar.scrolled {
    background: rgba(10,10,10,0.88);
    backdrop-filter: blur(24px) saturate(160%);
    border-bottom: 1px solid rgba(0,209,178,0.12);
  }
  .nav-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 18px;
    color: ${TEXT_BODY};
    text-decoration: none;
    transition: transform 380ms cubic-bezier(0.4,0,0.2,1);
  }
  .navbar.scrolled .nav-logo { transform: scale(0.88); }
  .nav-logo-icon {
    width: 32px;
    height: 32px;
    background: ${CARD};
    border: 1px solid ${BORDER};
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .nav-links {
    display: flex;
    gap: 40px;
    list-style: none;
  }
  .nav-link {
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    color: ${TEXT_SUBTLE};
    text-decoration: none;
    position: relative;
    padding-bottom: 3px;
    cursor: none;
    transition: color 0.2s;
  }
  .nav-link::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0;
    width: 0%; height: 1px;
    background: ${TEAL};
    transition: width 260ms cubic-bezier(0.4,0,0.2,1);
  }
  .nav-link:hover::after, .nav-link.active::after { width: 100%; }
  .nav-link.active { color: ${TEAL}; font-weight: 500; }
  .nav-link:hover { color: ${TEXT_BODY}; }
  .btn-primary {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: ${BG};
    background: ${TEAL};
    border: none;
    padding: 10px 24px;
    border-radius: 100px;
    cursor: none;
    position: relative;
    overflow: hidden;
    transition: transform 0.08s;
  }
  .btn-primary:active { transform: scale(0.95); }
  .btn-outline {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: ${TEXT_BODY};
    background: transparent;
    border: 1px solid ${TEAL};
    padding: 14px 40px;
    border-radius: 6px;
    cursor: none;
    position: relative;
    overflow: hidden;
    transition: color 0.32s;
  }
  .btn-outline::before {
    content: '';
    position: absolute;
    inset: 0;
    background: ${TEAL};
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 320ms cubic-bezier(0.4,0,0.2,1);
  }
  .btn-outline:hover::before { transform: scaleX(1); }
  .btn-outline:hover { color: ${BG}; }
  .btn-outline span { position: relative; z-index: 1; }

  /* HERO */
  .hero {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    padding-top: 72px;
  }
  .hero-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.12em;
    color: ${TEAL};
    background: rgba(0,209,178,0.08);
    border: 1px solid rgba(0,209,178,0.2);
    border-radius: 100px;
    padding: 6px 16px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 32px;
  }
  .hero-headline {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: clamp(52px, 8vw, 96px);
    line-height: 1.0;
    text-align: center;
    margin-bottom: 28px;
    will-change: transform;
  }
  .hero-headline .line-teal { color: ${TEAL}; }
  .hero-sub {
    font-family: 'DM Sans', sans-serif;
    font-size: 17px;
    color: ${TEXT_SUBTLE};
    text-align: center;
    max-width: 560px;
    line-height: 1.65;
    margin-bottom: 48px;
    will-change: transform, opacity;
  }
  .hero-btns {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .btn-teal-filled {
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: ${BG};
    background: ${TEAL};
    border: none;
    padding: 16px 40px;
    border-radius: 6px;
    cursor: none;
    position: relative;
    overflow: hidden;
    transition: transform 0.08s;
  }
  .btn-teal-filled:active { transform: scale(0.95); }

  /* HERO GLOW BG */
  .hero-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 700px;
    height: 700px;
    background: radial-gradient(ellipse, rgba(0,209,178,0.07) 0%, transparent 70%);
    pointer-events: none;
  }

  /* SECTION LABEL */
  .section-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.14em;
    color: ${TEAL};
    margin-bottom: 24px;
    text-transform: uppercase;
  }
  .section-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: clamp(36px, 5vw, 56px);
    line-height: 1.1;
    margin-bottom: 24px;
  }
  .section-body {
    font-family: 'DM Sans', sans-serif;
    font-size: 16px;
    color: ${TEXT_SUBTLE};
    line-height: 1.7;
  }

  /* ABOUT */
  .about-section {
    padding: 120px 48px;
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    align-items: start;
  }
  .about-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .stat-card {
    background: ${CARD};
    border: 1px solid rgba(107,107,107,0.4);
    border-radius: 16px;
    padding: 32px 28px;
    transition: border-color 0.3s;
  }
  .stat-card:hover { border-color: rgba(0,209,178,0.3); }
  .stat-value {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 42px;
    color: ${TEAL};
    margin-bottom: 8px;
    transition: text-shadow 400ms ease;
  }
  .stat-value.glowing {
    text-shadow: 0 0 20px rgba(0,209,178,0.6);
  }
  .stat-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.12em;
    color: ${TEXT_SUBTLE};
    text-transform: uppercase;
  }
  .about-pill {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 28px;
    padding: 12px 16px;
    background: ${CARD};
    border: 1px solid rgba(107,107,107,0.3);
    border-radius: 10px;
  }
  .about-pill-icon {
    width: 36px;
    height: 36px;
    background: rgba(0,209,178,0.1);
    border: 1px solid rgba(0,209,178,0.2);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${TEAL};
    font-size: 16px;
  }
  .about-pill-text {
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    color: ${TEXT_BODY};
  }

  /* SERVICES */
  .services-section {
    padding: 120px 48px;
    max-width: 1200px;
    margin: 0 auto;
  }
  .services-header {
    text-align: center;
    margin-bottom: 64px;
  }
  .services-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
  .service-card {
    background: ${CARD};
    border: 1px solid rgba(107,107,107,0.3);
    border-radius: 16px;
    padding: 36px 32px;
    cursor: none;
    transform-style: preserve-3d;
    perspective: 900px;
    will-change: transform;
    transition: box-shadow 500ms ease, transform 700ms cubic-bezier(0.23,1,0.32,1);
  }
  .service-card:hover {
    box-shadow: 0 0 0 1px rgba(0,209,178,0.4), 0 20px 40px rgba(0,0,0,0.6), 0 0 60px rgba(0,209,178,0.12);
  }
  .service-icon-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
    transform: translateZ(30px);
  }
  .service-icon-bg {
    width: 52px;
    height: 52px;
    background: rgba(0,209,178,0.1);
    border: 1px solid rgba(0,209,178,0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${TEAL};
    font-size: 20px;
  }
  .service-icon-secondary {
    color: rgba(107,107,107,0.5);
    font-size: 28px;
  }
  .service-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 26px;
    line-height: 1.15;
    margin-bottom: 16px;
    transform: translateZ(20px);
  }
  .service-body {
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    color: ${TEXT_SUBTLE};
    line-height: 1.65;
    margin-bottom: 28px;
    transform: translateZ(10px);
  }
  .service-tag {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: ${TEAL};
    margin-bottom: 8px;
    letter-spacing: 0.08em;
  }

  /* TEAM */
  .team-section {
    padding: 120px 48px;
    max-width: 1200px;
    margin: 0 auto;
  }
  .team-header {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    align-items: end;
    margin-bottom: 64px;
  }
  .team-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 28px;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  @keyframes avatarPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(0,209,178,0); }
    50% { box-shadow: 0 0 0 8px rgba(0,209,178,0.2); }
  }

  .team-card {
    background: ${CARD};
    border: 1px solid rgba(107,107,107,0.3);
    border-radius: 16px;
    overflow: hidden;
    cursor: none;
    will-change: transform;
    transition: transform 400ms cubic-bezier(0.34,1.56,0.64,1), border-color 0.3s;
  }
  .team-card:nth-child(1) { animation: float 4s ease-in-out infinite; }
  .team-card:nth-child(2) { animation: float 4s ease-in-out infinite 0.4s; }
  .team-card:nth-child(3) { animation: float 4s ease-in-out infinite 0.8s; }
  .team-card:hover {
    animation-play-state: paused;
    transform: translateY(-12px) scale(1.02) !important;
    border-color: ${TEAL};
  }
  .team-avatar {
    width: 100%;
    aspect-ratio: 4/3;
    object-fit: cover;
    display: block;
    filter: grayscale(0.3);
    border-radius: 0;
  }
  .team-avatar-placeholder {
    width: 100%;
    aspect-ratio: 4/3;
    background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: avatarPulse 3s ease-in-out infinite;
  }
  .team-avatar-initials {
    font-family: 'Syne', sans-serif;
    font-size: 32px;
    font-weight: 700;
    color: ${TEAL};
    opacity: 0.6;
  }
  .team-info {
    padding: 24px 24px 28px;
  }
  .team-name {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 22px;
    margin-bottom: 6px;
  }
  .team-role {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.1em;
    color: ${TEAL};
    text-transform: uppercase;
  }

  /* CONTACT */
  .contact-section {
    padding: 80px 48px 120px;
    max-width: 1200px;
    margin: 0 auto;
  }
  .contact-card {
    background: ${CARD};
    border: 1px solid rgba(107,107,107,0.3);
    border-radius: 20px;
    padding: 64px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
  }
  .contact-info-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 28px;
    font-size: 15px;
    color: ${TEXT_SUBTLE};
  }
  .contact-info-row svg { color: ${TEAL}; flex-shrink: 0; }
  .form-group { margin-bottom: 24px; position: relative; }
  .form-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.1em;
    color: ${TEXT_SUBTLE};
    text-transform: uppercase;
    display: block;
    margin-bottom: 8px;
  }
  .form-input {
    width: 100%;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(107,107,107,0.4);
    border-radius: 8px;
    padding: 14px 16px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    color: ${TEXT_BODY};
    outline: none;
    transition: border-color 200ms ease, box-shadow 200ms ease;
    resize: none;
  }
  .form-input::placeholder { color: rgba(107,107,107,0.7); }
  .form-input:focus {
    border-color: ${TEAL};
    box-shadow: 0 0 0 3px rgba(0,209,178,0.15);
  }
  .btn-submit {
    width: 100%;
    background: ${TEAL};
    color: ${BG};
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    letter-spacing: 0.14em;
    font-weight: 500;
    padding: 18px;
    border: none;
    border-radius: 8px;
    cursor: none;
    text-transform: uppercase;
    transition: opacity 0.2s, transform 0.08s;
  }
  .btn-submit:hover { opacity: 0.9; }
  .btn-submit:active { transform: scale(0.98); }

  /* FOOTER */
  .footer {
    border-top: 1px solid rgba(107,107,107,0.2);
    padding: 64px 48px 40px;
    max-width: 1200px;
    margin: 0 auto;
  }
  .footer-grid {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 60px;
    margin-bottom: 60px;
  }
  .footer-brand-desc {
    font-size: 14px;
    color: ${TEXT_SUBTLE};
    line-height: 1.7;
    margin-top: 16px;
    margin-bottom: 24px;
  }
  .footer-social-icons {
    display: flex;
    gap: 12px;
  }
  .footer-social-icon {
    width: 36px;
    height: 36px;
    border: 1px solid rgba(107,107,107,0.4);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${TEXT_SUBTLE};
    cursor: none;
    transition: border-color 0.2s, color 0.2s;
    font-size: 14px;
  }
  .footer-social-icon:hover { border-color: ${TEAL}; color: ${TEAL}; }
  .footer-col-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.14em;
    color: ${TEAL};
    text-transform: uppercase;
    margin-bottom: 20px;
  }
  .footer-link {
    display: block;
    font-size: 14px;
    color: ${TEXT_SUBTLE};
    text-decoration: none;
    margin-bottom: 12px;
    cursor: none;
    transition: color 0.2s;
  }
  .footer-link:hover { color: ${TEXT_BODY}; }
  .footer-bottom {
    border-top: 1px solid rgba(107,107,107,0.2);
    padding-top: 24px;
    font-size: 13px;
    color: rgba(107,107,107,0.7);
    font-family: 'JetBrains Mono', monospace;
  }

  /* PAGE TRANSITION OVERLAY */
  .page-transition {
    position: fixed;
    inset: 0;
    background: ${BG};
    z-index: 9998;
    transform: scaleY(0);
    transform-origin: bottom;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }
  .page-transition .transition-logo {
    width: 144px;
    height: 144px;
    object-fit: contain;
    opacity: 0;
    transform: scale(0.7);
    transition: opacity 250ms ease, transform 250ms cubic-bezier(0.16, 1, 0.3, 1);
    filter: drop-shadow(0 0 20px rgba(0,209,178,0.35));
  }
  .page-transition.show-logo .transition-logo {
    opacity: 1;
    transform: scale(1);
  }
  .page-transition .transition-brand {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 28px;
    letter-spacing: 0.12em;
    color: rgba(255,255,255,0.4);
    opacity: 0;
    transition: opacity 250ms ease 80ms;
  }
  .page-transition.show-logo .transition-brand {
    opacity: 1;
  }

  /* DIVIDER */
  .section-divider {
    border: none;
    border-top: 1px solid rgba(107,107,107,0.2);
    margin: 0 48px;
  }

  @media (max-width: 1024px) {
    .services-grid { grid-template-columns: 1fr; }
    .team-grid { grid-template-columns: 1fr; }
    .about-section { grid-template-columns: 1fr; }
    .team-header { grid-template-columns: 1fr; }
    .contact-card { grid-template-columns: 1fr; }
    .footer-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 768px) {
    .navbar { padding: 0 24px; }
    .nav-links { display: none; }
    .hero { padding: 100px 24px 60px; }
    .about-section, .services-section, .team-section, .contact-section { padding: 80px 24px; }
    .footer { padding: 40px 24px; }
    .footer-grid { grid-template-columns: 1fr; }
    .contact-card { padding: 32px 24px; }
  }
  @media (hover: none), (pointer: coarse) {
    body { cursor: auto !important; }
    .cursor-dot, .cursor-ring { display: none !important; }
    * { cursor: auto !important; }
  }

  /* Button sweep animations */
  .btn-teal-filled::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(255,255,255,0.15);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 320ms cubic-bezier(0.4,0,0.2,1);
  }
  .btn-teal-filled:hover::before { transform: scaleX(1); }

  /* Hero background layer for parallax */
  .hero-bg-layer {
    position: absolute;
    inset: 0;
    z-index: 0;
    will-change: transform;
  }
`;

// SVG Icons as components
const DiamondIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L22 9l-10 13L2 9z" />
  </svg>
);

const CodeIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
  </svg>
);

const ChipIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="7" y="7" width="10" height="10" rx="1" />
    <path d="M4 10v1M4 14v1M20 10v1M20 14v1M10 4h1M14 4h1M10 20h1M14 20h1" />
  </svg>
);

const ServerIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="2" y="3" width="20" height="5" rx="1" />
    <rect x="2" y="10" width="20" height="5" rx="1" />
    <rect x="2" y="17" width="20" height="5" rx="1" />
    <circle cx="6" cy="5.5" r="0.8" fill="currentColor" />
    <circle cx="6" cy="12.5" r="0.8" fill="currentColor" />
  </svg>
);

const MailIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LocationIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const CheckCircleIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const TerminalIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <polyline points="4 17 10 11 4 5" /><line x1="12" x2="20" y1="19" y2="19" />
  </svg>
);

const GlobeIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const ShareIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

function useCountUp(target, duration = 2000, started = false) {
  const [count, setCount] = useState(0);
  const [glowing, setGlowing] = useState(false);
  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const easeOutExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.round(easeOutExpo(progress) * target));
      if (progress < 1) requestAnimationFrame(tick);
      else setGlowing(true);
    };
    requestAnimationFrame(tick);
  }, [started, target, duration]);
  return { count, glowing };
}

function StatCard({ value, label, isText = false, delay = 0 }) {
  const ref = useRef(null);
  const [started, setStarted] = useState(false);
  const numVal = isText ? 0 : parseInt(value);
  const { count, glowing } = useCountUp(numVal, 2000, started && !isText);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="stat-card" ref={ref} style={{ opacity: started ? 1 : 0, transform: started ? 'translateY(0)' : 'translateY(20px)', transition: `opacity 0.6s ${delay}ms, transform 0.6s ${delay}ms` }}>
      <div className={`stat-value${glowing || isText ? ' glowing' : ''}`}>{isText ? value : (started ? count : 0)}{!isText && value.includes('+') ? '+' : ''}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function ServiceCard({ icon, iconSecondary, title, body, tags }) {
  const cardRef = useRef(null);
  const rafRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouse.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        if (!cardRef.current) return;
        const rect2 = cardRef.current.getBoundingClientRect();
        const cx = rect2.width / 2;
        const cy = rect2.height / 2;
        const rx = ((mouse.current.y - cy) / cy) * 8;
        const ry = ((mouse.current.x - cx) / cx) * -8;
        cardRef.current.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`;
        cardRef.current.style.transition = 'none';
        rafRef.current = null;
      });
    }
  };
  const handleMouseLeave = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (cardRef.current) {
      cardRef.current.style.transform = '';
      cardRef.current.style.transition = 'transform 700ms cubic-bezier(0.23,1,0.32,1), box-shadow 500ms ease';
    }
  };

  return (
    <div className="service-card" ref={cardRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <div className="service-icon-row">
        <div className="service-icon-bg">{icon}</div>
        <div className="service-icon-secondary">{iconSecondary}</div>
      </div>
      <div className="service-title">{title}</div>
      <div className="service-body">{body}</div>
      {tags.map(t => (
        <div className="service-tag" key={t}>
          <CheckCircleIcon size={13} />
          {t}
        </div>
      ))}
    </div>
  );
}

export default function TrivistaLabs() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [loaded, setLoaded] = useState(false);
  const cursorDotRef = useRef(null);
  const cursorRingRef = useRef(null);
  const ringPos = useRef({ x: -100, y: -100 });
  const mousePos = useRef({ x: -100, y: -100 });
  const [ringHovered, setRingHovered] = useState(false);
  const transitionRef = useRef(null);

  // GSAP scroll animations - only after loading screen completes
  useScrollAnimations(loaded);
  useActiveSection(setActiveSection);

  const handleLoadComplete = useCallback(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (cursorDotRef.current) {
        cursorDotRef.current.style.left = e.clientX + 'px';
        cursorDotRef.current.style.top = e.clientY + 'px';
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    let animId;
    const loop = () => {
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * 0.12;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * 0.12;
      if (cursorRingRef.current) {
        cursorRingRef.current.style.left = ringPos.current.x + 'px';
        cursorRingRef.current.style.top = ringPos.current.y + 'px';
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    // Re-attach hover listeners when loaded changes (DOM updates)
    const attachHoverListeners = () => {
      const onEnter = () => setRingHovered(true);
      const onLeave = () => setRingHovered(false);
      const hoverEls = document.querySelectorAll('button, a, .service-card, .team-card, .nav-link, .footer-link, .footer-social-icon');
      hoverEls.forEach(el => { el.addEventListener('mouseenter', onEnter); el.addEventListener('mouseleave', onLeave); });
    };
    // Attach after a small delay to ensure DOM is rendered
    const t = setTimeout(attachHoverListeners, 200);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animId);
      clearTimeout(t);
    };
  }, [loaded]);

  // Page transition scroll function
  const scrollTo = (id) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const overlay = transitionRef.current;
    if (!overlay) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    // Phase 1: Slide overlay in from bottom
    overlay.classList.remove('show-logo');
    overlay.style.transformOrigin = 'bottom';
    overlay.style.transform = 'scaleY(1)';
    overlay.style.transition = 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1)';
    // Phase 2: Show logo once overlay is fully visible
    setTimeout(() => {
      overlay.classList.add('show-logo');
    }, 10);
    // Phase 3: Scroll to target while logo is showing, then slide out
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'instant' });
      overlay.classList.remove('show-logo');
      overlay.style.transformOrigin = 'top';
      overlay.style.transform = 'scaleY(0)';
      overlay.style.transition = 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1)';
    }, 750);
  };

  const teamMembers = [
    { name: "Esala Gamage", role: "Chief Executive & Engineer (CEO)", initials: "EG" },
    { name: "Umesh Isuranga", role: "Lead Systems Architect (CTO)", initials: "UI" },
    { name: "Dulaj Yuthsara", role: "Hardware Operations Lead (COO)", initials: "DY" },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className={`cursor-dot`} ref={cursorDotRef} style={{ opacity: ringHovered ? 0 : 1, transform: `translate(-50%, -50%) scale(${ringHovered ? 0 : 1})` }} />
      <div className={`cursor-ring${ringHovered ? ' hovered' : ''}`} ref={cursorRingRef}>
        <span className="cursor-label">View</span>
      </div>

      {/* LOADING SCREEN */}
      {!loaded && <LoadingScreen onComplete={handleLoadComplete} />}

      {/* PAGE TRANSITION OVERLAY */}
      <div className="page-transition" ref={transitionRef}>
        <img src={trivistaLogo} alt="" className="transition-logo" />
        <span className="transition-brand">TRIVISTA LABS</span>
      </div>

      {/* NAVBAR */}
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <a href="#" className="nav-logo" onClick={e => { e.preventDefault(); scrollTo('home'); }}>
          <div className="nav-logo-icon">
            <img src={trivistaLogo} alt="Trivista Labs" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          </div>
          Trivista Labs
        </a>
        <ul className="nav-links">
          {['home', 'about', 'services', 'team', 'contact'].map(s => (
            <li key={s}>
              <a className={`nav-link${activeSection === s ? ' active' : ''}`} href={`#${s}`}
                onClick={e => { e.preventDefault(); scrollTo(s); setActiveSection(s); }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </a>
            </li>
          ))}
        </ul>
        <button className="btn-primary" onClick={() => scrollTo('contact')}>Get in Touch</button>
      </nav>

      {/* HERO */}
      <section id="home" className="hero">
        <div className="hero-bg-layer">
          <BackgroundLayers />
        </div>
        <Hero3D />
        <div className="hero-glow" />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="hero-badge">
            <TerminalIcon size={12} />
            PRECISION ENGINEERING LAB
          </div>
          <h1 className="hero-headline">
            Engineering<br />
            <span className="line-teal">Tomorrow's</span><br />
            Impact
          </h1>
          <p className="hero-sub">
            Architecting the intersection of sophisticated hardware and elite software solutions. We build the stable foundations for future innovation.
          </p>
          <div className="hero-btns">
            <button className="btn-teal-filled" onClick={() => scrollTo('services')}>Explore Our Work</button>
            <button className="btn-outline" onClick={() => scrollTo('team')}><span>Meet the Team</span></button>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ABOUT */}
      <section id="about" style={{ position: 'relative', overflow: 'hidden' }}>
        <BackgroundLayers />
        <div className="about-section">
          <div>
            <div className="section-label">OUR MISSION</div>
            <h2 className="section-title">Built on Technical Rigor and Mathematical Precision.</h2>
            <p className="section-body">
              At Trivista Labs, we don't just develop; we engineer. Every line of code and every hardware integration is treated as a component of a larger, high-performance architecture. We solve the complex problems that sit at the edge of possibility.
            </p>
            <div className="about-pill">
              <div className="about-pill-icon"><DiamondIcon size={16} /></div>
              <span className="about-pill-text">Architectural Stability First</span>
            </div>
            <div className="about-pill" style={{ marginTop: 12 }}>
              <div className="about-pill-icon">⚡</div>
              <span className="about-pill-text">Elite Performance Tuning</span>
            </div>
          </div>
          <div className="about-stats">
            <StatCard value="3" label="FOUNDERS" delay={0} />
            <StatCard value="2+" label="YEARS" delay={100} />
            <StatCard value="LK" label="HQ" isText delay={200} />
            <StatCard value="∞" label="AMBITION" isText delay={300} />
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* SERVICES */}
      <section id="services">
        <div className="services-section">
          <div className="services-header">
            <div className="section-label">OUR CAPABILITIES</div>
            <h2 className="section-title">Precision Managed Services</h2>
          </div>
          <div className="services-grid">
            <ServiceCard
              icon={<DiamondIcon size={20} />}
              iconSecondary={<CodeIcon size={28} />}
              title="Full-Stack Development"
              body="Building robust, scalable web and mobile ecosystems with a focus on atomic design and architectural integrity."
              tags={['SYSTEM_ARCHITECTURE', 'SCALE_OPTIMIZATION']}
            />
            <ServiceCard
              icon={<ChipIcon size={20} />}
              iconSecondary={<ChipIcon size={28} />}
              title="HW-SW Integration"
              body="Bridging the gap between physical components and digital control layers. Specialized IoT and custom firmware development."
              tags={['EMBEDDED_LOGIC', 'PROTOCOL_DESIGN']}
            />
            <ServiceCard
              icon={<ServerIcon size={20} />}
              iconSecondary={<ServerIcon size={28} />}
              title="Enterprise IT"
              body="Deployment and management of high-availability enterprise infrastructure and secure data management systems."
              tags={['CLOUD_MANAGEMENT', 'DATA_SOVEREIGNTY']}
            />
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* TEAM */}
      <section id="team">
        <div className="team-section">
          <div className="team-header">
            <div>
              <div className="section-label">THE ARCHITECTS</div>
              <h2 className="section-title">Meet the Founding Trio</h2>
            </div>
            <p className="section-body" style={{ maxWidth: 340 }}>
              A collaborative force of engineering specialists dedicated to technical excellence.
            </p>
          </div>
          <div className="team-grid">
            {teamMembers.map((m, i) => (
              <div className="team-card" key={m.name}>
                <div className="team-avatar-placeholder">
                  <span className="team-avatar-initials">{m.initials}</span>
                </div>
                <div className="team-info">
                  <div className="team-name">{m.name}</div>
                  <div className="team-role">{m.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* CONTACT */}
      <section id="contact">
        <div className="contact-section">
          <div className="contact-card">
            <div>
              <div className="section-label">INITIALIZATION</div>
              <h2 className="section-title">Ready to start your next technical evolution?</h2>
              <p className="section-body">
                We are currently accepting high-impact projects. Drop us a message with your system requirements, and our engineering team will get back to you within 24 hours.
              </p>
              <div className="contact-info-row">
                <MailIcon size={16} />
                <span>hello@trivistalabs.com</span>
              </div>
              <div className="contact-info-row">
                <LocationIcon size={16} />
                <span>Precision Center, Colombo, LK</span>
              </div>
            </div>
            <div>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" type="text" placeholder="Your Name" />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" placeholder="Your Email" />
              </div>
              <div className="form-group">
                <label className="form-label">Project Inquiry</label>
                <textarea className="form-input" rows={5} placeholder="Describe your technical challenge…" />
              </div>
              <button className="btn-submit">SEND MESSAGE</button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer">
          <div className="footer-grid">
            <div>
              <a href="#" className="nav-logo" style={{ marginBottom: 16 }}>
                <div className="nav-logo-icon"><img src={trivistaLogo} alt="Trivista Labs" style={{ width: 22, height: 22, objectFit: 'contain' }} /></div>
                Trivista Labs
              </a>
              <p className="footer-brand-desc">Pioneering technical excellence through hardware-software convergence. Built for the high-end technical frontier.</p>
              <div className="footer-social-icons">
                <div className="footer-social-icon"><MailIcon size={14} /></div>
                <div className="footer-social-icon"><GlobeIcon size={14} /></div>
                <div className="footer-social-icon"><ShareIcon size={14} /></div>
              </div>
            </div>
            <div>
              <div className="footer-col-title">NAVIGATE</div>
              {['Home', 'About', 'Services'].map(l => <a key={l} href="#" className="footer-link" onClick={e => { e.preventDefault(); scrollTo(l.toLowerCase()); }}>{l}</a>)}
            </div>
            <div>
              <div className="footer-col-title">CONNECT</div>
              {['Team', 'Contact'].map(l => <a key={l} href="#" className="footer-link" onClick={e => { e.preventDefault(); scrollTo(l.toLowerCase()); }}>{l}</a>)}
            </div>
            <div>
              <div className="footer-col-title">LEGAL</div>
              {['Privacy Policy', 'Terms'].map(l => <a key={l} href="#" className="footer-link">{l}</a>)}
            </div>
          </div>
          <div className="footer-bottom">
            © 2024 Trivista Labs. All rights reserved. Precision Engineering.
          </div>
        </div>
      </footer>
    </>
  );
}
