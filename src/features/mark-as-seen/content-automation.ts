import { createExtensionError } from "@shared/errors";
import {
  type ExtensionResult,
  isMarkAsSeenAutomationRequest,
  onMessage,
} from "@shared/messaging";
import { delay, isDesktopWatchPage, waitFor } from "@shared/youtube-dom";

let handlerRegistered = false;

export function registerMarkAsSeenAutomationHandler(): void {
  if (handlerRegistered) {
    return;
  }

  handlerRegistered = true;
  onMessage(isMarkAsSeenAutomationRequest, runMarkAsSeenAutomation);
}

async function runMarkAsSeenAutomation(): Promise<ExtensionResult> {
  try {
    if (!isDesktopWatchPage()) {
      throw createExtensionError(
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

    await waitFor(() => Number.isFinite(video.duration) && video.duration > 1, {
      timeout: 15000,
      errorCode: "VIDEO_NOT_READY",
      errorMessage: "The YouTube video metadata never became ready.",
    });

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

    void video.play();

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
