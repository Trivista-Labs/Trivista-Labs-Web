import { describe, expect, it } from "vitest";
import { CONSENT_REGIONS_DENIED, startGoogleAnalytics, type GaEnvironment } from "../../src/lib/googleAnalytics";

const ID = "G-TEST123";
const HOST = "example.com";

/** A stand-in browser: records the script it is asked to add and what is queued for Google. */
function fakeEnvironment(hostname: string) {
  const added: { async: boolean; src: string }[] = [];
  const win: GaEnvironment["window"] = {};
  const env: GaEnvironment = {
    hostname,
    window: win,
    document: {
      createElement: () => ({ async: false, src: "" }),
      head: { appendChild: (element) => added.push(element) },
    },
  };
  // Each queued command is an `arguments` object, as gtag.js requires; read them as arrays.
  const queue = () => (win.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>));
  return { env, added, queue };
}

describe("startGoogleAnalytics", () => {
  it("does nothing away from the live site, so previews and tests are never counted", () => {
    const { env, added, queue } = fakeEnvironment("localhost");
    expect(startGoogleAnalytics(ID, HOST, env)).toBe(false);
    expect(added).toEqual([]);
    expect(queue()).toEqual([]);
  });

  it("loads Google's tag for the measurement ID on the live site", () => {
    const { env, added } = fakeEnvironment(HOST);
    expect(startGoogleAnalytics(ID, HOST, env)).toBe(true);
    expect(added).toEqual([{ async: true, src: "https://www.googletagmanager.com/gtag/js?id=G-TEST123" }]);
  });

  it("sets consent before anything is measured, with advertising off everywhere", () => {
    const { env, queue } = fakeEnvironment(HOST);
    startGoogleAnalytics(ID, HOST, env);
    const commands = queue();

    expect(commands[0]).toEqual([
      "consent",
      "default",
      { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "granted" },
    ]);
    expect(commands[1]).toEqual([
      "consent",
      "default",
      { analytics_storage: "denied", region: CONSENT_REGIONS_DENIED },
    ]);
    expect(commands[2][0]).toBe("js");
    expect(commands[3]).toEqual(["config", ID]);
  });

  it("keeps analytics cookies off in the EEA, the UK and Switzerland", () => {
    for (const country of ["DE", "FR", "IE", "NO", "IS", "LI", "GB", "CH"]) {
      expect(CONSENT_REGIONS_DENIED).toContain(country);
    }
    expect(CONSENT_REGIONS_DENIED).toHaveLength(32);
    expect(CONSENT_REGIONS_DENIED).not.toContain("LK");
  });

  it("gives the page a gtag function that queues commands for Google", () => {
    const { env, queue } = fakeEnvironment(HOST);
    startGoogleAnalytics(ID, HOST, env);
    env.window.gtag?.("event", "test_event", { location: "header" });
    expect(queue().at(-1)).toEqual(["event", "test_event", { location: "header" }]);
  });
});
