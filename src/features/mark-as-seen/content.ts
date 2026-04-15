import { getBootstrapIconMarkup } from "@shared/bootstrap-icons";
import { applyExtensionButtonStyles } from "@shared/extension-button";
import { MESSAGE_INLINE_TRIGGER, sendMessage } from "@shared/messaging";
import type { Feature, FeatureContext } from "@shared/types";

const BUTTON_HOST_ID = "yt-utils-inline-host";
const BUTTON_ID = "yt-utils-inline-button";
const STATE_RESET_DELAY_MS = 2500;

type ButtonState = "idle" | "running" | "success" | "error";

const markAsSeenFeature: Feature = {
	name: "mark-as-seen",
	isWatchPage: true,

	activate(_context: FeatureContext): void {
		ensureInlineButton();
		observePage();
	},

	deactivate(): void {
		removeInlineButton();
		stopObserving();
	},
};

export default markAsSeenFeature;

let currentState: ButtonState = "idle";
let stateResetTimer: number | null = null;
let ensureButtonQueued = false;
const _knownUrl = window.location.href;
let observer: MutationObserver | null = null;

function ensureInlineButton(): void {
	if (!isSupportedDesktopWatchPage()) {
		removeInlineButton();
		return;
	}

	const actionsContainer = findActionsContainer();

	if (!actionsContainer) {
		return;
	}

	let host = document.getElementById(BUTTON_HOST_ID);

	if (!host) {
		host = createInlineButtonHost();
	}

	const insertionTarget = findInsertionTarget(actionsContainer);

	if (insertionTarget?.previousSibling !== host) {
		if (insertionTarget) {
			insertionTarget.insertAdjacentElement("beforebegin", host);
		} else if (host.parentElement !== actionsContainer) {
			actionsContainer.prepend(host);
		}
	}

	syncButtonState();
}

function removeInlineButton(): void {
	const host = document.getElementById(BUTTON_HOST_ID);

	if (host) {
		host.remove();
	}
}

