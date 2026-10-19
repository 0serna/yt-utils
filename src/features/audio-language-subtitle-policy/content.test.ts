import { makeFeatureContext } from "@shared/test-helpers";
import type { FeatureContext } from "@shared/types";
import type { PlayerSnapshot } from "@shared/youtube-player";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest";

vi.mock("@shared/youtube-player", () => ({
  applySubtitleSelection: vi.fn(),
  determineSubtitleSelection: vi.fn(),
  isEnglishLanguage: vi.fn(
    (value: string | null | undefined) => value?.startsWith("en") ?? false,
  ),
  isSpanishLanguage: vi.fn(
    (value: string | null | undefined) => value?.startsWith("es") ?? false,
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
    availableAudioTracks: [],
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

  afterEach(async () => {
    const { default: feature } = await importFreshFeature();
    feature.deactivate();
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

    const { determineSubtitleSelection } = await import(
      "@shared/youtube-player"
    );
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

    const { determineSubtitleSelection } = await import(
      "@shared/youtube-player"
    );
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

    const { determineSubtitleSelection } = await import(
      "@shared/youtube-player"
    );
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

    const { readSubtitleSignature, determineSubtitleSelection } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(readSubtitleSignature).mockReturnValue("sig-matching");
    vi.mocked(determineSubtitleSelection).mockReturnValue({ mode: "off" });

    const { matchesSubtitleSelection, applySubtitleSelection } = await import(
      "@shared/youtube-player"
    );
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

    const { readSubtitleSignature, determineSubtitleSelection } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(readSubtitleSignature).mockReturnValue("sig");
    vi.mocked(determineSubtitleSelection)
      .mockReturnValueOnce({ mode: "off" })
      .mockReturnValue({
        mode: "track",
        track: captionSnapshot.captionTracks[0],
      });

    const { matchesSubtitleSelection, applySubtitleSelection } = await import(
      "@shared/youtube-player"
    );
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

  it("applies direct English captions for English audio", async () => {
    const englishTrack = { languageCode: "en", vssId: "a.en" };
    const englishSnapshot: PlayerSnapshot = {
      ...snapshot("test-video"),
      audioLanguage: "en-US",
      captionTracks: [englishTrack],
    };

    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(englishSnapshot);

    const { readSubtitleSignature, determineSubtitleSelection } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(readSubtitleSignature).mockReturnValue("sig-english");
    vi.mocked(determineSubtitleSelection).mockReturnValue({
      mode: "track",
      track: englishTrack,
    });

    const { matchesSubtitleSelection, applySubtitleSelection } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(matchesSubtitleSelection).mockReturnValue(false);
    vi.mocked(applySubtitleSelection).mockResolvedValue(true);

    const { waitForSubtitleSelection } = await import("@shared/youtube-player");
    vi.mocked(waitForSubtitleSelection).mockResolvedValue(true);

    const feature = await importFreshFeature();
    feature.default.activate(makeFeatureContext());

    await vi.waitFor(
      () => {
        expect(determineSubtitleSelection).toHaveBeenCalledWith(
          englishSnapshot,
        );
        expect(applySubtitleSelection).toHaveBeenCalledWith({
          mode: "track",
          track: englishTrack,
        });
      },
      { timeout: 3000 },
    );

    feature.default.deactivate();
  });

  it("applies subtitle selection when current state does not match", async () => {
    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

    const { readSubtitleSignature, determineSubtitleSelection } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(readSubtitleSignature).mockReturnValue("sig-applied");
    vi.mocked(determineSubtitleSelection).mockReturnValue({ mode: "off" });

    const { matchesSubtitleSelection, applySubtitleSelection } = await import(
      "@shared/youtube-player"
    );
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

  it("reapplies the policy when the player changes state during initialization", async () => {
    const initialSnapshot = snapshot("test-video");
    const changedSnapshot: PlayerSnapshot = {
      ...initialSnapshot,
      subtitlesOn: true,
      currentCaptionTrack: { languageCode: "en", vssId: "a.en" },
    };

    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    vi.mocked(readPlayerSnapshot)
      .mockResolvedValueOnce(initialSnapshot)
      .mockResolvedValue(changedSnapshot);

    const { readSubtitleSignature, determineSubtitleSelection } = await import(
      "@shared/youtube-player"
    );
    vi.mocked(readSubtitleSignature)
      .mockReturnValueOnce("sig-off")
      .mockReturnValue("sig-on");
    vi.mocked(determineSubtitleSelection).mockReturnValue({ mode: "off" });

    const { matchesSubtitleSelection, applySubtitleSelection } = await import(
      "@shared/youtube-player"
    );
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
        expect(applySubtitleSelection).toHaveBeenCalledWith({ mode: "off" });
      },
      { timeout: 3000 },
    );
  });

  describe("audio changes and override", () => {
    const englishTrack = { languageCode: "en", vssId: "a.en" };

    function diagnosticActions(context: FeatureContext): Array<unknown> {
      return vi
        .mocked(context.logger.diagnostic)
        .mock.calls.map(([details]) => (details as { action?: string }).action);
    }

    async function setupPolicyMocks(options: {
      snapshot: PlayerSnapshot;
      selectionSignature: string;
    }): Promise<{
      matches: { value: boolean };
      applySubtitleSelection: Mock;
    }> {
      const { readPlayerSnapshot, readSubtitleSignature } = await import(
        "@shared/youtube-player"
      );
      vi.mocked(readPlayerSnapshot).mockResolvedValue(options.snapshot);
      vi.mocked(readSubtitleSignature).mockReturnValue(
        options.selectionSignature,
      );

      const { determineSubtitleSelection, matchesSubtitleSelection } =
        await import("@shared/youtube-player");
      vi.mocked(determineSubtitleSelection).mockImplementation((snapshotted) =>
        snapshotted.audioLanguage?.startsWith("es")
          ? { mode: "off" }
          : { mode: "track", track: englishTrack },
      );

      const matches = { value: true };
      vi.mocked(matchesSubtitleSelection).mockImplementation(
        () => matches.value,
      );

      const { applySubtitleSelection, waitForSubtitleSelection } = await import(
        "@shared/youtube-player"
      );
      vi.mocked(applySubtitleSelection).mockResolvedValue(true);
      vi.mocked(waitForSubtitleSelection).mockResolvedValue(true);

      return {
        matches,
        applySubtitleSelection: vi.mocked(applySubtitleSelection),
      };
    }

    it("recomputes subtitles when the audio changes after the grace window", async () => {
      vi.useFakeTimers();
      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      const spanishSnapshot: PlayerSnapshot = {
        ...snapshot("test-video"),
        audioLanguage: "es-US",
      };
      const englishSnapshot: PlayerSnapshot = {
        ...snapshot("test-video"),
        audioLanguage: "en-US",
        captionTracks: [englishTrack],
      };
      const { matches, applySubtitleSelection } = await setupPolicyMocks({
        snapshot: spanishSnapshot,
        selectionSignature: "off|caption:none",
      });
      const context = makeFeatureContext();
      const feature = await importFreshFeature();
      feature.default.activate(context);

      await vi.advanceTimersByTimeAsync(4500);
      expect(applySubtitleSelection).not.toHaveBeenCalled();

      vi.mocked(readPlayerSnapshot).mockResolvedValue(englishSnapshot);
      matches.value = false;
      await vi.advanceTimersByTimeAsync(500);

      expect(applySubtitleSelection).toHaveBeenCalledWith({
        mode: "track",
        track: englishTrack,
      });
      expect(diagnosticActions(context)).not.toContain("skip-overridden");
    });

    it("marks an override when the user changes subtitles", async () => {
      vi.useFakeTimers();
      const { readSubtitleSignature } = await import("@shared/youtube-player");
      const { matches, applySubtitleSelection } = await setupPolicyMocks({
        snapshot: { ...snapshot("test-video"), audioLanguage: "es-US" },
        selectionSignature: "off|caption:none",
      });
      const context = makeFeatureContext();
      const feature = await importFreshFeature();
      feature.default.activate(context);

      await vi.advanceTimersByTimeAsync(500);
      vi.mocked(readSubtitleSignature).mockReturnValue(
        "on|caption:en:asr:a.en",
      );
      matches.value = false;

      await vi.advanceTimersByTimeAsync(4000);

      expect(diagnosticActions(context)).toContain("skip-overridden");
      const callsAtOverride = applySubtitleSelection.mock.calls.length;
      await vi.advanceTimersByTimeAsync(2000);
      expect(applySubtitleSelection).toHaveBeenCalledTimes(callsAtOverride);
    });

    it("rearms the grace window on every apply", async () => {
      vi.useFakeTimers();
      const { readSubtitleSignature } = await import("@shared/youtube-player");
      const signature = { value: "a" };
      const { matches } = await setupPolicyMocks({
        snapshot: { ...snapshot("test-video"), audioLanguage: "es-US" },
        selectionSignature: "a",
      });
      vi.mocked(readSubtitleSignature).mockImplementation(
        () => signature.value,
      );
      const context = makeFeatureContext();
      const feature = await importFreshFeature();
      feature.default.activate(context);

      await vi.advanceTimersByTimeAsync(2000);
      signature.value = "b";
      await vi.advanceTimersByTimeAsync(500);
      await vi.advanceTimersByTimeAsync(2000);
      signature.value = "c";
      await vi.advanceTimersByTimeAsync(500);
      await vi.advanceTimersByTimeAsync(2000);
      signature.value = "d";
      await vi.advanceTimersByTimeAsync(500);

      expect(matches.value).toBe(true);
      expect(diagnosticActions(context)).not.toContain("skip-overridden");
    });

    it("does not touch subtitles while an audio switch is pending", async () => {
      vi.useFakeTimers();
      const { matches, applySubtitleSelection } = await setupPolicyMocks({
        snapshot: { ...snapshot("test-video"), audioLanguage: "es-US" },
        selectionSignature: "off|caption:none",
      });
      matches.value = false;
      const { markAudioSwitchPending, clearAudioSwitchPending } = await import(
        "@shared/audio-switch"
      );
      markAudioSwitchPending();
      const feature = await importFreshFeature();
      feature.default.activate(makeFeatureContext());

      await vi.advanceTimersByTimeAsync(2000);
      expect(applySubtitleSelection).not.toHaveBeenCalled();

      clearAudioSwitchPending();
      await vi.advanceTimersByTimeAsync(500);
      expect(applySubtitleSelection).toHaveBeenCalledWith({ mode: "off" });
    });
  });

  describe("renderer fallback", () => {
    let captionContainer: HTMLDivElement;
    let buttonContainer: HTMLDivElement;

    beforeEach(() => {
      captionContainer = document.createElement("div");
      buttonContainer = document.createElement("div");
      document.body.appendChild(captionContainer);
      document.body.appendChild(buttonContainer);
    });

    afterEach(() => {
      captionContainer.remove();
      buttonContainer.remove();
    });

    function createCaptionButton(): ReturnType<typeof vi.fn> {
      const clickSpy = vi.fn();
      const button = document.createElement("button");
      button.className = "ytp-subtitles-button";
      button.addEventListener("click", clickSpy);
      buttonContainer.appendChild(button);
      return clickSpy;
    }

    function addCaptionSegment(text: string): void {
      const segment = document.createElement("span");
      segment.className = "ytp-caption-segment";
      segment.textContent = text;
      captionContainer.appendChild(segment);
    }

    async function setupEnglishTrackMocks(
      subtitleSignatures = ["sig-applied"],
    ) {
      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const { readSubtitleSignature, determineSubtitleSelection } =
        await import("@shared/youtube-player");
      const readSubtitleSignatureMock = vi.mocked(readSubtitleSignature);
      const defaultSignature =
        subtitleSignatures[subtitleSignatures.length - 1] ?? "sig-applied";
      for (const signature of subtitleSignatures.slice(0, -1)) {
        readSubtitleSignatureMock.mockReturnValueOnce(signature);
      }
      readSubtitleSignatureMock.mockReturnValue(defaultSignature);
      vi.mocked(determineSubtitleSelection).mockReturnValue({
        mode: "track",
        track: { languageCode: "en", vssId: "a.en" },
      });

      const { matchesSubtitleSelection, applySubtitleSelection } = await import(
        "@shared/youtube-player"
      );
      vi.mocked(matchesSubtitleSelection)
        .mockReturnValueOnce(false)
        .mockReturnValue(true);
      vi.mocked(applySubtitleSelection).mockResolvedValue(true);

      const { waitForSubtitleSelection } = await import(
        "@shared/youtube-player"
      );
      vi.mocked(waitForSubtitleSelection).mockResolvedValue(true);
    }

    it("attempts one caption button fallback when no caption text appears", async () => {
      await setupEnglishTrackMocks();
      const clickSpy = createCaptionButton();

      const feature = await importFreshFeature();
      feature.default.activate(makeFeatureContext());

      await vi.waitFor(
        () => {
          expect(clickSpy).toHaveBeenCalledTimes(2);
        },
        { timeout: 5000 },
      );
    });

    it("does not attempt caption button fallback when caption text is present", async () => {
      await setupEnglishTrackMocks();
      addCaptionSegment("Hello world");
      const clickSpy = createCaptionButton();

      const feature = await importFreshFeature();
      feature.default.activate(makeFeatureContext());

      await new Promise((resolve) => window.setTimeout(resolve, 3000));
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it("attempts caption button fallback at most once per video", async () => {
      await setupEnglishTrackMocks();
      const clickSpy = createCaptionButton();

      const feature = await importFreshFeature();
      feature.default.activate(makeFeatureContext());

      await vi.waitFor(
        () => {
          expect(clickSpy).toHaveBeenCalledTimes(2);
        },
        { timeout: 5000 },
      );

      await new Promise((resolve) => window.setTimeout(resolve, 1000));
      expect(clickSpy).toHaveBeenCalledTimes(2);
    });

    it("does not attempt caption button fallback when user overrides during grace period", async () => {
      await setupEnglishTrackMocks([
        "sig-applied",
        "sig-applied",
        "user-override-sig",
      ]);
      const clickSpy = createCaptionButton();

      const feature = await importFreshFeature();
      feature.default.activate(makeFeatureContext());

      await new Promise((resolve) => window.setTimeout(resolve, 3000));
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it("does not attempt caption button fallback when navigation occurs before fallback", async () => {
      await setupEnglishTrackMocks();
      const clickSpy = createCaptionButton();

      const feature = await importFreshFeature();
      feature.default.activate(makeFeatureContext());

      await new Promise((resolve) => window.setTimeout(resolve, 1000));

      Object.defineProperty(window, "location", {
        value: {
          href: "https://www.youtube.com/watch?v=other-video",
          hostname: "www.youtube.com",
          pathname: "/watch",
          search: "?v=other-video",
        },
        writable: true,
        configurable: true,
      });

      await new Promise((resolve) => window.setTimeout(resolve, 3000));
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it.each(["navigate", "deactivate"])(
      "stops the second caption click after %s",
      async (change) => {
        vi.useFakeTimers();
        await setupEnglishTrackMocks();
        const clickSpy = createCaptionButton();
        const feature = await importFreshFeature();
        feature.default.activate(makeFeatureContext());
        await vi.advanceTimersByTimeAsync(3000);
        expect(clickSpy).toHaveBeenCalledTimes(1);
        if (change === "deactivate") {
          feature.default.deactivate();
        } else {
          window.location.href = "https://www.youtube.com/watch?v=next";
        }
        await vi.advanceTimersByTimeAsync(200);
        expect(clickSpy).toHaveBeenCalledTimes(1);
        feature.default.deactivate();
      },
    );

    it("rejects renderer fallback when deactivated during its snapshot read", async () => {
      vi.useFakeTimers();
      await setupEnglishTrackMocks();
      const clickSpy = createCaptionButton();
      const feature = await importFreshFeature();
      feature.default.activate(makeFeatureContext());
      await vi.advanceTimersByTimeAsync(2999);
      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      const pending = Promise.withResolvers<PlayerSnapshot | null>();
      vi.mocked(readPlayerSnapshot).mockReturnValue(pending.promise);
      await vi.advanceTimersByTimeAsync(1);
      feature.default.deactivate();
      pending.resolve(snapshot("test-video"));
      await vi.advanceTimersByTimeAsync(1000);
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it("does not attempt caption button fallback when subtitle button is missing", async () => {
      await setupEnglishTrackMocks();

      const feature = await importFreshFeature();
      feature.default.activate(makeFeatureContext());

      await new Promise((resolve) => window.setTimeout(resolve, 3000));
    });
  });
});
