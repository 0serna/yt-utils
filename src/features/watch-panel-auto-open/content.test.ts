import { makeFeatureContext } from "@shared/test-helpers";
import type { PlayerSnapshot } from "@shared/youtube-player";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let mockLocationSearch: string;

vi.mock("@shared/youtube-dom", () => ({
  clickElement: vi.fn(),
  delay: vi.fn(() => Promise.resolve()),
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

function matchesButtonLabel(
  matchers: readonly RegExp[],
  label: string,
): boolean {
  return matchers.some((matcher) => matcher.test(label));
}

function clickedElements(clickElement: {
  mock: { calls: unknown[][] };
}): unknown[] {
  return clickElement.mock.calls.flat();
}

function appendNoisyPanel(text: string): {
  panel: HTMLElement;
  closeButton: HTMLButtonElement;
} {
  const panel = appendEngagementPanel(
    "engagement-panel-noisy-test",
    "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED",
  );
  panel.textContent = text;

  const closeButton = document.createElement("button");
  closeButton.setAttribute("aria-label", "Close");
  panel.appendChild(closeButton);

  return { panel, closeButton };
}

function appendLiveChatReplayFrame(buttonLabel: string): {
  frame: HTMLElement;
  button: HTMLButtonElement;
} {
  const frame = document.createElement("ytd-live-chat-frame");
  frame.id = "chat";
  frame.textContent = buttonLabel;

  const button = document.createElement("button");
  button.setAttribute("aria-label", buttonLabel);
  button.textContent = buttonLabel;
  frame.appendChild(button);
  document.body.appendChild(frame);

  return { frame, button };
}

function appendLiveChatHeader(): {
  header: HTMLElement;
  closeButton: HTMLButtonElement;
} {
  const header = document.createElement("yt-live-chat-header-renderer");
  const closeHost = document.createElement("div");
  closeHost.id = "close-button";

  const closeButton = document.createElement("button");
  closeButton.setAttribute("aria-label", "Close");
  closeHost.appendChild(closeButton);
  header.appendChild(closeHost);
  document.body.appendChild(header);

  return { header, closeButton };
}

function appendLiveChatReplayIframe(): {
  iframe: HTMLIFrameElement;
  closeButton: HTMLButtonElement;
} {
  const iframe = document.createElement("iframe");
  iframe.id = "chatframe";
  iframe.src = "https://www.youtube.com/live_chat_replay";
  document.body.appendChild(iframe);

  iframe.contentDocument!.open();
  iframe.contentDocument!.write("<body></body>");
  iframe.contentDocument!.close();

  const closeButton = iframe.contentDocument!.createElement("button");
  closeButton.setAttribute("aria-label", "Close");
  iframe.contentDocument!.body.appendChild(closeButton);

  return { iframe, closeButton };
}

async function importFreshFeature() {
  return import("./content");
}

async function resetMocks() {
  const {
    delay,
    findButton,
    clickElement,
    isDesktopWatchPage,
    isVisible,
    waitFor,
  } = await import("@shared/youtube-dom");
  vi.mocked(clickElement).mockReset();
  vi.mocked(delay).mockReset();
  vi.mocked(delay).mockResolvedValue(undefined);
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
    vi.useRealTimers();
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
    expect(() => feature.default.activate(makeFeatureContext())).not.toThrow();
  });

  it("sync runs but returns early when not on watch page", async () => {
    const { isDesktopWatchPage } = await import("@shared/youtube-dom");
    vi.mocked(isDesktopWatchPage).mockReturnValue(false);

    const feature = await importFreshFeature();
    feature.default.activate(makeFeatureContext());

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
      feature.activate(makeFeatureContext());

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
      feature.activate(makeFeatureContext());
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
      feature.activate(makeFeatureContext());
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
      feature.activate(makeFeatureContext());
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
      feature.activate(makeFeatureContext());
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

      const { findButton, clickElement, waitFor } = await import(
        "@shared/youtube-dom"
      );
      vi.mocked(findButton).mockReturnValue(askButton);
      vi.mocked(waitFor).mockResolvedValue(askButton);

      const feature = await setupWatchPage();
      feature.activate(makeFeatureContext());

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
      feature.activate(makeFeatureContext());

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
      feature.activate(makeFeatureContext());
      await vi.waitFor(
        () => {
          expect(clickElement).not.toHaveBeenCalled();
        },
        { timeout: 1000 },
      );

      panel.remove();
    });

    it("opens ask panel when both chapters and ask are available", async () => {
      const askPanel = appendEngagementPanel(
        "PAyouchat",
        "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN",
      );
      const { chatInput, sendButton } = appendAskPromptControls(askPanel);

      const chaptersPanel = appendEngagementPanel(
        "engagement-panel-macro-markers",
        "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN",
      );
      const chapterItem = appendChapterItem(chaptersPanel);

      const askButton = document.createElement("button");
      const chaptersButton = document.createElement("button");

      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const { findButton, isVisible, clickElement, waitFor } = await import(
        "@shared/youtube-dom"
      );
      vi.mocked(findButton).mockImplementation((_root, matchers) => {
        if (matchesButtonLabel(matchers, "Ask")) return askButton;
        if (matchesButtonLabel(matchers, "Chapters")) {
          return chaptersButton;
        }
        return null;
      });
      vi.mocked(isVisible).mockImplementation((el) => {
        if (el === chapterItem || el === chatInput) return true;
        return false;
      });
      vi.mocked(clickElement).mockImplementation((element) => {
        if (element === askButton) {
          askPanel.setAttribute(
            "visibility",
            "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED",
          );
        }
      });
      vi.mocked(waitFor).mockImplementation((callback) =>
        Promise.resolve(callback() as HTMLElement),
      );

      const feature = await setupWatchPage();
      feature.activate(makeFeatureContext());

      await vi.waitFor(
        () => {
          expect(clickElement).toHaveBeenCalledWith(askButton);
          expect(clickElement).toHaveBeenCalledWith(sendButton);
        },
        { timeout: 2000 },
      );
      expect(clickedElements(vi.mocked(clickElement))).not.toContain(
        chaptersButton,
      );

      chaptersPanel.remove();
      askPanel.remove();
    });

    it("opens ask when chapters panel is already expanded with items", async () => {
      const askPanel = appendEngagementPanel(
        "PAyouchat",
        "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN",
      );
      const askButton = document.createElement("button");

      const chaptersPanel = appendEngagementPanel(
        "engagement-panel-macro-markers",
        "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED",
      );
      const chapterItem = appendChapterItem(chaptersPanel);

      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const { isVisible, clickElement, findButton, waitFor } = await import(
        "@shared/youtube-dom"
      );
      vi.mocked(findButton).mockImplementation((_root, matchers) =>
        matchesButtonLabel(matchers, "Ask") ? askButton : null,
      );
      vi.mocked(isVisible).mockImplementation((el) => {
        if (el === chapterItem) return true;
        return false;
      });
      vi.mocked(clickElement).mockImplementation((element) => {
        if (element === askButton) {
          askPanel.setAttribute(
            "visibility",
            "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED",
          );
        }
      });
      vi.mocked(waitFor).mockImplementation((callback) =>
        Promise.resolve(callback() as HTMLElement),
      );

      const feature = await setupWatchPage();
      feature.activate(makeFeatureContext());

      await vi.waitFor(
        () => {
          expect(clickElement).toHaveBeenCalledWith(askButton);
        },
        { timeout: 2000 },
      );

      chaptersPanel.remove();
      askPanel.remove();
    });

    it("falls back to chapters when ask is not available within the wait window", async () => {
      const chaptersPanel = appendEngagementPanel(
        "engagement-panel-macro-markers",
        "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN",
      );
      const chapterItem = appendChapterItem(chaptersPanel);
      const chaptersButton = document.createElement("button");

      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const { findButton, clickElement, waitFor, isVisible } = await import(
        "@shared/youtube-dom"
      );
      vi.mocked(findButton).mockImplementation((_root, matchers) =>
        matchesButtonLabel(matchers, "Chapters") ? chaptersButton : null,
      );
      vi.mocked(clickElement).mockImplementation((element) => {
        if (element === chaptersButton) {
          chaptersPanel.setAttribute(
            "visibility",
            "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED",
          );
        }
      });
      vi.mocked(isVisible).mockImplementation((el) => el === chapterItem);
      vi.mocked(waitFor).mockImplementation((callback, options) => {
        if (options?.errorCode === "ASK_NOT_AVAILABLE") {
          return Promise.reject(new Error("ask timeout"));
        }
        return Promise.resolve(callback() as HTMLElement);
      });

      const feature = await setupWatchPage();
      feature.activate(makeFeatureContext());

      await vi.waitFor(
        () => {
          expect(clickElement).toHaveBeenCalledWith(chaptersButton);
        },
        { timeout: 2000 },
      );

      chaptersPanel.remove();
    });

    it("falls back to ask when only an ambiguous In this video entrypoint is available", async () => {
      const panel = appendEngagementPanel(
        "PAyouchat",
        "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN",
      );
      panel.style.display = "none";

      const ambiguousButton = document.createElement("button");
      ambiguousButton.className = "ytp-chapter-title";
      ambiguousButton.textContent = "In this video";
      document.body.appendChild(ambiguousButton);

      const askButton = document.createElement("button");

      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const { findButton, clickElement, waitFor, isVisible } = await import(
        "@shared/youtube-dom"
      );
      vi.mocked(findButton).mockImplementation((_root, matchers) =>
        matchesButtonLabel(matchers, "Ask") ? askButton : null,
      );
      vi.mocked(clickElement).mockImplementation((element) => {
        if (element === askButton) {
          panel.style.display = "";
          panel.setAttribute(
            "visibility",
            "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED",
          );
        }
      });
      vi.mocked(isVisible).mockImplementation((el) => el === ambiguousButton);
      vi.mocked(waitFor).mockResolvedValue(askButton);

      const feature = await setupWatchPage();
      feature.activate(makeFeatureContext());

      await vi.waitFor(
        () => {
          expect(clickElement).toHaveBeenCalledWith(askButton);
        },
        { timeout: 2000 },
      );
      expect(clickElement).not.toHaveBeenCalledWith(ambiguousButton);

      ambiguousButton.remove();
      panel.remove();
    });

    it("retries when Ask opens transiently and closes during SPA settle", async () => {
      vi.useFakeTimers();
      const panel = appendEngagementPanel(
        "PAyouchat",
        "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN",
      );
      panel.style.display = "none";

      const askButton = document.createElement("button");
      let clickCount = 0;

      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const { delay, findButton, clickElement, waitFor } = await import(
        "@shared/youtube-dom"
      );
      vi.mocked(findButton).mockImplementation((_root, matchers) =>
        matchesButtonLabel(matchers, "Ask") ? askButton : null,
      );
      vi.mocked(clickElement).mockImplementation((element) => {
        if (element === askButton) {
          clickCount++;
          panel.style.display = "";
          panel.setAttribute(
            "visibility",
            "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED",
          );
        }
      });
      vi.mocked(delay).mockImplementation(async () => {
        if (clickCount === 1) {
          panel.setAttribute(
            "visibility",
            "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN",
          );
        }
      });
      vi.mocked(waitFor).mockImplementation((callback) =>
        Promise.resolve(callback() as HTMLElement),
      );

      const feature = await setupWatchPage();
      feature.activate(makeFeatureContext());

      await vi.waitFor(
        () => {
          expect(clickElement).toHaveBeenCalledWith(askButton);
        },
        { timeout: 2000 },
      );

      await vi.advanceTimersByTimeAsync(1000);
      await Promise.resolve();
      await Promise.resolve();

      await vi.waitFor(
        () => {
          expect(clickElement).toHaveBeenCalledTimes(2);
        },
        { timeout: 2000 },
      );

      feature.deactivate();
      vi.useRealTimers();
      panel.remove();
    });

    it("does not interact when neither chapters nor ask is available", async () => {
      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const { clickElement, findButton } = await import("@shared/youtube-dom");
      vi.mocked(findButton).mockReturnValue(null as unknown as HTMLElement);

      const feature = await setupWatchPage();
      feature.activate(makeFeatureContext());

      await vi.waitFor(
        () => {
          expect(findButton).toHaveBeenCalled();
          expect(clickElement).not.toHaveBeenCalled();
        },
        { timeout: 1000 },
      );
    });

    it("closes noisy In this video and opened Live chat replay panels during initial auto-open", async () => {
      const inThisVideo = appendNoisyPanel("In this video Timeline Transcript");
      const liveChatReplay = appendLiveChatReplayFrame("Hide chat replay");
      const liveChatHeader = appendLiveChatHeader();
      const liveChatIframe = appendLiveChatReplayIframe();

      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const { clickElement, findButton, isVisible } = await import(
        "@shared/youtube-dom"
      );
      vi.mocked(findButton).mockImplementation((root, matchers) => {
        if (root === inThisVideo.panel) return inThisVideo.closeButton;
        if (root === liveChatReplay.frame) {
          return matchers.some((matcher) => matcher.test("Hide chat replay"))
            ? liveChatReplay.button
            : null;
        }
        if (root === liveChatHeader.header) return liveChatHeader.closeButton;
        if (root === liveChatIframe.iframe.contentDocument) {
          return liveChatIframe.closeButton;
        }
        return null;
      });
      vi.mocked(isVisible).mockImplementation(
        (el) =>
          el === inThisVideo.closeButton ||
          el === liveChatReplay.button ||
          el === liveChatHeader.closeButton ||
          el === liveChatIframe.closeButton,
      );

      const feature = await setupWatchPage();
      feature.activate(makeFeatureContext());

      await vi.waitFor(
        () => {
          expect(clickElement).toHaveBeenCalledWith(inThisVideo.closeButton);
          expect(clickElement).toHaveBeenCalledWith(liveChatReplay.button);
          expect(clickElement).toHaveBeenCalledWith(liveChatHeader.closeButton);
          expect(clickElement).toHaveBeenCalledWith(liveChatIframe.closeButton);
        },
        { timeout: 2000 },
      );

      inThisVideo.panel.remove();
      liveChatReplay.frame.remove();
      liveChatHeader.header.remove();
      liveChatIframe.iframe.remove();
    });

    it("preserves passive Live chat replay teasers and collapsed frames", async () => {
      const teaser = document.createElement("div");
      teaser.textContent = "Live chat replay Open panel";
      const openButton = document.createElement("button");
      openButton.textContent = "Open panel";
      teaser.appendChild(openButton);
      document.body.appendChild(teaser);
      const collapsedFrame = appendLiveChatReplayFrame("Show chat replay");

      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const { clickElement, findButton, isVisible } = await import(
        "@shared/youtube-dom"
      );
      vi.mocked(findButton).mockImplementation((root, matchers) => {
        if (root === collapsedFrame.frame) {
          return matchers.some((matcher) => matcher.test("Show chat replay"))
            ? collapsedFrame.button
            : null;
        }
        return null;
      });
      vi.mocked(isVisible).mockImplementation(
        (el) => el === collapsedFrame.button,
      );

      const feature = await setupWatchPage();
      feature.activate(makeFeatureContext());

      await vi.waitFor(
        () => {
          expect(findButton).toHaveBeenCalled();
          expect(clickElement).not.toHaveBeenCalled();
        },
        { timeout: 1000 },
      );

      teaser.remove();
      collapsedFrame.frame.remove();
    });

    it("types prompt and clicks Send when chat input is available after ask opens", async () => {
      const panel = appendEngagementPanel(
        "PAyouchat",
        "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN",
      );
      panel.style.display = "none";

      const { chatInput, sendButton } = appendAskPromptControls(panel);

      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const { findButton, clickElement, waitFor, isVisible } = await import(
        "@shared/youtube-dom"
      );

      const askButton = document.createElement("button");
      vi.mocked(findButton).mockReturnValue(askButton);
      vi.mocked(clickElement).mockImplementation((element) => {
        if (element === askButton) {
          panel.style.display = "";
          panel.setAttribute(
            "visibility",
            "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED",
          );
        }
      });
      vi.mocked(isVisible).mockImplementation((el) => {
        if (el === chatInput) return true;
        return false;
      });
      vi.mocked(waitFor).mockImplementation((callback) =>
        Promise.resolve(callback() as HTMLElement),
      );

      const feature = await setupWatchPage();
      feature.activate(makeFeatureContext());

      await vi.waitFor(
        () => {
          expect(clickElement).toHaveBeenCalledWith(sendButton);
        },
        { timeout: 2000 },
      );

      panel.remove();
    });

    it("leaves ask open without falling back to chapters when chat input is missing", async () => {
      const askPanel = appendEngagementPanel(
        "PAyouchat",
        "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN",
      );
      const chaptersPanel = appendEngagementPanel(
        "engagement-panel-macro-markers",
        "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN",
      );
      const chapterItem = appendChapterItem(chaptersPanel);
      const askButton = document.createElement("button");
      const chaptersButton = document.createElement("button");

      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const { findButton, clickElement, waitFor, isVisible } = await import(
        "@shared/youtube-dom"
      );
      vi.mocked(findButton).mockImplementation((_root, matchers) => {
        if (matchesButtonLabel(matchers, "Ask")) return askButton;
        if (matchesButtonLabel(matchers, "Chapters")) {
          return chaptersButton;
        }
        return null;
      });
      vi.mocked(clickElement).mockImplementation((element) => {
        if (element === askButton) {
          askPanel.setAttribute(
            "visibility",
            "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED",
          );
        }
      });
      vi.mocked(isVisible).mockImplementation((el) => el === chapterItem);
      vi.mocked(waitFor).mockImplementation((callback, options) => {
        if (options?.errorCode === "CHAT_INPUT_NOT_FOUND") {
          return Promise.reject(new Error("chat input timeout"));
        }
        return Promise.resolve(callback() as HTMLElement);
      });

      const feature = await setupWatchPage();
      feature.activate(makeFeatureContext());

      await vi.waitFor(
        () => {
          expect(clickElement).toHaveBeenCalledWith(askButton);
        },
        { timeout: 2000 },
      );
      expect(clickedElements(vi.mocked(clickElement))).not.toContain(
        chaptersButton,
      );
      expect(askPanel.getAttribute("visibility")).toBe(
        "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED",
      );

      chaptersPanel.remove();
      askPanel.remove();
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
      feature.activate(makeFeatureContext());

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

      const { clickElement, waitFor, isVisible } = await import(
        "@shared/youtube-dom"
      );
      vi.mocked(isVisible).mockImplementation((el) => el === chatInput);
      vi.mocked(waitFor).mockImplementation((callback) =>
        Promise.resolve(callback() as HTMLElement),
      );

      const feature = await setupWatchPage();
      feature.activate(makeFeatureContext());

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

      const { clickElement, waitFor, isVisible } = await import(
        "@shared/youtube-dom"
      );
      vi.mocked(isVisible).mockImplementation((el) => el === chatInput);
      vi.mocked(waitFor).mockImplementation((callback) =>
        Promise.resolve(callback() as HTMLElement),
      );

      const feature = await setupWatchPage();
      feature.activate(makeFeatureContext());

      await vi.waitFor(
        () => {
          expect(clickElement).toHaveBeenCalledWith(sendButton);
        },
        { timeout: 3000 },
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));
      await Promise.resolve();
      await Promise.resolve();
      vi.mocked(clickElement).mockClear();
      panel.setAttribute("data-test-resync", "1");

      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(clickElement).not.toHaveBeenCalled();

      panel.remove();
    });

    it("resets and syncs when the URL video changes without registry reactivation", async () => {
      vi.useFakeTimers();
      const panel = appendEngagementPanel(
        "PAyouchat",
        "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN",
      );
      panel.style.display = "none";

      const askButton = document.createElement("button");

      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockImplementation(() =>
        Promise.resolve(
          snapshot(new URLSearchParams(mockLocationSearch).get("v")!),
        ),
      );

      const { findButton, clickElement, waitFor } = await import(
        "@shared/youtube-dom"
      );
      vi.mocked(findButton).mockReturnValue(askButton);
      vi.mocked(waitFor).mockResolvedValue(askButton);

      const feature = await setupWatchPage();
      feature.activate(makeFeatureContext());

      await vi.waitFor(
        () => {
          expect(clickElement).toHaveBeenCalledWith(askButton);
        },
        { timeout: 2000 },
      );

      vi.mocked(clickElement).mockClear();
      mockLocationSearch = "?v=next-video";
      await vi.advanceTimersByTimeAsync(500);

      await vi.waitFor(
        () => {
          expect(clickElement).toHaveBeenCalledWith(askButton);
        },
        { timeout: 2000 },
      );

      feature.deactivate();
      vi.useRealTimers();
      panel.remove();
    });

    it("does not auto-switch to late ask after chapters fallback, but prompts after manual ask open", async () => {
      const askPanel = appendEngagementPanel(
        "PAyouchat",
        "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN",
      );
      askPanel.style.display = "none";
      const askButton = document.createElement("button");
      let askAvailable = false;

      const { chatInput, sendButton } = appendAskPromptControls(askPanel);

      const chaptersPanel = appendEngagementPanel(
        "engagement-panel-macro-markers",
        "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED",
      );
      const chapterItem = appendChapterItem(chaptersPanel);

      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const { clickElement, findButton, isVisible, waitFor } = await import(
        "@shared/youtube-dom"
      );
      vi.mocked(findButton).mockImplementation((_root, matchers) =>
        askAvailable && matchesButtonLabel(matchers, "Ask") ? askButton : null,
      );
      vi.mocked(isVisible).mockImplementation((el) => {
        if (el === chapterItem || el === chatInput) return true;
        return false;
      });
      vi.mocked(waitFor).mockImplementation((callback, options) => {
        if (options?.errorCode === "ASK_NOT_AVAILABLE") {
          return Promise.reject(new Error("ask timeout"));
        }
        return Promise.resolve(callback() as HTMLElement);
      });

      const feature = await setupWatchPage();
      feature.activate(makeFeatureContext());

      await vi.waitFor(
        () => {
          expect(findButton).toHaveBeenCalled();
          expect(clickElement).not.toHaveBeenCalled();
        },
        { timeout: 1000 },
      );

      askAvailable = true;
      askPanel.setAttribute("data-late-ask", "1");
      await new Promise((resolve) => setTimeout(resolve, 600));
      expect(clickElement).not.toHaveBeenCalledWith(askButton);

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

    it("does not close manually opened noisy panels after auto-open completes", async () => {
      const chaptersPanel = appendEngagementPanel(
        "engagement-panel-macro-markers",
        "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED",
      );
      const chapterItem = appendChapterItem(chaptersPanel);

      const { readPlayerSnapshot } = await import("@shared/youtube-player");
      vi.mocked(readPlayerSnapshot).mockResolvedValue(snapshot("test-video"));

      const { clickElement, findButton, isVisible } = await import(
        "@shared/youtube-dom"
      );
      vi.mocked(isVisible).mockImplementation((el) => el === chapterItem);

      const feature = await setupWatchPage();
      feature.activate(makeFeatureContext());

      await vi.waitFor(
        () => {
          expect(
            vi.mocked(isVisible).mock.calls.some(([el]) => el === chapterItem),
          ).toBe(true);
          expect(clickElement).not.toHaveBeenCalled();
        },
        { timeout: 1000 },
      );
      await new Promise((resolve) => setTimeout(resolve, 600));
      vi.mocked(clickElement).mockClear();

      const noisyPanel = appendNoisyPanel("In this video Timeline Transcript");
      vi.mocked(findButton).mockImplementation((root) =>
        root === noisyPanel.panel ? noisyPanel.closeButton : null,
      );
      vi.mocked(isVisible).mockImplementation(
        (el) => el === chapterItem || el === noisyPanel.closeButton,
      );

      noisyPanel.panel.setAttribute("data-test-resync", "1");
      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(clickElement).not.toHaveBeenCalledWith(noisyPanel.closeButton);

      noisyPanel.panel.remove();
      chaptersPanel.remove();
    });
  });
});
