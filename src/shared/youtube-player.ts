import {
  BRIDGE_SOURCE,
  determineSubtitleSelection,
  isEnglishLanguage,
  isSpanishLanguage,
  matchesSubtitleSelection,
  readSubtitleSignature,
} from "@shared/youtube-player-model";
import type {
  BridgeRequest,
  BridgeResponse,
  PlayerSnapshot,
  SubtitleSelection,
} from "@shared/youtube-player-model";

export {
  determineSubtitleSelection,
  isEnglishLanguage,
  isSpanishLanguage,
  matchesSubtitleSelection,
  readSubtitleSignature,
};
export type {
  PlayerSnapshot,
  SubtitleSelection,
} from "@shared/youtube-player-model";

const BRIDGE_RESPONSE_TIMEOUT_MS = 2000;
const DEFAULT_SUBTITLE_SELECTION_WAIT = {
  timeoutMs: 1500,
  intervalMs: 100,
};

let requestCounter = 0;

export async function readPlayerSnapshot(): Promise<PlayerSnapshot | null> {
  const snapshot = await sendBridgeRequest("readSnapshot");
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  return snapshot as PlayerSnapshot;
}

export async function applySubtitleSelection(
  selection: SubtitleSelection,
): Promise<boolean> {
  const result = await sendBridgeRequest("applySelection", selection);
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
): Promise<PlayerSnapshot | boolean | null> {
  const id = `${Date.now()}-${requestCounter++}`;

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
