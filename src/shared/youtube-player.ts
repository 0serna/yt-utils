import type {
  BridgeRequest,
  BridgeResponse,
  PlayerSnapshot,
  SubtitleSelection,
} from "@shared/youtube-player-model";
import {
  BRIDGE_SOURCE,
  determineSubtitleSelection,
  isEnglishLanguage,
  isPlayerSnapshot,
  isSpanishLanguage,
  matchesSubtitleSelection,
  readAudioTrackIdentity,
  readSubtitleSignature,
  selectOriginalAudioTrack,
} from "@shared/youtube-player-model";

export type {
  AvailableAudioTrack,
  PlayerSnapshot,
  SubtitleSelection,
} from "@shared/youtube-player-model";
export {
  determineSubtitleSelection,
  isEnglishLanguage,
  isSpanishLanguage,
  matchesSubtitleSelection,
  readAudioTrackIdentity,
  readSubtitleSignature,
  selectOriginalAudioTrack,
};

const BRIDGE_RESPONSE_TIMEOUT_MS = 2000;
const SNAPSHOT_CACHE_MS = 400;
const DEFAULT_SUBTITLE_SELECTION_WAIT = {
  timeoutMs: 1500,
  intervalMs: 100,
};

let requestCounter = 0;
let snapshotCache: {
  startedAt: number;
  promise: Promise<PlayerSnapshot | null>;
} | null = null;

export async function readPlayerSnapshot(): Promise<PlayerSnapshot | null> {
  const now = Date.now();
  if (snapshotCache && now - snapshotCache.startedAt < SNAPSHOT_CACHE_MS) {
    return snapshotCache.promise;
  }

  const promise = sendBridgeRequest("readSnapshot").then((snapshot) =>
    isPlayerSnapshot(snapshot) ? snapshot : null,
  );
  snapshotCache = { startedAt: now, promise };
  return promise;
}

export async function applySubtitleSelection(
  selection: SubtitleSelection,
): Promise<boolean> {
  snapshotCache = null;
  const result = await sendBridgeRequest("applySelection", selection);
  return result === true;
}

export async function applyAudioTrackSelection(
  audioTrackId: string,
): Promise<boolean> {
  snapshotCache = null;
  const result = await sendBridgeRequest(
    "applyAudioTrack",
    undefined,
    audioTrackId,
  );
  return result === true;
}

export async function applyQualityLevel(level: string): Promise<boolean> {
  snapshotCache = null;
  const result = await sendBridgeRequest(
    "applyQuality",
    undefined,
    undefined,
    level,
  );
  return result === true;
}

export async function waitForSubtitleSelection(
  getSnapshot: () => Promise<PlayerSnapshot | null>,
  selection: SubtitleSelection,
  options?: {
    timeoutMs?: number;
    intervalMs?: number;
  },
): Promise<boolean> {
  const config = readWaitForSubtitleSelectionConfig(options);
  const startedAt = Date.now();

  while (Date.now() - startedAt <= config.timeoutMs) {
    if (await selectionMatchesSnapshot(getSnapshot, selection)) {
      return true;
    }

    await delay(config.intervalMs);
  }

  return false;
}

function readWaitForSubtitleSelectionConfig(options?: {
  timeoutMs?: number;
  intervalMs?: number;
}): { timeoutMs: number; intervalMs: number } {
  return { ...DEFAULT_SUBTITLE_SELECTION_WAIT, ...options };
}

async function sendBridgeRequest(
  action: BridgeRequest["action"],
  selection?: SubtitleSelection,
  audioTrackId?: string,
  qualityLevel?: string,
): Promise<PlayerSnapshot | boolean | null> {
  return sendBridgeRequestOnce(action, selection, audioTrackId, qualityLevel);
}

async function sendBridgeRequestOnce(
  action: BridgeRequest["action"],
  selection?: SubtitleSelection,
  audioTrackId?: string,
  qualityLevel?: string,
): Promise<PlayerSnapshot | boolean | null> {
  const id = `${crypto.randomUUID?.() ?? requestCounter++}`;

  return new Promise((resolve) => {
    let settled = false;
    const timeout = window.setTimeout(() => {
      cleanup();
      resolve(null);
    }, BRIDGE_RESPONSE_TIMEOUT_MS);

    const onMessage = (event: MessageEvent<BridgeResponse>) => {
      if (!isMatchingBridgeResponse(event, id)) {
        return;
      }

      cleanup();
      resolve(event.data.result ?? null);
    };

    const cleanup = () => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
    };

    window.addEventListener("message", onMessage);
    const request: BridgeRequest = {
      source: BRIDGE_SOURCE,
      kind: "request",
      id,
      action,
      selection,
      audioTrackId,
      qualityLevel,
    };
    window.postMessage(request, window.location.origin);
  });
}

async function selectionMatchesSnapshot(
  getSnapshot: () => Promise<PlayerSnapshot | null>,
  selection: SubtitleSelection,
): Promise<boolean> {
  const snapshot = await getSnapshot();
  return Boolean(snapshot && matchesSubtitleSelection(snapshot, selection));
}

function isMatchingBridgeResponse(
  event: MessageEvent<BridgeResponse>,
  id: string,
): boolean {
  return event.source === window && isBridgeResponseForId(event.data, id);
}

function isBridgeResponseForId(
  data: BridgeResponse | undefined,
  id: string,
): boolean {
  return isBridgeResponse(data) && data.id === id;
}

function isBridgeResponse(
  data: BridgeResponse | undefined,
): data is BridgeResponse {
  return data?.source === BRIDGE_SOURCE && data?.kind === "response";
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
