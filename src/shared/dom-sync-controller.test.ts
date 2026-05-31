import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDomSyncController } from "./dom-sync-controller";

describe("createDomSyncController", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts a new-session sync immediately even when previous sync is pending", async () => {
    let resolveFirstSync = (): void => {
      throw new Error("first sync was not started");
    };
    const sync = vi.fn((token: number) => {
      if (token === 1) {
        return new Promise<void>((resolve) => {
          resolveFirstSync = resolve;
        });
      }

      return Promise.resolve();
    });

    const controller = createDomSyncController({
      pollIntervalMs: 500,
      observerOptions: { childList: true },
      hasRelevantMutation: () => false,
      sync,
    });

    controller.activate();
    expect(sync).toHaveBeenCalledWith(1);

    controller.deactivate();
    controller.activate();

    expect(sync).toHaveBeenCalledWith(3);
    resolveFirstSync();
    controller.deactivate();
  });

  it("ignores stale sync completion after a newer session starts", async () => {
    let resolveFirstSync = (): void => {
      throw new Error("first sync was not started");
    };
    let resolveSecondSync = (): void => {
      throw new Error("second sync was not started");
    };
    const sync = vi.fn((token: number) => {
      if (token === 1) {
        return new Promise<void>((resolve) => {
          resolveFirstSync = resolve;
        });
      }

      if (token === 3) {
        return new Promise<void>((resolve) => {
          resolveSecondSync = resolve;
        });
      }

      return Promise.resolve();
    });

    const controller = createDomSyncController({
      pollIntervalMs: 500,
      observerOptions: { childList: true },
      hasRelevantMutation: () => false,
      sync,
    });

    controller.activate();
    controller.deactivate();
    controller.activate();

    expect(sync).toHaveBeenCalledTimes(2);

    resolveFirstSync();
    await Promise.resolve();
    controller.queueSync();

    expect(sync).toHaveBeenCalledTimes(2);

    resolveSecondSync();
    await Promise.resolve();
    controller.queueSync();

    expect(sync).toHaveBeenCalledTimes(3);
    expect(sync).toHaveBeenNthCalledWith(3, 3);

    controller.deactivate();
  });

  it("runs a queued sync after an in-progress sync completes", async () => {
    let resolveFirstSync = (): void => {
      throw new Error("first sync was not started");
    };
    const sync = vi.fn(() =>
      sync.mock.calls.length === 1
        ? new Promise<void>((resolve) => {
            resolveFirstSync = resolve;
          })
        : Promise.resolve(),
    );

    const controller = createDomSyncController({
      pollIntervalMs: 500,
      observerOptions: { childList: true },
      hasRelevantMutation: () => false,
      sync,
    });

    controller.activate();
    controller.queueSync();

    expect(sync).toHaveBeenCalledTimes(1);

    resolveFirstSync();
    await Promise.resolve();

    expect(sync).toHaveBeenCalledTimes(2);
    expect(sync).toHaveBeenNthCalledWith(2, 1);

    controller.deactivate();
  });
});
