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

function appendEngagementPanel(
  targetId: string,
  visibility: string,
): HTMLElement {
  const panel = document.createElement(
    "ytd-engagement-panel-section-list-renderer",
  );
  panel.setAttribute("target-id", targetId);
  panel.setAttribute("visibility", visibility);
  document.body.appendChild(panel);
  return panel;
}

function appendChapterItem(panel: HTMLElement): HTMLElement {
  const chapterItem = document.createElement(
    "ytd-macro-markers-list-item-renderer",
  );
  panel.appendChild(chapterItem);
  return chapterItem;
}

function appendAskPromptControls(panel: HTMLElement): {
  chatInput: HTMLTextAreaElement;
  sendButton: HTMLButtonElement;
} {
  const chatInput = document.createElement("textarea");
  chatInput.className = "chatInputViewModelChatInput";
  panel.appendChild(chatInput);

  const sendButton = document.createElement("button");
  sendButton.setAttribute("aria-label", "Send");
  panel.appendChild(sendButton);

  return { chatInput, sendButton };
}

async function importFreshFeature() {
  return import("./content");
}

async function resetMocks() {
  const { findButton, clickElement, isDesktopWatchPage, isVisible, waitFor } =
    await import("@shared/youtube-dom");
  vi.mocked(clickElement).mockReset();
  vi.mocked(findButton).mockReset();
  vi.mocked(isDesktopWatchPage).mockReset();
  vi.mocked(isVisible).mockReset();
  vi.mocked(waitFor).mockReset();
  const { readPlayerSnapshot } = await import("@shared/youtube-player");
  vi.mocked(readPlayerSnapshot).mockReset();
}

