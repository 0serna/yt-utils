import { makeFeatureContext } from "@shared/test-helpers";
import type { PlayerSnapshot } from "@shared/youtube-player";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@shared/youtube-player", () => ({
  applyAudioTrackSelection: vi.fn(),
  readAudioTrackIdentity: vi.fn(),
  readPlayerSnapshot: vi.fn(),
  selectOriginalAudioTrack: vi.fn(),
}));

const ORIGINAL_TRACK = {
  id: "251;en",
  name: "English (US) original",
  isDefault: true,
  isAutoDubbed: false,
  languageCode: "en-us",
};

function snapshot(videoId: string): PlayerSnapshot {
  return {
    videoId,
    audioTrack: null,
    availableAudioTracks: [],
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

describe("original-audio-track feature", () => {
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

  afterEach(async () => {
    const { default: feature } = await importFreshFeature();
    feature.deactivate();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("exports a watch-page feature", async () => {
    const feature = await importFreshFeature();

    expect(feature.default.name).toBe("original-audio-track");
    expect(feature.default.isWatchPage).toBe(true);
  });

  it("activate and deactivate return without error", async () => {
    const feature = await importFreshFeature();

    expect(() => feature.default.activate(makeFeatureContext())).not.toThrow();
    expect(() => feature.default.deactivate()).not.toThrow();
  });

  it("applies the original track when the active one is dubbed", async () => {
    const { readPlayerSnapshot, selectOriginalAudioTrack } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));
    vi.mocked(selectOriginalAudioTrack).mockReturnValue(ORIGINAL_TRACK);

    const { readAudioTrackIdentity, applyAudioTrackSelection } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(readAudioTrackIdentity).mockReturnValue("251;es");

    const feature = await importFreshFeature();
    feature.default.activate(makeFeatureContext());

    await vi.waitFor(
      () => {
        expect(applyAudioTrackSelection).toHaveBeenCalledWith("251;en");
      },
      { timeout: 2000 },
    );
  });

  it("does not apply when the original track is already active", async () => {
    const { readPlayerSnapshot, selectOriginalAudioTrack } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));
    vi.mocked(selectOriginalAudioTrack).mockReturnValue(ORIGINAL_TRACK);

    const { readAudioTrackIdentity, applyAudioTrackSelection } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(readAudioTrackIdentity).mockReturnValue("251;en");

    const feature = await importFreshFeature();
    feature.default.activate(makeFeatureContext());

    await vi.waitFor(
      () => {
        expect(readAudioTrackIdentity).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );

    expect(applyAudioTrackSelection).not.toHaveBeenCalled();
  });

  it("does not apply when no original track is identified", async () => {
    const { readPlayerSnapshot, selectOriginalAudioTrack } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));
    vi.mocked(selectOriginalAudioTrack).mockReturnValue(null);

    const { applyAudioTrackSelection } = await import("@shared/youtube-player");

    const feature = await importFreshFeature();
    feature.default.activate(makeFeatureContext());

    await vi.waitFor(
      () => {
        expect(readPlayerSnapshot).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );

    expect(applyAudioTrackSelection).not.toHaveBeenCalled();
  });

  it("ignores snapshots without video id", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue({
      ...snapshot(""),
      videoId: null,
    } as unknown as PlayerSnapshot);

    const { selectOriginalAudioTrack } = await import("@shared/youtube-player");

    const feature = await importFreshFeature();
    feature.default.activate(makeFeatureContext());

    await vi.waitFor(
      () => {
        expect(readPlayerSnapshot).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );

    expect(selectOriginalAudioTrack).not.toHaveBeenCalled();
  });

  it("stops applying after the attempt limit", async () => {
    vi.useFakeTimers();

    const { readPlayerSnapshot, selectOriginalAudioTrack } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));
    vi.mocked(selectOriginalAudioTrack).mockReturnValue(ORIGINAL_TRACK);

    const { readAudioTrackIdentity, applyAudioTrackSelection } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(readAudioTrackIdentity).mockReturnValue("251;es");
    vi.mocked(applyAudioTrackSelection).mockResolvedValue(true);

    const feature = await importFreshFeature();
    const context = makeFeatureContext();
    feature.default.activate(context);

    await vi.advanceTimersByTimeAsync(500 * 10);

    expect(applyAudioTrackSelection).toHaveBeenCalledTimes(5);
    expect(context.logger.diagnostic).toHaveBeenCalledWith(
      expect.objectContaining({ action: "give-up" }),
    );
  });

  it("announces the switch until the original track is confirmed", async () => {
    vi.useFakeTimers();

    const { readPlayerSnapshot, selectOriginalAudioTrack } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));
    vi.mocked(selectOriginalAudioTrack).mockReturnValue(ORIGINAL_TRACK);

    const { readAudioTrackIdentity, applyAudioTrackSelection } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(readAudioTrackIdentity)
      .mockReturnValueOnce("251;es")
      .mockReturnValue("251;en");
    vi.mocked(applyAudioTrackSelection).mockResolvedValue(true);

    const { isAudioSwitchPending } = await import("@shared/audio-switch");
    const feature = await importFreshFeature();
    feature.default.activate(makeFeatureContext());

    await vi.advanceTimersByTimeAsync(1);
    expect(applyAudioTrackSelection).toHaveBeenCalledOnce();
    expect(isAudioSwitchPending()).toBe(true);

    await vi.advanceTimersByTimeAsync(499);
    expect(isAudioSwitchPending()).toBe(false);
  });

  it("clears the announcement when the attempts run out", async () => {
    vi.useFakeTimers();

    const { readPlayerSnapshot, selectOriginalAudioTrack } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));
    vi.mocked(selectOriginalAudioTrack).mockReturnValue(ORIGINAL_TRACK);

    const { readAudioTrackIdentity, applyAudioTrackSelection } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(readAudioTrackIdentity).mockReturnValue("251;es");
    vi.mocked(applyAudioTrackSelection).mockResolvedValue(false);

    const { isAudioSwitchPending } = await import("@shared/audio-switch");
    const feature = await importFreshFeature();
    feature.default.activate(makeFeatureContext());

    await vi.advanceTimersByTimeAsync(500 * 10);

    expect(isAudioSwitchPending()).toBe(false);
  });

  it("clears the announcement on deactivate", async () => {
    const { readPlayerSnapshot, selectOriginalAudioTrack } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));
    vi.mocked(selectOriginalAudioTrack).mockReturnValue(ORIGINAL_TRACK);

    const { readAudioTrackIdentity, applyAudioTrackSelection } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(readAudioTrackIdentity).mockReturnValue("251;es");
    vi.mocked(applyAudioTrackSelection).mockResolvedValue(true);

    const { isAudioSwitchPending } = await import("@shared/audio-switch");
    const feature = await importFreshFeature();
    feature.default.activate(makeFeatureContext());

    await vi.waitFor(
      () => {
        expect(isAudioSwitchPending()).toBe(true);
      },
      { timeout: 2000 },
    );

    feature.default.deactivate();

    expect(isAudioSwitchPending()).toBe(false);
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