function observePage(): void {
	if (observer) {
		return;
	}

	observer = new MutationObserver((mutations) => {
		const hasRelevantMutation = mutations.some((mutation) => {
			if (isInsideInlineButton(mutation.target)) {
				return false;
			}

			return [...mutation.addedNodes, ...mutation.removedNodes].some((node) => {
				if (!(node instanceof Element)) {
					return false;
				}

				if (
					node.id === BUTTON_HOST_ID ||
					node.querySelector?.(`#${BUTTON_HOST_ID}`)
				) {
					return false;
				}

				return (
					node.matches?.(
						"ytd-watch-metadata, #actions-inner, #top-level-buttons-computed, segmented-like-dislike-button-view-model, ytd-menu-renderer",
					) ||
					node.querySelector?.(
						"ytd-watch-metadata, #actions-inner, #top-level-buttons-computed, segmented-like-dislike-button-view-model, ytd-menu-renderer",
					)
				);
			});
		});

		if (!hasRelevantMutation) {
			return;
		}

		queueEnsureButton();
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

function queueEnsureButton(): void {
	if (ensureButtonQueued) {
		return;
	}

	ensureButtonQueued = true;

	window.requestAnimationFrame(() => {
		ensureButtonQueued = false;
		ensureInlineButton();
	});
}

function isSupportedDesktopWatchPage(): boolean {
	return (
		window.location.hostname === "www.youtube.com" &&
		window.location.pathname === "/watch" &&
		new URLSearchParams(window.location.search).has("v")
	);
}

function findActionsContainer(): HTMLElement | null {
	const selectors = [
		"ytd-watch-metadata #top-level-buttons-computed",
		"#actions-inner ytd-menu-renderer #top-level-buttons-computed",
		"#actions-inner #top-level-buttons-computed",
	];

	for (const selector of selectors) {
		const element = document.querySelector<HTMLElement>(selector);

		if (element) {
			return element;
		}
	}

	return null;
}

function findInsertionTarget(
	actionsContainer: HTMLElement,
): HTMLElement | null {
	const candidates = [...actionsContainer.children].filter(
		(child) => child.id !== BUTTON_HOST_ID,
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

function createInlineButtonHost(): HTMLElement {
	const host = document.createElement("div");
	host.id = BUTTON_HOST_ID;
	host.style.display = "inline-flex";
	host.style.alignItems = "center";
	host.style.marginInlineEnd = "8px";
	host.style.flex = "0 0 auto";
	host.style.pointerEvents = "auto";

	const button = document.createElement("button");
	button.id = BUTTON_ID;
	button.type = "button";
	button.onclick = onInlineButtonClick;

	host.append(button);
	return host;
}

function syncButtonState(): void {
	const button = document.getElementById(BUTTON_ID);

	if (!button) {
		return;
	}

	const palette = getStatePalette(currentState);
	(button as HTMLButtonElement).disabled = currentState === "running";
	button.dataset.state = currentState;
	button.setAttribute("aria-label", palette.label);
	button.title = palette.label;
	applyExtensionButtonStyles(button as HTMLButtonElement, {
		background: palette.background,
		hoverBackground: palette.hoverBackground,
		activeBackground: palette.activeBackground,
		opacity: palette.opacity,
		cursor: currentState === "running" ? "default" : "pointer",
		position: "relative",
		zIndex: "1",
	});
	button.innerHTML = getButtonIconMarkup(currentState);
}

function getStatePalette(state: ButtonState): {
	label: string;
	background: string;
	hoverBackground: string;
	activeBackground: string;
	opacity: string;
} {
	switch (state) {
		case "running":
			return {
				label: "Marking as seen...",
				background: "rgba(255, 255, 255, 0.2)",
				hoverBackground: "rgba(255, 255, 255, 0.2)",
				activeBackground: "rgba(255, 255, 255, 0.2)",
				opacity: "0.75",
			};
		case "success":
			return {
				label: "Marked as seen.",
				background: "#2e7d32",
				hoverBackground: "#2e7d32",
				activeBackground: "#2e7d32",
				opacity: "1",
			};
		case "error":
			return {
				label: "Mark as seen failed.",
				background: "#b71c1c",
				hoverBackground: "#b71c1c",
				activeBackground: "#b71c1c",
				opacity: "1",
			};
		default:
			return {
				label: "Mark as seen",
				background: "rgba(255, 255, 255, 0.1)",
				hoverBackground: "rgba(255, 255, 255, 0.2)",
				activeBackground: "rgba(255, 255, 255, 0.2)",
				opacity: "1",
			};
	}
}

function getButtonIconMarkup(state: ButtonState): string {
	if (state === "running") {
		return [
			'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">',
			'<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2" opacity="0.35"></circle>',
			'<path d="M12 4a8 8 0 0 1 8 8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"></path>',
			"</svg>",
		].join("");
	}

	return [getBootstrapIconMarkup("check")].join("");
}

async function onInlineButtonClick(event: Event): Promise<void> {
	event.preventDefault();
	event.stopPropagation();

	if (currentState === "running") {
		return;
	}

	clearResetTimer();
	currentState = "running";
	syncButtonState();

	try {
		const response = (await sendMessage({ type: MESSAGE_INLINE_TRIGGER })) as {
			ok?: boolean;
			message?: string;
		} | null;

		if (!response?.ok) {
			throw new Error(response?.message || "The automation failed.");
		}

		currentState = "success";
		syncButtonState();
	} catch (error) {
		console.error("[YTUtils:inline]", error);
		currentState = "error";
		syncButtonState();
		stateResetTimer = window.setTimeout(() => {
			stateResetTimer = null;
			currentState = "idle";
			syncButtonState();
		}, STATE_RESET_DELAY_MS);
	}
}

function clearResetTimer(): void {
	if (stateResetTimer !== null) {
		window.clearTimeout(stateResetTimer);
		stateResetTimer = null;
	}
}

function getElementLabel(element: Element): string {
	const values = [
		element.getAttribute?.("aria-label"),
		element.getAttribute?.("title"),
		element instanceof HTMLElement ? element.innerText : "",
		element instanceof HTMLElement ? element.textContent : "",
	];

	return values.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function isInsideInlineButton(node: Node): boolean {
	return node instanceof Element && Boolean(node.closest(`#${BUTTON_HOST_ID}`));
}
