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
  const timeoutMs = options?.timeoutMs ?? 1500;
  const intervalMs = options?.intervalMs ?? 100;
  const startedAt = Date.now();

  while (Date.now() - startedAt <= timeoutMs) {
    const snapshot = await getSnapshot();
    if (snapshot && matchesSubtitleSelection(snapshot, selection)) {
      return true;
    }

    await delay(intervalMs);
  }

  return false;
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
      if (
        event.source !== window ||
        event.data?.source !== BRIDGE_SOURCE ||
        event.data?.kind !== "response" ||
        event.data?.id !== id
      ) {
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
