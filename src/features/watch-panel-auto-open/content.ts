import {
  createDomSyncController,
  hasRelevantSurfaceMutation,
} from "@shared/dom-sync-controller";
import type { Feature, FeatureContext } from "@shared/types";
import {
  clickElement,
  findButton,
  isDesktopWatchPage,
  isVisible,
  waitFor,
} from "@shared/youtube-dom";
import { readPlayerSnapshot } from "@shared/youtube-player";

const PANEL_TARGET_ID = "PAyouchat";
const CHAPTERS_PANEL_TARGET_IDS = [
  "engagement-panel-macro-markers",
  "engagement-panel-macro-markers-description-chapters",
];
const CHAPTERS_PANEL_SELECTOR = CHAPTERS_PANEL_TARGET_IDS.map(
  (id) => `ytd-engagement-panel-section-list-renderer[target-id="${id}"]`,
).join(", ");
const ASK_SCROLL_CONTAINER_SELECTOR =
  'ytd-engagement-panel-section-list-renderer[target-id="PAyouchat"] yt-section-list-renderer';
const POLL_INTERVAL_MS = 500;
const SYNC_TIMEOUT_MS = 5000;
const PANEL_SETTLE_DELAY_MS = 1500;
const ASK_LABELS = [/\bask\b/i, /\bpreguntar\b/i];
const CHAPTERS_LABELS = [/\bchapters\b/i, /\bcapítulos\b/i];
const CHAPTER_ITEM_SELECTOR = "ytd-macro-markers-list-item-renderer";
const CHAT_INPUT_SELECTOR =
  'textarea.chatInputViewModelChatInput, textarea[placeholder="Ask a question..."], textarea[placeholder="Haz una pregunta..."]';
const SEND_BUTTON_SELECTOR = 'button[aria-label="Send"]';
const SUMMARIZE_PROMPT =
  "Please summarize this video for me, including timestamps, in chronological order, and in a bulleted list format.";
const ASK_SCROLL_OVERSCROLL_BEHAVIOR = "contain";

let sessionToken = 0;
let completedVideoId: string | null = null;
let promptedVideoId: string | null = null;
let expandedVideoId: string | null = null;
let activatedAt = 0;

const domSyncController = createDomSyncController({
  pollIntervalMs: POLL_INTERVAL_MS,
  observerOptions: {
    attributes: true,
    childList: true,
    subtree: true,
    attributeFilter: ["visibility", "hidden", "aria-hidden", "class", "style"],
  },
  hasRelevantMutation: (mutations) =>
    hasRelevantSurfaceMutation(mutations, isInsidePanelSurface),
  sync: syncCurrentVideoPanel,
});

const watchPanelAutoOpenFeature: Feature = {
  name: "youtube-watch-panel-auto-open",
  isWatchPage: true,

  activate(_context: FeatureContext): void {
    activatedAt = Date.now();
    completedVideoId = null;
    promptedVideoId = null;
    expandedVideoId = null;
    syncAskScrollContainment();
    sessionToken = domSyncController.activate();
  },

  deactivate(): void {
    sessionToken = domSyncController.deactivate();
    activatedAt = 0;
    completedVideoId = null;
    promptedVideoId = null;
    expandedVideoId = null;
  },
};

export default watchPanelAutoOpenFeature;

function getCurrentVideoId(): string | null {
  return new URLSearchParams(window.location.search).get("v");
}

function findAskPanel(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `ytd-engagement-panel-section-list-renderer[target-id="${PANEL_TARGET_ID}"]`,
  );
}

function findChaptersPanel(): HTMLElement | null {
  for (const targetId of CHAPTERS_PANEL_TARGET_IDS) {
    const panel = document.querySelector<HTMLElement>(
      `ytd-engagement-panel-section-list-renderer[target-id="${targetId}"]`,
    );
    if (panel) return panel;
  }

  const panels = document.querySelectorAll<HTMLElement>(
    "ytd-engagement-panel-section-list-renderer",
  );
  for (const panel of panels) {
    const text = panel.textContent || "";
    if (
      CHAPTERS_LABELS.some((re) => re.test(text)) &&
      panel.querySelector(CHAPTER_ITEM_SELECTOR)
    ) {
      return panel;
    }
  }

  return null;
}

function isAskPanelExpanded(panel: HTMLElement): boolean {
  const visibility = panel.getAttribute("visibility");

  if (visibility === "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED") {
    return true;
  }

  if (visibility === "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN") {
    return false;
  }

  return isVisible(panel);
}

function findVisibleChapterItems(): HTMLElement[] {
  const panel = findChaptersPanel();
  if (!panel) return [];

  return [...panel.querySelectorAll<HTMLElement>(CHAPTER_ITEM_SELECTOR)].filter(
    isVisible,
  );
}

