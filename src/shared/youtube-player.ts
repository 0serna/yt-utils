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
const BRIDGE_FALLBACK_INSTALL_DELAY_MS = 400;
const BRIDGE_MODULE_RESOURCE_HINT = "youtube-player-bridge.ts-";
const DEFAULT_SUBTITLE_SELECTION_WAIT = {
  timeoutMs: 1500,
  intervalMs: 100,
};

type WebAccessibleManifest = {
  web_accessible_resources?: Array<{ resources?: unknown[] }>;
};

let requestCounter = 0;
let bridgeFallbackAttempted = false;

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

export async function applyAudioTrackSelection(
  audioTrackId: string,
): Promise<boolean> {
  const result = await sendBridgeRequest(
    "applyAudioTrack",
    undefined,
    audioTrackId,
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
): Promise<PlayerSnapshot | boolean | null> {
  const result = await sendBridgeRequestOnce(action, selection, audioTrackId);
  if (result !== null || action !== "readSnapshot") {
    return result;
  }

  if (!(await installBridgeFallbackScript())) {
    return result;
  }

  await delay(BRIDGE_FALLBACK_INSTALL_DELAY_MS);
  return sendBridgeRequestOnce(action, selection, audioTrackId);
}

async function installBridgeFallbackScript(): Promise<boolean> {
  if (bridgeFallbackAttempted) {
    return false;
  }

  bridgeFallbackAttempted = true;
  try {
    const response = await fetch(chrome.runtime.getURL("manifest.json"));
    if (!response.ok) {
      return false;
    }

    const manifest = (await response.json()) as WebAccessibleManifest;
    const resource = findBridgeModuleResource(manifest);
    if (!resource) {
      return false;
    }

    const parent = document.head ?? document.documentElement;
    if (!parent) {
      return false;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = chrome.runtime.getURL(resource);
    parent.appendChild(script);
    return true;
  } catch {
    return false;
  }
}

export function findBridgeModuleResource(
  manifest: WebAccessibleManifest | null,
): string | null {
  for (const entry of manifest?.web_accessible_resources ?? []) {
    for (const resource of entry?.resources ?? []) {
      if (
        typeof resource === "string" &&
        resource.includes(BRIDGE_MODULE_RESOURCE_HINT) &&
        resource.endsWith(".js")
      ) {
        return resource;
      }
    }
  }

  return null;
}

async function sendBridgeRequestOnce(
  action: BridgeRequest["action"],
  selection?: SubtitleSelection,
  audioTrackId?: string,
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
      audioTrackId,
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
