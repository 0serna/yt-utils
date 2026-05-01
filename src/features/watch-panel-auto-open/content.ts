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
const SUMMARIZE_LABELS = [
  /summarize the video/i,
  /resumir el video/i,
  /^resumir$/i,
];
const ASK_SCROLL_OVERSCROLL_BEHAVIOR = "contain";

let sessionToken = 0;
let completedVideoId: string | null = null;
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
    expandedVideoId = null;
    syncAskScrollContainment();
    sessionToken = domSyncController.activate();
  },

  deactivate(): void {
    sessionToken = domSyncController.deactivate();
    activatedAt = 0;
    completedVideoId = null;
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

function getPanelVisibility(panel: HTMLElement): string | null {
  return panel.getAttribute("visibility");
}

function isAskPanelExpanded(panel: HTMLElement): boolean {
  const visibility = getPanelVisibility(panel);

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

function findSummarizeChip(): HTMLElement | null {
  const askPanel = findAskPanel();
  if (!askPanel) return null;

  const chips = askPanel.querySelectorAll<HTMLElement>(
    "button, [role='button']",
  );
  return [...chips].find(isSummarizeChipCandidate) ?? null;
}

function isSummarizeChipCandidate(chip: HTMLElement): boolean {
  return isVisible(chip) && isEnabled(chip) && matchesSummarizeLabel(chip);
}

function isEnabled(element: HTMLElement): boolean {
  if (element.getAttribute("disabled") !== null) return false;
  if (element.getAttribute("aria-disabled") === "true") return false;
  return true;
}

function matchesSummarizeLabel(element: HTMLElement): boolean {
  const text = getElementText(element);
  return SUMMARIZE_LABELS.some((re) => re.test(text));
}

function getElementText(element: HTMLElement): string {
  return (
    element.getAttribute("aria-label") ||
    element.getAttribute("title") ||
    element.textContent ||
    ""
  );
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
  if (!prepareVideoState(videoId)) {
    return;
  }

  const askPanel = findAskPanel();
  const askExpanded = isCurrentAskPanelExpanded(askPanel);

  if (handleAlreadyExpandedAsk(videoId, askExpanded)) {
    return;
  }

  syncCollapsedAskPanelScrollContainment(askPanel, askExpanded);

  if (await handledChaptersOrLostSession(videoId, token)) {
    return;
  }

  await openAskFallbackIfNeeded(videoId, token, askExpanded);
}

function prepareVideoState(videoId: string): boolean {
  resetStaleState(videoId);
  return completedVideoId !== videoId;
}

function handleAlreadyExpandedAsk(
  videoId: string,
  askExpanded: boolean,
): boolean {
  if (shouldDeferInitialExpandedAsk(videoId, askExpanded)) {
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

function isCurrentAskPanelExpanded(panel: HTMLElement | null): boolean {
  return panel ? isAskPanelExpanded(panel) : false;
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

    if (!isContextValid(token, videoId)) {
      return;
    }

    await waitForSummarizeChip(videoId, token);

    if (!isContextValid(token, videoId)) {
      return;
    }

    completeVideo(videoId);

    syncAskScrollContainment();
  } catch {
    // Intentionally silent: the feature should not interfere when YouTube
    // changes the UI or the panel does not respond. Keep retrying while the
    // current video's Ask panel remains closed.
  }
}

async function waitForSummarizeChip(
  videoId: string,
  token: number,
): Promise<void> {
  try {
    const chip = await waitFor(() => findSummarizeChip(), {
      timeout: SYNC_TIMEOUT_MS,
      interval: 100,
      errorCode: "SUMMARIZE_CHIP_NOT_FOUND",
      errorMessage: "Timed out waiting for summarize chip.",
    });

    if (!isContextValid(token, videoId)) {
      return;
    }

    clickElement(chip);
  } catch {
    // Intentionally silent: no enabled summarize chip appeared within timeout.
    // Leave Ask open without retrying.
  }
}

function syncAskScrollContainment(): void {
  const scrollContainer = findAskScrollContainer();

  if (!scrollContainer) {
    return;
  }

  if (
    scrollContainer.style.overscrollBehaviorY !== ASK_SCROLL_OVERSCROLL_BEHAVIOR
  ) {
    scrollContainer.style.overscrollBehaviorY = ASK_SCROLL_OVERSCROLL_BEHAVIOR;
  }
}

function findAskScrollContainer(): HTMLElement | null {
  return document.querySelector<HTMLElement>(ASK_SCROLL_CONTAINER_SELECTOR);
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
