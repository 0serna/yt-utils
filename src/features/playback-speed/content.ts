import { getBootstrapIconMarkup } from "@shared/bootstrap-icons";
import { hasRelevantSelectorMutation } from "@shared/dom-mutations";
import { applyExtensionButtonStyles } from "@shared/extension-button";
import {
  formatPlaybackSpeed,
  normalizePlaybackSpeed,
  PLAYBACK_SPEED_DEFAULT,
  PLAYBACK_SPEED_MAX,
  PLAYBACK_SPEED_MIN,
  PLAYBACK_SPEED_STEP,
} from "@shared/playback-speed";
import type { Feature, FeatureContext } from "@shared/types";
import {
  isDesktopWatchPage,
  placeWatchActionHost,
  RELEVANT_MUTATION_SELECTORS,
} from "@shared/youtube-dom";
import { isEnglishLanguage, isSpanishLanguage } from "@shared/youtube-player";
import type { PlayerSnapshot } from "@shared/youtube-player";
import {
  getCurrentWatchVideoId,
  readConfirmedCurrentVideoSnapshot,
} from "@shared/youtube-session";

const CONTROL_HOST_ID = "yt-utils-speed-host";
const SPEED_DECREMENT_ID = "yt-utils-speed-decrement";
const SPEED_VALUE_ID = "yt-utils-speed-value";
const SPEED_INCREMENT_ID = "yt-utils-speed-increment";
const MARK_AS_SEEN_HOST_ID = "yt-utils-inline-host";

let localSpeed: number = PLAYBACK_SPEED_DEFAULT;
let observer: MutationObserver | null = null;
let ensureQueued = false;
let userInteracted = false;
let pollTimer: number | null = null;
let sessionToken = 0;
let syncQueued = false;
let initializedVideoId: string | null = null;

const playbackSpeedFeature: Feature = {
  name: "playback-speed",
  isWatchPage: true,

  activate(_context: FeatureContext): void {
    sessionToken += 1;
    localSpeed = PLAYBACK_SPEED_DEFAULT;
    userInteracted = false;
    syncQueued = false;
    initializedVideoId = null;
    ensureSpeedControl();
    applySpeedToVideo();
    observePage();
    startPolling();
    void queueSync(sessionToken);
  },

  deactivate(): void {
    sessionToken += 1;
    removeSpeedControl();
    syncQueued = false;
    initializedVideoId = null;
    stopPolling();
    stopObserving();
  },
};

export default playbackSpeedFeature;

function ensureSpeedControl(): void {
  if (!isDesktopWatchPage()) {
    removeSpeedControl();
    return;
  }

  let host = document.getElementById(CONTROL_HOST_ID);
  if (!host) {
    host = createSpeedControlHost();
  }

  if (
    !placeWatchActionHost(host, {
      excludedHostIds: [CONTROL_HOST_ID, MARK_AS_SEEN_HOST_ID],
      preferredBeforeHostId: MARK_AS_SEEN_HOST_ID,
    })
  ) {
    return;
  }

  syncControlState();
}

function removeSpeedControl(): void {
  const host = document.getElementById(CONTROL_HOST_ID);
  if (host) {
    host.remove();
  }
}

function createSpeedControlHost(): HTMLElement {
  const host = document.createElement("div");
  host.id = CONTROL_HOST_ID;
  host.style.display = "inline-flex";
  host.style.alignItems = "center";
  host.style.gap = "0px";
  host.style.marginInlineEnd = "8px";
  host.style.flex = "0 0 auto";
  host.style.pointerEvents = "auto";

  const decrementBtn = document.createElement("button");
  decrementBtn.id = SPEED_DECREMENT_ID;
  decrementBtn.type = "button";
  decrementBtn.setAttribute("aria-label", "Decrease playback speed");
  decrementBtn.title = "Decrease playback speed";
  decrementBtn.innerHTML = getBootstrapIconMarkup("dash");
  applyExtensionButtonStyles(decrementBtn);
  decrementBtn.onclick = onDecrement;

  const valueDisplay = document.createElement("span");
  valueDisplay.id = SPEED_VALUE_ID;
  valueDisplay.style.padding = "0 4px";
  valueDisplay.style.fontSize = "12px";
  valueDisplay.style.fontWeight = "600";
  valueDisplay.style.fontVariantNumeric = "tabular-nums";
  valueDisplay.style.color = "var(--yt-spec-text-primary, #f1f1f1)";
  valueDisplay.style.userSelect = "none";
  valueDisplay.style.whiteSpace = "nowrap";
  valueDisplay.style.minWidth = "32px";
  valueDisplay.style.textAlign = "center";
  valueDisplay.style.cursor = "pointer";
  valueDisplay.textContent = formatPlaybackSpeed(PLAYBACK_SPEED_DEFAULT);
  valueDisplay.onclick = onReset;

  const incrementBtn = document.createElement("button");
  incrementBtn.id = SPEED_INCREMENT_ID;
  incrementBtn.type = "button";
  incrementBtn.setAttribute("aria-label", "Increase playback speed");
  incrementBtn.title = "Increase playback speed";
  incrementBtn.innerHTML = getBootstrapIconMarkup("plus");
  applyExtensionButtonStyles(incrementBtn);
  incrementBtn.onclick = onIncrement;

  host.append(decrementBtn, valueDisplay, incrementBtn);
  return host;
}

