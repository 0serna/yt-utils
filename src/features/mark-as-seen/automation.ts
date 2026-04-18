import type { AutomationResult } from "./types";

const WATCH_PAGE_HOSTS = new Set([
	"www.youtube.com",
	"youtube.com",
	"m.youtube.com",
]);

function isSupportedWatchPage(rawUrl: string | undefined): boolean {
	if (!rawUrl) {
		return false;
	}

	try {
		const url = new URL(rawUrl);
		return (
			WATCH_PAGE_HOSTS.has(url.hostname) &&
			url.pathname === "/watch" &&
			url.searchParams.has("v")
		);
	} catch {
		return false;
	}
}

function createExtensionError(
	code: string,
	message: string,
	details?: unknown,
): Error & { code: string; details: unknown } {
	const error = new Error(message) as Error & {
		code: string;
		details: unknown;
	};
	error.code = code;
	error.details = details ?? null;
	return error;
}

async function setActionStatus(
	tabId: number,
	status: { text: string; color: string; title: string },
): Promise<void> {
	await chrome.action.setBadgeBackgroundColor({ tabId, color: status.color });
	await chrome.action.setBadgeText({ tabId, text: status.text });
	await chrome.action.setTitle({ tabId, title: status.title });
}

async function clearActionStatus(tabId: number): Promise<void> {
	await chrome.action.setBadgeText({ tabId, text: "" });
	await chrome.action.setTitle({ tabId, title: "YT Utils" });
}

