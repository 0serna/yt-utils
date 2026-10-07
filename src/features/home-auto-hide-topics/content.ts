import type { Feature } from "@shared/types";
import { findRichItemCards, isDesktopHomePage } from "@shared/youtube-dom";
import { isBlockedCardText } from "./topics";

const HIDDEN_ATTRIBUTE = "data-yt-utils-home-auto-hide-topics-hidden";
const HIDDEN_DISPLAY = "none";

let observer: MutationObserver | null = null;
let ensureQueued = false;
const previousDisplays = new WeakMap<HTMLElement, string>();

const homeAutoHideTopicsFeature: Feature = {
  name: "home-auto-hide-topics",
  matchesPage(url: URL): boolean {
    return isDesktopHomePage(url);
  },

  activate(): void {
    applyFilter();
    observePage();
  },

  deactivate(): void {
    stopObserving();
  },
};

export default homeAutoHideTopicsFeature;

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

export function shouldHideCard(card: HTMLElement): boolean {
  return isBlockedCardText(readCardFilterText(card));
}

function applyFilter(): void {
  if (!isDesktopHomePage()) {
    return;
  }

  for (const card of findRichItemCards()) {
    updateCard(card);
  }
}

function updateCard(card: HTMLElement): void {
  if (shouldHideCard(card)) {
    hideCard(card);
    return;
  }

  restoreCard(card);
}

function hideCard(card: HTMLElement): void {
  if (card.getAttribute(HIDDEN_ATTRIBUTE) === "true") {
    return;
  }

  previousDisplays.set(card, card.style.display);
  card.setAttribute(HIDDEN_ATTRIBUTE, "true");
  card.style.display = HIDDEN_DISPLAY;
}

function restoreCard(card: HTMLElement): void {
  if (card.getAttribute(HIDDEN_ATTRIBUTE) !== "true") {
    return;
  }

  card.style.display = previousDisplays.get(card) ?? "";
  previousDisplays.delete(card);
  card.removeAttribute(HIDDEN_ATTRIBUTE);
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
        applyFilter();
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
