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
    if (!isSupportedWatchPage(rawUrl)) {
      throw createExtensionError(
        "UNSUPPORTED_PAGE",
        "Open a standard YouTube watch page before using the extension.",
      );
    }

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

    await setActionStatus(tabId, {
      text: "OK",
      color: "#2e7d32",
      title: "Video marked as seen.",
    });

    return {
      ok: true,
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
