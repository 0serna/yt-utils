import { getBootstrapIconMarkup } from "@shared/bootstrap-icons";
import { applyExtensionButtonStyles } from "@shared/extension-button";
import {
	formatPlaybackSpeed,
	normalizePlaybackSpeed,
	PLAYBACK_SPEED_DEFAULT,
	PLAYBACK_SPEED_MAX,
	PLAYBACK_SPEED_MIN,
	PLAYBACK_SPEED_STEP,
} from "@shared/playback-speed";
import type { Feature, FeatureContext } from "@shared/types";
import {
	findWatchPageActionsContainer,
	getElementLabel,
	isDesktopWatchPage,
	RELEVANT_MUTATION_SELECTORS,
} from "@shared/youtube-dom";
import {
	isEnglishLanguage,
	isSpanishLanguage,
	readPlayerSnapshot,
} from "@shared/youtube-player";

const CONTROL_HOST_ID = "yt-utils-speed-host";
const SPEED_DECREMENT_ID = "yt-utils-speed-decrement";
const SPEED_VALUE_ID = "yt-utils-speed-value";
const SPEED_INCREMENT_ID = "yt-utils-speed-increment";
const MARK_AS_SEEN_HOST_ID = "yt-utils-inline-host";

let localSpeed: number = PLAYBACK_SPEED_DEFAULT;
let observer: MutationObserver | null = null;
let ensureQueued = false;
let userInteracted: boolean = false;
let pollTimer: number | null = null;
let sessionToken = 0;
let syncQueued = false;

const playbackSpeedFeature: Feature = {
	name: "playback-speed",
	isWatchPage: true,

	activate(_context: FeatureContext): void {
		sessionToken += 1;
		localSpeed = PLAYBACK_SPEED_DEFAULT;
		userInteracted = false;
		ensureSpeedControl();
		applySpeedToVideo();
		observePage();
		startPolling();
		void queueSync(sessionToken);
	},

	deactivate(): void {
		sessionToken += 1;
		removeSpeedControl();
		stopPolling();
		stopObserving();
	},
};

export default playbackSpeedFeature;

function isSupportedDesktopWatchPage(): boolean {
	return isDesktopWatchPage();
}

function ensureSpeedControl(): void {
	if (!isSupportedDesktopWatchPage()) {
		removeSpeedControl();
		return;
	}

	const actionsContainer = findWatchPageActionsContainer();
	if (!actionsContainer) {
		return;
	}

	let host = document.getElementById(CONTROL_HOST_ID);
	if (!host) {
		host = createSpeedControlHost();
	}

	const markAsSeenHost = document.getElementById(MARK_AS_SEEN_HOST_ID);
	if (markAsSeenHost && markAsSeenHost.parentElement === actionsContainer) {
		if (markAsSeenHost.previousSibling !== host) {
			markAsSeenHost.insertAdjacentElement("beforebegin", host);
		}
	} else {
		const insertionTarget = findInsertionTarget(actionsContainer);
		if (insertionTarget) {
			if (insertionTarget.previousSibling !== host) {
				insertionTarget.insertAdjacentElement("beforebegin", host);
			}
		} else if (host.parentElement !== actionsContainer) {
			actionsContainer.prepend(host);
		}
	}

	syncControlState();
}

function removeSpeedControl(): void {
	const host = document.getElementById(CONTROL_HOST_ID);
	if (host) {
		host.remove();
	}
}

function findInsertionTarget(
	actionsContainer: HTMLElement,
): HTMLElement | null {
	const candidates = [...actionsContainer.children].filter(
		(child) =>
			child.id !== CONTROL_HOST_ID && child.id !== MARK_AS_SEEN_HOST_ID,
	) as HTMLElement[];

	return (
		candidates.find((child) => {
			const label = getElementLabel(child);
			return (
				/like this video/i.test(label) ||
				child.tagName === "SEGMENTED-LIKE-DISLIKE-BUTTON-VIEW-MODEL"
			);
		}) ||
		candidates[0] ||
		null
	);
}

function createSpeedControlHost(): HTMLElement {
	const host = document.createElement("div");
	host.id = CONTROL_HOST_ID;
	host.style.display = "inline-flex";
	host.style.alignItems = "center";
	host.style.gap = "0px";
	host.style.marginInlineEnd = "8px";
	host.style.flex = "0 0 auto";
	host.style.pointerEvents = "auto";

	const decrementBtn = document.createElement("button");
	decrementBtn.id = SPEED_DECREMENT_ID;
	decrementBtn.type = "button";
	decrementBtn.setAttribute("aria-label", "Decrease playback speed");
	decrementBtn.title = "Decrease playback speed";
	decrementBtn.innerHTML = getBootstrapIconMarkup("dash");
	applyExtensionButtonStyles(decrementBtn);
	decrementBtn.onclick = onDecrement;

	const valueDisplay = document.createElement("span");
	valueDisplay.id = SPEED_VALUE_ID;
	valueDisplay.style.padding = "0 4px";
	valueDisplay.style.fontSize = "12px";
	valueDisplay.style.fontWeight = "600";
	valueDisplay.style.fontVariantNumeric = "tabular-nums";
	valueDisplay.style.color = "var(--yt-spec-text-primary, #f1f1f1)";
	valueDisplay.style.userSelect = "none";
	valueDisplay.style.whiteSpace = "nowrap";
	valueDisplay.style.minWidth = "32px";
	valueDisplay.style.textAlign = "center";
	valueDisplay.textContent = formatPlaybackSpeed(PLAYBACK_SPEED_DEFAULT);

	const incrementBtn = document.createElement("button");
	incrementBtn.id = SPEED_INCREMENT_ID;
	incrementBtn.type = "button";
	incrementBtn.setAttribute("aria-label", "Increase playback speed");
	incrementBtn.title = "Increase playback speed";
	incrementBtn.innerHTML = getBootstrapIconMarkup("plus");
	applyExtensionButtonStyles(incrementBtn);
	incrementBtn.onclick = onIncrement;

	host.append(decrementBtn, valueDisplay, incrementBtn);
	return host;
}

