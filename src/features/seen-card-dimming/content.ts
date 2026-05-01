import type { Feature, FeatureContext } from "@shared/types";
import {
  findSubscriptionsFeedCards,
  isDesktopSubscriptionsFeedPage,
} from "@shared/youtube-dom";

const PROGRESS_SEGMENT_CLASS =
  "ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment";

let observer: MutationObserver | null = null;
let ensureQueued = false;

const seenCardDimmingFeature: Feature = {
  name: "seen-card-dimming",
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

export default seenCardDimmingFeature;

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
  const cardLockup = card.querySelector<HTMLElement>("yt-lockup-view-model");
  if (shouldDimCard(card, cardLockup)) {
    applyDimming(cardLockup);
  }
}

function shouldDimCard(
  card: HTMLElement,
  lockup: HTMLElement | null,
): lockup is HTMLElement {
  return (
    !isShortsCard(card) &&
    !!lockup &&
    lockup.style.opacity === "" &&
    isSeenVideo(card)
  );
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
    if (hasRelevantSeenMutation(mutations)) {
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

function hasRelevantSeenMutation(mutations: MutationRecord[]): boolean {
  return (
    !ensureQueued &&
    mutations.some((mutation) =>
      mutation.type === "attributes"
        ? isRelevantAttributeMutation(mutation)
        : isRelevantChildListMutation(mutation),
    )
  );
}

function isRelevantAttributeMutation(mutation: MutationRecord): boolean {
  const target = mutation.target;
  if (!(target instanceof Element)) {
    return false;
  }

  return (
    target.classList.contains(PROGRESS_SEGMENT_CLASS) ||
    !!target.closest("ytd-rich-item-renderer")
  );
}

function isRelevantChildListMutation(mutation: MutationRecord): boolean {
  return [...mutation.addedNodes].some(isSeenOverlayMutationNode);
}

function isSeenOverlayMutationNode(node: Node): boolean {
  return node instanceof Element && hasSeenOverlayMatch(node);
}

function hasSeenOverlayMatch(node: Element): boolean {
  return (
    isRichItemRenderer(node) ||
    hasChildRichItemRenderer(node) ||
    hasProgressSegmentClass(node)
  );
}

function isRichItemRenderer(node: Element): boolean {
  return !!node.matches?.("ytd-rich-item-renderer");
}

function hasChildRichItemRenderer(node: Element): boolean {
  return !!node.querySelector?.("ytd-rich-item-renderer");
}

function hasProgressSegmentClass(node: Element): boolean {
  return (
    node.classList?.contains(PROGRESS_SEGMENT_CLASS) ||
    !!node.querySelector?.(`.${PROGRESS_SEGMENT_CLASS}`)
  );
}

function stopObserving(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}