function runYoutubeMarkAsSeenAutomation(
	watchPageHosts: readonly string[],
): Promise<AutomationResult> {
	const supportedWatchPageHosts = new Set(watchPageHosts);
	const LABELS = {
		share: [/\bshare\b/i, /\bcompartir\b/i],
		copy: [/\bcopy\b/i, /\bcopy link\b/i, /\bcopiar\b/i, /\bcopiar enlace\b/i],
		startAt: [/\bstart at\b/i, /\bempezar en\b/i],
	};

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
		error.details = details ?? null;
		return error;
	}

	function delay(ms: number): Promise<void> {
		return new Promise((resolve) => window.setTimeout(resolve, ms));
	}

	async function waitFor<T>(
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
		const startedAt = Date.now();

		while (Date.now() - startedAt <= timeout) {
			const value = getValue();

			if (value) {
				return value as NonNullable<T>;
			}

			await delay(interval);
		}

		throw createAutomationError(
			options?.errorCode || "WAIT_FAILED",
			options?.errorMessage || "Timed out waiting for the next step.",
		);
	}

	function isVisible(element: Element): boolean {
		const style = window.getComputedStyle(element);
		const rect = element.getBoundingClientRect();

		return (
			style.display !== "none" &&
			style.visibility !== "hidden" &&
			rect.width > 0 &&
			rect.height > 0
		);
	}

	function getElementLabel(element: Element): string {
		const values = [
			element.getAttribute("aria-label"),
			element.getAttribute("title"),
			element instanceof HTMLElement ? element.innerText : "",
			element instanceof HTMLElement ? element.textContent : "",
		];

		return values.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
	}

	function matchesAnyLabel(
		element: Element,
		matchers: readonly RegExp[],
	): boolean {
		const label = getElementLabel(element);
		return matchers.some((matcher) => matcher.test(label));
	}

	function findButton(
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

	function findShareDialog(): HTMLElement | null {
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

	function findStartAtCheckbox(
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

	function findShareUrlInput(dialog: ParentNode): HTMLInputElement | null {
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

	function clickElement(element: HTMLElement): void {
		element.scrollIntoView({ block: "center", inline: "center" });
		element.dispatchEvent(
			new MouseEvent("mouseover", { bubbles: true, cancelable: true }),
		);
		element.dispatchEvent(
			new MouseEvent("mousedown", {
				bubbles: true,
				cancelable: true,
				button: 0,
			}),
		);
		element.dispatchEvent(
			new MouseEvent("mouseup", { bubbles: true, cancelable: true, button: 0 }),
		);
		element.click();
	}

	function hasStartTime(value: string): boolean {
		return /(?:[?&](?:t|start)=)/.test(value);
	}

	async function execute(): Promise<AutomationResult> {
		try {
			const isSupportedPage =
				supportedWatchPageHosts.has(window.location.hostname) &&
				window.location.pathname === "/watch" &&
				new URLSearchParams(window.location.search).has("v");

			if (!isSupportedPage) {
				throw createAutomationError(
					"UNSUPPORTED_PAGE",
					"This page is not a standard YouTube watch page.",
				);
			}

			const video = await waitFor(
				() => document.querySelector<HTMLVideoElement>("video"),
				{
					timeout: 15000,
					errorCode: "VIDEO_NOT_FOUND",
					errorMessage: "The YouTube video element was not found.",
				},
			);

			await waitFor(
				() => Number.isFinite(video.duration) && video.duration > 1,
				{
					timeout: 15000,
					errorCode: "VIDEO_NOT_READY",
					errorMessage: "The YouTube video metadata never became ready.",
				},
			);

			const targetTime = Math.max(
				0,
				Math.min(video.duration - 0.25, video.duration * 0.99),
			);

			video.currentTime = targetTime;

			await waitFor(
				() => Math.abs(video.currentTime - targetTime) < 1 || video.ended,
				{
					timeout: 5000,
					interval: 50,
					errorCode: "SEEK_FAILED",
					errorMessage: "The video did not seek to the requested time.",
				},
			);

			video.play();

			await delay(2000);

			video.pause();

			await waitFor(() => video.paused, {
				timeout: 1500,
				interval: 50,
				errorCode: "PAUSE_FAILED",
				errorMessage: "The video could not be paused after seeking.",
			});

			const shareButton = await waitFor(
				() => findButton(document, LABELS.share),
				{
					timeout: 10000,
					errorCode: "SHARE_BUTTON_NOT_FOUND",
					errorMessage: "The YouTube Share button could not be found.",
				},
			);

			clickElement(shareButton);

			const shareDialog = await waitFor(findShareDialog, {
				timeout: 10000,
				errorCode: "SHARE_DIALOG_NOT_FOUND",
				errorMessage: "The YouTube share dialog did not open.",
			});

			const startAtCheckbox = await waitFor(
				() => findStartAtCheckbox(shareDialog, LABELS.startAt),
				{
					timeout: 10000,
					errorCode: "START_AT_NOT_FOUND",
					errorMessage:
						"The share dialog did not expose the Start at checkbox.",
				},
			);

			const shareUrlInput = await waitFor(
				() => findShareUrlInput(shareDialog),
				{
					timeout: 5000,
					errorCode: "SHARE_URL_NOT_FOUND",
					errorMessage:
						"The share dialog did not expose the generated URL field.",
				},
			);

			const initialShareUrl = shareUrlInput.value.trim();

			if (!hasStartTime(initialShareUrl)) {
				clickElement(startAtCheckbox);
			}

			await waitFor(
				() => {
					const value = shareUrlInput.value.trim();
					return (
						Boolean(value) && value.includes("youtu") && hasStartTime(value)
					);
				},
				{
					timeout: 5000,
					interval: 50,
					errorCode: "SHARE_URL_NOT_READY",
					errorMessage:
						"The generated share URL was never updated with the selected start time.",
				},
			);

			const redirectUrl = shareUrlInput.value.trim();
			const copyButton = await waitFor(
				() => findButton(shareDialog, LABELS.copy),
				{
					timeout: 5000,
					errorCode: "COPY_BUTTON_NOT_FOUND",
					errorMessage:
						"The Copy button could not be found in the share dialog.",
				},
			);

			clickElement(copyButton);
			await delay(150);

			return { ok: true, redirectUrl };
		} catch (error) {
			return {
				ok: false,
				code: (error as Error & { code?: string })?.code || "AUTOMATION_FAILED",
				message:
					(error as Error)?.message ||
					"The automation did not complete successfully.",
				details: (error as Error & { details?: unknown })?.details ?? null,
			};
		}
	}

	return execute();
}

export { clearActionStatus, runYoutubeMarkAsSeenAutomation };

export async function runMarkAsSeenForTab(
	tabId: number,
	rawUrl: string | undefined,
	options: { redirectTab?: boolean } = {},
): Promise<{
	ok: boolean;
	redirectUrl?: string;
	code?: string;
	message: string;
	details?: unknown;
}> {
	try {
		if (!isSupportedWatchPage(rawUrl)) {
			throw createExtensionError(
				"UNSUPPORTED_PAGE",
				"Open a standard YouTube watch page before using the extension.",
			);
		}

		const [execution] = await chrome.scripting.executeScript({
			target: { tabId },
			func: runYoutubeMarkAsSeenAutomation,
			args: [[...WATCH_PAGE_HOSTS]],
		});

		const result = execution?.result as AutomationResult | undefined;

		if (!result?.ok) {
			throw createExtensionError(
				result?.code || "AUTOMATION_FAILED",
				result?.message || "The automation did not complete successfully.",
				result?.details,
			);
		}

		if (options.redirectTab) {
			await chrome.tabs.update(tabId, { url: result.redirectUrl });
		}

		await setActionStatus(tabId, {
			text: "OK",
			color: "#2e7d32",
			title: "Video marked as seen.",
		});

		return {
			ok: true,
			redirectUrl: result.redirectUrl,
			message: "Video marked as seen.",
			details: null,
		};
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "The automation failed.";

		console.error("[YTUtils]", error);

		await setActionStatus(tabId, {
			text: "ERR",
			color: "#b71c1c",
			title: message,
		});

		return {
			ok: false,
			code: (error as Error & { code?: string })?.code || "AUTOMATION_FAILED",
			message,
			details: (error as Error & { details?: unknown })?.details ?? null,
		};
	}
}
