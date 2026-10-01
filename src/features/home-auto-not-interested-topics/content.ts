import type { Feature, FeatureContext } from "@shared/types";
import {
  clickElement,
  findNotInterestedMenuItem,
  findRichItemCards,
  findRichItemMenuButton,
  isDesktopHomePage,
  waitFor,
} from "@shared/youtube-dom";
import { isBlockedCardText } from "./topics";
import { readCardKey } from "./video-id";

export const MAX_AUTO_ATTEMPTS = 3;
const ACTION_TIMEOUT_MS = 3000;

let observer: MutationObserver | null = null;
let ensureQueued = false;
let activeContext: FeatureContext | null = null;
let actionQueue: Promise<void> = Promise.resolve();
const completedKeys = new Set<string>();
const attemptCounts = new Map<string, number>();
const queuedKeys = new Set<string>();
const abortControllers = new Set<AbortController>();

const homeAutoNotInterestedTopicsFeature: Feature = {
  name: "home-auto-not-interested-topics",
  matchesPage(url: URL): boolean {
    return isDesktopHomePage(url);
  },

  activate(context: FeatureContext): void {
    activeContext = context;
    scanCards();
    observePage();
  },

  deactivate(): void {
    activeContext = null;
    stopObserving();
    cancelPendingActions();
  },
};

export default homeAutoNotInterestedTopicsFeature;

export function readCardFilterText(card: HTMLElement): string[] {
  const parts = [
    ...card.querySelectorAll<HTMLElement>(
      [
        "h3",
        "#video-title",
        "a#video-title-link",
        "ytd-channel-name",
        "yt-lockup-metadata-view-model",
        "a[href^='/@']",
      ].join(","),
    ),
  ]
    .map((element) => element.textContent ?? "")
    .filter((text) => text.trim().length > 0);

  if (parts.length === 0) {
    const fallback = card.textContent ?? "";
    if (fallback.trim().length > 0) {
      parts.push(fallback);
    }
  }

  return parts;
}

export function shouldAutoMarkCard(card: HTMLElement): boolean {
  return isBlockedCardText(readCardFilterText(card));
}

export function getAttemptCount(key: string): number {
  return attemptCounts.get(key) ?? 0;
}

function scanCards(): void {
  if (!isDesktopHomePage()) {
    return;
  }

  for (const card of findRichItemCards()) {
    const key = readCardKey(card);
    if (completedKeys.has(key) || queuedKeys.has(key)) {
      continue;
    }
    if (getAttemptCount(key) >= MAX_AUTO_ATTEMPTS) {
      continue;
    }
    if (!shouldAutoMarkCard(card)) {
      continue;
    }
    queuedKeys.add(key);
    queueNativeAction(key, card);
  }
}

function queueNativeAction(key: string, card: HTMLElement): void {
  const queuedAction = actionQueue.then(
    () => executeNativeAction(key, card),
    () => executeNativeAction(key, card),
  );
  actionQueue = queuedAction.catch(() => undefined);
}

async function executeNativeAction(
  key: string,
  card: HTMLElement,
): Promise<void> {
  const controller = new AbortController();
  abortControllers.add(controller);
  try {
    if (
      completedKeys.has(key) ||
      getAttemptCount(key) >= MAX_AUTO_ATTEMPTS ||
      !card.isConnected ||
      !isDesktopHomePage()
    ) {
      return;
    }

    const menuButton = findRichItemMenuButton(card);
    if (!menuButton) {
      recordAttempt(key, "The card menu button is unavailable.");
      return;
    }

    clickElement(menuButton);

    let menuItem: HTMLElement;
    try {
      menuItem = await waitFor(() => findNotInterestedMenuItem(), {
        timeout: ACTION_TIMEOUT_MS,
        errorCode: "NOT_INTERESTED_ACTION_UNAVAILABLE",
        errorMessage: "The native Not interested action did not appear.",
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      recordAttempt(key, error);
      return;
    }

    if (!card.isConnected || !isDesktopHomePage()) {
      return;
    }
    clickElement(menuItem);
    completedKeys.add(key);
  } finally {
    queuedKeys.delete(key);
    abortControllers.delete(controller);
  }
}

function recordAttempt(key: string, error: unknown): void {
  const nextCount = getAttemptCount(key) + 1;
  attemptCounts.set(key, nextCount);
  if (nextCount >= MAX_AUTO_ATTEMPTS) {
    activeContext?.logger.error(error, { phase: "runtime" });
  }
}

function observePage(): void {
  if (observer) {
    return;
  }

  observer = new MutationObserver(() => {
    if (!ensureQueued) {
      ensureQueued = true;
      window.requestAnimationFrame(() => {
        ensureQueued = false;
        scanCards();
      });
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

function stopObserving(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

function cancelPendingActions(): void {
  for (const controller of abortControllers) {
    controller.abort();
  }
  abortControllers.clear();
  queuedKeys.clear();
}