function findChaptersButton(): HTMLElement | null {
  const playerButton = document.querySelector<HTMLElement>(
    "button.ytp-chapter-title",
  );
  if (playerButton && isVisible(playerButton)) {
    return playerButton;
  }

  return findButton(document, CHAPTERS_LABELS);
}

function findAskButton(): HTMLElement | null {
  const entrypoint = document.querySelector<HTMLElement>(
    "button-view-model.you-chat-entrypoint-button button, yt-button-view-model button[aria-label='Ask'], yt-button-view-model button[aria-label='Preguntar']",
  );

  if (entrypoint && isVisible(entrypoint)) {
    return entrypoint;
  }

  return findButton(document, ASK_LABELS);
}

async function syncCurrentVideoPanel(token: number): Promise<void> {
  const videoId = await validateSyncContext(token);
  if (!videoId) {
    return;
  }

  await syncValidatedVideoPanel(videoId, token);
}

async function syncValidatedVideoPanel(
  videoId: string,
  token: number,
): Promise<void> {
  const askPanel = findAskPanel();
  const askExpanded = askPanel ? isAskPanelExpanded(askPanel) : false;

  if (!prepareVideoState(videoId, askExpanded)) {
    return;
  }

  if (await handleAlreadyExpandedAsk(videoId, askExpanded)) {
    return;
  }

  syncCollapsedAskPanelScrollContainment(askPanel, askExpanded);

  if (await handledChaptersOrLostSession(videoId, token)) {
    return;
  }

  await openAskFallbackIfNeeded(videoId, token, askExpanded);
}

function prepareVideoState(videoId: string, askExpanded: boolean): boolean {
  resetStaleState(videoId);
  return (
    completedVideoId !== videoId ||
    shouldPromptExpandedAsk(videoId, askExpanded)
  );
}

async function handleAlreadyExpandedAsk(
  videoId: string,
  askExpanded: boolean,
): Promise<boolean> {
  if (shouldDeferInitialExpandedAsk(videoId, askExpanded)) {
    return true;
  }

  if (shouldPromptExpandedAsk(videoId, askExpanded)) {
    promptedVideoId = videoId;
    await typeAndSendPrompt();
    completeVideo(videoId);
    return true;
  }

  if (expandedVideoId !== videoId) {
    return false;
  }

  completeVideo(videoId);
  return true;
}

async function handledChaptersOrLostSession(
  videoId: string,
  token: number,
): Promise<boolean> {
  const chaptersHandled = await tryOpenChapters(videoId, token);
  return token !== sessionToken || chaptersHandled;
}

async function openAskFallbackIfNeeded(
  videoId: string,
  token: number,
  askExpanded: boolean,
): Promise<void> {
  if (askExpanded) {
    completeVideo(videoId);
    return;
  }

  await openAskPanel(videoId, token);
}

function shouldPromptExpandedAsk(
  videoId: string,
  askExpanded: boolean,
): boolean {
  return askExpanded && promptedVideoId !== videoId;
}

function syncCollapsedAskPanelScrollContainment(
  panel: HTMLElement | null,
  askExpanded: boolean,
): void {
  if (panel && !askExpanded) {
    syncAskScrollContainment();
  }
}

function shouldDeferInitialExpandedAsk(
  videoId: string,
  askExpanded: boolean,
): boolean {
  if (!askExpanded) {
    return false;
  }

  syncAskScrollContainment();
  return (
    expandedVideoId !== videoId &&
    Date.now() - activatedAt < PANEL_SETTLE_DELAY_MS
  );
}

async function validateSyncContext(token: number): Promise<string | null> {
  if (token !== sessionToken || !isDesktopWatchPage()) {
    return null;
  }

  const videoId = getCurrentVideoId();
  if (!videoId) {
    return null;
  }

  const snapshot = await readPlayerSnapshot();
  if (
    token !== sessionToken ||
    !snapshot?.videoId ||
    snapshot.videoId !== videoId
  ) {
    return null;
  }

  return videoId;
}

function resetStaleState(videoId: string): void {
  if (completedVideoId && completedVideoId !== videoId) {
    completedVideoId = null;
  }

  if (promptedVideoId && promptedVideoId !== videoId) {
    promptedVideoId = null;
  }

  if (expandedVideoId && expandedVideoId !== videoId) {
    expandedVideoId = null;
  }
}

function isContextValid(token: number, videoId: string): boolean {
  return (
    token === sessionToken &&
    getCurrentVideoId() === videoId &&
    isDesktopWatchPage()
  );
}

function completeVideo(videoId: string): void {
  expandedVideoId = videoId;
  completedVideoId = videoId;
}

