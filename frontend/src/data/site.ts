import { PUBLIC_CONTACT_API_URL } from "astro:env/client";

// One source of truth for company facts. Change them here, not in pages.
export const site = {
  name: "Trivista Labs",
  legalName: "Trivista Labs (Pvt) Ltd",
  url: "https://trivistalabs.io",
  description:
    "Trivista Labs designs and builds web and mobile apps, business systems, connected hardware and infrastructure. Based in Colombo, Sri Lanka.",
  email: "contact@trivistalabs.lk",
  /** For job applications only. Every careers call to action uses this address. */
  careersEmail: "careers@trivistalabs.lk",
  locality: "Colombo",
  country: "Sri Lanka",
  countryCode: "LK",
  /** The office. `area` is the Colombo postal district, as people write it. */
  address: { street: "35 Edward Ln", area: "Colombo 03" },
  /** Trivista Labs' place on Google Maps. Linked to, never embedded: an embedded map would set cookies. */
  mapsUrl: "https://maps.app.goo.gl/S3hWd6dekfDx5goU8",
  /** Where the Google Maps pin sits, to four decimal places. */
  coordinates: { latitude: 6.8966, longitude: 79.8565 },
  responseTime: "within 24 hours",
  contactApiUrl: PUBLIC_CONTACT_API_URL.replace(/\/+$/, ""),
  legalUpdated: { iso: "2026-09-30", display: "30 September 2026" },
} as const;

/** The office address on one line: "35 Edward Ln, Colombo 03, Sri Lanka". */
export const fullAddress = `${site.address.street}, ${site.address.area}, ${site.country}`;

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
  { label: "Careers", href: "/careers/" },
] as const;
