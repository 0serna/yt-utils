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
  audioTrack: PlayerSnapshot["audioTrack"] = null,
): PlayerSnapshot {
  return {
    videoId,
    audioTrack,
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

  it("initializes English videos at 0.95x after player confirmation", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(
      snapshot("test-video", "en-US"),
    );

    const feature = await importFreshFeature();
    activeFeature = feature.default;
    feature.default.activate(makeFeatureContext());

    const video = document.querySelector("video")!;
    await vi.waitFor(() => expect(video.playbackRate).toBe(0.95), {
      timeout: 2000,
    });
  });

  it("initializes Spanish videos from US audio metadata at 1.10x", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(
      snapshot("test-video", "es-us", [], {
        id: "251;ChEKBWFjb250EghvcmlnaW5hbAoNCgRsYW5nEgVlcy1VUwoHCgJ2YhIBMQ",
        US: {
          id: "es-US.4",
          name: "Spanish (US) original",
        },
      }),
    );

    const feature = await importFreshFeature();
    activeFeature = feature.default;
    feature.default.activate(makeFeatureContext());

    const video = document.querySelector("video")!;
    await vi.waitFor(() => expect(video.playbackRate).toBe(1.1), {
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

  it("does not fall back to non-ASR Spanish caption metadata when audio language is unavailable", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(
      snapshot("test-video", null, [{ languageCode: "es", vssId: ".es" }]),
    );

    const feature = await importFreshFeature();
    activeFeature = feature.default;
    feature.default.activate(makeFeatureContext());

    const video = document.querySelector("video")!;
    await vi.waitFor(() => expect(readPlayerSnapshot).toHaveBeenCalled());
    expect(video.playbackRate).toBe(1);
  });

  it("falls back to English ASR caption metadata when audio language is unavailable", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(
      snapshot("test-video", null, [
        { languageCode: "en", kind: "asr", vssId: "a.en" },
      ]),
    );

    const feature = await importFreshFeature();
    activeFeature = feature.default;
    feature.default.activate(makeFeatureContext());

    const video = document.querySelector("video")!;
    await vi.waitFor(() => expect(video.playbackRate).toBe(0.95), {
      timeout: 2000,
    });
  });

  it("falls back to Spanish ASR caption metadata when audio language is unavailable", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(
      snapshot("test-video", null, [{ languageCode: "es", vssId: "a.es" }]),
    );

    const feature = await importFreshFeature();
    activeFeature = feature.default;
    feature.default.activate(makeFeatureContext());

    const video = document.querySelector("video")!;
    await vi.waitFor(() => expect(video.playbackRate).toBe(1.1), {
      timeout: 2000,
    });
  });

  it("falls back to Spanish ASR when opaque audio id has no usable metadata", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(
      snapshot(
        "test-video",
        null,
        [{ languageCode: "es", kind: "asr", vssId: "a.es" }],
        {
          id: "251;ChEKBWFjb250EghvcmlnaW5hbAoNCgRsYW5nEgVlcy1VUwoHCgJ2YhIBMQ",
        },
      ),
    );

    const feature = await importFreshFeature();
    activeFeature = feature.default;
    feature.default.activate(makeFeatureContext());

    const video = document.querySelector("video")!;
    await vi.waitFor(() => expect(video.playbackRate).toBe(1.1), {
      timeout: 2000,
    });
  });

  it("prefers English when unavailable audio has English and Spanish ASR captions", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(
      snapshot("test-video", null, [
        { languageCode: "es", kind: "asr", vssId: "a.es" },
        { languageCode: "en", kind: "asr", vssId: "a.en" },
      ]),
    );

    const feature = await importFreshFeature();
    activeFeature = feature.default;
    feature.default.activate(makeFeatureContext());

    const video = document.querySelector("video")!;
    await vi.waitFor(() => expect(video.playbackRate).toBe(0.95), {
      timeout: 2000,
    });
  });

  it("does not override explicit non-English audio with ASR caption metadata", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(
      snapshot("test-video", "fr", [
        { languageCode: "en", kind: "asr", vssId: "a.en" },
        { languageCode: "es", kind: "asr", vssId: "a.es" },
      ]),
    );

    const feature = await importFreshFeature();
    activeFeature = feature.default;
    feature.default.activate(makeFeatureContext());

    const video = document.querySelector("video")!;
    await vi.waitFor(() => expect(readPlayerSnapshot).toHaveBeenCalled());
    expect(video.playbackRate).toBe(1);
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

    await vi.waitFor(() => expect(video.playbackRate).toBe(0.95), {
      timeout: 2000,
    });
  });
});
