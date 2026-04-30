import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { PlayerSnapshot } from "@shared/youtube-player";

let mockLocationSearch: string;

vi.mock("@shared/youtube-dom", () => ({
  clickElement: vi.fn(),
  findButton: vi.fn(),
  isDesktopWatchPage: vi.fn(),
  isVisible: vi.fn(),
  waitFor: vi.fn(),
}));

vi.mock("@shared/youtube-player", () => ({
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

async function importFreshFeature() {
  return import("./content");
}

describe("ask-auto-open feature", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockLocationSearch = "";

    Object.defineProperty(window, "location", {
      value: {
        get search() {
          return mockLocationSearch;
        },
        get href() {
          return `https://www.youtube.com/watch${mockLocationSearch}`;
        },
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("exports a feature with correct name", async () => {
    const feature = await importFreshFeature();
    expect(feature.default.name).toBe("youtube-ask-auto-open");
  });

  it("feature is a watch-page feature", async () => {
    const feature = await importFreshFeature();
    expect(feature.default.isWatchPage).toBe(true);
  });

  it("activate returns without error when not on watch page", async () => {
    const feature = await importFreshFeature();
    expect(() =>
      feature.default.activate({ sendMessage: vi.fn() }),
    ).not.toThrow();
  });

  it("sync runs but returns early when not on watch page", async () => {
    const { isDesktopWatchPage } = await import("@shared/youtube-dom");
    vi.mocked(isDesktopWatchPage).mockReturnValue(false);

    const feature = await importFreshFeature();
    feature.default.activate({ sendMessage: vi.fn() });

    const { readPlayerSnapshot } = await import("@shared/youtube-player");
    await vi.waitFor(
      () => {
        expect(readPlayerSnapshot).not.toHaveBeenCalled();
      },
      { timeout: 1000 },
    );
  });

  describe("when on a desktop watch page", () => {
    beforeEach(() => {
      mockLocationSearch = "?v=test-video";
    });

    afterEach(() => {
      mockLocationSearch = "";
    });

    async function setupWatchPage() {
      const { isDesktopWatchPage } = await import("@shared/youtube-dom");
      vi.mocked(isDesktopWatchPage).mockReturnValue(true);
      const feature = await importFreshFeature();
      return feature.default;
    }

    it("sync reads player snapshot when on watch page", async () => {
      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(null);

      const feature = await setupWatchPage();
      feature.activate({ sendMessage: vi.fn() });

      await vi.waitFor(
        () => {
          expect(readPlayerSnapshot).toHaveBeenCalled();
        },
        { timeout: 1000 },
      );
    });

    it("sync returns early when player snapshot is null", async () => {
      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(null);

      const feature = await setupWatchPage();
      feature.activate({ sendMessage: vi.fn() });

      const { findButton } = await import("@shared/youtube-dom");
      await vi.waitFor(
        () => {
          expect(findButton).not.toHaveBeenCalled();
        },
        { timeout: 1000 },
      );
    });

    it("sync returns early when snapshot has no videoId", async () => {
      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue({
        ...snapshot(""),
        videoId: null,
      } as unknown as PlayerSnapshot);

      const feature = await setupWatchPage();
      feature.activate({ sendMessage: vi.fn() });

      const { findButton } = await import("@shared/youtube-dom");
      await vi.waitFor(
        () => {
          expect(findButton).not.toHaveBeenCalled();
        },
        { timeout: 1000 },
      );
    });

    it("sync returns early when snapshot videoId differs from URL", async () => {
      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("different-id"));

      const feature = await setupWatchPage();
      feature.activate({ sendMessage: vi.fn() });

      const { findButton } = await import("@shared/youtube-dom");
      await vi.waitFor(
        () => {
          expect(findButton).not.toHaveBeenCalled();
        },
        { timeout: 1000 },
      );
    });

    it("deactivate prevents further syncs", async () => {
      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const feature = await setupWatchPage();
      feature.activate({ sendMessage: vi.fn() });
      feature.deactivate();

      const { findButton } = await import("@shared/youtube-dom");
      await vi.waitFor(
        () => {
          expect(findButton).not.toHaveBeenCalled();
        },
        { timeout: 1000 },
      );
    });

    it("sync clicks ask button when panel is not expanded", async () => {
      const panel = document.createElement(
        "ytd-engagement-panel-section-list-renderer",
      );
      panel.setAttribute("target-id", "PAyouchat");
      panel.setAttribute("visibility", "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN");
      panel.style.display = "none";
      document.body.appendChild(panel);

      const askButton = document.createElement("button");

      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const { findButton, clickElement, waitFor } =
        await import("@shared/youtube-dom");
      vi.mocked(findButton).mockReturnValue(askButton);
      vi.mocked(waitFor).mockResolvedValue(askButton);

      const feature = await setupWatchPage();
      feature.activate({ sendMessage: vi.fn() });

      await vi.waitFor(
        () => {
          expect(clickElement).toHaveBeenCalledWith(askButton);
        },
        { timeout: 2000 },
      );

      panel.remove();
    });

    it("sync uses waitFor callback to detect panel open", async () => {
      const panel = document.createElement(
        "ytd-engagement-panel-section-list-renderer",
      );
      panel.setAttribute("target-id", "PAyouchat");
      panel.setAttribute("visibility", "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN");
      panel.style.display = "none";
      document.body.appendChild(panel);

      const askButton = document.createElement("button");

      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const { findButton, waitFor } = await import("@shared/youtube-dom");
      vi.mocked(findButton).mockReturnValue(askButton);
      vi.mocked(waitFor).mockResolvedValue(askButton);

      const feature = await setupWatchPage();
      feature.activate({ sendMessage: vi.fn() });

      await vi.waitFor(
        () => {
          expect(waitFor).toHaveBeenCalled();
        },
        { timeout: 2000 },
      );

      panel.remove();
    });

    it("sync does not click ask button when panel is already expanded", async () => {
      const panel = document.createElement(
        "ytd-engagement-panel-section-list-renderer",
      );
      panel.setAttribute("target-id", "PAyouchat");
      panel.setAttribute("visibility", "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED");
      document.body.appendChild(panel);

      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const feature = await setupWatchPage();
      feature.activate({ sendMessage: vi.fn() });

      const { clickElement } = await import("@shared/youtube-dom");
      await vi.waitFor(
        () => {
          expect(clickElement).not.toHaveBeenCalled();
        },
        { timeout: 1000 },
      );

      panel.remove();
    });
  });
});
