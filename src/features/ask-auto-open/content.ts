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
const ASK_SCROLL_CONTAINER_SELECTOR =
  'ytd-engagement-panel-section-list-renderer[target-id="PAyouchat"] yt-section-list-renderer';
const POLL_INTERVAL_MS = 500;
const SYNC_TIMEOUT_MS = 5000;
const PANEL_SETTLE_DELAY_MS = 1500;
const ASK_LABELS = [/\bask\b/i, /\bpreguntar\b/i];
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
    hasRelevantSurfaceMutation(mutations, isInsideAskSurface),
  sync: syncAskPanel,
});

const askAutoOpenFeature: Feature = {
  name: "youtube-ask-auto-open",
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

export default askAutoOpenFeature;

function getCurrentVideoId(): string | null {
  return new URLSearchParams(window.location.search).get("v");
}

function findAskPanel(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `ytd-engagement-panel-section-list-renderer[target-id="${PANEL_TARGET_ID}"]`,
  );
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

function findAskButton(): HTMLElement | null {
  const entrypoint = document.querySelector<HTMLElement>(
    "button-view-model.you-chat-entrypoint-button button, yt-button-view-model button[aria-label='Ask'], yt-button-view-model button[aria-label='Preguntar']",
  );

  if (entrypoint && isVisible(entrypoint)) {
    return entrypoint;
  }

  return findButton(document, ASK_LABELS);
}

async function syncAskPanel(token: number): Promise<void> {
  const videoId = await validateSyncContext(token);
  if (!videoId) {
    return;
  }

  resetStaleState(videoId);

  if (completedVideoId === videoId) {
    return;
  }

  const panel = findAskPanel();
  if (!panel) {
    return;
  }

  syncAskScrollContainment();

  if (handlePanelState(videoId, panel)) {
    return;
  }

  await openAskPanel(videoId, token);
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

function handlePanelState(videoId: string, panel: HTMLElement): boolean {
  if (isAskPanelExpanded(panel)) {
    if (
      expandedVideoId !== videoId &&
      Date.now() - activatedAt < PANEL_SETTLE_DELAY_MS
    ) {
      return true;
    }

    expandedVideoId = videoId;
    completedVideoId = videoId;
    return true;
  }

  if (expandedVideoId === videoId) {
    completedVideoId = videoId;
    return true;
  }

  return false;
}

async function openAskPanel(videoId: string, token: number): Promise<void> {
  const askButton = findAskButton();
  if (!askButton) {
    return;
  }

  clickElement(askButton);

  try {
    const openedPanel = await waitFor(
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

    if (token !== sessionToken) {
      return;
    }

    expandedVideoId = videoId;
    completedVideoId = videoId;

    if (!isAskPanelExpanded(openedPanel)) {
      completedVideoId = null;
    }

    syncAskScrollContainment();
  } catch {
    // Intentionally silent: the feature should not interfere when YouTube
    // changes the UI or the panel does not respond. Keep retrying while the
    // current video's Ask panel remains closed.
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

function isInsideAskSurface(node: Node): boolean {
  if (!(node instanceof Element)) {
    return false;
  }

  return Boolean(
    node.closest(
      `ytd-watch-metadata, #actions-inner, #top-level-buttons-computed, ytd-menu-renderer, ytd-engagement-panel-section-list-renderer[target-id="${PANEL_TARGET_ID}"]`,
    ),
  );
}
