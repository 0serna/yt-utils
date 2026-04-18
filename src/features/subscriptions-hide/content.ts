import { getBootstrapIconMarkup } from "@shared/bootstrap-icons";
import { applyExtensionButtonStyles } from "@shared/extension-button";
import type { Feature, FeatureContext } from "@shared/types";
import {
	clickElement,
	findSubscriptionsCardMenuButton,
	findSubscriptionsCardOverlayActionsHost,
	findSubscriptionsFeedCards,
	findSubscriptionsHideMenuItem,
	isDesktopSubscriptionsFeedPage,
	waitFor,
} from "@shared/youtube-dom";

const BUTTON_HOST_ID_PREFIX = "yt-utils-subscriptions-hide-host-";
const BUTTON_ID_PREFIX = "yt-utils-subscriptions-hide-button-";
const CARD_KEY_ATTRIBUTE = "ytUtilsSubscriptionsHideKey";
const HIDE_ACTION_TIMEOUT_MS = 3000;

let observer: MutationObserver | null = null;
let ensureQueued = false;
let nextCardKey = 0;
const pendingCardKeys = new Set<string>();

const subscriptionsHideFeature: Feature = {
	name: "youtube-subscriptions-feed-controls",
	matchesPage(url: URL): boolean {
		return isDesktopSubscriptionsFeedPage(url);
	},

	activate(_context: FeatureContext): void {
		ensureHideButtons();
		observePage();
	},

	deactivate(): void {
		pendingCardKeys.clear();
		removeHideButtons();
		stopObserving();
	},
};

export default subscriptionsHideFeature;

function ensureHideButtons(): void {
	if (!isDesktopSubscriptionsFeedPage()) {
		removeHideButtons();
		return;
	}

	for (const card of findSubscriptionsFeedCards()) {
		ensureHideButton(card);
	}
}

function ensureHideButton(card: HTMLElement): void {
	const overlayActionsHost = findSubscriptionsCardOverlayActionsHost(card);
	const menuButton = findSubscriptionsCardMenuButton(card);

	if (!overlayActionsHost || !menuButton) {
		removeHideButton(card);
		return;
	}

	const cardKey = getCardKey(card);
	const hostId = getHostId(cardKey);
	const buttonId = getButtonId(cardKey);
	let host = document.getElementById(hostId);

	if (!host) {
		host = createHideButtonHost(cardKey, buttonId);
	}

	if (host.parentElement !== overlayActionsHost) {
		overlayActionsHost.append(host);
	}

	syncHideButtonState(cardKey);
}

function createHideButtonHost(cardKey: string, buttonId: string): HTMLElement {
	const host = document.createElement("div");
	host.id = getHostId(cardKey);
	host.className = "ytThumbnailHoverOverlayToggleActionsViewModelButton";
	host.style.display = "flex";
	host.style.alignItems = "center";
	host.style.justifyContent = "center";
	host.style.pointerEvents = "auto";

	const button = document.createElement("button");
	button.id = buttonId;
	button.type = "button";
	button.setAttribute("aria-label", "Hide");
	button.title = "Hide";
	button.innerHTML = getBootstrapIconMarkup("x");
	button.onclick = (event) => {
		void onHideButtonClick(cardKey, event);
	};
	styleHideButton(button);

	host.append(button);
	return host;
}

function styleHideButton(button: HTMLButtonElement): void {
	applyExtensionButtonStyles(button, {
		background: "rgba(15, 15, 15, 0.72)",
		hoverBackground: "rgba(15, 15, 15, 0.88)",
		activeBackground: "rgba(15, 15, 15, 0.94)",
		color: "#fff",
		position: "relative",
		zIndex: "1",
	});
	button.style.width = "32px";
	button.style.height = "32px";
	button.style.borderRadius = "16px";
	button.style.boxShadow = "0 1px 4px rgba(0, 0, 0, 0.35)";
	button.style.backdropFilter = "blur(12px)";
	button.style.setProperty("-webkit-backdrop-filter", "blur(12px)");
	button.style.margin = "0";
	button.style.padding = "0";
	button.style.pointerEvents = "auto";
	button.style.touchAction = "manipulation";
}

function syncHideButtonState(cardKey: string): void {
	const button = document.getElementById(
		getButtonId(cardKey),
	) as HTMLButtonElement | null;

	if (!button) {
		return;
	}

	const pending = pendingCardKeys.has(cardKey);
	button.disabled = pending;
	button.style.opacity = pending ? "0.65" : "1";
	button.style.cursor = pending ? "default" : "pointer";
	button.setAttribute("aria-label", pending ? "Hiding..." : "Hide");
	button.title = pending ? "Hiding..." : "Hide";
}

