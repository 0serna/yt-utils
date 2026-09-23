import type { Feature, FeatureContext } from "@shared/types";
import { findRichItemCards, isDesktopHomePage } from "@shared/youtube-dom";
import { isBlockedCardText } from "./keywords";

const HIDDEN_ATTRIBUTE = "data-yt-utils-home-keyword-filter-hidden";
const HIDDEN_DISPLAY = "none";

let observer: MutationObserver | null = null;
let ensureQueued = false;

const homeKeywordFilterFeature: Feature = {
  name: "home-keyword-filter",
  matchesPage(url: URL): boolean {
    return isDesktopHomePage(url);
  },

  activate(_context: FeatureContext): void {
    applyFilter();
    observePage();
  },

  deactivate(): void {
    stopObserving();
    restoreHiddenCards();
  },
};

export default homeKeywordFilterFeature;

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
  for (const card of findRichItemCards()) {
    if (shouldHideCard(card)) {
      hideCard(card);
    }
  }
}

function hideCard(card: HTMLElement): void {
  if (card.getAttribute(HIDDEN_ATTRIBUTE) === "true") {
    return;
  }

  card.setAttribute(HIDDEN_ATTRIBUTE, "true");
  card.dataset.ytUtilsHomeKeywordFilterDisplay = card.style.display;
  card.style.display = HIDDEN_DISPLAY;
}

function restoreHiddenCards(): void {
  for (const card of document.querySelectorAll<HTMLElement>(
    `ytd-rich-item-renderer[${HIDDEN_ATTRIBUTE}="true"]`,
  )) {
    card.style.display = card.dataset.ytUtilsHomeKeywordFilterDisplay ?? "";
    delete card.dataset.ytUtilsHomeKeywordFilterDisplay;
    card.removeAttribute(HIDDEN_ATTRIBUTE);
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
