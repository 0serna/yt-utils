import type { Feature, FeatureContext } from "@shared/types";
import {
  findMembershipShelves,
  isDesktopHomePage,
  removeAllMembershipSections,
} from "@shared/youtube-dom";

let observer: MutationObserver | null = null;
let ensureQueued = false;

const homeMembershipsRemovalFeature: Feature = {
  name: "home-memberships-removal",
  matchesPage(url: URL): boolean {
    return isDesktopHomePage(url);
  },

  activate(_context: FeatureContext): void {
    removeAllMembershipSections();
    observePage();
  },

  deactivate(): void {
    stopObserving();
  },
};

export default homeMembershipsRemovalFeature;

function observePage(): void {
  if (observer) {
    return;
  }

  observer = new MutationObserver(() => {
    if (findMembershipShelves().length > 0 && !ensureQueued) {
      ensureQueued = true;
      window.requestAnimationFrame(() => {
        ensureQueued = false;
        removeAllMembershipSections();
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
