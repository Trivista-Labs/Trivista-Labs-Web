import { readFileSync, readdirSync } from "node:fs";

// Content entries, read from the Markdown files, so new projects, case studies and job openings
// are covered by the tests automatically.
const CONTENT_DIR = new URL("../../src/content/", import.meta.url);

function readEntries(collection: string) {
  const dir = new URL(`${collection}/`, CONTENT_DIR);
  return readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const frontmatter = readFileSync(new URL(file, dir), "utf8").split("---")[1] ?? "";
      const field = (name: string) => frontmatter.match(new RegExp(`^${name}:\\s*(.+)$`, "m"))?.[1].trim();
      return { slug: file.replace(/\.md$/, ""), field };
    });
}

export const WORK_ENTRIES = readEntries("work").map(({ slug, field }) => ({
  slug,
  title: field("title") ?? "",
  // Entries are drafts, and have no case study, unless they say otherwise, matching the content schema.
  draft: field("draft") !== "false",
  caseStudy: field("caseStudy") === "true",
}));

/** The published case-study pages. */
export const CASE_STUDY_PAGES = WORK_ENTRIES.filter((entry) => entry.caseStudy && !entry.draft).map(
  (entry) => `/work/${entry.slug}/`
);

const DAY_MS = 24 * 60 * 60 * 1000;

/** Roles that are open today, matching isOpen() in src/lib/careers.ts. */
export const OPEN_JOBS = readEntries("jobs")
  .map(({ slug, field }) => ({ slug, title: field("title") ?? "", status: field("status"), closes: field("closes") }))
  .filter((job) => job.status === "open" && (!job.closes || new Date(job.closes).getTime() + DAY_MS > Date.now()));

export const OPEN_JOB_PAGES = OPEN_JOBS.map((job) => `/careers/${job.slug}/`);
