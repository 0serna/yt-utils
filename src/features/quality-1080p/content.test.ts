import { makeFeatureContext } from "@shared/test-helpers";
import type { PlayerSnapshot } from "@shared/youtube-player";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@shared/youtube-player", () => ({
  applyQualityLevel: vi.fn(),
  readPlayerSnapshot: vi.fn(),
}));

function snapshot(
  videoId: string,
  availableQualityLevels: string[] = ["hd1080", "hd720", "medium"],
): PlayerSnapshot {
  return {
    videoId,
    audioTrack: null,
    availableAudioTracks: [],
    audioLanguage: null,
    captionTracks: [],
    translationLanguages: [],
    currentCaptionTrack: null,
    subtitlesOn: false,
    qualityLevel: "hd720",
    availableQualityLevels,
  };
}

function navigateTo(url: string): void {
  const parsed = new URL(url);
  Object.defineProperty(window, "location", {
    value: {
      href: url,
      hostname: parsed.hostname,
      pathname: parsed.pathname,
      search: parsed.search,
    },
    writable: true,
    configurable: true,
  });
}

async function importFreshFeature() {
  return import("./content");
}

describe("quality-1080p feature", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    navigateTo("https://www.youtube.com/watch?v=test-video");
  });

  afterEach(async () => {
    const { default: feature } = await importFreshFeature();
    feature.deactivate();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("exports a watch-page feature", async () => {
    const feature = await importFreshFeature();

    expect(feature.default.name).toBe("quality-1080p");
    expect(feature.default.isWatchPage).toBe(true);
  });

  it("activate and deactivate return without error", async () => {
    const feature = await importFreshFeature();

    expect(() => feature.default.activate(makeFeatureContext())).not.toThrow();
    expect(() => feature.default.deactivate()).not.toThrow();
  });

  it("applies 1080p when the level is available", async () => {
    const { readPlayerSnapshot, applyQualityLevel } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));
    vi.mocked(applyQualityLevel).mockResolvedValue(true);

    const feature = await importFreshFeature();
    feature.default.activate(makeFeatureContext());

    await vi.waitFor(
      () => {
        expect(applyQualityLevel).toHaveBeenCalledWith("hd1080");
      },
      { timeout: 2000 },
    );
  });

  it("applies 1080p only once per Watch Session", async () => {
    const { readPlayerSnapshot, applyQualityLevel } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));
    vi.mocked(applyQualityLevel).mockResolvedValue(true);

    const feature = await importFreshFeature();
    feature.default.activate(makeFeatureContext());

    await vi.waitFor(
      () => {
        expect(applyQualityLevel).toHaveBeenCalledTimes(1);
      },
      { timeout: 2000 },
    );

    await vi.waitFor(
      () => {
        expect(readPlayerSnapshot).toHaveBeenCalledTimes(3);
      },
      { timeout: 2000 },
    );

    expect(applyQualityLevel).toHaveBeenCalledTimes(1);
  });

  it("applies again when the same video starts a new Watch Session", async () => {
    const { readPlayerSnapshot, applyQualityLevel } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));
    vi.mocked(applyQualityLevel).mockResolvedValue(true);

    const feature = await importFreshFeature();
    feature.default.activate(makeFeatureContext());

    await vi.waitFor(
      () => {
        expect(applyQualityLevel).toHaveBeenCalledTimes(1);
      },
      { timeout: 2000 },
    );

    navigateTo("https://www.youtube.com/");
    window.dispatchEvent(new Event("yt-navigate-start"));
    navigateTo("https://www.youtube.com/watch?v=test-video");
    window.dispatchEvent(new Event("yt-navigate-start"));

    await vi.waitFor(
      () => {
        expect(applyQualityLevel).toHaveBeenCalledTimes(2);
      },
      { timeout: 2000 },
    );
  });

  it("does not apply when 1080p is not available", async () => {
    const { readPlayerSnapshot, applyQualityLevel } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(readPlayerSnapshot).mockResolvedValue(
      snapshot("test-video", ["hd720", "medium"]),
    );

    const feature = await importFreshFeature();
    const context = makeFeatureContext();
    feature.default.activate(context);

    await vi.waitFor(
      () => {
        expect(context.logger.diagnostic).toHaveBeenCalledWith(
          expect.objectContaining({ action: "skip-no-1080p" }),
        );
      },
      { timeout: 2000 },
    );

    expect(applyQualityLevel).not.toHaveBeenCalled();
  });

  it("waits while the player reports no quality levels", async () => {
    const { readPlayerSnapshot, applyQualityLevel } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video", []));

    const feature = await importFreshFeature();
    feature.default.activate(makeFeatureContext());

    await vi.waitFor(
      () => {
        expect(readPlayerSnapshot).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );

    expect(applyQualityLevel).not.toHaveBeenCalled();
  });

  it("stops applying after the attempt limit", async () => {
    vi.useFakeTimers();

    const { readPlayerSnapshot, applyQualityLevel } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));
    vi.mocked(applyQualityLevel).mockResolvedValue(false);

    const feature = await importFreshFeature();
    const context = makeFeatureContext();
    feature.default.activate(context);

    await vi.advanceTimersByTimeAsync(500 * 10);

    expect(applyQualityLevel).toHaveBeenCalledTimes(5);
    expect(context.logger.diagnostic).toHaveBeenCalledWith(
      expect.objectContaining({ action: "give-up" }),
    );
  });

  it("stops polling after deactivate", async () => {
    vi.useFakeTimers();

    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

    const feature = await importFreshFeature();
    feature.default.activate(makeFeatureContext());
    feature.default.deactivate();

    const callsAfterDeactivate =
      vi.mocked(readPlayerSnapshot).mock.calls.length;
    await vi.advanceTimersByTimeAsync(2000);

    expect(readPlayerSnapshot).toHaveBeenCalledTimes(callsAfterDeactivate);
  });
});
