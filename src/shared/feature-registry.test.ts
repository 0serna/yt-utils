import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Feature, FeatureContext } from "./types";

type FeatureRegistryClass = typeof import("./feature-registry").FeatureRegistry;

let FeatureRegistry: FeatureRegistryClass;

vi.mock("./feature-logger", () => ({
  createFeatureLogger: vi.fn((_name: string) => ({
    activation: vi.fn(),
    deactivation: vi.fn(),
    diagnostic: vi.fn(),
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

type RegistryInternals = {
  activeFeatures: Set<Feature>;
  deactivateAll: () => void;
  syncFeatures: () => void;
};

function internals(
  registry: InstanceType<FeatureRegistryClass>,
): RegistryInternals {
  return registry as unknown as RegistryInternals;
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

  describe("startup", () => {
    it("activates each feature once after start", () => {
      const registry = new FeatureRegistry();
      const first = makeFeature("first");
      const second = makeFeature("second");
      const third = makeFeature("third");

      registry.register(first);
      registry.register(second);
      registry.register(third);
      registry.start();

      expect(first.activate).toHaveBeenCalledOnce();
      expect(second.activate).toHaveBeenCalledOnce();
      expect(third.activate).toHaveBeenCalledOnce();
      expect(first.deactivate).not.toHaveBeenCalled();
      expect(second.deactivate).not.toHaveBeenCalled();
      expect(third.deactivate).not.toHaveBeenCalled();
    });

    it("does not activate features on register alone", () => {
      const registry = new FeatureRegistry();
      const feature = makeFeature("late-feature");

      registry.register(feature);

      expect(feature.activate).not.toHaveBeenCalled();
    });

    it("activates a feature registered after start", () => {
      const registry = new FeatureRegistry();
      registry.start();

      const feature = makeFeature("late-feature");
      registry.register(feature);

      expect(feature.activate).toHaveBeenCalledOnce();
    });
  });

  describe("lifecycle logging", () => {
    it("creates a logger and passes it through context on activate", () => {
      const registry = new FeatureRegistry();
      const feature = makeFeature("test-feature");
      registry.register(feature);
      registry.start();

      const context = vi.mocked(feature.activate).mock
        .calls[0]?.[0] as FeatureContext;
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
      registry.register(broken);
      registry.start();

      const active = internals(registry).activeFeatures;
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
      registry.register(broken);
      registry.register(good);
      registry.start();

      expect(good.activate).toHaveBeenCalled();
    });

    it("removes feature from active set even when deactivation fails", () => {
      const registry = new FeatureRegistry();
      const broken = makeFeature("broken", {
        deactivate: vi.fn(() => {
          throw new Error("fail");
        }),
      });
      const active = internals(registry).activeFeatures;
      active.add(broken);
      internals(registry).deactivateAll();

      expect(active.has(broken)).toBe(false);
    });

    it("does not reset watch features for same-video URL parameter changes", () => {
      const registry = new FeatureRegistry();
      const feature = makeFeature("watch-feature");
      registry.register(feature);
      registry.start();
      vi.mocked(feature.activate).mockClear();
      vi.mocked(feature.deactivate).mockClear();

      Object.defineProperty(window, "location", {
        value: {
          href: "https://www.youtube.com/watch?v=abc123&t=42&feature=share",
        },
        writable: true,
        configurable: true,
      });

      internals(registry).syncFeatures();

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
      registry.register(feature);
      registry.start();
      vi.mocked(feature.activate).mockClear();
      vi.mocked(feature.deactivate).mockClear();

      Object.defineProperty(window, "location", {
        value: {
          href: "https://www.youtube.com/watch?v=next456",
        },
        writable: true,
        configurable: true,
      });

      internals(registry).syncFeatures();

      expect(feature.deactivate).toHaveBeenCalledOnce();
      expect(feature.activate).toHaveBeenCalledOnce();
    });
  });
});
