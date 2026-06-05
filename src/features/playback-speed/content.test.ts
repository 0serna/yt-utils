import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeFeatureContext } from "@shared/test-helpers";
import type { PlayerSnapshot } from "@shared/youtube-player";

vi.mock("@shared/youtube-dom", () => ({
  isDesktopWatchPage: vi.fn(),
  placeWatchActionHost: vi.fn(),
  RELEVANT_MUTATION_SELECTORS: "ytd-watch-metadata",
}));

vi.mock("@shared/youtube-player", () => ({
  isEnglishLanguage: vi.fn(
    (value: string | null | undefined) => value?.startsWith("en") ?? false,
  ),
  isSpanishLanguage: vi.fn(
    (value: string | null | undefined) => value?.startsWith("es") ?? false,
  ),
  readPlayerSnapshot: vi.fn(),
}));

function snapshot(
  videoId: string,
  audioLanguage: string | null,
  captionTracks: PlayerSnapshot["captionTracks"] = [],
): PlayerSnapshot {
  return {
    videoId,
    audioTrack: null,
    audioLanguage,
    captionTracks,
    translationLanguages: [],
    currentCaptionTrack: null,
    subtitlesOn: false,
  };
}

function setWatchVideo(videoId: string): void {
  Object.defineProperty(window, "location", {
    value: {
      href: `https://www.youtube.com/watch?v=${videoId}`,
      hostname: "www.youtube.com",
      pathname: "/watch",
      search: `?v=${videoId}`,
    },
    writable: true,
    configurable: true,
  });
}

async function importFreshFeature() {
  return import("./content");
}

describe("playback-speed feature", () => {
  let activeFeature:
    | Awaited<ReturnType<typeof importFreshFeature>>["default"]
    | null = null;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    document.body.innerHTML = "<video></video>";
    setWatchVideo("test-video");

    const { isDesktopWatchPage, placeWatchActionHost } =
      await import("@shared/youtube-dom");
    vi.mocked(isDesktopWatchPage).mockReturnValue(true);
    vi.mocked(placeWatchActionHost).mockReturnValue(true);
  });

  afterEach(() => {
    activeFeature?.deactivate();
    activeFeature = null;
    document.body.innerHTML = "";
  });

  it("exports a watch-page feature", async () => {
    const feature = await importFreshFeature();
    expect(feature.default.name).toBe("playback-speed");
    expect(feature.default.isWatchPage).toBe(true);
  });

  it("initializes Spanish videos at 1.10x after player confirmation", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(
      snapshot("test-video", "es"),
    );

    const feature = await importFreshFeature();
    activeFeature = feature.default;
    feature.default.activate(makeFeatureContext());

    const video = document.querySelector("video")!;
    await vi.waitFor(() => expect(video.playbackRate).toBe(1.1), {
      timeout: 2000,
    });
  });

  it("initializes English videos at 0.90x after player confirmation", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(
      snapshot("test-video", "en-US"),
    );

    const feature = await importFreshFeature();
    activeFeature = feature.default;
    feature.default.activate(makeFeatureContext());

    const video = document.querySelector("video")!;
    await vi.waitFor(() => expect(video.playbackRate).toBe(0.9), {
      timeout: 2000,
    });
  });

  it("does not initialize speed while URL and player video IDs differ", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(
      snapshot("previous-video", "es"),
    );

    const feature = await importFreshFeature();
    activeFeature = feature.default;
    feature.default.activate(makeFeatureContext());

    const video = document.querySelector("video")!;
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(video.playbackRate).toBe(1);
  });

  it("keeps retrying until the current video audio language is available", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot)
      .mockResolvedValueOnce(snapshot("test-video", null))
      .mockResolvedValue(snapshot("test-video", "es"));

    const feature = await importFreshFeature();
    activeFeature = feature.default;
    feature.default.activate(makeFeatureContext());

    const video = document.querySelector("video")!;
    await vi.waitFor(() => expect(video.playbackRate).toBe(1.1), {
      timeout: 2000,
    });
  });

  it("falls back to Spanish caption metadata when audio language is unavailable", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(
      snapshot("test-video", null, [{ languageCode: "es", vssId: ".es" }]),
    );

    const feature = await importFreshFeature();
    activeFeature = feature.default;
    feature.default.activate(makeFeatureContext());

    const video = document.querySelector("video")!;
    await vi.waitFor(() => expect(video.playbackRate).toBe(1.1), {
      timeout: 2000,
    });
  });

  it("falls back to English caption metadata when audio language is unavailable", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(
      snapshot("test-video", null, [{ languageCode: "en", vssId: ".en" }]),
    );

    const feature = await importFreshFeature();
    activeFeature = feature.default;
    feature.default.activate(makeFeatureContext());

    const video = document.querySelector("video")!;
    await vi.waitFor(() => expect(video.playbackRate).toBe(0.9), {
      timeout: 2000,
    });
  });

  it("reinitializes language speed for a new SPA video session", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(
      snapshot("test-video", "es"),
    );

    const feature = await importFreshFeature();
    activeFeature = feature.default;
    feature.default.activate(makeFeatureContext());

    const video = document.querySelector("video")!;
    await vi.waitFor(() => expect(video.playbackRate).toBe(1.1), {
      timeout: 2000,
    });

    feature.default.deactivate();
    setWatchVideo("next-video");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(
      snapshot("next-video", "en"),
    );
    feature.default.activate(makeFeatureContext());

    await vi.waitFor(() => expect(video.playbackRate).toBe(0.9), {
      timeout: 2000,
    });
  });
});
