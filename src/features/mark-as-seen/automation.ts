import { createExtensionError } from "@shared/errors";
import {
  type ExtensionResult,
  MESSAGE_MARK_AS_SEEN_AUTOMATION,
  normalizeExtensionResult,
} from "@shared/messaging";

const WATCH_PAGE_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "m.youtube.com",
]);

function isSupportedWatchPage(rawUrl: string | undefined): boolean {
  try {
    return rawUrl ? isValidWatchUrl(new URL(rawUrl)) : false;
  } catch {
    return false;
  }
}

function isValidWatchUrl(url: URL): boolean {
  return (
    WATCH_PAGE_HOSTS.has(url.hostname) &&
    url.pathname === "/watch" &&
    url.searchParams.has("v")
  );
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

export { clearActionStatus };

export async function runMarkAsSeenForTab(
  tabId: number,
  rawUrl: string | undefined,
): Promise<ExtensionResult> {
  try {
    validateWatchPage(rawUrl);
    await runAutomationRequest(tabId);

    await setActionStatus(tabId, {
      text: "OK",
      color: "#2e7d32",
      title: "Video marked as seen.",
    });

    return { ok: true, message: "Video marked as seen.", details: null };
  } catch (error) {
    return handleAutomationError(tabId, error);
  }
}

async function runAutomationRequest(tabId: number): Promise<void> {
  const response = await sendMarkAsSeenAutomationRequest(tabId);
  const result = normalizeExtensionResult(
    response,
    "The automation did not complete successfully.",
  );

  if (!result.ok) {
    throw createExtensionError(
      result.code || "AUTOMATION_FAILED",
      result.message || "The automation did not complete successfully.",
      result.details,
    );
  }
}

function validateWatchPage(rawUrl: string | undefined): void {
  if (!isSupportedWatchPage(rawUrl)) {
    throw createExtensionError(
      "UNSUPPORTED_PAGE",
      "Open a standard YouTube watch page before using the extension.",
    );
  }
}

async function handleAutomationError(
  tabId: number,
  error: unknown,
): Promise<ExtensionResult> {
  const { message, code, details } = normalizeExtensionError(error);

  console.error("[YTUtils]", error);

  await setActionStatus(tabId, {
    text: "ERR",
    color: "#b71c1c",
    title: message,
  });

  return { ok: false, code, message, details };
}

export function normalizeExtensionError(error: unknown): {
  code: string;
  message: string;
  details: unknown;
} {
  const err = error as Error & { code?: string; details?: unknown };
  return {
    code: err.code || "AUTOMATION_FAILED",
    message: error instanceof Error ? error.message : "The automation failed.",
    details: err.details ?? null,
  };
}

function sendMarkAsSeenAutomationRequest(tabId: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(
      tabId,
      { type: MESSAGE_MARK_AS_SEEN_AUTOMATION },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(
            createExtensionError(
              "CONTENT_SCRIPT_UNAVAILABLE",
              "The YouTube content script is unavailable on this page.",
              chrome.runtime.lastError.message,
            ),
          );
          return;
        }

        resolve(response);
      },
    );
  });
}
