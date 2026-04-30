import type { Feature, FeatureContext } from "@shared/types";
import {
  applySubtitleSelection,
  determineSubtitleSelection,
  matchesSubtitleSelection,
  readPlayerSnapshot,
  readSubtitleSignature,
  waitForSubtitleSelection,
} from "@shared/youtube-player";
import type { PlayerSnapshot, SubtitleSelection } from "@shared/youtube-player";

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
    appliedStateByVideo = new Map();
    overriddenVideos = new Set();
    startPolling();
    void queueSync();
  },

  deactivate(): void {
    sessionToken += 1;
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

  const { videoId, snapshot, currentSignature } = ctx;
  const appliedSignature = appliedStateByVideo.get(videoId);

  if (isPolicyOverridden(videoId, currentSignature, appliedSignature)) {
    return;
  }

  const desiredSelection = determineSubtitleSelection(snapshot);

  if (appliedSignature) {
    // Already applied for this video; check if it's still valid.
    if (currentSignature !== appliedSignature) {
      overriddenVideos.add(videoId);
    }
    return;
  }

  await ensureSubtitleSelection(
    videoId,
    snapshot,
    desiredSelection,
    currentSignature,
    token,
  );
}

type PolicyContext = {
  videoId: string;
  snapshot: PlayerSnapshot;
  currentSignature: string;
};

async function getPolicyContext(token: number): Promise<PolicyContext | null> {
  if (token !== sessionToken) {
    return null;
  }

  const snapshot = await readPlayerSnapshot();
  if (token !== sessionToken) {
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
  token: number,
): Promise<void> {
  if (matchesSubtitleSelection(snapshot, desiredSelection)) {
    appliedStateByVideo.set(videoId, currentSignature);
    return;
  }

  const started = await applySubtitleSelection(desiredSelection);
  if (!started) {
    return;
  }

  const applied = await waitForSubtitleSelection(
    readPlayerSnapshot,
    desiredSelection,
    { timeoutMs: 1800, intervalMs: 100 },
  );

  if (!applied || token !== sessionToken) {
    return;
  }

  const verifiedSnapshot = await readPlayerSnapshot();
  if (
    !verifiedSnapshot?.videoId ||
    verifiedSnapshot.videoId !== snapshot.videoId
  ) {
    return;
  }

  if (!matchesSubtitleSelection(verifiedSnapshot, desiredSelection)) {
    return;
  }

  appliedStateByVideo.set(
    verifiedSnapshot.videoId,
    readSubtitleSignature(verifiedSnapshot),
  );
}

function isSupportedWatchPage(): boolean {
  return (
    window.location.hostname === "www.youtube.com" &&
    window.location.pathname === "/watch" &&
    new URLSearchParams(window.location.search).has("v")
  );
}

if (!isSupportedWatchPage()) {
  stopPolling();
}
