import type { Feature, FeatureContext } from "@shared/types";
import { isVisible } from "@shared/youtube-dom";

const POLL_INTERVAL_MS = 500;
const PANEL_SELECTOR = "ytd-engagement-panel-section-list-renderer";
const EXPANDED_PANEL_VISIBILITY = "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED";
const CONTAINMENT_VALUE = "contain";
const MIN_SCROLL_CONTAINER_HEIGHT = 120;

let observer: MutationObserver | null = null;
let pollTimer: number | null = null;
let ensureQueued = false;
let syncInProgress = false;
let sessionToken = 0;

const engagementPanelScrollContainmentFeature: Feature = {
	name: "youtube-engagement-panel-scroll-containment",
	isWatchPage: true,

	activate(_context: FeatureContext): void {
		sessionToken += 1;
		startPolling();
		observePage();
		void queueSync(sessionToken);
	},

	deactivate(): void {
		sessionToken += 1;
		stopPolling();
		stopObserving();
	},
};

export default engagementPanelScrollContainmentFeature;

function isSupportedWatchPage(): boolean {
	return (
		window.location.hostname === "www.youtube.com" &&
		window.location.pathname === "/watch" &&
		new URLSearchParams(window.location.search).has("v")
	);
}

function startPolling(): void {
	if (pollTimer !== null) {
		return;
	}

	pollTimer = window.setInterval(() => {
		void queueSync(sessionToken);
	}, POLL_INTERVAL_MS);
}

function stopPolling(): void {
	if (pollTimer !== null) {
		window.clearInterval(pollTimer);
		pollTimer = null;
	}
}

function observePage(): void {
	if (observer) {
		return;
	}

	observer = new MutationObserver((mutations) => {
		const hasRelevantMutation = mutations.some((mutation) => {
			if (!(mutation.target instanceof Element)) {
				return false;
			}

			if (isInsideEngagementPanelSurface(mutation.target)) {
				return true;
			}

			return [...mutation.addedNodes, ...mutation.removedNodes].some((node) => {
				if (!(node instanceof Element)) {
					return false;
				}

				return isInsideEngagementPanelSurface(node);
			});
		});

		if (!hasRelevantMutation) {
			return;
		}

		queueEnsureSync();
	});

	observer.observe(document.documentElement, {
		attributes: true,
		childList: true,
		subtree: true,
		attributeFilter: ["visibility", "hidden", "aria-hidden", "class", "style"],
	});
}

function stopObserving(): void {
	if (observer) {
		observer.disconnect();
		observer = null;
	}
}

function queueEnsureSync(): void {
	if (ensureQueued) {
		return;
	}

	ensureQueued = true;

	window.requestAnimationFrame(() => {
		ensureQueued = false;
		void queueSync(sessionToken);
	});
}

async function queueSync(token: number): Promise<void> {
	if (token !== sessionToken || !isSupportedWatchPage()) {
		return;
	}

	if (syncInProgress) {
		return;
	}

	syncInProgress = true;
	try {
		await syncContainment(token);
	} finally {
		syncInProgress = false;
	}
}

async function syncContainment(token: number): Promise<void> {
	if (token !== sessionToken || !isSupportedWatchPage()) {
		return;
	}

	for (const panel of findExpandedEngagementPanels()) {
		const scrollContainer = findPrimaryScrollContainer(panel);
		if (!scrollContainer) {
			continue;
		}

		if (scrollContainer.style.overscrollBehaviorY !== CONTAINMENT_VALUE) {
			scrollContainer.style.overscrollBehaviorY = CONTAINMENT_VALUE;
		}
	}
}

function findExpandedEngagementPanels(): HTMLElement[] {
	return [...document.querySelectorAll<HTMLElement>(PANEL_SELECTOR)].filter(
		(panel) => isPanelExpanded(panel),
	);
}

function isPanelExpanded(panel: HTMLElement): boolean {
	const visibility = panel.getAttribute("visibility");

	if (visibility === EXPANDED_PANEL_VISIBILITY) {
		return true;
	}

	return isVisible(panel);
}

function findPrimaryScrollContainer(panel: HTMLElement): HTMLElement | null {
	const candidates = [...panel.querySelectorAll<HTMLElement>("*")]
		.filter((element) => isPrimaryScrollCandidate(element))
		.map((element) => ({
			element,
			score: scoreScrollCandidate(element),
		}))
		.sort((left, right) => right.score - left.score);

	return candidates[0]?.element ?? null;
}

function isPrimaryScrollCandidate(element: HTMLElement): boolean {
	if (!isVisible(element)) {
		return false;
	}

	if (
		element.tagName === "TEXTAREA" ||
		element.tagName === "INPUT" ||
		element.tagName === "SELECT"
	) {
		return false;
	}

	const style = window.getComputedStyle(element);
	if (style.overflowY !== "auto" && style.overflowY !== "scroll") {
		return false;
	}

	return element.clientHeight >= MIN_SCROLL_CONTAINER_HEIGHT;
}

function scoreScrollCandidate(element: HTMLElement): number {
	const style = window.getComputedStyle(element);
	const hasOverflow = element.scrollHeight > element.clientHeight + 4;
	const overflowBonus = hasOverflow ? 1_000_000 : 0;
	const areaScore = element.clientWidth * element.clientHeight;
	const scrollModeBonus = style.overflowY === "scroll" ? 10_000 : 0;

	return overflowBonus + scrollModeBonus + areaScore;
}

function isInsideEngagementPanelSurface(node: Node): boolean {
	if (!(node instanceof Element)) {
		return false;
	}

	return Boolean(
		node.closest(
			`${PANEL_SELECTOR}, ytd-watch-metadata, #actions-inner, #top-level-buttons-computed, ytd-menu-renderer`,
		),
	);
}
