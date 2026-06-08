import type { Feature, FeatureContext } from "@shared/types";
import {
  isDesktopSubscriptionsFeedPage,
  removeAllMostRelevantSections,
} from "@shared/youtube-dom";

let observer: MutationObserver | null = null;
let ensureQueued = false;

const subscriptionsMostRelevantRemovalFeature: Feature = {
  name: "subscriptions-most-relevant-removal",
  matchesPage(url: URL): boolean {
    return isDesktopSubscriptionsFeedPage(url);
  },

  activate(_context: FeatureContext): void {
    removeAllMostRelevantSections();
    observePage();
  },

  deactivate(): void {
    stopObserving();
  },
};

export default subscriptionsMostRelevantRemovalFeature;

function observePage(): void {
  if (observer) {
    return;
  }

  observer = new MutationObserver(() => {
    if (!ensureQueued) {
      ensureQueued = true;
      window.requestAnimationFrame(() => {
        ensureQueued = false;
        removeAllMostRelevantSections();
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
