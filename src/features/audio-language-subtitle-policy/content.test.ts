import { makeFeatureContext } from "@shared/test-helpers";
import type { PlayerSnapshot } from "@shared/youtube-player";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

    it("does not attempt caption button fallback when subtitle button is missing", async () => {
      await setupEnglishTrackMocks();

      const feature = await importFreshFeature();
      feature.default.activate(makeFeatureContext());

      await new Promise((resolve) => window.setTimeout(resolve, 3000));
    });
  });
});
