import type { Feature, FeatureContext } from "@shared/types";

const HOLD_MS = 3000;
const METADATA_WAIT_MS = 1000;
const LIVE_BADGE_SELECTOR = ".ytp-live-badge";

let active = false;
let activeContext: FeatureContext | null = null;
let holdTimer: number | null = null;
let heldVideo: HTMLVideoElement | null = null;
let heldAt = 0;
let holding = false;
let resuming = false;
let metadataTimer: number | null = null;
let metadataListener: (() => void) | null = null;
let metadataVideo: HTMLVideoElement | null = null;

const playbackStartGateFeature: Feature = {
  name: "playback-start-gate",
  isWatchPage: true,

  activate(context: FeatureContext): void {
    resetState();
    active = true;
    activeContext = context;
    document.removeEventListener("play", onPlay, true);
    document.addEventListener("play", onPlay, true);
    holdIfPlaying();
  },

  deactivate(): void {
    active = false;
    activeContext = null;
    document.removeEventListener("play", onPlay, true);
    resetState();
  },
};

export default playbackStartGateFeature;

function onPlay(event: Event): void {
  if (!active || resuming) {
    return;
  }

  const video = event.target;
  if (!(video instanceof HTMLVideoElement) || !isMainVideo(video)) {
    return;
  }

  if (holding) {
    cancelHold();
    return;
  }

  startHold(video);
}

function holdIfPlaying(): void {
  const video = findMainVideo();
  if (video && !video.paused) {
    startHold(video);
  }
}

function startHold(video: HTMLVideoElement): void {
  if (!active || holding || resuming || isAdShowing()) {
    return;
  }

  if (isLivePlayback(video)) {
    return;
  }

  holding = true;
  heldVideo = video;
  heldAt = Date.now();
  video.pause();
  scheduleResume(video);
}

function scheduleResume(video: HTMLVideoElement): void {
  if (!holding || heldVideo !== video) {
    return;
  }

  if (isLivePlayback(video)) {
    resumeHeldVideo(video);
    return;
  }

  if (!Number.isFinite(video.duration)) {
    waitForMetadata(video);
    return;
  }

  scheduleHoldTimer(video, HOLD_MS);
}

function waitForMetadata(video: HTMLVideoElement): void {
  clearMetadataWait();
  metadataVideo = video;
  metadataListener = () => {
    clearMetadataWait();
    if (!holding || heldVideo !== video) {
      return;
    }
    if (isLivePlayback(video)) {
      resumeHeldVideo(video);
      return;
    }
    scheduleHoldTimer(video, Math.max(0, HOLD_MS - (Date.now() - heldAt)));
  };

  video.addEventListener("loadedmetadata", metadataListener, { once: true });
  video.addEventListener("durationchange", metadataListener, { once: true });
  metadataTimer = window.setTimeout(() => {
    metadataListener?.();
  }, METADATA_WAIT_MS);
}

function scheduleHoldTimer(video: HTMLVideoElement, delayMs: number): void {
  clearHoldTimer();
  holdTimer = window.setTimeout(() => resumeHeldVideo(video), delayMs);
}

function resumeHeldVideo(video: HTMLVideoElement): void {
  clearMetadataWait();
  holdTimer = null;
  if (!active || !holding || heldVideo !== video) {
    return;
  }

  if (!video.isConnected) {
    resetState();
    return;
  }

  holding = false;
  heldVideo = null;
  resuming = true;

  try {
    void video
      .play()
      .catch((error: unknown) => {
        activeContext?.logger.error(error, { phase: "runtime" });
      })
      .finally(() => {
        resuming = false;
      });
  } catch (error) {
    resuming = false;
    activeContext?.logger.error(error, { phase: "runtime" });
  }
}

function cancelHold(): void {
  clearHoldTimer();
  clearMetadataWait();
  holding = false;
  heldVideo = null;
}

function resetState(): void {
  clearHoldTimer();
  clearMetadataWait();
  holding = false;
  heldVideo = null;
  resuming = false;
}

function clearHoldTimer(): void {
  if (holdTimer !== null) {
    window.clearTimeout(holdTimer);
    holdTimer = null;
  }
}

function clearMetadataWait(): void {
  if (metadataTimer !== null) {
    window.clearTimeout(metadataTimer);
    metadataTimer = null;
  }

  const video = metadataVideo;
  const listener = metadataListener;
  metadataVideo = null;
  metadataListener = null;

  if (video && listener) {
    video.removeEventListener("loadedmetadata", listener);
    video.removeEventListener("durationchange", listener);
  }
}

function findMainVideo(): HTMLVideoElement | null {
  return (
    document.querySelector<HTMLVideoElement>("#movie_player video") ??
    document.querySelector<HTMLVideoElement>("video")
  );
}

function isMainVideo(video: HTMLVideoElement): boolean {
  return findMainVideo() === video;
}

function isLivePlayback(video: HTMLVideoElement): boolean {
  if (video.duration === Number.POSITIVE_INFINITY) {
    return true;
  }

  const badge = document.querySelector<HTMLElement>(LIVE_BADGE_SELECTOR);
  if (!badge) {
    return false;
  }

  const style = window.getComputedStyle(badge);
  return style.display !== "none" && style.visibility !== "hidden";
}

function isAdShowing(): boolean {
  return Boolean(
    document.getElementById("movie_player")?.classList.contains("ad-showing"),
  );
}