describe("watch-panel-auto-open feature", () => {
  beforeEach(async () => {
    vi.resetModules();
    await resetMocks();
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

  afterEach(async () => {
    await resetMocks();
  });

  it("exports a feature with correct name", async () => {
    const feature = await importFreshFeature();
    expect(feature.default.name).toBe("youtube-watch-panel-auto-open");
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
      document.body.innerHTML = "";
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

      const { findButton } = await import("@shared/youtube-dom");
      feature.activate({ sendMessage: vi.fn() });
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

      const { findButton } = await import("@shared/youtube-dom");
      feature.activate({ sendMessage: vi.fn() });
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

      const { findButton } = await import("@shared/youtube-dom");
      feature.activate({ sendMessage: vi.fn() });
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
      const panel = appendEngagementPanel(
        "PAyouchat",
        "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN",
      );
      panel.style.display = "none";

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
      const panel = appendEngagementPanel(
        "PAyouchat",
        "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN",
      );
      panel.style.display = "none";

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
      const panel = appendEngagementPanel(
        "PAyouchat",
        "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED",
      );

      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const feature = await setupWatchPage();

      const { clickElement } = await import("@shared/youtube-dom");
      feature.activate({ sendMessage: vi.fn() });
      await vi.waitFor(
        () => {
          expect(clickElement).not.toHaveBeenCalled();
        },
        { timeout: 1000 },
      );

      panel.remove();
    });

    it("opens chapters panel when both chapters and ask are available", async () => {
      const askPanel = appendEngagementPanel(
        "PAyouchat",
        "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN",
      );

      const chaptersPanel = appendEngagementPanel(
        "engagement-panel-macro-markers",
        "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN",
      );
      const chapterItem = appendChapterItem(chaptersPanel);

      const chaptersButton = document.createElement("button");

      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const { findButton, isVisible, clickElement, waitFor } =
        await import("@shared/youtube-dom");
      vi.mocked(findButton).mockReturnValue(chaptersButton);
      vi.mocked(isVisible).mockImplementation((el) => {
        if (el === chapterItem) return true;
        return false;
      });
      vi.mocked(waitFor).mockResolvedValue([chapterItem]);

      const feature = await setupWatchPage();
      feature.activate({ sendMessage: vi.fn() });

      await vi.waitFor(
        () => {
          expect(clickElement).toHaveBeenCalledWith(chaptersButton);
        },
        { timeout: 2000 },
      );

      chaptersPanel.remove();
      askPanel.remove();
    });

    it("opens chapters panel when chapters panel is already expanded with items", async () => {
      const askPanel = appendEngagementPanel(
        "PAyouchat",
        "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN",
      );

      const chaptersPanel = appendEngagementPanel(
        "engagement-panel-macro-markers",
        "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED",
      );
      const chapterItem = appendChapterItem(chaptersPanel);

      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const { isVisible, clickElement, findButton } =
        await import("@shared/youtube-dom");
      vi.mocked(isVisible).mockImplementation((el) => {
        if (el === chapterItem) return true;
        return false;
      });

      const feature = await setupWatchPage();
      feature.activate({ sendMessage: vi.fn() });

      await vi.waitFor(
        () => {
          expect(findButton).not.toHaveBeenCalled();
          expect(clickElement).not.toHaveBeenCalled();
        },
        { timeout: 1000 },
      );

      chaptersPanel.remove();
      askPanel.remove();
    });

    it("falls back to ask when chapters are not available", async () => {
      const panel = appendEngagementPanel(
        "PAyouchat",
        "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN",
      );
      panel.style.display = "none";

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

    it("does not interact when neither chapters nor ask is available", async () => {
      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const { clickElement, findButton } = await import("@shared/youtube-dom");
      vi.mocked(findButton).mockReturnValue(null as unknown as HTMLElement);

      const feature = await setupWatchPage();
      feature.activate({ sendMessage: vi.fn() });

      await vi.waitFor(
        () => {
          expect(findButton).toHaveBeenCalled();
          expect(clickElement).not.toHaveBeenCalled();
        },
        { timeout: 1000 },
      );
    });

    it("types prompt and clicks Send when chat input is available after ask fallback opens", async () => {
      const panel = appendEngagementPanel(
        "PAyouchat",
        "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN",
      );
      panel.style.display = "none";

      const { chatInput, sendButton } = appendAskPromptControls(panel);

      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const { findButton, clickElement, waitFor, isVisible } =
        await import("@shared/youtube-dom");

      const askButton = document.createElement("button");
      vi.mocked(findButton).mockReturnValue(askButton);
      vi.mocked(isVisible).mockImplementation((el) => {
        if (el === chatInput) return true;
        return false;
      });
      vi.mocked(waitFor).mockImplementation(
        (() => {
          let callIndex = 0;
          return () => {
            callIndex++;
            if (callIndex === 1)
              return Promise.reject(new Error("chapters timeout"));
            if (callIndex === 2) return Promise.resolve(askButton);
            return Promise.resolve(chatInput);
          };
        })(),
      );

      const feature = await setupWatchPage();
      feature.activate({ sendMessage: vi.fn() });

      await vi.waitFor(
        () => {
          expect(clickElement).toHaveBeenCalledWith(sendButton);
        },
        { timeout: 2000 },
      );

      panel.remove();
    });

    it("does not interact when ask was already expanded before fallback", async () => {
      const panel = appendEngagementPanel(
        "PAyouchat",
        "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED",
      );

      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const { clickElement } = await import("@shared/youtube-dom");

      const feature = await setupWatchPage();
      feature.activate({ sendMessage: vi.fn() });

      await vi.waitFor(
        () => {
          expect(clickElement).not.toHaveBeenCalled();
        },
        { timeout: 1000 },
      );

      panel.remove();
    });

    it("types prompt when ask is manually opened", async () => {
      const panel = appendEngagementPanel(
        "PAyouchat",
        "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED",
      );

      const { chatInput, sendButton } = appendAskPromptControls(panel);

      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const { clickElement, waitFor, isVisible } =
        await import("@shared/youtube-dom");
      vi.mocked(isVisible).mockImplementation((el) => el === chatInput);
      vi.mocked(waitFor).mockImplementation((callback) =>
        Promise.resolve(callback() as HTMLElement),
      );

      const feature = await setupWatchPage();
      feature.activate({ sendMessage: vi.fn() });

      await vi.waitFor(
        () => {
          expect(clickElement).toHaveBeenCalledWith(sendButton);
        },
        { timeout: 3000 },
      );

      panel.remove();
    });

    it("does not re-prompt after ask was already prompted for the current video", async () => {
      const panel = appendEngagementPanel(
        "PAyouchat",
        "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED",
      );

      const { chatInput, sendButton } = appendAskPromptControls(panel);

      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const { clickElement, waitFor, isVisible } =
        await import("@shared/youtube-dom");
      vi.mocked(isVisible).mockImplementation((el) => el === chatInput);
      vi.mocked(waitFor).mockImplementation((callback) =>
        Promise.resolve(callback() as HTMLElement),
      );

      const feature = await setupWatchPage();
      feature.activate({ sendMessage: vi.fn() });

      await vi.waitFor(
        () => {
          expect(clickElement).toHaveBeenCalledWith(sendButton);
        },
        { timeout: 3000 },
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));
      vi.mocked(clickElement).mockClear();
      panel.setAttribute("data-test-resync", "1");

      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(clickElement).not.toHaveBeenCalled();

      panel.remove();
    });

    it("types prompt when ask is manually opened after chapters completed the video", async () => {
      const askPanel = appendEngagementPanel(
        "PAyouchat",
        "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN",
      );
      askPanel.style.display = "none";

      const { chatInput, sendButton } = appendAskPromptControls(askPanel);

      const chaptersPanel = appendEngagementPanel(
        "engagement-panel-macro-markers",
        "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED",
      );
      const chapterItem = appendChapterItem(chaptersPanel);

      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const { clickElement, isVisible, waitFor } =
        await import("@shared/youtube-dom");
      vi.mocked(isVisible).mockImplementation((el) => {
        if (el === chapterItem || el === chatInput) return true;
        return false;
      });
      vi.mocked(waitFor).mockImplementation((callback) =>
        Promise.resolve(callback() as HTMLElement),
      );

      const feature = await setupWatchPage();
      feature.activate({ sendMessage: vi.fn() });

      await vi.waitFor(
        () => {
          expect(clickElement).not.toHaveBeenCalled();
        },
        { timeout: 1000 },
      );

      askPanel.style.display = "";
      askPanel.setAttribute(
        "visibility",
        "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED",
      );

      await vi.waitFor(
        () => {
          expect(clickElement).toHaveBeenCalledWith(sendButton);
        },
        { timeout: 3000 },
      );

      chaptersPanel.remove();
      askPanel.remove();
    });
  });
});
