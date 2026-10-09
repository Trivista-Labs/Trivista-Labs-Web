import { afterEach, describe, expect, it, vi } from "vitest";
import { toGaEventName, track } from "../../src/lib/analytics";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("toGaEventName", () => {
  it("turns a readable event name into one Google Analytics accepts", () => {
    expect(toGaEventName("Start a project clicked")).toBe("start_a_project_clicked");
    expect(toGaEventName("CV email clicked")).toBe("cv_email_clicked");
  });

  it("drops punctuation and keeps to Google's 40-character limit", () => {
    expect(toGaEventName("  LinkedIn clicked!  ")).toBe("linkedin_clicked");
    expect(toGaEventName("a".repeat(50))).toHaveLength(40);
  });

  it("starts with a letter, as Google requires", () => {
    expect(toGaEventName("2nd step done")).toBe("event_2nd_step_done");
  });
});

describe("track", () => {
  it("does nothing when Google Analytics is not loaded, as in previews and tests", () => {
    vi.stubGlobal("window", {});
    expect(() => track("Contact form sent")).not.toThrow();
  });

  it("does nothing during server rendering", () => {
    vi.stubGlobal("window", undefined);
    expect(() => track("Contact form sent")).not.toThrow();
  });

  it("sends the event to Google Analytics with its details", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });
    track("Start a project clicked", { location: "header" });
    expect(gtag).toHaveBeenCalledWith("event", "start_a_project_clicked", { location: "header" });
  });

  it("sends events without details too", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });
    track("Contact form sent");
    expect(gtag).toHaveBeenCalledWith("event", "contact_form_sent", {});
  });
});
