export type Principle = { readonly title: string; readonly text: string };

// Founders to confirm these describe how Trivista works.
export const principles: readonly Principle[] = [
  {
    title: "Maintainable",
    text: "Clear structure and documentation, so a system can be changed safely long after launch.",
  },
  {
    title: "Secure",
    text: "Access control, validation and careful handling of data, designed in from the start.",
  },
  {
    title: "Fast",
    text: "Speed treated as a requirement, and measured on the devices people actually use.",
  },
  {
    title: "Reliable",
    text: "Tested before release, and built to fail safely when something goes wrong.",
  },
];

export type SiteFact = { readonly label: string; readonly value: string };

// Verifiable facts about this website. tests/e2e/site.spec.ts checks the JavaScript budget.
// See "Keeping the site's claims true" in the README before changing any of them.
export const siteFacts: readonly SiteFact[] = [
  { label: "Pages", value: "Static HTML, generated before anyone visits" },
  {
    label: "Our JavaScript on this page",
    value: "Under 10 KB compressed, including the 3D drawing. Google Analytics loads after the page",
  },
  { label: "Cookies", value: "Google Analytics only, to count visits. None in the EEA, UK or Switzerland" },
  { label: "Images", value: "Sized for each screen and served as AVIF or WebP" },
  {
    label: "Content security policy",
    value: "Strict, with hashed scripts and styles. Google's tag is the only outside script",
  },
];
