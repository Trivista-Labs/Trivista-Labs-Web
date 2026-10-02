import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { CAPABILITY_IDS } from "./data/capabilities";

// Projects and case studies. A project is public only when `draft: false`.
// Draft entries appear in `astro dev` and in builds made with PUBLIC_SHOW_DRAFTS=true.
const work = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/work" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string().max(200),
      category: z.string(),
      capability: z.enum(CAPABILITY_IDS),
      status: z.enum(["live", "on-request", "in-development", "internal", "completed"]).optional(),
      client: z.string().optional(),
      year: z.number().int().optional(),
      url: z.httpUrl().optional(),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      /** A phone-sized screenshot, shown in front of the cover. */
      screen: image().optional(),
      screenAlt: z.string().optional(),
      /** Short annotations shown beside the screenshots, such as "Public site". */
      coverLabel: z.string().max(40).optional(),
      screenLabel: z.string().max(40).optional(),
      stack: z.array(z.string()).default([]),
      /** True when the entry has a full case-study page. */
      caseStudy: z.boolean().default(false),
      draft: z.boolean().default(true),
      order: z.number().default(100),
      /** Details the founders still need to provide. Shown on draft previews only. */
      missing: z.array(z.string()).default([]),
    })
    .refine((entry) => !entry.cover || Boolean(entry.coverAlt), {
      error: "Describe the cover image in coverAlt, for people using screen readers.",
      path: ["coverAlt"],
    })
    .refine((entry) => !entry.screen || Boolean(entry.screenAlt), {
      error: "Describe the phone screenshot in screenAlt, for people using screen readers.",
      path: ["screenAlt"],
    }),
});

// Job openings, one Markdown file per role in src/content/jobs/. The body is the role overview.
// Only roles with `status: open` (and no closing date in the past) are built and listed; the
// careers page shows its "no open positions" state when there are none. See "Adding a job" in the README.
const jobs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/jobs" }),
  schema: z.object({
    title: z.string(),
    department: z.string(),
    type: z.enum(["full-time", "part-time", "contract", "internship"]),
    arrangement: z.enum(["on-site", "hybrid", "remote"]),
    location: z.string().default("Colombo, Sri Lanka"),
    summary: z.string().max(240),
    responsibilities: z.array(z.string()).min(1),
    requirements: z.array(z.string()).min(1),
    niceToHave: z.array(z.string()).default([]),
    status: z.enum(["open", "closed"]),
    posted: z.coerce.date(),
    closes: z.coerce.date().optional(),
  }),
});

export const collections = { work, jobs };
