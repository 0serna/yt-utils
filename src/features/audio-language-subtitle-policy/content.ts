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
  summarizeCaptionTrack,
  summarizePlayerSnapshot,
} from "@shared/youtube-player-model";
import {
  createWatchSessionController,
  type WatchSession,
} from "@shared/youtube-session";

const POLL_INTERVAL_MS = 500;
const PLAYER_SETTLE_GRACE_MS = 3000;
const UI_TOGGLE_DELAY_MS = 200;

let pollTimer: number | null = null;
const watchSessions = createWatchSessionController();
let appliedStateByVideo = new Map<string, string>();
let appliedAtByVideo = new Map<string, number>();
let overriddenVideos = new Set<string>();
let rendererFallbackAttempted = new Set<string>();
let lastLoggedDiagnostic = "";

const audioLanguageSubtitlePolicyFeature: Feature = {
  name: "audio-language-subtitle-policy",
  isWatchPage: true,

  activate(context: FeatureContext): void {
    watchSessions.activate();
    appliedStateByVideo = new Map();
    appliedAtByVideo = new Map();
    overriddenVideos = new Set();
    rendererFallbackAttempted = new Set();
    lastLoggedDiagnostic = "";
    startPolling(context.logger);
    void watchSessions.run((session) => syncPolicy(session, context.logger));
  },

  deactivate(): void {
    watchSessions.deactivate();
    stopPolling();
    appliedStateByVideo.clear();
    appliedAtByVideo.clear();
    overriddenVideos.clear();
    rendererFallbackAttempted.clear();
    lastLoggedDiagnostic = "";
  },
};

export default audioLanguageSubtitlePolicyFeature;

function startPolling(logger: FeatureContext["logger"]): void {
  if (pollTimer !== null) {
    return;
  }

  pollTimer = window.setInterval(() => {
    void watchSessions.run((session) => syncPolicy(session, logger));
  }, POLL_INTERVAL_MS);
}

function stopPolling(): void {
  if (pollTimer !== null) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function syncPolicy(
  session: WatchSession,
  logger: FeatureContext["logger"],
): Promise<void> {
  const ctx = await getPolicyContext(session);
  if (!ctx || !session.isCurrent()) {
    return;
  }

  const appliedSignature = appliedStateByVideo.get(ctx.videoId);
  const desiredSelection = determineSubtitleSelection(ctx.snapshot);
  const overridden = isPolicyOverridden(
    ctx.videoId,
    ctx.currentSignature,
    appliedSignature,
  );
  logPolicyDiagnostic(
    ctx,
    desiredSelection,
    appliedSignature,
    overridden,
    logger,
  );
  if (overridden) {
    return;
  }

  if (appliedSignature && ctx.currentSignature === appliedSignature) {
    return;
  }

  await ensureSubtitleSelection(
    ctx.videoId,
    ctx.snapshot,
    desiredSelection,
    ctx.currentSignature,
    session,
  );
}

function logPolicyDiagnostic(
  ctx: PolicyContext,
  desiredSelection: SubtitleSelection,
  appliedSignature: string | undefined,
  overridden: boolean,
  logger: FeatureContext["logger"],
): void {
  const details = {
    stage: "subtitle-policy",
    action: overridden
      ? "skip-overridden"
      : appliedSignature && ctx.currentSignature === appliedSignature
        ? "skip-applied"
        : appliedSignature
          ? "reapply"
          : "apply",
    currentSignature: ctx.currentSignature,
    appliedSignature: appliedSignature ?? null,
    overridden,
    desiredSelection:
      desiredSelection.mode === "track"
        ? {
            mode: desiredSelection.mode,
            track: summarizeCaptionTrack(desiredSelection.track),
          }
        : desiredSelection,
    ...summarizePlayerSnapshot(ctx.snapshot),
  };
  const key = JSON.stringify(details);

  if (key === lastLoggedDiagnostic) {
    return;
  }

  lastLoggedDiagnostic = key;
  logger.diagnostic(details);
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
    const appliedAt = appliedAtByVideo.get(videoId);
    if (appliedAt && Date.now() - appliedAt < PLAYER_SETTLE_GRACE_MS) {
      return false;
    }

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
  appliedAtByVideo.set(videoId, appliedAtByVideo.get(videoId) ?? Date.now());
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

  await delay(PLAYER_SETTLE_GRACE_MS);

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
