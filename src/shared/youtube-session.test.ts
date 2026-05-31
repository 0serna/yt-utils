import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCurrentWatchSessionKey,
  getCurrentWatchVideoId,
  isCurrentWatchVideo,
  readConfirmedCurrentVideoSnapshot,
} from "./youtube-session";
import type { PlayerSnapshot } from "./youtube-player";

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

    await expect(readConfirmedCurrentVideoSnapshot()).resolves.toEqual(
      snapshot("abc123"),
    );
  });

  it("rejects stale live player snapshots from another video", async () => {
    const { isDesktopWatchPage } = await import("./youtube-dom");
    const { readPlayerSnapshot } = await import("./youtube-player");
    vi.mocked(isDesktopWatchPage).mockReturnValue(true);
    vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("old999"));

    await expect(readConfirmedCurrentVideoSnapshot()).resolves.toBeNull();
  });

  it("checks whether a video ID is still the current watch video", async () => {
    const { isDesktopWatchPage } = await import("./youtube-dom");
    vi.mocked(isDesktopWatchPage).mockReturnValue(true);

    expect(isCurrentWatchVideo("abc123")).toBe(true);
    expect(isCurrentWatchVideo("old999")).toBe(false);
  });
});
