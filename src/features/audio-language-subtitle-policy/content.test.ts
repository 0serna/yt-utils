import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { makeFeatureContext } from "@shared/test-helpers";
import type { PlayerSnapshot } from "@shared/youtube-player";

vi.mock("@shared/youtube-player", () => ({
  applySubtitleSelection: vi.fn(),
  determineSubtitleSelection: vi.fn(),
  isEnglishLanguage: vi.fn(
    (value: string | null | undefined) => value?.startsWith("en") ?? false,
  ),
  matchesSubtitleSelection: vi.fn(),
  readPlayerSnapshot: vi.fn(),
  readSubtitleSignature: vi.fn(),
  waitForSubtitleSelection: vi.fn(),
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

async function importFreshFeature() {
  return import("./content");
}

describe("audio-language-subtitle-policy feature", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      value: {
        href: "https://www.youtube.com/watch?v=test-video",
        hostname: "www.youtube.com",
        pathname: "/watch",
        search: "?v=test-video",
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("exports a feature with correct name", async () => {
    const feature = await importFreshFeature();
    expect(feature.default.name).toBe("audio-language-subtitle-policy");
  });

  it("feature is a watch-page feature", async () => {
    const feature = await importFreshFeature();
    expect(feature.default.isWatchPage).toBe(true);
  });

  it("activate returns without error", async () => {
    const feature = await importFreshFeature();
    expect(() => feature.default.activate(makeFeatureContext())).not.toThrow();
  });

  it("deactivate returns without error", async () => {
    const feature = await importFreshFeature();
    feature.default.activate(makeFeatureContext());
    expect(() => feature.default.deactivate()).not.toThrow();
  });

  it("deactivate prevents further syncs", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

    const feature = await importFreshFeature();
    feature.default.activate(makeFeatureContext());
    feature.default.deactivate();

    const { determineSubtitleSelection } =
      await import("@shared/youtube-player");
    await vi.waitFor(
      () => {
        expect(determineSubtitleSelection).not.toHaveBeenCalled();
      },
      { timeout: 1000 },
    );
  });

  it("sync reads player snapshot when activated", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(null);

    const feature = await importFreshFeature();
    feature.default.activate(makeFeatureContext());

    await vi.waitFor(
      () => {
        expect(readPlayerSnapshot).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );
  });

  it("returns early when snapshot has no videoId", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue({
      ...snapshot(""),
      videoId: null,
    } as unknown as PlayerSnapshot);

    const feature = await importFreshFeature();
    feature.default.activate(makeFeatureContext());

    const { determineSubtitleSelection } =
      await import("@shared/youtube-player");
    await vi.waitFor(
      () => {
        expect(determineSubtitleSelection).not.toHaveBeenCalled();
      },
      { timeout: 1000 },
    );
  });

  it("returns early when snapshot videoId differs from URL", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("previous-video"));

    const feature = await importFreshFeature();
    feature.default.activate(makeFeatureContext());

    const { determineSubtitleSelection } =
      await import("@shared/youtube-player");
    await vi.waitFor(
      () => {
        expect(determineSubtitleSelection).not.toHaveBeenCalled();
      },
      { timeout: 1000 },
    );
  });

  it("records applied state when selection already matches", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

    const { readSubtitleSignature, determineSubtitleSelection } =
      await import("@shared/youtube-player");
    vi.mocked(readSubtitleSignature).mockReturnValue("sig-matching");
    vi.mocked(determineSubtitleSelection).mockReturnValue({ mode: "off" });

    const { matchesSubtitleSelection, applySubtitleSelection } =
      await import("@shared/youtube-player");
    vi.mocked(matchesSubtitleSelection).mockReturnValue(true);

    const feature = await importFreshFeature();
    feature.default.activate(makeFeatureContext());

    await vi.waitFor(
      () => {
        expect(matchesSubtitleSelection).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );

    expect(applySubtitleSelection).not.toHaveBeenCalled();
  });

  it("retries matching off state while audio language is still unavailable", async () => {
    const initialSnapshot = snapshot("test-video");
    const captionSnapshot: PlayerSnapshot = {
      ...snapshot("test-video"),
      audioLanguage: "en",
      captionTracks: [{ languageCode: "en", vssId: "a.en" }],
    };

    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot)
      .mockResolvedValueOnce(initialSnapshot)
      .mockResolvedValue(captionSnapshot);

    const { readSubtitleSignature, determineSubtitleSelection } =
      await import("@shared/youtube-player");
    vi.mocked(readSubtitleSignature).mockReturnValue("sig");
    vi.mocked(determineSubtitleSelection)
      .mockReturnValueOnce({ mode: "off" })
      .mockReturnValue({
        mode: "track",
        track: captionSnapshot.captionTracks[0],
      });

    const { matchesSubtitleSelection, applySubtitleSelection } =
      await import("@shared/youtube-player");
    vi.mocked(matchesSubtitleSelection)
      .mockReturnValueOnce(true)
      .mockReturnValue(false);
    vi.mocked(applySubtitleSelection).mockResolvedValue(true);

    const { waitForSubtitleSelection } = await import("@shared/youtube-player");
    vi.mocked(waitForSubtitleSelection).mockResolvedValue(true);

    const feature = await importFreshFeature();
    feature.default.activate(makeFeatureContext());

    await vi.waitFor(
      () => {
        expect(applySubtitleSelection).toHaveBeenCalledWith({
          mode: "track",
          track: captionSnapshot.captionTracks[0],
        });
      },
      { timeout: 3000 },
    );
  });

  it("applies subtitle selection when current state does not match", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

    const { readSubtitleSignature, determineSubtitleSelection } =
      await import("@shared/youtube-player");
    vi.mocked(readSubtitleSignature).mockReturnValue("sig-applied");
    vi.mocked(determineSubtitleSelection).mockReturnValue({ mode: "off" });

    const { matchesSubtitleSelection, applySubtitleSelection } =
      await import("@shared/youtube-player");
    vi.mocked(matchesSubtitleSelection).mockReturnValue(false);
    vi.mocked(applySubtitleSelection).mockResolvedValue(true);

    const { waitForSubtitleSelection } = await import("@shared/youtube-player");
    vi.mocked(waitForSubtitleSelection).mockResolvedValue(true);

    const feature = await importFreshFeature();
    feature.default.activate(makeFeatureContext());

    await vi.waitFor(
      () => {
        expect(applySubtitleSelection).toHaveBeenCalled();
      },
      { timeout: 3000 },
    );
  });
});
