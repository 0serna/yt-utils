import { MESSAGE_LOG_EVENT } from "./messaging";
import type { FeatureLogger, FeatureLoggerMeta } from "./types";

const STORAGE_KEY = "yt-utils:logs";

const MAX_ENTRIES = 1000;

let appendQueue: Promise<void> = Promise.resolve();

export interface LogEntry {
  timestamp: string;
  feature: string;
  event: "activation" | "deactivation" | "error";
  phase?: "activate" | "deactivate" | "runtime";
  url: string;
  videoId?: string;
  error?: {
    code?: string;
    message: string;
    stack?: string;
  };
}

export function createFeatureLogger(featureName: string): FeatureLogger {
  return {
    activation(): void {
      enqueueWrite(buildLogEntry(featureName, "activation"));
    },

    deactivation(): void {
      enqueueWrite(buildLogEntry(featureName, "deactivation"));
    },

    error(error: unknown, meta?: FeatureLoggerMeta): void {
      const context = captureUrlContext();
      const normalized = normalizeError(error);
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        feature: featureName,
        event: "error",
        phase: meta?.phase ?? "runtime",
        url: context.url,
        videoId: context.videoId,
        error: normalized,
      };

      console.error(`[YTUtils:${featureName}]`, error);
      enqueueWrite(entry);
    },
  };
}

function buildLogEntry(
  feature: string,
  event: "activation" | "deactivation",
): LogEntry {
  const context = captureUrlContext();

  return {
    timestamp: new Date().toISOString(),
    feature,
    event,
    url: context.url,
    videoId: context.videoId,
  };
}

export function captureUrlContext(): {
  url: string;
  videoId: string | undefined;
} {
  const url = window.location.href;
  const videoId =
    new URLSearchParams(window.location.search).get("v") ?? undefined;

  return { url, videoId };
}

export function normalizeError(error: unknown): {
  code?: string;
  message: string;
  stack?: string;
} {
  if (error instanceof Error) {
    const typed = error as Error & { code?: string };
    return {
      code: typed.code,
      message: typed.message || "Unknown error",
      stack: typed.stack,
    };
  }

  return { message: String(error) };
}

export function trimLogs(logs: LogEntry[], maxEntries: number): LogEntry[] {
  if (logs.length <= maxEntries) {
    return logs;
  }

  return logs.slice(logs.length - maxEntries);
}

function enqueueWrite(entry: LogEntry): void {
  chrome.runtime.sendMessage({ type: MESSAGE_LOG_EVENT, entry }).catch(() => {
    /* storage write failure is intentionally silent */
  });
}

export async function appendAndTrim(entry: LogEntry): Promise<void> {
  appendQueue = appendQueue
    .catch(() => undefined)
    .then(() => appendAndTrimNow(entry));
  return appendQueue;
}

async function appendAndTrimNow(entry: LogEntry): Promise<void> {
  const raw = await chrome.storage.local.get(STORAGE_KEY);
  const stored: LogEntry[] = Array.isArray(raw[STORAGE_KEY])
    ? raw[STORAGE_KEY]
    : [];

  const trimmed = trimLogs(stored.concat(entry), MAX_ENTRIES);

  await chrome.storage.local.set({ [STORAGE_KEY]: trimmed });
}