function syncControlState(): void {
	const decrementBtn = document.getElementById(
		SPEED_DECREMENT_ID,
	) as HTMLButtonElement | null;
	const incrementBtn = document.getElementById(
		SPEED_INCREMENT_ID,
	) as HTMLButtonElement | null;
	const valueDisplay = document.getElementById(SPEED_VALUE_ID);

	if (decrementBtn) {
		decrementBtn.disabled = localSpeed <= PLAYBACK_SPEED_MIN;
		decrementBtn.style.opacity = decrementBtn.disabled ? "0.4" : "1";
		decrementBtn.style.cursor = decrementBtn.disabled ? "default" : "pointer";
	}

	if (incrementBtn) {
		incrementBtn.disabled = localSpeed >= PLAYBACK_SPEED_MAX;
		incrementBtn.style.opacity = incrementBtn.disabled ? "0.4" : "1";
		incrementBtn.style.cursor = incrementBtn.disabled ? "default" : "pointer";
	}

	if (valueDisplay) {
		valueDisplay.textContent = formatPlaybackSpeed(localSpeed);
	}
}

function startPolling(): void {
	if (pollTimer !== null) {
		return;
	}

	pollTimer = window.setInterval(() => {
		void queueSync(sessionToken);
	}, 500);
}

function stopPolling(): void {
	if (pollTimer !== null) {
		window.clearInterval(pollTimer);
		pollTimer = null;
	}
}

function applySpeedToVideo(): void {
	const video = document.querySelector<HTMLVideoElement>("video");
	if (video) {
		video.playbackRate = localSpeed;
	}
}

function onDecrement(event: Event): void {
	event.preventDefault();
	event.stopPropagation();
	userInteracted = true;
	localSpeed = normalizePlaybackSpeed(localSpeed - PLAYBACK_SPEED_STEP);
	syncControlState();
	applySpeedToVideo();
}

function onIncrement(event: Event): void {
	event.preventDefault();
	event.stopPropagation();
	userInteracted = true;
	localSpeed = normalizePlaybackSpeed(localSpeed + PLAYBACK_SPEED_STEP);
	syncControlState();
	applySpeedToVideo();
}

function observePage(): void {
	if (observer) {
		return;
	}

	observer = new MutationObserver((mutations) => {
		const hasRelevantMutation = mutations.some((mutation) => {
			if (isInsideSpeedControl(mutation.target)) {
				return false;
			}

			return [...mutation.addedNodes, ...mutation.removedNodes].some((node) => {
				if (!(node instanceof Element)) {
					return false;
				}

				if (
					node.id === CONTROL_HOST_ID ||
					node.querySelector?.(`#${CONTROL_HOST_ID}`)
				) {
					return false;
				}

				return (
					node.matches?.(RELEVANT_MUTATION_SELECTORS) ||
					node.querySelector?.(RELEVANT_MUTATION_SELECTORS)
				);
			});
		});

		if (!hasRelevantMutation) {
			return;
		}

		queueEnsureSpeedControl();
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

function queueEnsureSpeedControl(): void {
	if (ensureQueued) {
		return;
	}

	ensureQueued = true;

	window.requestAnimationFrame(() => {
		ensureQueued = false;
		ensureSpeedControl();
		applySpeedToVideo();
	});
}

async function queueSync(token: number): Promise<void> {
	if (syncQueued) {
		return;
	}

	syncQueued = true;
	try {
		await syncSpeedForCurrentVideo(token);
	} finally {
		syncQueued = false;
	}
}

async function syncSpeedForCurrentVideo(token: number): Promise<void> {
	if (token !== sessionToken || userInteracted) {
		return;
	}

	const snapshot = await readPlayerSnapshot();
	if (token !== sessionToken || userInteracted || !snapshot) {
		return;
	}

	const nextSpeed = isSpanishLanguage(snapshot.audioLanguage)
		? normalizePlaybackSpeed(1.1)
		: isEnglishLanguage(snapshot.audioLanguage)
			? normalizePlaybackSpeed(1.0)
			: PLAYBACK_SPEED_DEFAULT;

	if (localSpeed === nextSpeed) {
		return;
	}

	localSpeed = nextSpeed;
	syncControlState();
	applySpeedToVideo();
}

function isInsideSpeedControl(node: Node): boolean {
	return (
		node instanceof Element && Boolean(node.closest(`#${CONTROL_HOST_ID}`))
	);
}
