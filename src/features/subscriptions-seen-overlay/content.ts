import type { Feature, FeatureContext } from "@shared/types";
import {
	findSubscriptionsFeedCards,
	isDesktopSubscriptionsFeedPage,
} from "@shared/youtube-dom";

const OVERLAY_CLASS = "yt-utils-seen-overlay";

let observer: MutationObserver | null = null;
let ensureQueued = false;

const subscriptionsSeenOverlayFeature: Feature = {
	name: "subscriptions-seen-overlay",
	matchesPage(url: URL): boolean {
		return isDesktopSubscriptionsFeedPage(url);
	},

	activate(_context: FeatureContext): void {
		ensureOverlays();
		observePage();
	},

	deactivate(): void {
		removeAllOverlays();
		stopObserving();
	},
};

export default subscriptionsSeenOverlayFeature;

function ensureOverlays(): void {
	if (!isDesktopSubscriptionsFeedPage()) {
		return;
	}

	const cards = findSubscriptionsFeedCards();
	for (const card of cards) {
		ensureOverlay(card);
	}
}

function ensureOverlay(card: HTMLElement): void {
	if (isShortsCard(card)) {
		return;
	}

	const thumbnail = findThumbnailViewModel(card);
	if (!thumbnail) {
		return;
	}

	if (thumbnail.querySelector(`.${OVERLAY_CLASS}`)) {
		return;
	}

	if (!isSeenVideo(card)) {
		return;
	}

	injectOverlay(thumbnail);
}

function findThumbnailViewModel(card: HTMLElement): HTMLElement | null {
	return card.querySelector<HTMLElement>("yt-thumbnail-view-model");
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
		".ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment",
	);

	for (const segment of segments) {
		const style = segment.getAttribute("style");
		if (!style) {
			continue;
		}

		const match = style.match(/(?:^|;)\s*width:\s*(\d+)/);
		if (!match?.[1]) {
			continue;
		}

		const width = parseInt(match[1], 10);
		if (width >= 80) {
			return true;
		}
	}

	return false;
}

function injectOverlay(thumbnail: HTMLElement): void {
	const imageContainer = thumbnail.querySelector(".ytThumbnailViewModelImage");
	if (!imageContainer) {
		return;
	}

	const overlay = document.createElement("div");
	overlay.className = OVERLAY_CLASS;
	Object.assign(overlay.style, {
		position: "absolute",
		top: "0",
		left: "0",
		width: "100%",
		height: "100%",
		background: "rgba(0, 0, 0, 0.6)",
		pointerEvents: "none",
		zIndex: "1",
	});

	imageContainer.insertAdjacentElement("afterend", overlay);
}

function removeAllOverlays(): void {
	for (const overlay of document.querySelectorAll<HTMLElement>(
		`.${OVERLAY_CLASS}`,
	)) {
		overlay.remove();
	}
}

function observePage(): void {
	if (observer) {
		return;
	}

	observer = new MutationObserver((mutations) => {
		const hasRelevantMutation = mutations.some((mutation) => {
			return [...mutation.addedNodes].some((node) => {
				if (!(node instanceof Element)) {
					return false;
				}

				if (node.matches?.(`.${OVERLAY_CLASS}`)) {
					return false;
				}

				if (
					node.matches?.("ytd-rich-item-renderer") ||
					node.querySelector?.("ytd-rich-item-renderer")
				) {
					return true;
				}

				return false;
			});
		});

		if (hasRelevantMutation && !ensureQueued) {
			ensureQueued = true;
			window.requestAnimationFrame(() => {
				ensureQueued = false;
				ensureOverlays();
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