async function tryOpenChapters(
  videoId: string,
  token: number,
): Promise<boolean> {
  const chaptersPanel = findChaptersPanel();
  if (chaptersPanel && isAskPanelExpanded(chaptersPanel)) {
    const items = findVisibleChapterItems();
    if (items.length > 0) {
      completeVideo(videoId);
      return true;
    }
  }

  const chaptersButton = findChaptersButton();
  if (!chaptersButton) {
    return false;
  }

  clickElement(chaptersButton);

  try {
    await waitFor(
      () => {
        const items = findVisibleChapterItems();
        return items.length > 0 ? items : null;
      },
      {
        timeout: SYNC_TIMEOUT_MS,
        interval: 100,
        errorCode: "CHAPTERS_NOT_AVAILABLE",
        errorMessage: "Timed out waiting for chapters panel to show items.",
      },
    );

    if (token !== sessionToken) {
      return false;
    }

    completeVideo(videoId);
    return true;
  } catch {
    return false;
  }
}

async function openAskPanel(videoId: string, token: number): Promise<void> {
  const recheckPanel = findAskPanel();
  if (recheckPanel && isAskPanelExpanded(recheckPanel)) {
    completeVideo(videoId);
    return;
  }

  const askButton = findAskButton();
  if (!askButton) {
    return;
  }

  clickElement(askButton);

  try {
    await waitFor(
      () => {
        const currentPanel = findAskPanel();
        return currentPanel && isAskPanelExpanded(currentPanel)
          ? currentPanel
          : null;
      },
      {
        timeout: SYNC_TIMEOUT_MS,
        interval: 100,
        errorCode: "ASK_PANEL_NOT_OPENED",
        errorMessage: "Timed out waiting for the Ask panel to open.",
      },
    );
  } catch {
    return;
  }

  if (!isContextValid(token, videoId)) {
    return;
  }

  promptedVideoId = videoId;
  await typeAndSendPrompt();

  if (!isContextValid(token, videoId)) {
    return;
  }

  completeVideo(videoId);
  syncAskScrollContainment();
}

function findChatInput(): HTMLElement | null {
  const askPanel = findAskPanel();
  if (!askPanel) return null;
  return askPanel.querySelector<HTMLElement>(CHAT_INPUT_SELECTOR);
}

function findSendButton(): HTMLElement | null {
  const askPanel = findAskPanel();
  if (!askPanel) return null;
  return askPanel.querySelector<HTMLElement>(SEND_BUTTON_SELECTOR);
}

async function typeAndSendPrompt(): Promise<void> {
  try {
    const input = await waitFor(
      () => {
        const el = findChatInput();
        return el && isVisible(el) ? el : null;
      },
      {
        timeout: SYNC_TIMEOUT_MS,
        interval: 100,
        errorCode: "CHAT_INPUT_NOT_FOUND",
        errorMessage: "Timed out waiting for chat input.",
      },
    );

    const sendButton = findSendButton();
    if (!sendButton) {
      return;
    }

    input.focus();

    typePromptText(input);

    clickElement(sendButton);
  } catch {
    // Intentionally silent: chat input or send button unavailable.
  }
}

function syncAskScrollContainment(): void {
  const scrollContainer = document.querySelector<HTMLElement>(
    ASK_SCROLL_CONTAINER_SELECTOR,
  );

  if (!scrollContainer) {
    return;
  }

  if (
    scrollContainer.style.overscrollBehaviorY !== ASK_SCROLL_OVERSCROLL_BEHAVIOR
  ) {
    scrollContainer.style.overscrollBehaviorY = ASK_SCROLL_OVERSCROLL_BEHAVIOR;
  }
}

function typePromptText(input: HTMLElement): void {
  const textInput = getTextInput(input);

  if (textInput) {
    textInput.value = "";
  } else {
    input.textContent = "";
  }

  for (const character of SUMMARIZE_PROMPT) {
    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: character,
        bubbles: true,
        cancelable: true,
      }),
    );
    input.dispatchEvent(
      new KeyboardEvent("keypress", {
        key: character,
        bubbles: true,
        cancelable: true,
      }),
    );

    if (textInput) {
      textInput.value += character;
    } else {
      input.textContent = `${input.textContent || ""}${character}`;
    }

    input.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: character,
      }),
    );
    input.dispatchEvent(
      new KeyboardEvent("keyup", {
        key: character,
        bubbles: true,
        cancelable: true,
      }),
    );
  }
}

function getTextInput(
  input: HTMLElement,
): HTMLInputElement | HTMLTextAreaElement | null {
  if (
    input instanceof HTMLInputElement ||
    input instanceof HTMLTextAreaElement
  ) {
    return input;
  }

  return null;
}

function isInsidePanelSurface(node: Node): boolean {
  if (!(node instanceof Element)) {
    return false;
  }

  return Boolean(
    node.closest(
      `ytd-watch-metadata, #actions-inner, #top-level-buttons-computed, ytd-menu-renderer, ytd-engagement-panel-section-list-renderer[target-id="${PANEL_TARGET_ID}"], ${CHAPTERS_PANEL_SELECTOR}`,
    ),
  );
}
