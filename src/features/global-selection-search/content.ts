import { applyExtensionButtonStyles } from "@shared/extension-button";
import { MESSAGE_GOOGLE_SEARCH, sendMessage } from "@shared/messaging";

const HOST_ID = "yt-utils-google-search-host";
const BUTTON_ID = "yt-utils-google-search-button";
const BUTTON_SIZE = 30;
const BUTTON_OFFSET = 6;
const VIEWPORT_MARGIN = 8;
const SUPPORTED_INPUT_TYPES = new Set([
	"",
	"email",
	"search",
	"tel",
	"text",
	"url",
]);

let host: HTMLElement | null = null;
let activeQuery = "";
let syncQueued = false;

export function startGlobalSelectionSearch(): void {
	bindListeners();
	queueSync();
}

function bindListeners(): void {
	document.addEventListener("selectionchange", queueSync);
	document.addEventListener("mouseup", queueSync);
	document.addEventListener("keyup", queueSync);
	document.addEventListener("pointerup", queueSync);
	document.addEventListener("touchend", queueSync);
	document.addEventListener("focusin", queueSync);
	document.addEventListener("focusout", queueSync);
	window.addEventListener("scroll", hideInlineAction, true);
	window.addEventListener("resize", queueSync);
	window.addEventListener("blur", hideInlineAction);
}

function queueSync(): void {
	if (syncQueued) {
		return;
	}

	syncQueued = true;
	window.requestAnimationFrame(() => {
		syncQueued = false;
		syncSelectionAction();
	});
}

function syncSelectionAction(): void {
	const selection = readActiveSelection();

	if (!selection) {
		hideInlineAction();
		return;
	}

	activeQuery = selection.query;
	ensureInlineAction();
	positionInlineAction(selection.anchor);
}

function readActiveSelection(): {
	query: string;
	anchor: DOMRect;
	source: "document" | "control";
} | null {
	const activeElement = document.activeElement;
	if (
		isSupportedTextInput(activeElement) ||
		activeElement instanceof HTMLTextAreaElement
	) {
		const text = readControlSelection(activeElement);

		if (!text) {
			return null;
		}

		return {
			query: text,
			anchor: activeElement.getBoundingClientRect(),
			source: "control",
		};
	}

	const selection = window.getSelection();
	if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
		return null;
	}

	if (isContentEditableSelection(selection)) {
		return null;
	}

	const text = normalizeSelectedText(selection.toString());
	if (!text) {
		return null;
	}

	const range = selection.getRangeAt(0);
	const rect = getSelectionRect(range);

	if (!rect) {
		return null;
	}

	return {
		query: text,
		anchor: rect,
		source: "document",
	};
}

function isSupportedTextInput(
	element: Element | null,
): element is HTMLInputElement {
	return (
		element instanceof HTMLInputElement &&
		SUPPORTED_INPUT_TYPES.has(element.type.toLowerCase())
	);
}

function readControlSelection(
	control: HTMLInputElement | HTMLTextAreaElement,
): string | null {
	const { selectionStart, selectionEnd, value } = control;

	if (
		selectionStart === null ||
		selectionEnd === null ||
		selectionStart === selectionEnd
	) {
		return null;
	}

	return normalizeSelectedText(value.slice(selectionStart, selectionEnd));
}

function isContentEditableSelection(selection: Selection): boolean {
	const nodes = [selection.anchorNode, selection.focusNode].filter(
		Boolean,
	) as Node[];
	return nodes.some((node) => {
		const element = node instanceof Element ? node : node.parentElement;
		return Boolean(
			element?.closest(
				"[contenteditable='true'], [contenteditable=''], [contenteditable='plaintext-only']",
			),
		);
	});
}

function normalizeSelectedText(text: string): string {
	return text.replace(/\s+/g, " ").trim();
}

function getSelectionRect(range: Range): DOMRect | null {
	const rect = range.getBoundingClientRect();
	if (rect.width > 0 || rect.height > 0) {
		return rect;
	}

	const clientRect = [...range.getClientRects()].find(
		(candidate) => candidate.width > 0 || candidate.height > 0,
	);
	return clientRect ?? null;
}

