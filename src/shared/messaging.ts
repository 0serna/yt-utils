export const MESSAGE_INLINE_TRIGGER = "yt-utils:inline-trigger" as const;
export const MESSAGE_GOOGLE_SEARCH = "yt-utils:google-search" as const;
export const MESSAGE_MARK_AS_SEEN_AUTOMATION =
  "yt-utils:mark-as-seen-automation" as const;
export const MESSAGE_LOG_EVENT = "yt-utils:log-event" as const;

export type MarkAsSeenAutomationRequest = {
  type: typeof MESSAGE_MARK_AS_SEEN_AUTOMATION;
};

export interface LogEventRequest {
  type: typeof MESSAGE_LOG_EVENT;
  entry: import("../shared/feature-logger").LogEntry;
}

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
  const extensionResult = readExtensionResult(response);
  if (!extensionResult) {
    return makeErrorResult(
      "INVALID_RESPONSE",
      fallbackMessage,
      response ?? null,
    );
  }

  return normalizeKnownExtensionResult(extensionResult, fallbackMessage);
}

function normalizeKnownExtensionResult(
  response: ExtensionResult,
  fallbackMessage: string,
): ExtensionResult {
  if (response.ok) {
    return makeSuccessResult(response);
  }

  return normalizeErrorExtensionResult(response, fallbackMessage);
}

function normalizeErrorExtensionResult(
  response: ExtensionResult,
  fallbackMessage: string,
): ExtensionResult {
  return makeErrorResult(
    response.code || "AUTOMATION_FAILED",
    response.message || fallbackMessage,
    response.details ?? null,
  );
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
        sendResponse(
          makeErrorResultFromUnknown(
            error,
            "HANDLER_FAILED",
            "The message handler failed.",
          ),
        );
      });

    return true;
  });
}

export function makeErrorResultFromUnknown(
  error: unknown,
  fallbackCode: string,
  fallbackMessage: string,
): ExtensionResult {
  const typedError = error as Error & { code?: string; details?: unknown };
  return makeErrorResult(
    typedError.code || fallbackCode,
    typedError.message || fallbackMessage,
    typedError.details ?? null,
  );
}

function readExtensionResult(response: unknown): ExtensionResult | null {
  return isExtensionResult(response) ? response : null;
}

function makeSuccessResult(response: ExtensionResult): ExtensionResult {
  return {
    ok: true,
    message: response.message,
    details: response.details ?? null,
  };
}

function makeErrorResult(
  code: string,
  message: string,
  details: unknown,
): ExtensionResult {
  return {
    ok: false,
    code,
    message,
    details,
  };
}
