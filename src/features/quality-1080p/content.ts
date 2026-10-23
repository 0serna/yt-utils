import type { Feature, FeatureContext } from "@shared/types";
import type { PlayerSnapshot } from "@shared/youtube-player";
import { applyQualityLevel } from "@shared/youtube-player";
import {
  createWatchSessionController,
  type WatchSession,
} from "@shared/youtube-session";

const POLL_INTERVAL_MS = 500;
const MAX_APPLY_ATTEMPTS = 5;
const TARGET_QUALITY_LEVEL = "hd1080";

let pollTimer: number | null = null;
const watchSessions = createWatchSessionController();
let resolvedSession: WatchSession | null = null;
let attemptedSession: WatchSession | null = null;
let applyAttempts = 0;
let lastLoggedDiagnostic = "";

const quality1080pFeature: Feature = {
  name: "quality-1080p",
  isWatchPage: true,

  activate(context: FeatureContext): void {
    watchSessions.activate();
    resolvedSession = null;
    attemptedSession = null;
    applyAttempts = 0;
    lastLoggedDiagnostic = "";
    startPolling(context.logger);
    void watchSessions.run((session) =>
      syncQualityLevel(session, context.logger),
    );
  },

  deactivate(): void {
    watchSessions.deactivate();
    stopPolling();
    resolvedSession = null;
    attemptedSession = null;
    applyAttempts = 0;
    lastLoggedDiagnostic = "";
  },
};

export default quality1080pFeature;

function startPolling(logger: FeatureContext["logger"]): void {
  if (pollTimer !== null) {
    return;
  }

  pollTimer = window.setInterval(() => {
    void watchSessions.run((session) => syncQualityLevel(session, logger));
  }, POLL_INTERVAL_MS);
}

function stopPolling(): void {
  if (pollTimer !== null) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function syncQualityLevel(
  session: WatchSession,
  logger: FeatureContext["logger"],
): Promise<void> {
  const snapshot = await session.readSnapshot();
  if (!snapshot?.videoId || !session.isCurrent()) {
    return;
  }

  if (resolvedSession === session) {
    return;
  }

  if (attemptedSession !== session) {
    attemptedSession = session;
    applyAttempts = 0;
  }

  const availableQualityLevels = snapshot.availableQualityLevels ?? [];
  if (availableQualityLevels.length === 0) {
    return;
  }

  if (!availableQualityLevels.includes(TARGET_QUALITY_LEVEL)) {
    resolvedSession = session;
    logQualityDiagnostic(snapshot, "skip-no-1080p", logger);
    return;
  }

  if (applyAttempts >= MAX_APPLY_ATTEMPTS) {
    resolvedSession = session;
    logQualityDiagnostic(snapshot, "give-up", logger);
    return;
  }

  applyAttempts += 1;
  if (applyAttempts === 1) {
    logQualityDiagnostic(snapshot, "apply", logger);
  }

  const applied = await applyQualityLevel(TARGET_QUALITY_LEVEL);
  if (applied && session.isCurrent()) {
    resolvedSession = session;
  }
}

function logQualityDiagnostic(
  snapshot: PlayerSnapshot,
  action: "apply" | "skip-no-1080p" | "give-up",
  logger: FeatureContext["logger"],
): void {
  const details = {
    stage: "quality-1080p",
    action,
    videoId: snapshot.videoId,
    qualityLevel: snapshot.qualityLevel ?? null,
    availableQualityLevels: snapshot.availableQualityLevels ?? [],
  };
  const key = JSON.stringify(details);

  if (key === lastLoggedDiagnostic) {
    return;
  }

  lastLoggedDiagnostic = key;
  logger.diagnostic(details);
}