function ensureInlineAction(): void {
	if (host) {
		return;
	}

	host = document.createElement("div");
	host.id = HOST_ID;
	host.style.position = "fixed";
	host.style.zIndex = "2147483647";
	host.style.pointerEvents = "none";
	host.style.left = "0";
	host.style.top = "0";

	const button = document.createElement("button");
	button.id = BUTTON_ID;
	button.type = "button";
	button.setAttribute("aria-label", "Search selected text on Google");
	button.innerHTML = getGoogleSearchIconMarkup();
	button.addEventListener("pointerdown", (event) => event.preventDefault());
	button.addEventListener("mousedown", (event) => event.preventDefault());
	button.onclick = onInlineActionClick;
	applyExtensionButtonStyles(button, {
		background: "rgba(255, 255, 255, 0.96)",
		hoverBackground: "#f1f3f4",
		activeBackground: "#e8eaed",
		color: "#4285f4",
		cursor: "pointer",
		position: "relative",
		zIndex: "1",
	});
	button.style.width = `${BUTTON_SIZE}px`;
	button.style.height = `${BUTTON_SIZE}px`;
	button.style.borderRadius = `${BUTTON_SIZE / 2}px`;

	host.append(button);
	(document.body ?? document.documentElement).append(host);
}

function positionInlineAction(anchor: DOMRect): void {
	if (!host) {
		return;
	}

	const topSpace = anchor.top - BUTTON_SIZE - BUTTON_OFFSET;
	const preferredTop =
		topSpace >= VIEWPORT_MARGIN ? topSpace : anchor.bottom + BUTTON_OFFSET;
	const preferredLeft = anchor.right - BUTTON_SIZE;
	const maxLeft = Math.max(
		VIEWPORT_MARGIN,
		window.innerWidth - BUTTON_SIZE - VIEWPORT_MARGIN,
	);
	const maxTop = Math.max(
		VIEWPORT_MARGIN,
		window.innerHeight - BUTTON_SIZE - VIEWPORT_MARGIN,
	);

	host.style.left = `${clamp(preferredLeft, VIEWPORT_MARGIN, maxLeft)}px`;
	host.style.top = `${clamp(preferredTop, VIEWPORT_MARGIN, maxTop)}px`;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function hideInlineAction(): void {
	activeQuery = "";
	if (host) {
		host.remove();
		host = null;
	}
}

async function onInlineActionClick(event: Event): Promise<void> {
	event.preventDefault();
	event.stopPropagation();

	if (!activeQuery) {
		return;
	}

	try {
		await sendMessage({
			type: MESSAGE_GOOGLE_SEARCH,
			query: activeQuery,
		});
	} catch (error) {
		console.error("[YTUtils:global-selection]", error);
	}
}

function getGoogleSearchIconMarkup(): string {
	return [
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">',
		'<path fill="#4285F4" d="M21.6 12.2c0-.74-.07-1.44-.2-2.12H12v4.01h5.36a4.58 4.58 0 0 1-1.99 3.01v2.5h3.22c1.88-1.74 2.97-4.31 2.97-7.4Z"/>',
		'<path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.4l-3.22-2.5c-.9.6-2.05.95-3.4.95-2.61 0-4.82-1.76-5.61-4.13H3.06v2.58A10 10 0 0 0 12 22Z"/>',
		'<path fill="#FBBC05" d="M6.39 13.92A6 6 0 0 1 6.07 12c0-.67.11-1.32.32-1.92V7.5H3.06A10 10 0 0 0 2 12c0 1.61.39 3.13 1.06 4.5l3.33-2.58Z"/>',
		'<path fill="#EA4335" d="M12 5.86c1.47 0 2.79.51 3.84 1.52l2.88-2.88C16.96 2.9 14.7 2 12 2A10 10 0 0 0 3.06 7.5l3.33 2.58C7.18 7.62 9.39 5.86 12 5.86Z"/>',
		"</svg>",
	].join("");
}
