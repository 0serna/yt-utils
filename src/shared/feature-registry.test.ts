import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Feature, FeatureContext } from "./types";

type FeatureRegistryClass = typeof import("./feature-registry").FeatureRegistry;

let FeatureRegistry: FeatureRegistryClass;

vi.mock("./feature-logger", () => ({
  createFeatureLogger: vi.fn((_name: string) => ({
    activation: vi.fn(),
    deactivation: vi.fn(),
    error: vi.fn(),
  })),
}));

async function loadRegistry(): Promise<void> {
  FeatureRegistry = (await import("./feature-registry")).FeatureRegistry;
}

function makeFeature(name: string, opts?: Partial<Feature>): Feature {
  return {
    name,
    isWatchPage: true,
    activate: vi.fn(),
    deactivate: vi.fn(),
    ...opts,
  };
}

describe("FeatureRegistry logging", () => {
  beforeEach(async () => {
    vi.resetModules();
    Object.defineProperty(window, "location", {
      value: {
        href: "https://www.youtube.com/watch?v=abc123",
      },
      writable: true,
      configurable: true,
    });
    await loadRegistry();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("lifecycle logging", () => {
    it("creates a logger and passes it through context on activate", () => {
      const registry = new FeatureRegistry();
      const feature = makeFeature("test-feature");
      registry["register"](feature);

      const context = vi.mocked(feature.activate).mock
        .calls[0]?.[0] as FeatureContext;
      expect(context.sendMessage).toBeDefined();
      expect(typeof context.sendMessage).toBe("function");
      expect(context.logger).toBeDefined();
      expect(typeof context.logger.activation).toBe("function");
      expect(typeof context.logger.error).toBe("function");
    });

    it("does not add feature to active set on activation failure", () => {
      const registry = new FeatureRegistry();
      const broken = makeFeature("broken", {
        activate: vi.fn(() => {
          throw new Error("fail");
        }),
      });
      registry["register"](broken);

      const active = registry["activeFeatures"] as Set<Feature>;
      expect(active.has(broken)).toBe(false);
    });

    it("continues with other features after one activation fails", () => {
      const registry = new FeatureRegistry();
      const broken = makeFeature("broken", {
        activate: vi.fn(() => {
          throw new Error("fail");
        }),
      });
      const good = makeFeature("good");
      registry["register"](broken);
      registry["register"](good);

      expect(good.activate).toHaveBeenCalled();
    });

    it("removes feature from active set even when deactivation fails", () => {
      const registry = new FeatureRegistry();
      const broken = makeFeature("broken", {
        deactivate: vi.fn(() => {
          throw new Error("fail");
        }),
      });
      const active = registry["activeFeatures"] as Set<Feature>;
      active.add(broken);
      (registry["deactivateAll"] as () => void)();

      expect(active.has(broken)).toBe(false);
    });

    it("does not reset watch features for same-video URL parameter changes", () => {
      const registry = new FeatureRegistry();
      const feature = makeFeature("watch-feature");
      registry["register"](feature);
      vi.mocked(feature.activate).mockClear();
      vi.mocked(feature.deactivate).mockClear();

      Object.defineProperty(window, "location", {
        value: {
          href: "https://www.youtube.com/watch?v=abc123&t=42&feature=share",
        },
        writable: true,
        configurable: true,
      });

      registry["syncFeatures"]();

      expect(feature.deactivate).not.toHaveBeenCalled();
      expect(feature.activate).not.toHaveBeenCalled();
    });

    it("schedules repeated syncs for YouTube navigation events", () => {
      vi.useFakeTimers();
      const registry = new FeatureRegistry();
      const syncFeatures = vi.spyOn(
        registry as unknown as { syncFeatures: () => void },
        "syncFeatures",
      );

      window.dispatchEvent(new Event("yt-page-data-updated"));
      vi.runOnlyPendingTimers();

      expect(syncFeatures.mock.calls.length).toBeGreaterThanOrEqual(4);
      vi.useRealTimers();
    });

    it("resets watch features when the URL video ID changes", () => {
      const registry = new FeatureRegistry();
      const feature = makeFeature("watch-feature");
      registry["register"](feature);
      vi.mocked(feature.activate).mockClear();
      vi.mocked(feature.deactivate).mockClear();

      Object.defineProperty(window, "location", {
        value: {
          href: "https://www.youtube.com/watch?v=next456",
        },
        writable: true,
        configurable: true,
      });

      registry["syncFeatures"]();

      expect(feature.deactivate).toHaveBeenCalledOnce();
      expect(feature.activate).toHaveBeenCalledOnce();
    });
  });
});
