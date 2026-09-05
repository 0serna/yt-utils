import type { Feature, FeatureContext } from "@shared/types";
import type { PlayerSnapshot, SubtitleSelection } from "@shared/youtube-player";
import {
  applySubtitleSelection,
  determineSubtitleSelection,
  isEnglishLanguage,
  matchesSubtitleSelection,
  readSubtitleSignature,
  waitForSubtitleSelection,
} from "@shared/youtube-player";
import {
  createWatchSessionController,
  type WatchSession,
} from "@shared/youtube-session";

const POLL_INTERVAL_MS = 500;
const RENDERER_FALLBACK_GRACE_MS = 3000;
const UI_TOGGLE_DELAY_MS = 200;

let pollTimer: number | null = null;
const watchSessions = createWatchSessionController();
let appliedStateByVideo = new Map<string, string>();
let overriddenVideos = new Set<string>();
let rendererFallbackAttempted = new Set<string>();

const audioLanguageSubtitlePolicyFeature: Feature = {
  name: "audio-language-subtitle-policy",
  isWatchPage: true,

  activate(_context: FeatureContext): void {
    watchSessions.activate();
    appliedStateByVideo = new Map();
    overriddenVideos = new Set();
    rendererFallbackAttempted = new Set();
    startPolling();
    void watchSessions.run(syncPolicy);
  },

  deactivate(): void {
    watchSessions.deactivate();
    stopPolling();
    appliedStateByVideo.clear();
    overriddenVideos.clear();
    rendererFallbackAttempted.clear();
  },
};

export default audioLanguageSubtitlePolicyFeature;

function startPolling(): void {
  if (pollTimer !== null) {
    return;
  }

  pollTimer = window.setInterval(() => {
    void watchSessions.run(syncPolicy);
  }, POLL_INTERVAL_MS);
}

function stopPolling(): void {
  if (pollTimer !== null) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function syncPolicy(session: WatchSession): Promise<void> {
  const ctx = await getPolicyContext(session);
  if (!ctx || !session.isCurrent()) {
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
    session,
  );
}

type PolicyContext = {
  videoId: string;
  snapshot: PlayerSnapshot;
  currentSignature: string;
};

async function getPolicyContext(
  session: WatchSession,
): Promise<PolicyContext | null> {
  if (!session.isCurrent()) {
    return null;
  }

  const snapshot = await session.readSnapshot();
  return createPolicyContext(session, snapshot);
}

function createPolicyContext(
  session: WatchSession,
  snapshot: PlayerSnapshot | null,
): PolicyContext | null {
  if (!session.isCurrent()) {
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
  session: WatchSession,
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
    session,
    desiredSelection,
  );
  if (!verifiedSnapshot || !session.isCurrent()) {
    return;
  }

  rememberAppliedSignature(videoId, readSubtitleSignature(verifiedSnapshot));

  if (desiredSelection.mode === "track") {
    void scheduleRendererFallback(videoId, desiredSelection, session);
  }
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
  session: WatchSession,
  desiredSelection: SubtitleSelection,
): Promise<PlayerSnapshot | null> {
  if (!session.isCurrent()) return null;
  const started = await applySubtitleSelection(desiredSelection);
  return started ? waitForVerifiedSnapshot(session, desiredSelection) : null;
}

async function waitForVerifiedSnapshot(
  session: WatchSession,
  desiredSelection: SubtitleSelection,
): Promise<PlayerSnapshot | null> {
  if (!(await waitForSelectionApply(session, desiredSelection))) {
    return null;
  }

  if (!session.isCurrent()) {
    return null;
  }

  return readMatchingVerifiedSnapshot(session, desiredSelection);
}

async function readMatchingVerifiedSnapshot(
  session: WatchSession,
  desiredSelection: SubtitleSelection,
): Promise<PlayerSnapshot | null> {
  const verifiedSnapshot = await session.readSnapshot();
  return session.isCurrent() &&
    verifiedSnapshot &&
    matchesSubtitleSelection(verifiedSnapshot, desiredSelection)
    ? verifiedSnapshot
    : null;
}

async function waitForSelectionApply(
  session: WatchSession,
  desiredSelection: SubtitleSelection,
): Promise<boolean> {
  return waitForSubtitleSelection(session.readSnapshot, desiredSelection, {
    timeoutMs: 2500,
    intervalMs: 100,
  });
}

function rememberAppliedSignature(videoId: string, signature: string): void {
  appliedStateByVideo.set(videoId, signature);
}

function hasRenderedCaptionText(): boolean {
  const segments = document.querySelectorAll(".ytp-caption-segment");
  return [...segments].some(
    (segment) => (segment.textContent ?? "").trim().length > 0,
  );
}

async function refreshCaptionsUI(session: WatchSession): Promise<void> {
  const button = document.querySelector<HTMLElement>(".ytp-subtitles-button");
  if (!button || !session.isCurrent()) {
    return;
  }
  button.click();
  await delay(UI_TOGGLE_DELAY_MS);
  if (session.isCurrent() && button.isConnected) button.click();
}

async function scheduleRendererFallback(
  videoId: string,
  desiredSelection: SubtitleSelection,
  session: WatchSession,
): Promise<void> {
  if (rendererFallbackAttempted.has(videoId)) {
    return;
  }

  await delay(RENDERER_FALLBACK_GRACE_MS);

  if (!session.isCurrent()) {
    return;
  }

  if (overriddenVideos.has(videoId)) {
    return;
  }

  const snapshot = await session.readSnapshot();
  if (!snapshot || !session.isCurrent()) {
    return;
  }

  if (!matchesSubtitleSelection(snapshot, desiredSelection)) {
    return;
  }

  if (hasRenderedCaptionText()) {
    return;
  }

  rendererFallbackAttempted.add(videoId);
  await refreshCaptionsUI(session);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
