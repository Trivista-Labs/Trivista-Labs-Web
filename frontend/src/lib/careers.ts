// Job openings: which roles are open, how people apply, and how a role is described to search
// engines. Pure functions, so they can be tested without Astro. The pages read the `jobs` collection.

export type EmploymentType = "full-time" | "part-time" | "contract" | "internship";
export type Arrangement = "on-site" | "hybrid" | "remote";

/** One role, as written in the frontmatter of src/content/jobs/*.md. */
export interface Job {
  readonly title: string;
  readonly department: string;
  readonly type: EmploymentType;
  readonly arrangement: Arrangement;
  readonly location: string;
  readonly summary: string;
  readonly responsibilities: readonly string[];
  readonly requirements: readonly string[];
  readonly niceToHave: readonly string[];
  readonly status: "open" | "closed";
  readonly posted: Date;
  readonly closes?: Date;
}

export interface HiringDetails {
  /** The role's own page. */
  readonly url: string;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly locality: string;
  readonly countryCode: string;
}

export const EMPLOYMENT_TYPE_LABELS: Readonly<Record<EmploymentType, string>> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  internship: "Internship",
};

export const ARRANGEMENT_LABELS: Readonly<Record<Arrangement, string>> = {
  "on-site": "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

// schema.org employment types: https://schema.org/employmentType
const SCHEMA_EMPLOYMENT_TYPES: Readonly<Record<EmploymentType, string>> = {
  "full-time": "FULL_TIME",
  "part-time": "PART_TIME",
  contract: "CONTRACTOR",
  internship: "INTERN",
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** The email subject people are asked to use, so applications are easy to sort. */
export const applicationSubject = (role?: string): string =>
  role ? `Application: ${role} — [Your Name]` : "General Application — [Your Name]";

export const applicationMailto = (address: string, role?: string): string =>
  `mailto:${address}?subject=${encodeURIComponent(applicationSubject(role))}`;

/** Open, and not past its closing date. A role stays open for the whole of its closing day. */
export function isOpen(job: Job, now: Date): boolean {
  if (job.status !== "open") return false;
  return !job.closes || job.closes.getTime() + DAY_MS > now.getTime();
}

/** The open roles, newest first. */
export function openJobs<T extends { readonly data: Job }>(entries: readonly T[], now: Date): T[] {
  return entries
    .filter((entry) => isOpen(entry.data, now))
    .toSorted((a, b) => b.data.posted.getTime() - a.data.posted.getTime());
}

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

const escapeHtml = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function descriptionHtml(job: Job): string {
  const list = (heading: string, items: readonly string[]) =>
    items.length === 0 ? "" : `<h3>${heading}</h3><ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  return [
    `<p>${escapeHtml(job.summary)}</p>`,
    list("Responsibilities", job.responsibilities),
    list("Requirements", job.requirements),
    list("Nice to have", job.niceToHave),
  ].join("");
}

/**
 * JobPosting structured data. Only for roles that are open: describing a closed or invented role
 * as a vacancy would mislead job search engines, so this throws instead.
 */
export function jobPostingSchema(job: Job, hiring: HiringDetails): Record<string, unknown> {
  if (job.status !== "open") {
    throw new Error(`"${job.title}" is not open, so it must not be published as a JobPosting.`);
  }
  const remote = job.arrangement === "remote";
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: descriptionHtml(job),
    datePosted: isoDate(job.posted),
    ...(job.closes ? { validThrough: isoDate(job.closes) } : {}),
    employmentType: SCHEMA_EMPLOYMENT_TYPES[job.type],
    url: hiring.url,
    directApply: false,
    hiringOrganization: { "@type": "Organization", "@id": hiring.organizationId, name: hiring.organizationName },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: hiring.locality, addressCountry: hiring.countryCode },
    },
    ...(remote
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: { "@type": "Country", name: hiring.countryCode },
        }
      : {}),
  };
}
