import { readFileSync, readdirSync } from "node:fs";

// Every work entry, read from the content files, so new drafts and case studies are covered automatically.
const WORK_DIR = new URL("../../src/content/work/", import.meta.url);

export const WORK_ENTRIES = readdirSync(WORK_DIR)
  .filter((file) => file.endsWith(".md"))
  .map((file) => {
    const frontmatter = readFileSync(new URL(file, WORK_DIR), "utf8").split("---")[1] ?? "";
    const field = (name: string) => frontmatter.match(new RegExp(`^${name}:\\s*(.+)$`, "m"))?.[1].trim();
    return {
      slug: file.replace(/\.md$/, ""),
      title: field("title") ?? "",
      // Entries are drafts, and have no case study, unless they say otherwise, matching the content schema.
      draft: field("draft") !== "false",
      caseStudy: field("caseStudy") === "true",
    };
  });

/** The published case-study pages. */
export const CASE_STUDY_PAGES = WORK_ENTRIES.filter((entry) => entry.caseStudy && !entry.draft).map(
  (entry) => `/work/${entry.slug}/`
);
