export const MESSAGE_INLINE_TRIGGER = "yt-utils:inline-trigger" as const;
export const MESSAGE_GOOGLE_SEARCH = "yt-utils:google-search" as const;
export const MESSAGE_MARK_AS_SEEN_AUTOMATION =
  "yt-utils:mark-as-seen-automation" as const;

export type MarkAsSeenAutomationRequest = {
  type: typeof MESSAGE_MARK_AS_SEEN_AUTOMATION;
};

export type ExtensionResult = {
  ok: boolean;
  code?: string;
  message?: string;
  details?: unknown;
};

export function isMarkAsSeenAutomationRequest(
  message: unknown,
): message is MarkAsSeenAutomationRequest {
  return (
    (message as { type?: string })?.type === MESSAGE_MARK_AS_SEEN_AUTOMATION
  );
}

function isExtensionResult(response: unknown): response is ExtensionResult {
  return typeof (response as { ok?: unknown })?.ok === "boolean";
}

export function normalizeExtensionResult(
  response: unknown,
  fallbackMessage: string,
): ExtensionResult {
  if (!isExtensionResult(response)) {
    return {
      ok: false,
      code: "INVALID_RESPONSE",
      message: fallbackMessage,
      details: response ?? null,
    };
  }

  if (response.ok) {
    return {
      ok: true,
      message: response.message,
      details: response.details ?? null,
    };
  }

  return {
    ok: false,
    code: response.code || "AUTOMATION_FAILED",
    message: response.message || fallbackMessage,
    details: response.details ?? null,
  };
}

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
