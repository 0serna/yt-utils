import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PlayerSnapshot } from "./youtube-player";
import {
  createWatchSessionController,
  getCurrentWatchSessionKey,
  getCurrentWatchVideoId,
} from "./youtube-session";

vi.mock("./youtube-dom", () => ({
  isDesktopWatchPage: vi.fn(),
}));

vi.mock("./youtube-player", () => ({
  readPlayerSnapshot: vi.fn(),
}));

function snapshot(videoId: string): PlayerSnapshot {
  return {
    videoId,
    audioTrack: null,
    audioLanguage: null,
    captionTracks: [],
    translationLanguages: [],
    currentCaptionTrack: null,
    subtitlesOn: false,
  };
}

function setLocation(href: string): void {
  const url = new URL(href);
  Object.defineProperty(window, "location", {
    value: {
      href,
      hostname: url.hostname,
      pathname: url.pathname,
      search: url.search,
    },
    writable: true,
    configurable: true,
  });
}

describe("youtube watch video session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setLocation("https://www.youtube.com/watch?v=abc123");
  });

  it("identifies watch sessions by URL video ID", () => {
    expect(
      getCurrentWatchSessionKey(
        new URL("https://www.youtube.com/watch?v=abc123&t=1"),
      ),
    ).toBe("watch:abc123");
    expect(
      getCurrentWatchSessionKey(
        new URL("https://www.youtube.com/watch?v=abc123&feature=share"),
      ),
    ).toBe("watch:abc123");
    expect(
      getCurrentWatchSessionKey(
        new URL("https://www.youtube.com/watch?v=def456"),
      ),
    ).toBe("watch:def456");
  });

  it("returns null video ID for non-watch URLs", () => {
    expect(
      getCurrentWatchVideoId(
        new URL("https://www.youtube.com/feed/subscriptions"),
      ),
    ).toBeNull();
  });

  it("confirms the current URL video against the live player snapshot", async () => {
    const { isDesktopWatchPage } = await import("./youtube-dom");
    const { readPlayerSnapshot } = await import("./youtube-player");
    vi.mocked(isDesktopWatchPage).mockReturnValue(true);
    vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("abc123"));

    const controller = createWatchSessionController();
    controller.activate();
    await controller.run(async (session) => {
      expect(await session.readSnapshot()).toEqual(snapshot("abc123"));
    });
    controller.deactivate();
  });

  it("rejects stale live player snapshots from another video", async () => {
    const { isDesktopWatchPage } = await import("./youtube-dom");
    const { readPlayerSnapshot } = await import("./youtube-player");
    vi.mocked(isDesktopWatchPage).mockReturnValue(true);
    vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("old999"));

    const controller = createWatchSessionController();
    controller.activate();
    await controller.run(async (session) => {
      expect(await session.readSnapshot()).toBeNull();
    });
    controller.deactivate();
  });

  it("rejects a snapshot when navigation happens during the read", async () => {
    const { isDesktopWatchPage } = await import("./youtube-dom");
    const { readPlayerSnapshot } = await import("./youtube-player");
    vi.mocked(isDesktopWatchPage).mockReturnValue(true);
    const pending = Promise.withResolvers<PlayerSnapshot | null>();
    vi.mocked(readPlayerSnapshot).mockReturnValueOnce(pending.promise);

    const controller = createWatchSessionController();
    controller.activate();
    const result = controller.run(async (session) => {
      expect(await session.readSnapshot()).toBeNull();
    });
    setLocation("https://www.youtube.com/watch?v=next");
    pending.resolve(snapshot("abc123"));
    await result;
    controller.deactivate();
  });

  it("invalidates pending work even when the same video is reactivated", async () => {
    const { isDesktopWatchPage } = await import("./youtube-dom");
    const { readPlayerSnapshot } = await import("./youtube-player");
    vi.mocked(isDesktopWatchPage).mockReturnValue(true);
    const pending = Promise.withResolvers<PlayerSnapshot | null>();
    vi.mocked(readPlayerSnapshot).mockReturnValueOnce(pending.promise);
    const controller = createWatchSessionController();
    controller.activate();
    const result = controller.run(async (session) => {
      const value = await session.readSnapshot();
      expect(value).toBeNull();
      expect(session.isCurrent()).toBe(false);
    });
    controller.deactivate();
    controller.activate();
    pending.resolve(snapshot("abc123"));
    await result;
    controller.deactivate();
  });

  it("an old completion cannot release a newer session's pending work", async () => {
    const { isDesktopWatchPage } = await import("./youtube-dom");
    vi.mocked(isDesktopWatchPage).mockReturnValue(true);
    const oldWork = Promise.withResolvers<void>();
    const newWork = Promise.withResolvers<void>();
    const controller = createWatchSessionController();
    controller.activate();
    const oldRun = controller.run(() => oldWork.promise);
    controller.deactivate();
    controller.activate();
    const newRun = controller.run(() => newWork.promise);
    oldWork.resolve();
    await oldRun;
    const extraWork = vi.fn(async () => {});
    await controller.run(extraWork);
    expect(extraWork).not.toHaveBeenCalled();
    newWork.resolve();
    await newRun;
    await controller.run(extraWork);
    expect(extraWork).toHaveBeenCalledOnce();
    controller.deactivate();
  });

  it("starts work for a new video while the old video read is pending", async () => {
    const { isDesktopWatchPage } = await import("./youtube-dom");
    const { readPlayerSnapshot } = await import("./youtube-player");
    vi.mocked(isDesktopWatchPage).mockReturnValue(true);
    const pending = Promise.withResolvers<PlayerSnapshot | null>();
    vi.mocked(readPlayerSnapshot)
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce(snapshot("next"));
    const controller = createWatchSessionController();
    controller.activate();
    const oldRun = controller.run(async (session) => {
      expect(await session.readSnapshot()).toBeNull();
    });
    setLocation("https://www.youtube.com/watch?v=next");
    await controller.run(async (session) => {
      expect(await session.readSnapshot()).toEqual(snapshot("next"));
    });
    pending.resolve(snapshot("abc123"));
    await oldRun;
    controller.deactivate();
  });

  it("does not revive an expired session when returning to its video", async () => {
    const { isDesktopWatchPage } = await import("./youtube-dom");
    vi.mocked(isDesktopWatchPage).mockReturnValue(true);
    const controller = createWatchSessionController();
    controller.activate();
    await controller.run(async (session) => {
      setLocation("https://www.youtube.com/watch?v=next");
      window.dispatchEvent(new Event("yt-navigate-finish"));
      setLocation("https://www.youtube.com/watch?v=abc123");
      expect(session.isCurrent()).toBe(false);
    });
    controller.deactivate();
    const work = vi.fn(async () => {});
    await controller.run(work);
    expect(work).not.toHaveBeenCalled();
  });
});
