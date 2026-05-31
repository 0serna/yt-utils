import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { makeFeatureContext } from "@shared/test-helpers";

describe("search-date-filter feature", () => {
  let replaceSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    replaceSpy = vi.fn();
    vi.stubGlobal("location", {
      ...window.location,
      replace: replaceSpy,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function importFreshFeature() {
    return import("./content");
  }

  function setSearchUrl(searchQuery: string, sp?: string): void {
    const params = new URLSearchParams({ search_query: searchQuery });
    if (sp) {
      params.set("sp", sp);
    }

    Object.defineProperty(window, "location", {
      value: {
        href: `https://www.youtube.com/results?${params.toString()}`,
        hostname: "www.youtube.com",
        pathname: "/results",
        search: `?${params.toString()}`,
        replace: replaceSpy,
      },
      writable: true,
      configurable: true,
    });
  }

  describe("matchesPage", () => {
    it("matches YouTube search results pages", async () => {
      const url = new URL(
        "https://www.youtube.com/results?search_query=brave+vs+chrome",
      );
      const { default: feature } = await importFreshFeature();
      expect(feature.matchesPage?.(url)).toBe(true);
    });

    it("does not match non-search pages", async () => {
      const url = new URL("https://www.youtube.com/watch?v=abc123");
      const { default: feature } = await importFreshFeature();
      expect(feature.matchesPage?.(url)).toBe(false);
    });

    it("does not match search results without search_query", async () => {
      const url = new URL("https://www.youtube.com/results");
      const { default: feature } = await importFreshFeature();
      expect(feature.matchesPage?.(url)).toBe(false);
    });

    it("matches search results with existing sp parameter", async () => {
      const url = new URL(
        "https://www.youtube.com/results?search_query=test&sp=EgIIBg%253D%253D",
      );
      const { default: feature } = await importFreshFeature();
      expect(feature.matchesPage?.(url)).toBe(true);
    });
  });

  describe("activate", () => {
    it("redirects to add sp parameter when not present", async () => {
      setSearchUrl("brave vs chrome");

      const { default: feature } = await importFreshFeature();
      feature.activate(makeFeatureContext());

      expect(replaceSpy).toHaveBeenCalledWith(
        expect.stringContaining("sp=EgIIBQ%3D%3D"),
      );
      expect(replaceSpy).toHaveBeenCalledWith(
        expect.stringContaining("search_query=brave+vs+chrome"),
      );
    });

    it("does not redirect when sp parameter already exists", async () => {
      setSearchUrl("brave vs chrome", "EgIIBg%253D%253D");

      const { default: feature } = await importFreshFeature();
      feature.activate(makeFeatureContext());

      expect(replaceSpy).not.toHaveBeenCalled();
    });

    it("preserves other query parameters during redirect", async () => {
      const params = new URLSearchParams({
        search_query: "test",
        special: "1",
      });

      Object.defineProperty(window, "location", {
        value: {
          href: `https://www.youtube.com/results?${params.toString()}`,
          hostname: "www.youtube.com",
          pathname: "/results",
          search: `?${params.toString()}`,
          replace: replaceSpy,
        },
        writable: true,
        configurable: true,
      });

      const { default: feature } = await importFreshFeature();
      feature.activate(makeFeatureContext());

      const calledUrl = replaceSpy.mock.calls[0][0] as string;
      expect(calledUrl).toContain("search_query=test");
      expect(calledUrl).toContain("special=1");
      expect(calledUrl).toContain("sp=EgIIBQ%3D%3D");
    });
  });

  describe("deactivate", () => {
    it("is a no-op", async () => {
      const { default: feature } = await importFreshFeature();
      expect(() => feature.deactivate()).not.toThrow();
    });
  });
});
