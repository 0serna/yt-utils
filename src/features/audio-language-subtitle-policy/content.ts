import type { Feature, FeatureContext } from "@shared/types";
import {
  applySubtitleSelection,
  determineSubtitleSelection,
  isEnglishLanguage,
  matchesSubtitleSelection,
  readPlayerSnapshot,
  readSubtitleSignature,
  waitForSubtitleSelection,
} from "@shared/youtube-player";
import type { PlayerSnapshot, SubtitleSelection } from "@shared/youtube-player";
import {
  getCurrentWatchVideoId,
  isCurrentWatchVideo,
  readConfirmedCurrentVideoSnapshot,
} from "@shared/youtube-session";

const POLL_INTERVAL_MS = 500;

let pollTimer: number | null = null;
let syncQueued = false;
let sessionToken = 0;
let appliedStateByVideo = new Map<string, string>();
let overriddenVideos = new Set<string>();

const audioLanguageSubtitlePolicyFeature: Feature = {
  name: "audio-language-subtitle-policy",
  isWatchPage: true,

  activate(_context: FeatureContext): void {
    sessionToken += 1;
    syncQueued = false;
    appliedStateByVideo = new Map();
    overriddenVideos = new Set();
    startPolling();
    void queueSync();
  },

  deactivate(): void {
    sessionToken += 1;
    syncQueued = false;
    stopPolling();
    appliedStateByVideo.clear();
    overriddenVideos.clear();
  },
};

export default audioLanguageSubtitlePolicyFeature;

function startPolling(): void {
  if (pollTimer !== null) {
    return;
  }

  pollTimer = window.setInterval(() => {
    void queueSync();
  }, POLL_INTERVAL_MS);
}

function stopPolling(): void {
  if (pollTimer !== null) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function queueSync(): Promise<void> {
  if (syncQueued) {
    return;
  }

  syncQueued = true;
  const token = sessionToken;
  try {
    await syncPolicy(token);
  } finally {
    syncQueued = false;
  }
}

async function syncPolicy(token: number): Promise<void> {
  const ctx = await getPolicyContext(token);
  if (!ctx) {
    return;
  }

  const appliedSignature = appliedStateByVideo.get(ctx.videoId);
  if (isPolicyOverridden(ctx.videoId, ctx.currentSignature, appliedSignature)) {
    return;
  }

  if (appliedSignature) {
    return;
  }

  await ensureSubtitleSelection(
    ctx.videoId,
    ctx.snapshot,
    determineSubtitleSelection(ctx.snapshot),
    ctx.currentSignature,
    token,
  );
}

type PolicyContext = {
  videoId: string;
  snapshot: PlayerSnapshot;
  currentSignature: string;
};

async function getPolicyContext(token: number): Promise<PolicyContext | null> {
  if (shouldAbortPolicySync(token)) {
    return null;
  }

  const snapshot = await readConfirmedCurrentVideoSnapshot();
  return createPolicyContext(token, snapshot);
}

function createPolicyContext(
  token: number,
  snapshot: PlayerSnapshot | null,
): PolicyContext | null {
  if (shouldAbortPolicySync(token)) {
    return null;
  }

  if (!snapshot?.videoId) {
    return null;
  }

  return {
    videoId: snapshot.videoId,
    snapshot,
    currentSignature: readSubtitleSignature(snapshot),
  };
}

function shouldAbortPolicySync(token: number): boolean {
  return token !== sessionToken;
}

function isPolicyOverridden(
  videoId: string,
  currentSignature: string,
  appliedSignature: string | undefined,
): boolean {
  if (overriddenVideos.has(videoId)) {
    return true;
  }

  if (appliedSignature && currentSignature !== appliedSignature) {
    overriddenVideos.add(videoId);
    return true;
  }

  return false;
}

async function ensureSubtitleSelection(
  videoId: string,
  snapshot: PlayerSnapshot,
  desiredSelection: SubtitleSelection,
  currentSignature: string,
  token: number,
): Promise<void> {
  if (
    rememberIfSelectionAlreadyMatches(
      snapshot,
      desiredSelection,
      videoId,
      currentSignature,
    )
  ) {
    return;
  }

  const verifiedSnapshot = await applyAndVerifySubtitleSelection(
    token,
    videoId,
    desiredSelection,
  );
  if (!verifiedSnapshot) {
    return;
  }

  rememberAppliedSignature(videoId, readSubtitleSignature(verifiedSnapshot));
}

function rememberIfSelectionAlreadyMatches(
  snapshot: PlayerSnapshot,
  desiredSelection: SubtitleSelection,
  videoId: string,
  currentSignature: string,
): boolean {
  if (!matchesSubtitleSelection(snapshot, desiredSelection)) {
    return false;
  }

  if (shouldRememberMatchingSelection(snapshot, desiredSelection)) {
    rememberAppliedSignature(videoId, currentSignature);
  }
  return true;
}

function shouldRememberMatchingSelection(
  snapshot: PlayerSnapshot,
  desiredSelection: SubtitleSelection,
): boolean {
  if (desiredSelection.mode !== "off") {
    return true;
  }

  if (!snapshot.audioLanguage?.trim()) {
    return false;
  }

  // Don't cache English "off" while captions are still loading — tracks may appear on the next poll.
  return (
    !isEnglishLanguage(snapshot.audioLanguage) ||
    snapshot.captionTracks.length > 0
  );
}

async function applyAndVerifySubtitleSelection(
  token: number,
  videoId: string,
  desiredSelection: SubtitleSelection,
): Promise<PlayerSnapshot | null> {
  const started = await applySubtitleSelection(desiredSelection);
  return started
    ? waitForVerifiedSnapshot(token, videoId, desiredSelection)
    : null;
}

async function waitForVerifiedSnapshot(
  token: number,
  videoId: string,
  desiredSelection: SubtitleSelection,
): Promise<PlayerSnapshot | null> {
  if (!(await waitForSelectionApply(desiredSelection))) {
    return null;
  }

  if (shouldAbortPolicySync(token) || !isCurrentWatchVideo(videoId)) {
    return null;
  }

  return readMatchingVerifiedSnapshot(videoId, desiredSelection);
}

async function readMatchingVerifiedSnapshot(
  videoId: string,
  desiredSelection: SubtitleSelection,
): Promise<PlayerSnapshot | null> {
  const verifiedSnapshot = await readVerifiedSnapshot(videoId);
  return verifiedSnapshot &&
    matchesSubtitleSelection(verifiedSnapshot, desiredSelection)
    ? verifiedSnapshot
    : null;
}

async function waitForSelectionApply(
  desiredSelection: SubtitleSelection,
): Promise<boolean> {
  return waitForSubtitleSelection(readPlayerSnapshot, desiredSelection, {
    timeoutMs: 1800,
    intervalMs: 100,
  });
}

async function readVerifiedSnapshot(
  videoId: string,
): Promise<PlayerSnapshot | null> {
  if (!isCurrentWatchVideo(videoId)) {
    return null;
  }

  const verifiedSnapshot = await readConfirmedCurrentVideoSnapshot();
  return verifiedSnapshot?.videoId === videoId ? verifiedSnapshot : null;
}

function rememberAppliedSignature(videoId: string, signature: string): void {
  appliedStateByVideo.set(videoId, signature);
}

if (!getCurrentWatchVideoId()) {
  stopPolling();
}
