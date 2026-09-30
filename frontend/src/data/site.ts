import { PUBLIC_CONTACT_API_URL } from "astro:env/client";

// One source of truth for company facts. Change them here, not in pages.
export const site = {
  name: "Trivista Labs",
  legalName: "Trivista Labs (Pvt) Ltd",
  url: "https://trivistalabs.io",
  description:
    "Trivista Labs designs and builds web and mobile apps, business systems, connected hardware and infrastructure. Based in Colombo, Sri Lanka.",
  email: "contact@trivistalabs.lk",
  locality: "Colombo",
  country: "Sri Lanka",
  countryCode: "LK",
  responseTime: "within 24 hours",
  contactApiUrl: PUBLIC_CONTACT_API_URL.replace(/\/+$/, ""),
  legalUpdated: { iso: "2026-09-30", display: "30 September 2026" },
} as const;

export type SocialLink = {
  readonly label: string;
  readonly href: string;
  /** True for a canonical profile URL that can be listed in structured data. */
  readonly profile: boolean;
};

export const social: readonly SocialLink[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/trivistalabs/", profile: true },
  { label: "Instagram", href: "https://www.instagram.com/trivista_labs/", profile: true },
  { label: "Facebook", href: "https://www.facebook.com/share/1915hgWcBM/", profile: false },
];

export const navigation = [
  { label: "Work", href: "/work/" },
  { label: "Capabilities", href: "/capabilities/" },
  { label: "Company", href: "/company/" },
] as const;
