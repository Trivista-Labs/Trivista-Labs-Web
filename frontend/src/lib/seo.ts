import { founders } from "../data/founders";
import { site, social } from "../data/site";

export type JsonLd = Record<string, unknown>;

const absolute = (path: string) => new URL(path, site.url).href;

export function organizationSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absolute("/#organization"),
    name: site.name,
    legalName: site.legalName,
    url: absolute("/"),
    logo: absolute("/icon-512.png"),
    email: site.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: site.locality,
      addressCountry: site.countryCode,
    },
    sameAs: social.filter((link) => link.profile).map((link) => link.href),
    founder: founders.map((founder) => ({
      "@type": "Person",
      name: founder.name,
      jobTitle: founder.title,
      ...(founder.linkedin ? { sameAs: [founder.linkedin] } : {}),
    })),
  };
}

export function websiteSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absolute("/#website"),
    url: absolute("/"),
    name: site.name,
    publisher: { "@id": absolute("/#organization") },
  };
}

export function breadcrumbSchema(items: readonly { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}

/** Serialise JSON-LD so it can never close the surrounding script element. */
export const serializeJsonLd = (data: JsonLd): string => JSON.stringify(data).replace(/</g, "\\u003c");
