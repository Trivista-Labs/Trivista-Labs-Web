import { getCollection, type CollectionEntry } from "astro:content";
import { PUBLIC_SHOW_DRAFTS } from "astro:env/client";

export type WorkEntry = CollectionEntry<"work">;
export type WorkStatus = NonNullable<WorkEntry["data"]["status"]>;

export const showDrafts: boolean = import.meta.env.DEV || PUBLIC_SHOW_DRAFTS;

export const STATUS_LABELS: Readonly<Record<WorkStatus, string>> = {
  live: "Live",
  "on-request": "Access on request",
  "in-development": "In development",
  internal: "Internal product",
  completed: "Completed",
};

/** Published work, plus drafts when previews are enabled, in display order. */
export async function getWork(): Promise<WorkEntry[]> {
  const entries = await getCollection("work", ({ data }) => showDrafts || !data.draft);
  return entries.toSorted((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
}

export const workHref = (entry: WorkEntry): string | undefined =>
  entry.data.caseStudy ? `/work/${entry.id}/` : entry.data.url;
