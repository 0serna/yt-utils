import {
  clearAudioSwitchPending,
  markAudioSwitchPending,
} from "@shared/audio-switch";
import type { Feature, FeatureContext } from "@shared/types";
import type {
  AvailableAudioTrack,
  PlayerSnapshot,
} from "@shared/youtube-player";
import {
  applyAudioTrackSelection,
  readAudioTrackIdentity,
  selectOriginalAudioTrack,
} from "@shared/youtube-player";
import {
  createWatchSessionController,
  type WatchSession,
} from "@shared/youtube-session";

const POLL_INTERVAL_MS = 500;
const MAX_APPLY_ATTEMPTS = 5;

let pollTimer: number | null = null;
const watchSessions = createWatchSessionController();
let resolvedVideos = new Set<string>();
let attemptsByVideo = new Map<string, number>();
let lastLoggedDiagnostic = "";

const originalAudioTrackFeature: Feature = {
  name: "original-audio-track",
  isWatchPage: true,

  activate(context: FeatureContext): void {
    watchSessions.activate();
    resolvedVideos = new Set();
    attemptsByVideo = new Map();
    lastLoggedDiagnostic = "";
    startPolling(context.logger);
    void watchSessions.run((session) =>
      syncAudioTrack(session, context.logger),
    );
  },

  deactivate(): void {
    watchSessions.deactivate();
    stopPolling();
    clearAudioSwitchPending();
    resolvedVideos.clear();
    attemptsByVideo.clear();
    lastLoggedDiagnostic = "";
  },
};

export default originalAudioTrackFeature;

function startPolling(logger: FeatureContext["logger"]): void {
  if (pollTimer !== null) {
    return;
  }

  pollTimer = window.setInterval(() => {
    void watchSessions.run((session) => syncAudioTrack(session, logger));
  }, POLL_INTERVAL_MS);
}

function stopPolling(): void {
  if (pollTimer !== null) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function syncAudioTrack(
  session: WatchSession,
  logger: FeatureContext["logger"],
): Promise<void> {
  const snapshot = await session.readSnapshot();
  if (!snapshot?.videoId || !session.isCurrent()) {
    return;
  }

  const videoId = snapshot.videoId;
  if (resolvedVideos.has(videoId)) {
    return;
  }

  const original = selectOriginalAudioTrack(snapshot.availableAudioTracks);
  const activeId = readAudioTrackIdentity(snapshot.audioTrack);
  const attempts = attemptsByVideo.get(videoId) ?? 0;

  if (!original?.id) {
    clearAudioSwitchPending();
    logAudioDiagnostic(snapshot, original, "skip-no-original", logger);
    return;
  }

  if (activeId === original.id) {
    resolvedVideos.add(videoId);
    clearAudioSwitchPending();
    logAudioDiagnostic(snapshot, original, "keep-original", logger);
    return;
  }

  if (attempts >= MAX_APPLY_ATTEMPTS) {
    resolvedVideos.add(videoId);
    clearAudioSwitchPending();
    logger.diagnostic({
      stage: "original-audio-track",
      action: "give-up",
      videoId,
      attempts,
      originalTrack: original,
      activeTrackId: activeId,
    });
    return;
  }

  attemptsByVideo.set(videoId, attempts + 1);
  if (attempts === 0) {
    logAudioDiagnostic(snapshot, original, "apply", logger);
  }

  markAudioSwitchPending();
  await applyAudioTrackSelection(original.id);
}

function logAudioDiagnostic(
  snapshot: PlayerSnapshot,
  original: AvailableAudioTrack | null,
  action: "apply" | "keep-original" | "skip-no-original",
  logger: FeatureContext["logger"],
): void {
  const details = {
    stage: "original-audio-track",
    action,
    videoId: snapshot.videoId,
    availableAudioTrackCount: snapshot.availableAudioTracks.length,
    activeTrackId: readAudioTrackIdentity(snapshot.audioTrack),
    activeTrackLanguage: snapshot.audioLanguage,
    originalTrack: original,
  };
  const key = JSON.stringify(details);

  if (key === lastLoggedDiagnostic) {
    return;
  }

  lastLoggedDiagnostic = key;
  logger.diagnostic(details);
}
