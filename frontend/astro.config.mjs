// @ts-check
import { defineConfig, envField, fontProviders } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { loadEnv } from "vite";

const env = loadEnv(process.env.NODE_ENV ?? "production", process.cwd(), "");
const DEFAULT_CONTACT_API = "https://trivista-labs-api.onrender.com";
const contactApiOrigin = new URL(env.PUBLIC_CONTACT_API_URL || DEFAULT_CONTACT_API).origin;

export default defineConfig({
  site: "https://trivistalabs.io",
  trailingSlash: "always",
  // Pages that moved after launch. The old address still works, and sends people to the new one.
  redirects: {
    "/work/the-beauty-room/": "/work/salon-booking-system/",
  },
  // Keep HTML whitespace rules. Astro 7 defaults to JSX rules, which join inline words.
  compressHTML: true,
  integrations: [
    react(),
    sitemap({ filter: (page) => !page.includes("/404") }),
  ],
  env: {
    schema: {
      PUBLIC_CONTACT_API_URL: envField.string({
        context: "client",
        access: "public",
        default: DEFAULT_CONTACT_API,
        url: true,
      }),
      // Show draft work entries in a build, for founder review. Always on in `astro dev`.
      PUBLIC_SHOW_DRAFTS: envField.boolean({ context: "client", access: "public", default: false }),
    },
  },
  image: {
    layout: "constrained",
    responsiveStyles: true,
  },
  // Shiki writes inline styles, which the content security policy blocks. Prism uses classes.
  markdown: {
    syntaxHighlight: "prism",
  },
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Schibsted Grotesk",
      cssVariable: "--font-schibsted",
      weights: [400, 500, 600],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["Helvetica Neue", "Arial", "sans-serif"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "JetBrains Mono",
      cssVariable: "--font-jetbrains",
      weights: [400, 500],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-monospace", "Menlo", "Consolas", "monospace"],
    },
  ],
  security: {
    // Astro adds script-src and style-src with hashes for everything it renders.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        `connect-src 'self' ${contactApiOrigin}`,
        "form-action 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "upgrade-insecure-requests",
      ],
    },
  },
});
