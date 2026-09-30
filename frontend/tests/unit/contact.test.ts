import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import {
  EMPTY_FIELDS,
  LIMITS,
  PROJECT_TYPES,
  TIMELINES,
  parseResponse,
  toPayload,
  validateContactFields,
  type ContactFields,
} from "../../src/lib/contact";

const require = createRequire(import.meta.url);

const filled: ContactFields = {
  ...EMPTY_FIELDS,
  name: "Nimali Perera",
  email: "nimali@example.com",
  projectType: "business-system",
  message: "We need a booking system for three branches.",
};

describe("validateContactFields", () => {
  it("accepts a complete submission", () => {
    expect(validateContactFields(filled)).toEqual({});
  });

  it("requires name, email, project type and message", () => {
    const errors = validateContactFields(EMPTY_FIELDS);
    expect(Object.keys(errors).sort()).toEqual(["email", "message", "name", "projectType"]);
  });

  it("treats whitespace-only answers as empty", () => {
    expect(validateContactFields({ ...filled, name: "   " }).name).toBeTruthy();
  });

  it("rejects malformed email addresses", () => {
    for (const email of ["plain", "a@b", "a b@example.com", 'x"@example.com', "a@b.c", "a%0Ab@example.com"]) {
      expect(validateContactFields({ ...filled, email }).email, email).toBeTruthy();
    }
  });

  it("accepts common email formats", () => {
    for (const email of ["first.last@example.co.uk", "name+tag@example.lk"]) {
      expect(validateContactFields({ ...filled, email }).email, email).toBeUndefined();
    }
  });

  it("asks for more detail when the message is very short", () => {
    expect(validateContactFields({ ...filled, message: "Hi there" }).message).toMatch(/at least 10/);
  });

  it("enforces the maximum lengths", () => {
    const tooLong = (n: number) => "x".repeat(n + 1);
    expect(validateContactFields({ ...filled, name: tooLong(LIMITS.name) }).name).toBeTruthy();
    expect(validateContactFields({ ...filled, company: tooLong(LIMITS.company) }).company).toBeTruthy();
    expect(validateContactFields({ ...filled, message: tooLong(LIMITS.message) }).message).toBeTruthy();
  });

  it("rejects values that are not in the option lists", () => {
    expect(validateContactFields({ ...filled, projectType: "rocket-science" }).projectType).toBeTruthy();
    expect(validateContactFields({ ...filled, timeline: "yesterday" }).timeline).toBeTruthy();
  });

  it("leaves the optional fields optional", () => {
    const errors = validateContactFields({ ...filled, company: "", timeline: "" });
    expect(errors.company).toBeUndefined();
    expect(errors.timeline).toBeUndefined();
  });
});

describe("toPayload", () => {
  it("trims values and drops empty optional fields", () => {
    expect(toPayload({ ...filled, name: "  Nimali Perera  ", company: "  ", timeline: "" })).toEqual({
      name: "Nimali Perera",
      email: "nimali@example.com",
      projectType: "business-system",
      message: "We need a booking system for three branches.",
      contact_ref: "",
    });
  });

  it("sends the honeypot under the name the API checks", () => {
    expect(toPayload({ ...filled, honeypot: "spam" }).contact_ref).toBe("spam");
  });

  it("includes optional fields when they have a value", () => {
    const payload = toPayload({ ...filled, company: "Perera Salons", timeline: "asap" });
    expect(payload.company).toBe("Perera Salons");
    expect(payload.timeline).toBe("asap");
  });
});

describe("parseResponse", () => {
  it("reads a success response", () => {
    expect(parseResponse({ success: true, message: "Thanks." })).toEqual({ success: true, message: "Thanks." });
  });

  it("reads an error response with field errors", () => {
    expect(
      parseResponse({ success: false, error: "Check the form.", fields: { email: "Bad email.", other: 42 } })
    ).toEqual({ success: false, error: "Check the form.", fields: { email: "Bad email." } });
  });

  it("treats anything unexpected as a failure", () => {
    for (const data of [null, undefined, "ok", 42, [], { success: "yes" }]) {
      expect(parseResponse(data).success).toBe(false);
    }
  });
});

describe("option lists", () => {
  it("match the values the API accepts", () => {
    const api = require("../../../backend/src/lib/options.js") as {
      PROJECT_TYPE_LABELS: Record<string, string>;
      TIMELINE_LABELS: Record<string, string>;
    };
    expect(Object.fromEntries(PROJECT_TYPES.map((o) => [o.value, o.label]))).toEqual(api.PROJECT_TYPE_LABELS);
    expect(Object.fromEntries(TIMELINES.map((o) => [o.value, o.label]))).toEqual(api.TIMELINE_LABELS);
  });
});
