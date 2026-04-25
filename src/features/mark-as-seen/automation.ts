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

      return { ok: true };
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
): Promise<{
  ok: boolean;
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
