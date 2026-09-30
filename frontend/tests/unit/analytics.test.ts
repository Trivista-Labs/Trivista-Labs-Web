import { afterEach, describe, expect, it, vi } from "vitest";
import { track } from "../../src/lib/analytics";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("track", () => {
  it("does nothing when no analytics provider is loaded", () => {
    vi.stubGlobal("window", {});
    expect(() => track("Contact form sent")).not.toThrow();
  });

  it("does nothing during server rendering", () => {
    vi.stubGlobal("window", undefined);
    expect(() => track("Contact form sent")).not.toThrow();
  });

  it("sends events to Plausible when it is loaded", () => {
    const plausible = vi.fn();
    vi.stubGlobal("window", { plausible });
    track("Contact form sent", { projectType: "not-sure" });
    expect(plausible).toHaveBeenCalledWith("Contact form sent", { props: { projectType: "not-sure" } });
  });

  it("sends events to Umami when it is loaded", () => {
    const umamiTrack = vi.fn();
    vi.stubGlobal("window", { umami: { track: umamiTrack } });
    track("Start a project clicked", { location: "header" });
    expect(umamiTrack).toHaveBeenCalledWith("Start a project clicked", { location: "header" });
  });
});
