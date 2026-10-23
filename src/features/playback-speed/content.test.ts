import { makeFeatureContext, requireValue } from "@shared/test-helpers";
import type { PlayerSnapshot } from "@shared/youtube-player";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
    availableAudioTracks: [],
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

function chooseNativeSpeed(video: HTMLVideoElement, speed: number): void {
  const menu = document.createElement("div");
  menu.className = "ytp-settings-menu";
  document.body.append(menu);
  menu.click();
  menu.remove();
  video.playbackRate = speed;
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

    const { isDesktopWatchPage, placeWatchActionHost } = await import(
      "@shared/youtube-dom"
    );
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

    const video = requireValue(
      document.querySelector("video"),
      "missing video",
    );
    await vi.waitFor(() => expect(video.playbackRate).toBe(1.1), {
      timeout: 2000,
    });
  });

  it("initializes English videos at 1x after player confirmation", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(
      snapshot("test-video", "en-US"),
    );

    const feature = await importFreshFeature();
    activeFeature = feature.default;
    feature.default.activate(makeFeatureContext());

    const video = requireValue(
      document.querySelector("video"),
      "missing video",
    );
    await vi.waitFor(() => expect(video.playbackRate).toBe(1), {
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

    const video = requireValue(
      document.querySelector("video"),
      "missing video",
    );
    await vi.waitFor(() => expect(video.playbackRate).toBe(1.1), {
      timeout: 2000,
    });
  });

  it("initializes Spanish videos from content metadata when audio language is unknown", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue({
      ...snapshot("test-video", null),
      contentLanguage: "es",
    });

    const feature = await importFreshFeature();
    activeFeature = feature.default;
    feature.default.activate(makeFeatureContext());

    const video = requireValue(
      document.querySelector("video"),
      "missing video",
    );
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

    const video = requireValue(
      document.querySelector("video"),
      "missing video",
    );
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

    const video = requireValue(
      document.querySelector("video"),
      "missing video",
    );
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

    const video = requireValue(
      document.querySelector("video"),
      "missing video",
    );
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

    const video = requireValue(
      document.querySelector("video"),
      "missing video",
    );
    await vi.waitFor(() => expect(video.playbackRate).toBe(1), {
      timeout: 2000,
    });
  });

  it("logs when Spanish audio appears after an English fallback", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot)
      .mockResolvedValueOnce(
        snapshot("test-video", null, [
          { languageCode: "en", kind: "asr", vssId: "a.en" },
        ]),
      )
      .mockResolvedValue(snapshot("test-video", "es"));

    const context = makeFeatureContext();
    const feature = await importFreshFeature();
    activeFeature = feature.default;
    feature.default.activate(context);

    await vi.waitFor(
      () => {
        expect(context.logger.diagnostic).toHaveBeenCalledWith(
          expect.objectContaining({
            detectedAudioLanguage: "es",
            action: "skip-initialized",
          }),
        );
      },
      { timeout: 2000 },
    );
  });

  it("falls back to Spanish ASR caption metadata when audio language is unavailable", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(
      snapshot("test-video", null, [{ languageCode: "es", vssId: "a.es" }]),
    );

    const feature = await importFreshFeature();
    activeFeature = feature.default;
    feature.default.activate(makeFeatureContext());

    const video = requireValue(
      document.querySelector("video"),
      "missing video",
    );
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

    const video = requireValue(
      document.querySelector("video"),
      "missing video",
    );
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

    const video = requireValue(
      document.querySelector("video"),
      "missing video",
    );
    await vi.waitFor(() => expect(video.playbackRate).toBe(1), {
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

    const video = requireValue(
      document.querySelector("video"),
      "missing video",
    );
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

    const video = requireValue(
      document.querySelector("video"),
      "missing video",
    );
    await vi.waitFor(() => expect(video.playbackRate).toBe(1.1), {
      timeout: 2000,
    });

    feature.default.deactivate();
    setWatchVideo("next-video");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(
      snapshot("next-video", "en"),
    );
    feature.default.activate(makeFeatureContext());

    await vi.waitFor(() => expect(video.playbackRate).toBe(1), {
      timeout: 2000,
    });
  });
  it("reapplies the language speed when YouTube resets the rate", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(
      snapshot("test-video", "es"),
    );

    const feature = await importFreshFeature();
    activeFeature = feature.default;
    feature.default.activate(makeFeatureContext());

    const video = requireValue(
      document.querySelector("video"),
      "missing video",
    );
    await vi.waitFor(() => expect(video.playbackRate).toBe(1.1), {
      timeout: 2000,
    });

    video.playbackRate = 1;

    await vi.waitFor(() => expect(video.playbackRate).toBe(1.1), {
      timeout: 2000,
    });
  });

  it("reapplies the language speed after an unrelated click", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(
      snapshot("test-video", "es"),
    );

    const feature = await importFreshFeature();
    activeFeature = feature.default;
    feature.default.activate(makeFeatureContext());

    const video = requireValue(
      document.querySelector("video"),
      "missing video",
    );
    await vi.waitFor(() => expect(video.playbackRate).toBe(1.1), {
      timeout: 2000,
    });

    document.body.click();
    video.playbackRate = 1;

    await vi.waitFor(() => expect(video.playbackRate).toBe(1.1), {
      timeout: 2000,
    });
  });

  it("keeps a playback rate chosen by the user", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(
      snapshot("test-video", "es"),
    );
    const { placeWatchActionHost } = await import("@shared/youtube-dom");
    vi.mocked(placeWatchActionHost).mockImplementation((host) => {
      document.body.append(host);
      return true;
    });

    const feature = await importFreshFeature();
    activeFeature = feature.default;
    feature.default.activate(makeFeatureContext());

    const video = requireValue(
      document.querySelector("video"),
      "missing video",
    );
    await vi.waitFor(() => expect(video.playbackRate).toBe(1.1), {
      timeout: 2000,
    });

    chooseNativeSpeed(video, 1.5);

    await vi.waitFor(
      () =>
        expect(
          document.getElementById("yt-utils-speed-value")?.textContent,
        ).toBe("1.50x"),
      { timeout: 2000 },
    );
    await new Promise((resolve) => setTimeout(resolve, 700));
    expect(video.playbackRate).toBe(1.5);
  });

  it("resets the video rate after a user-chosen speed", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(
      snapshot("test-video", "en"),
    );
    const { placeWatchActionHost } = await import("@shared/youtube-dom");
    vi.mocked(placeWatchActionHost).mockImplementation((host) => {
      document.body.append(host);
      return true;
    });

    const feature = await importFreshFeature();
    activeFeature = feature.default;
    feature.default.activate(makeFeatureContext());

    const video = requireValue(
      document.querySelector("video"),
      "missing video",
    );
    await vi.waitFor(() => expect(video.playbackRate).toBe(1), {
      timeout: 2000,
    });

    chooseNativeSpeed(video, 1.5);
    await vi.waitFor(
      () =>
        expect(
          document.getElementById("yt-utils-speed-value")?.textContent,
        ).toBe("1.50x"),
      { timeout: 2000 },
    );

    document.getElementById("yt-utils-speed-value")?.click();
    await vi.waitFor(() => expect(video.playbackRate).toBe(1), {
      timeout: 2000,
    });
  });

  it("reapplies an extension-chosen speed when YouTube resets the rate", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(
      snapshot("test-video", "en"),
    );
    const { placeWatchActionHost } = await import("@shared/youtube-dom");
    vi.mocked(placeWatchActionHost).mockImplementation((host) => {
      document.body.append(host);
      return true;
    });

    const feature = await importFreshFeature();
    activeFeature = feature.default;
    feature.default.activate(makeFeatureContext());

    const video = requireValue(
      document.querySelector("video"),
      "missing video",
    );
    await vi.waitFor(() => expect(video.playbackRate).toBe(1), {
      timeout: 2000,
    });

    document.getElementById("yt-utils-speed-increment")?.click();
    await vi.waitFor(() => expect(video.playbackRate).toBe(1.05), {
      timeout: 2000,
    });

    video.playbackRate = 1;

    await vi.waitFor(() => expect(video.playbackRate).toBe(1.05), {
      timeout: 2000,
    });
  });

  it("ignores a pending language result after same-video reactivation", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    const pending = Promise.withResolvers<PlayerSnapshot | null>();
    vi.mocked(readPlayerSnapshot)
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValue(snapshot("test-video", "en"));
    const { default: feature } = await importFreshFeature();
    activeFeature = feature;
    feature.activate(makeFeatureContext());
    feature.deactivate();
    feature.activate(makeFeatureContext());
    pending.resolve(snapshot("test-video", "es"));
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    const video = requireValue(
      document.querySelector("video"),
      "missing video",
    );
    expect(video.playbackRate).toBe(1);
  });
});
