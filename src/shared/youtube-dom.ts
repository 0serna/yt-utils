const LABELS = {
	share: [/\bshare\b/i, /\bcompartir\b/i],
	copy: [/\bcopy\b/i, /\bcopy link\b/i, /\bcopiar\b/i, /\bcopiar enlace\b/i],
	startAt: [/\bstart at\b/i, /\bempezar en\b/i],
	hide: [/\bhide\b/i, /\bocultar\b/i],
	moreActions: [/\bmore actions\b/i, /\bm[aá]s acciones\b/i],
} as const;

export { LABELS };

export function waitFor<T>(
	getValue: () => T | null | undefined | false,
	options?: {
		timeout?: number;
		interval?: number;
		errorCode?: string;
		errorMessage?: string;
	},
): Promise<NonNullable<T>> {
	const timeout = options?.timeout ?? 5000;
	const interval = options?.interval ?? 100;

	return new Promise((resolve, reject) => {
		const startedAt = Date.now();

		const check = () => {
			const value = getValue();

			if (value) {
				resolve(value as NonNullable<T>);
				return;
			}

			if (Date.now() - startedAt > timeout) {
				reject(
					createAutomationError(
						options?.errorCode || "WAIT_FAILED",
						options?.errorMessage || "Timed out waiting for the next step.",
					),
				);
				return;
			}

			window.setTimeout(check, interval);
		};

		check();
	});
}

export function findButton(
	root: ParentNode,
	matchers: readonly RegExp[],
): HTMLElement | null {
	const elements = root.querySelectorAll<HTMLElement>(
		"button, [role='button'], tp-yt-paper-checkbox[role='checkbox']",
	);

	return (
		[...elements].find(
			(element) => isVisible(element) && matchesAnyLabel(element, matchers),
		) ?? null
	);
}

export function findMenuItem(
	root: ParentNode,
	matchers: readonly RegExp[],
): HTMLElement | null {
	const elements = root.querySelectorAll<HTMLElement>("[role='menuitem']");

	return (
		[...elements].find(
			(element) => isVisible(element) && matchesAnyLabel(element, matchers),
		) ?? null
	);
}

export function findShareDialog(): HTMLElement | null {
	const dialogs = document.querySelectorAll<HTMLElement>(
		"tp-yt-paper-dialog, [role='dialog']",
	);

	return (
		[...dialogs].find((dialog) => {
			if (!isVisible(dialog)) {
				return false;
			}

			return (
				Boolean(findShareUrlInput(dialog)) &&
				Boolean(findButton(dialog, LABELS.copy))
			);
		}) ?? null
	);
}

export function findStartAtCheckbox(
	dialog: ParentNode,
	matchers: readonly RegExp[],
): HTMLElement | null {
	const selectors = [
		"#start-at-checkbox",
		"tp-yt-paper-checkbox[role='checkbox']",
		"input[type='checkbox']",
		"[role='checkbox']",
	];

	for (const selector of selectors) {
		const candidates = dialog.querySelectorAll<HTMLElement>(selector);

		for (const candidate of candidates) {
			if (!isVisible(candidate)) {
				continue;
			}

			if (
				candidate.id === "start-at-checkbox" ||
				matchesAnyLabel(candidate, matchers)
			) {
				return candidate;
			}
		}
	}

	return null;
}

export function findShareUrlInput(dialog: ParentNode): HTMLInputElement | null {
	const selectors = ["#share-url", "input[readonly]", "input[type='text']"];

	for (const selector of selectors) {
		const candidates = dialog.querySelectorAll<HTMLInputElement>(selector);

		for (const candidate of candidates) {
			if (!isVisible(candidate)) {
				continue;
			}

			if (candidate.value?.includes("youtu")) {
				return candidate;
			}
		}
	}

	return null;
}

export function findWatchPageActionsContainer(): HTMLElement | null {
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

export const RELEVANT_MUTATION_SELECTORS =
	"ytd-watch-metadata, #actions-inner, #top-level-buttons-computed, segmented-like-dislike-button-view-model, ytd-menu-renderer";

export function isDesktopSubscriptionsFeedPage(
	url: URL = new URL(window.location.href),
): boolean {
	return (
		url.hostname === "www.youtube.com" && url.pathname === "/feed/subscriptions"
	);
}

export function isDesktopWatchPage(): boolean {
	return (
		window.location.hostname === "www.youtube.com" &&
		window.location.pathname === "/watch" &&
		new URLSearchParams(window.location.search).has("v")
	);
}

export function findSubscriptionsFeedCards(): HTMLElement[] {
	return [...document.querySelectorAll<HTMLElement>("ytd-rich-item-renderer")];
}

export function findSubscriptionsCardOverlayActionsHost(
	card: ParentNode,
): HTMLElement | null {
	return card.querySelector<HTMLElement>(
		"yt-thumbnail-hover-overlay-toggle-actions-view-model",
	);
}

export function findSubscriptionsCardMenuButton(
	card: ParentNode,
): HTMLElement | null {
	return findButton(card, LABELS.moreActions);
}

export function findSubscriptionsHideMenuItem(
	root: ParentNode = document,
): HTMLElement | null {
	return findMenuItem(root, LABELS.hide);
}

export function findShortsShelf(): HTMLElement | null {
	return document.querySelector<HTMLElement>(
		"ytd-rich-shelf-renderer[is-shorts]",
	);
}

export function removeShortsSection(): void {
	const shelf = findShortsShelf();
	if (!shelf) {
		return;
	}

	const section = shelf.closest<HTMLElement>("ytd-rich-section-renderer");
	if (section) {
		section.remove();
	}
}

export function isVisible(element: Element): boolean {
	const style = window.getComputedStyle(element);
	const rect = element.getBoundingClientRect();

	return (
		style.display !== "none" &&
		style.visibility !== "hidden" &&
		rect.width > 0 &&
		rect.height > 0
	);
}

export function getElementLabel(element: Element): string {
	const values = [
		element.getAttribute("aria-label"),
		element.getAttribute("title"),
		element instanceof HTMLElement ? element.innerText : "",
		element instanceof HTMLElement ? element.textContent : "",
	];

	return values.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export function clickElement(element: HTMLElement): void {
	element.scrollIntoView({ block: "center", inline: "center" });
	element.dispatchEvent(
		new MouseEvent("mouseover", { bubbles: true, cancelable: true }),
	);
	element.dispatchEvent(
		new MouseEvent("mousedown", { bubbles: true, cancelable: true, button: 0 }),
	);
	element.dispatchEvent(
		new MouseEvent("mouseup", { bubbles: true, cancelable: true, button: 0 }),
	);
	element.click();
}

function matchesAnyLabel(
	element: Element,
	matchers: readonly RegExp[],
): boolean {
	const label = getElementLabel(element);
	return matchers.some((matcher) => matcher.test(label));
}

function createAutomationError(
	code: string,
	message: string,
	details?: unknown,
): Error & { code: string; details: unknown } {
	const error = new Error(message) as Error & {
		code: string;
		details: unknown;
	};
	error.code = code;
	error.details = details;
	return error;
}
