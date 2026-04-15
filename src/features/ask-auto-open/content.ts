import type { Feature, FeatureContext } from "@shared/types";
import {
	clickElement,
	findButton,
	isVisible,
	waitFor,
} from "@shared/youtube-dom";
import { readPlayerSnapshot } from "@shared/youtube-player";

const PANEL_TARGET_ID = "PAyouchat";
const ASK_SCROLL_CONTAINER_SELECTOR =
	'ytd-engagement-panel-section-list-renderer[target-id="PAyouchat"] yt-section-list-renderer';
const POLL_INTERVAL_MS = 500;
const SYNC_TIMEOUT_MS = 5000;
const PANEL_SETTLE_DELAY_MS = 1500;
const ASK_LABELS = [/\bask\b/i, /\bpreguntar\b/i];
const ASK_SCROLL_OVERSCROLL_BEHAVIOR = "contain";

let observer: MutationObserver | null = null;
let pollTimer: number | null = null;
let ensureQueued = false;
let syncInProgress = false;
let sessionToken = 0;
let completedVideoId: string | null = null;
let expandedVideoId: string | null = null;
let activatedAt = 0;

const askAutoOpenFeature: Feature = {
	name: "youtube-ask-auto-open",
	isWatchPage: true,

	activate(_context: FeatureContext): void {
		sessionToken += 1;
		activatedAt = Date.now();
		completedVideoId = null;
		expandedVideoId = null;
		observePage();
		startPolling();
		syncAskScrollContainment();
		void queueSync(sessionToken);
	},

	deactivate(): void {
		sessionToken += 1;
		activatedAt = 0;
		completedVideoId = null;
		expandedVideoId = null;
		stopPolling();
		stopObserving();
	},
};

export default askAutoOpenFeature;

function isSupportedDesktopWatchPage(): boolean {
	return (
		window.location.hostname === "www.youtube.com" &&
		window.location.pathname === "/watch" &&
		new URLSearchParams(window.location.search).has("v")
	);
}

function getCurrentVideoId(): string | null {
	return new URLSearchParams(window.location.search).get("v");
}

function findAskPanel(): HTMLElement | null {
	return document.querySelector<HTMLElement>(
		`ytd-engagement-panel-section-list-renderer[target-id="${PANEL_TARGET_ID}"]`,
	);
}

function getPanelVisibility(panel: HTMLElement): string | null {
	return panel.getAttribute("visibility");
}

function isAskPanelExpanded(panel: HTMLElement): boolean {
	const visibility = getPanelVisibility(panel);

	if (visibility === "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED") {
		return true;
	}

	if (visibility === "ENGAGEMENT_PANEL_VISIBILITY_HIDDEN") {
		return false;
	}

	return isVisible(panel);
}

function findAskButton(): HTMLElement | null {
	const entrypoint = document.querySelector<HTMLElement>(
		"button-view-model.you-chat-entrypoint-button button, yt-button-view-model button[aria-label='Ask'], yt-button-view-model button[aria-label='Preguntar']",
	);

	if (entrypoint && isVisible(entrypoint)) {
		return entrypoint;
	}

	return findButton(document, ASK_LABELS);
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

			if (isInsideAskSurface(mutation.target)) {
				return true;
			}

			return [...mutation.addedNodes, ...mutation.removedNodes].some((node) => {
				if (!(node instanceof Element)) {
					return false;
				}

				return isInsideAskSurface(node);
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
	if (syncInProgress) {
		return;
	}

	syncInProgress = true;
	try {
		await syncAskPanel(token);
	} finally {
		syncInProgress = false;
	}
}

async function syncAskPanel(token: number): Promise<void> {
	if (token !== sessionToken || !isSupportedDesktopWatchPage()) {
		return;
	}

	const videoId = getCurrentVideoId();
	if (!videoId) {
		return;
	}

	const snapshot = await readPlayerSnapshot();
	if (
		token !== sessionToken ||
		!snapshot?.videoId ||
		snapshot.videoId !== videoId
	) {
		return;
	}

	if (completedVideoId && completedVideoId !== videoId) {
		completedVideoId = null;
	}

	if (expandedVideoId && expandedVideoId !== videoId) {
		expandedVideoId = null;
	}

	if (completedVideoId === videoId) {
		return;
	}

	const panel = findAskPanel();
	if (!panel) {
		return;
	}

	syncAskScrollContainment();

	if (isAskPanelExpanded(panel)) {
		if (
			expandedVideoId !== videoId &&
			Date.now() - activatedAt < PANEL_SETTLE_DELAY_MS
		) {
			return;
		}

		expandedVideoId = videoId;
		completedVideoId = videoId;
		return;
	}

	if (expandedVideoId === videoId) {
		completedVideoId = videoId;
		return;
	}

	const askButton = findAskButton();
	if (!askButton) {
		return;
	}

	clickElement(askButton);

	try {
		const openedPanel = await waitFor(
			() => {
				const currentPanel = findAskPanel();
				return currentPanel && isAskPanelExpanded(currentPanel)
					? currentPanel
					: null;
			},
			{
				timeout: SYNC_TIMEOUT_MS,
				interval: 100,
				errorCode: "ASK_PANEL_NOT_OPENED",
				errorMessage: "Timed out waiting for the Ask panel to open.",
			},
		);

		if (token !== sessionToken) {
			return;
		}

		expandedVideoId = videoId;
		completedVideoId = videoId;

		if (!isAskPanelExpanded(openedPanel)) {
			completedVideoId = null;
		}

		syncAskScrollContainment();
	} catch {
		// Intentionally silent: the feature should not interfere when YouTube
		// changes the UI or the panel does not respond. Keep retrying while the
		// current video's Ask panel remains closed.
	}
}

function syncAskScrollContainment(): void {
	const scrollContainer = findAskScrollContainer();

	if (!scrollContainer) {
		return;
	}

	if (
		scrollContainer.style.overscrollBehaviorY !== ASK_SCROLL_OVERSCROLL_BEHAVIOR
	) {
		scrollContainer.style.overscrollBehaviorY = ASK_SCROLL_OVERSCROLL_BEHAVIOR;
	}
}

function findAskScrollContainer(): HTMLElement | null {
	return document.querySelector<HTMLElement>(ASK_SCROLL_CONTAINER_SELECTOR);
}

function isInsideAskSurface(node: Node): boolean {
	if (!(node instanceof Element)) {
		return false;
	}

	return Boolean(
		node.closest(
			`ytd-watch-metadata, #actions-inner, #top-level-buttons-computed, ytd-menu-renderer, ytd-engagement-panel-section-list-renderer[target-id="${PANEL_TARGET_ID}"]`,
		),
	);
}