async function onHideButtonClick(cardKey: string, event: Event): Promise<void> {
	event.preventDefault();
	event.stopPropagation();

	if (pendingCardKeys.has(cardKey)) {
		return;
	}

	const card = getCardByKey(cardKey);
	if (!card) {
		return;
	}

	pendingCardKeys.add(cardKey);
	syncHideButtonState(cardKey);

	try {
		const menuButton = findSubscriptionsCardMenuButton(card);
		if (!menuButton) {
			throw new Error("The card menu button is unavailable.");
		}

		clickElement(menuButton);

		const hideMenuItem = await waitFor(() => findSubscriptionsHideMenuItem(), {
			timeout: HIDE_ACTION_TIMEOUT_MS,
			errorCode: "HIDE_ACTION_UNAVAILABLE",
			errorMessage: "The native Hide action did not appear.",
		});

		clickElement(hideMenuItem);
	} catch (error) {
		console.error("[YTUtils:subscriptions-hide]", error);
	} finally {
		pendingCardKeys.delete(cardKey);
		syncHideButtonState(cardKey);
		queueEnsureHideButtons();
	}
}

function observePage(): void {
	if (observer) {
		return;
	}

	observer = new MutationObserver((mutations) => {
		const hasRelevantMutation = mutations.some((mutation) => {
			if (isInsideHideButton(mutation.target)) {
				return false;
			}

			return [...mutation.addedNodes, ...mutation.removedNodes].some((node) => {
				if (!(node instanceof Element)) {
					return false;
				}

				if (
					node.id.startsWith(BUTTON_HOST_ID_PREFIX) ||
					node.querySelector?.(`[id^="${BUTTON_HOST_ID_PREFIX}"]`)
				) {
					return false;
				}

				return (
					node.matches?.(
						"ytd-rich-item-renderer, yt-thumbnail-hover-overlay-toggle-actions-view-model, yt-lockup-metadata-view-model, [role='menuitem']",
					) ||
					node.querySelector?.(
						"ytd-rich-item-renderer, yt-thumbnail-hover-overlay-toggle-actions-view-model, yt-lockup-metadata-view-model, [role='menuitem']",
					)
				);
			});
		});

		if (hasRelevantMutation) {
			queueEnsureHideButtons();
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

function queueEnsureHideButtons(): void {
	if (ensureQueued) {
		return;
	}

	ensureQueued = true;

	window.requestAnimationFrame(() => {
		ensureQueued = false;
		ensureHideButtons();
	});
}

function removeHideButtons(): void {
	for (const host of document.querySelectorAll<HTMLElement>(
		`[id^="${BUTTON_HOST_ID_PREFIX}"]`,
	)) {
		host.remove();
	}
	for (const card of findSubscriptionsFeedCards()) {
		delete card.dataset[CARD_KEY_ATTRIBUTE];
	}
}

function removeHideButton(card: HTMLElement): void {
	const cardKey = card.dataset[CARD_KEY_ATTRIBUTE];
	if (!cardKey) {
		return;
	}

	document.getElementById(getHostId(cardKey))?.remove();
	delete card.dataset[CARD_KEY_ATTRIBUTE];
	pendingCardKeys.delete(cardKey);
}

function getCardKey(card: HTMLElement): string {
	const existingKey = card.dataset[CARD_KEY_ATTRIBUTE];
	if (existingKey) {
		return existingKey;
	}

	nextCardKey += 1;
	const nextKey = `${nextCardKey}`;
	card.dataset[CARD_KEY_ATTRIBUTE] = nextKey;
	return nextKey;
}

function getCardByKey(cardKey: string): HTMLElement | null {
	const attr = CARD_KEY_ATTRIBUTE.replace(
		/[A-Z]/g,
		(match) => `-${match.toLowerCase()}`,
	);
	return document.querySelector<HTMLElement>(
		`ytd-rich-item-renderer[data-${attr}="${cardKey}"]`,
	);
}

function getHostId(cardKey: string): string {
	return `${BUTTON_HOST_ID_PREFIX}${cardKey}`;
}

function getButtonId(cardKey: string): string {
	return `${BUTTON_ID_PREFIX}${cardKey}`;
}

function isInsideHideButton(node: Node): boolean {
	return (
		node instanceof Element &&
		Boolean(node.closest(`[id^="${BUTTON_HOST_ID_PREFIX}"]`))
	);
}
