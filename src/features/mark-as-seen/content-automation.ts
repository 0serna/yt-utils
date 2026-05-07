import { createExtensionError } from "@shared/errors";
import {
  type ExtensionResult,
  isMarkAsSeenAutomationRequest,
  makeErrorResultFromUnknown,
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
    validateContentWatchPage();
    const video = await findAndPrepareVideo();
    await seekToNearEnd(video);
    await playVideoBriefly(video);

    return { ok: true };
  } catch (error) {
    return makeContentErrorResult(error);
  }
}

function validateContentWatchPage(): void {
  if (!isDesktopWatchPage()) {
    throw createExtensionError(
      "UNSUPPORTED_PAGE",
      "This page is not a standard YouTube watch page.",
    );
  }
}

async function findAndPrepareVideo(): Promise<HTMLVideoElement> {
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

  return video;
}

async function seekToNearEnd(video: HTMLVideoElement): Promise<void> {
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
}

async function playVideoBriefly(video: HTMLVideoElement): Promise<void> {
  void video.play();
  await delay(2000);
  video.pause();
  await waitFor(() => video.paused, {
    timeout: 1500,
    interval: 50,
    errorCode: "PAUSE_FAILED",
    errorMessage: "The video could not be paused after seeking.",
  });
}

function makeContentErrorResult(error: unknown): ExtensionResult {
  return makeErrorResultFromUnknown(
    error,
    "AUTOMATION_FAILED",
    "The automation did not complete successfully.",
  );
}
