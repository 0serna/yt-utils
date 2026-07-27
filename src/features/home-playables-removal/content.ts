import type { Feature, FeatureContext } from "@shared/types";
import {
  findPlayablesShelves,
  isDesktopHomePage,
  removeAllPlayablesSections,
} from "@shared/youtube-dom";

let observer: MutationObserver | null = null;
let ensureQueued = false;

const homePlayablesRemovalFeature: Feature = {
  name: "home-playables-removal",
  matchesPage(url: URL): boolean {
    return isDesktopHomePage(url);
  },

  activate(_context: FeatureContext): void {
    removeAllPlayablesSections();
    observePage();
  },

  deactivate(): void {
    stopObserving();
  },
};

export default homePlayablesRemovalFeature;

function observePage(): void {
  if (observer) {
    return;
  }

  observer = new MutationObserver(() => {
    if (findPlayablesShelves().length > 0 && !ensureQueued) {
      ensureQueued = true;
      window.requestAnimationFrame(() => {
        ensureQueued = false;
        removeAllPlayablesSections();
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