function syncControlState(): void {
  syncSpeedButton(SPEED_DECREMENT_ID, localSpeed <= PLAYBACK_SPEED_MIN);
  syncSpeedButton(SPEED_INCREMENT_ID, localSpeed >= PLAYBACK_SPEED_MAX);

  const valueDisplay = document.getElementById(SPEED_VALUE_ID);
  if (valueDisplay) {
    valueDisplay.textContent = formatPlaybackSpeed(localSpeed);
  }
}

function syncSpeedButton(buttonId: string, atLimit: boolean): void {
  const button = document.getElementById(buttonId) as HTMLButtonElement | null;
  if (!button) {
    return;
  }

  button.disabled = atLimit;
  button.style.opacity = atLimit ? "0.4" : "1";
  button.style.cursor = atLimit ? "default" : "pointer";
}

function startPolling(): void {
  if (pollTimer !== null) {
    return;
  }

  pollTimer = window.setInterval(() => {
    void queueSync(sessionToken);
  }, 500);
}

function stopPolling(): void {
  if (pollTimer !== null) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
}

function applySpeedToVideo(): void {
  const video = document.querySelector<HTMLVideoElement>("video");
  if (video) {
    video.playbackRate = localSpeed;
  }
}

function onDecrement(event: Event): void {
  event.preventDefault();
  event.stopPropagation();
  userInteracted = true;
  localSpeed = normalizePlaybackSpeed(localSpeed - PLAYBACK_SPEED_STEP);
  syncControlState();
  applySpeedToVideo();
}

function onIncrement(event: Event): void {
  event.preventDefault();
  event.stopPropagation();
  userInteracted = true;
  localSpeed = normalizePlaybackSpeed(localSpeed + PLAYBACK_SPEED_STEP);
  syncControlState();
  applySpeedToVideo();
}

function onReset(event: Event): void {
  event.preventDefault();
  event.stopPropagation();
  if (localSpeed === PLAYBACK_SPEED_DEFAULT) {
    return;
  }
  userInteracted = true;
  localSpeed = PLAYBACK_SPEED_DEFAULT;
  syncControlState();
  applySpeedToVideo();
}

function observePage(): void {
  if (observer) {
    return;
  }

  observer = new MutationObserver((mutations) => {
    if (!mutations.some(isRelevantSpeedMutation)) {
      return;
    }
    queueEnsureSpeedControl();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

function isRelevantSpeedMutation(mutation: MutationRecord): boolean {
  return hasRelevantSelectorMutation([mutation], {
    isInsideOwnedSurface: isInsideSpeedControl,
    isExternalNode: isExternalSpeedNode,
    selector: RELEVANT_MUTATION_SELECTORS,
  });
}

function isExternalSpeedNode(node: Element): boolean {
  return (
    node.id !== CONTROL_HOST_ID && !node.querySelector?.(`#${CONTROL_HOST_ID}`)
  );
}

function stopObserving(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

function queueEnsureSpeedControl(): void {
  if (ensureQueued) {
    return;
  }

  ensureQueued = true;

  window.requestAnimationFrame(() => {
    ensureQueued = false;
    ensureSpeedControl();
    applySpeedToVideo();
  });
}

async function queueSync(token: number): Promise<void> {
  if (syncQueued) {
    return;
  }

  syncQueued = true;
  try {
    await syncSpeedForCurrentVideo(token);
  } finally {
    syncQueued = false;
  }
}

async function syncSpeedForCurrentVideo(token: number): Promise<void> {
  if (shouldSkipSync(token)) {
    return;
  }

  const snapshot = await readConfirmedCurrentVideoSnapshot();
  if (!snapshot) {
    return;
  }

  if (shouldSkipSync(token) || getCurrentWatchVideoId() !== snapshot.videoId) {
    return;
  }

  applySpeedForLanguage(snapshot);
}

function shouldSkipSync(token: number): boolean {
  return token !== sessionToken || userInteracted;
}

function applySpeedForLanguage(snapshot: PlayerSnapshot): void {
  if (initializedVideoId === snapshot.videoId) {
    return;
  }

  const speedLanguage = readSpeedLanguage(snapshot);
  if (!speedLanguage) {
    return;
  }

  const nextSpeed = getSpeedForLanguage(speedLanguage);
  initializedVideoId = snapshot.videoId;

  if (localSpeed === nextSpeed) {
    return;
  }

  localSpeed = nextSpeed;
  syncControlState();
  applySpeedToVideo();
}

function readSpeedLanguage(snapshot: PlayerSnapshot): string | null {
  return (
    snapshot.audioLanguage ||
    snapshot.captionTracks.find((track) =>
      isSpanishLanguage(track.languageCode),
    )?.languageCode ||
    snapshot.captionTracks.find((track) =>
      isEnglishLanguage(track.languageCode),
    )?.languageCode ||
    null
  );
}

function getSpeedForLanguage(audioLanguage: string | null | undefined): number {
  if (isSpanishLanguage(audioLanguage)) {
    return normalizePlaybackSpeed(1.1);
  }

  if (isEnglishLanguage(audioLanguage)) {
    return normalizePlaybackSpeed(0.95);
  }

  return PLAYBACK_SPEED_DEFAULT;
}

function isInsideSpeedControl(node: Node): boolean {
  return (
    node instanceof Element && Boolean(node.closest(`#${CONTROL_HOST_ID}`))
  );
}
