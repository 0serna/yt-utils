import type { Feature, FeatureContext } from "@shared/types";
import {
	findShortsShelf,
	isDesktopSubscriptionsFeedPage,
	removeShortsSection,
} from "@shared/youtube-dom";

let observer: MutationObserver | null = null;
let ensureQueued = false;

const subscriptionsShortsRemovalFeature: Feature = {
	name: "subscriptions-shorts-removal",
	matchesPage(url: URL): boolean {
		return isDesktopSubscriptionsFeedPage(url);
	},

	activate(_context: FeatureContext): void {
		removeShortsSection();
		observePage();
	},

	deactivate(): void {
		stopObserving();
	},
};

export default subscriptionsShortsRemovalFeature;

function observePage(): void {
	if (observer) {
		return;
	}

	observer = new MutationObserver(() => {
		if (findShortsShelf() && !ensureQueued) {
			ensureQueued = true;
			window.requestAnimationFrame(() => {
				ensureQueued = false;
				removeShortsSection();
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
