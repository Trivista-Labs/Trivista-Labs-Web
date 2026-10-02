import { describe, expect, it } from "vitest";
import {
  applicationMailto,
  applicationSubject,
  isOpen,
  jobPostingSchema,
  openJobs,
  type Job,
} from "../../src/lib/careers";

// A made-up role, used only to test the helpers. It is never published.
const ROLE: Job = {
  title: "Test Role",
  department: "Engineering",
  type: "full-time",
  arrangement: "hybrid",
  location: "Colombo, Sri Lanka",
  summary: "A role used only in tests.",
  responsibilities: ["Build things"],
  requirements: ["Know <HTML> & CSS"],
  niceToHave: [],
  status: "open",
  posted: new Date("2026-01-15"),
};
const TODAY = new Date("2026-02-01");
const HIRING = {
  url: "https://example.com/careers/test-role/",
  organizationId: "https://example.com/#organization",
  organizationName: "Example",
  locality: "Colombo",
  countryCode: "LK",
};

describe("applicationSubject", () => {
  it("asks for a general application when no role is given", () => {
    expect(applicationSubject()).toBe("General Application — [Your Name]");
  });

  it("names the role when there is one", () => {
    expect(applicationSubject("Test Role")).toBe("Application: Test Role — [Your Name]");
  });
});

describe("applicationMailto", () => {
  it("addresses the careers inbox with an encoded subject", () => {
    const href = applicationMailto("careers@example.com");
    expect(href).toBe("mailto:careers@example.com?subject=General%20Application%20%E2%80%94%20%5BYour%20Name%5D");
    expect(decodeURIComponent(href.split("subject=")[1])).toBe(applicationSubject());
  });
});

describe("isOpen", () => {
  it("is true for an open role with no closing date", () => {
    expect(isOpen(ROLE, TODAY)).toBe(true);
  });

  it("is false for a closed role", () => {
    expect(isOpen({ ...ROLE, status: "closed" }, TODAY)).toBe(false);
  });

  it("is false once the closing date has passed", () => {
    expect(isOpen({ ...ROLE, closes: new Date("2026-01-31") }, TODAY)).toBe(false);
  });

  it("stays open through its closing day", () => {
    expect(isOpen({ ...ROLE, closes: new Date("2026-02-01") }, new Date("2026-02-01T18:00:00Z"))).toBe(true);
  });
});

describe("openJobs", () => {
  it("returns no roles when there are none", () => {
    expect(openJobs([], TODAY)).toEqual([]);
  });

  it("keeps only open roles, newest first", () => {
    const older = { id: "older", data: { ...ROLE, posted: new Date("2026-01-01") } };
    const newer = { id: "newer", data: { ...ROLE, posted: new Date("2026-01-20") } };
    const closed = { id: "closed", data: { ...ROLE, status: "closed" as const } };
    expect(openJobs([older, closed, newer], TODAY).map((entry) => entry.id)).toEqual(["newer", "older"]);
  });
});

describe("jobPostingSchema", () => {
  it("describes the role for search engines", () => {
    const schema = jobPostingSchema(ROLE, HIRING);
    expect(schema).toMatchObject({
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: "Test Role",
      datePosted: "2026-01-15",
      employmentType: "FULL_TIME",
      url: HIRING.url,
      hiringOrganization: { "@id": HIRING.organizationId, name: "Example" },
      jobLocation: { "@type": "Place", address: { addressLocality: "Colombo", addressCountry: "LK" } },
    });
    expect(schema).not.toHaveProperty("validThrough");
    expect(schema).not.toHaveProperty("jobLocationType");
  });

  it("escapes the text it puts in the HTML description", () => {
    const { description } = jobPostingSchema(ROLE, HIRING) as { description: string };
    expect(description).toContain("<li>Know &lt;HTML&gt; &amp; CSS</li>");
  });

  it("marks remote roles and their closing date", () => {
    const schema = jobPostingSchema({ ...ROLE, arrangement: "remote", closes: new Date("2026-03-01") }, HIRING);
    expect(schema).toMatchObject({
      jobLocationType: "TELECOMMUTE",
      applicantLocationRequirements: { "@type": "Country", name: "LK" },
      validThrough: "2026-03-01",
    });
  });

  it("refuses to describe a role that is not open", () => {
    expect(() => jobPostingSchema({ ...ROLE, status: "closed" }, HIRING)).toThrow(/not open/);
  });
});
