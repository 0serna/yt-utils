import { makeFeatureContext } from "@shared/test-helpers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const CHANNEL_URL = "https://www.youtube.com/@Ingl%C3%A9sconelG%C3%BCero";

function setLocation(url: string, assignSpy: ReturnType<typeof vi.fn>): void {
  const parsed = new URL(url);

  Object.defineProperty(window, "location", {
    value: {
      href: parsed.href,
      origin: parsed.origin,
      hostname: parsed.hostname,
      pathname: parsed.pathname,
      assign: assignSpy,
    },
    writable: true,
    configurable: true,
  });
}

describe("auto-switch-to-videos-tab feature", () => {
  let assignSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    sessionStorage.clear();
    assignSpy = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  async function importFreshFeature() {
    return import("./content");
  }

  describe("matchesPage", () => {
    it("matches YouTube channel pages", async () => {
      const { default: feature } = await importFreshFeature();
      expect(feature.matchesPage?.(new URL(CHANNEL_URL))).toBe(true);
    });

    it("does not match watch pages", async () => {
      const { default: feature } = await importFreshFeature();
      expect(
        feature.matchesPage?.(new URL("https://www.youtube.com/watch?v=abc")),
      ).toBe(false);
    });
  });

  describe("activate", () => {
    it("navigates channel home to the videos tab", async () => {
      setLocation(CHANNEL_URL, assignSpy);

      const { default: feature } = await importFreshFeature();
      feature.activate(makeFeatureContext());

      expect(assignSpy).toHaveBeenCalledWith(`${CHANNEL_URL}/videos`);
      expect(
        sessionStorage.getItem(
          "yt-utils:auto-switch-to-videos-tab:/@Ingl%C3%A9sconelG%C3%BCero",
        ),
      ).toBe("1");
    });

    it("does not navigate when already on a channel subtab", async () => {
      setLocation(`${CHANNEL_URL}/videos`, assignSpy);

      const { default: feature } = await importFreshFeature();
      feature.activate(makeFeatureContext());

      expect(assignSpy).not.toHaveBeenCalled();
    });

    it("does not navigate a channel already processed this session", async () => {
      setLocation(CHANNEL_URL, assignSpy);
      sessionStorage.setItem(
        "yt-utils:auto-switch-to-videos-tab:/@Ingl%C3%A9sconelG%C3%BCero",
        "1",
      );

      const { default: feature } = await importFreshFeature();
      feature.activate(makeFeatureContext());

      expect(assignSpy).not.toHaveBeenCalled();
    });
  });
});
