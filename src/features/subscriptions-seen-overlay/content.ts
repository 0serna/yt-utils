import type { Feature, FeatureContext } from "@shared/types";
import {
  findSubscriptionsFeedCards,
  isDesktopSubscriptionsFeedPage,
} from "@shared/youtube-dom";

const PROGRESS_SEGMENT_CLASS =
  "ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment";

let observer: MutationObserver | null = null;
let ensureQueued = false;

const subscriptionsSeenOverlayFeature: Feature = {
  name: "subscriptions-seen-overlay",
  matchesPage(url: URL): boolean {
    return isDesktopSubscriptionsFeedPage(url);
  },

  activate(_context: FeatureContext): void {
    ensureDimming();
    observePage();
  },

  deactivate(): void {
    removeAllDimming();
    stopObserving();
  },
};

export default subscriptionsSeenOverlayFeature;

function ensureDimming(): void {
  if (!isDesktopSubscriptionsFeedPage()) {
    return;
  }

  const cards = findSubscriptionsFeedCards();
  for (const card of cards) {
    ensureDimmingForCard(card);
  }
}

function ensureDimmingForCard(card: HTMLElement): void {
  if (isShortsCard(card)) {
    return;
  }

  const cardLockup = card.querySelector<HTMLElement>("yt-lockup-view-model");
  if (!cardLockup) {
    return;
  }

  if (cardLockup.style.opacity !== "") {
    return;
  }

  if (!isSeenVideo(card)) {
    return;
  }

  applyDimming(cardLockup);
}

function isShortsCard(card: HTMLElement): boolean {
  return (
    card.tagName === "YTD-REEL-ITEM-RENDERER" ||
    Boolean(card.querySelector("ytd-reel-item-renderer")) ||
    Boolean(card.querySelector('[class*="shorts"]'))
  );
}

function isSeenVideo(card: HTMLElement): boolean {
  const segments = card.querySelectorAll<HTMLElement>(
    `.${PROGRESS_SEGMENT_CLASS}`,
  );

  return Array.from(segments).some((segment) => {
    const style = segment.getAttribute("style");
    if (!style) {
      return false;
    }

    const match = style.match(/(?:^|;)\s*width:\s*(\d+)/);
    if (!match?.[1]) {
      return false;
    }

    return parseInt(match[1], 10) >= 80;
  });
}

function applyDimming(cardLockup: HTMLElement): void {
  Object.assign(cardLockup.style, { opacity: "0.4" });
}

function removeAllDimming(): void {
  for (const cardLockup of document.querySelectorAll<HTMLElement>(
    "yt-lockup-view-model",
  )) {
    if (cardLockup.style.opacity !== "") {
      cardLockup.style.opacity = "";
    }
  }
}

function observePage(): void {
  if (observer) {
    return;
  }

  observer = new MutationObserver((mutations) => {
    const hasRelevantMutation = mutations.some((mutation) => {
      if (mutation.type === "attributes") {
        const target = mutation.target;
        if (!(target instanceof Element)) {
          return false;
        }

        return (
          target.classList.contains(PROGRESS_SEGMENT_CLASS) ||
          !!target.closest("ytd-rich-item-renderer")
        );
      }

      return [...mutation.addedNodes].some((node) => {
        if (!(node instanceof Element)) {
          return false;
        }

        return !!(
          node.matches?.("ytd-rich-item-renderer") ||
          node.querySelector?.("ytd-rich-item-renderer") ||
          node.classList?.contains(PROGRESS_SEGMENT_CLASS) ||
          node.querySelector?.(`.${PROGRESS_SEGMENT_CLASS}`)
        );
      });
    });

    if (hasRelevantMutation && !ensureQueued) {
      ensureQueued = true;
      window.requestAnimationFrame(() => {
        ensureQueued = false;
        ensureDimming();
      });
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style"],
  });
}

function stopObserving(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}
