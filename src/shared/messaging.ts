export const MESSAGE_INLINE_TRIGGER = "yt-utils:inline-trigger" as const;

export type InlineTriggerMessage = {
	type: typeof MESSAGE_INLINE_TRIGGER;
};

export type ExtensionResult = {
	ok: boolean;
	code?: string;
	message?: string;
	details?: unknown;
};

export function sendMessage(message: unknown): Promise<unknown> {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage(message, (response) => {
			if (chrome.runtime.lastError) {
				reject(new Error(chrome.runtime.lastError.message));
				return;
			}

			resolve(response);
		});
	});
}

export function onMessage(
	typeCheck: (message: unknown) => boolean,
	handler: (
		message: unknown,
		sender: chrome.runtime.MessageSender,
	) => Promise<ExtensionResult>,
): void {
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (!typeCheck(message)) {
			return false;
		}

		handler(message, sender)
			.then(sendResponse)
			.catch((error) => {
				sendResponse({
					ok: false,
					code: (error as Error & { code?: string })?.code || "HANDLER_FAILED",
					message: (error as Error)?.message || "The message handler failed.",
					details: (error as Error & { details?: unknown })?.details || null,
				});
			});

		return true;
	});
}
