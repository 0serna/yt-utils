import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  appendAndTrim,
  captureUrlContext,
  createFeatureLogger,
  normalizeError,
  trimLogs,
} from "./feature-logger";
import type { LogEntry } from "./feature-logger";

describe("captureUrlContext", () => {
  it("captures full URL and videoId from watch page", () => {
    Object.defineProperty(window, "location", {
      value: {
        href: "https://www.youtube.com/watch?v=abc123&t=42",
        search: "?v=abc123&t=42",
      },
      writable: true,
      configurable: true,
    });

    const context = captureUrlContext();
    expect(context.url).toBe("https://www.youtube.com/watch?v=abc123&t=42");
    expect(context.videoId).toBe("abc123");
  });

  it("returns undefined videoId when URL has no v param", () => {
    Object.defineProperty(window, "location", {
      value: {
        href: "https://www.youtube.com/feed/subscriptions",
        search: "",
      },
      writable: true,
      configurable: true,
    });

    const context = captureUrlContext();
    expect(context.url).toBe("https://www.youtube.com/feed/subscriptions");
    expect(context.videoId).toBeUndefined();
  });
});

describe("normalizeError", () => {
  it("extracts message and stack from Error instances", () => {
    const error = new Error("something broke");
    const normalized = normalizeError(error);

    expect(normalized.message).toBe("something broke");
    expect(normalized.stack).toBeDefined();
    expect(normalized.code).toBeUndefined();
  });

  it("extracts code from Error with code property", () => {
    const error = Object.assign(new Error("fail"), {
      code: "CUSTOM_CODE",
    }) as Error & { code: string };
    const normalized = normalizeError(error);

    expect(normalized.code).toBe("CUSTOM_CODE");
    expect(normalized.message).toBe("fail");
  });

  it("converts non-Error values to string messages", () => {
    const normalized = normalizeError("plain string error");
    expect(normalized.message).toBe("plain string error");
    expect(normalized.stack).toBeUndefined();
    expect(normalized.code).toBeUndefined();
  });
});

describe("trimLogs", () => {
  const makeEntry = (feature: string): LogEntry => ({
    timestamp: new Date().toISOString(),
    feature,
    event: "activation",
    url: "https://example.com",
  });

  it("keeps all entries when under the limit", () => {
    const logs = [makeEntry("a"), makeEntry("b"), makeEntry("c")];
    const result = trimLogs(logs, 5);
    expect(result).toHaveLength(3);
    expect(result).toEqual(logs);
  });

  it("trims oldest entries when over the limit", () => {
    const logs = [makeEntry("a"), makeEntry("b"), makeEntry("c")];
    const result = trimLogs(logs, 2);
    expect(result).toHaveLength(2);
    expect(result[0].feature).toBe("b");
    expect(result[1].feature).toBe("c");
  });

  it("handles exact limit", () => {
    const logs = [makeEntry("a"), makeEntry("b")];
    const result = trimLogs(logs, 2);
    expect(result).toHaveLength(2);
  });

  it("handles empty array", () => {
    const result = trimLogs([], 1000);
    expect(result).toHaveLength(0);
  });
});

describe("createFeatureLogger", () => {
  const mockSendMessage = vi.fn<() => Promise<void>>();

  beforeEach(() => {
    vi.stubGlobal("chrome", {
      runtime: { sendMessage: mockSendMessage },
    });
    mockSendMessage.mockReset();
    mockSendMessage.mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  function getLastSendMessageCall():
    | {
        type: string;
        entry: LogEntry;
      }
    | undefined {
    const last = mockSendMessage.mock.calls.at(-1) as
      | [{ type: string; entry: LogEntry }]
      | undefined;
    return last?.[0];
  }

  it("activation sends entry with correct shape", () => {
    const logger = createFeatureLogger("test-feature");
    logger.activation();

    const msg = getLastSendMessageCall();
    expect(msg).toBeDefined();
    expect(msg!.entry.feature).toBe("test-feature");
    expect(msg!.entry.event).toBe("activation");
    expect(msg!.entry.timestamp).toBeDefined();
    expect(msg!.entry.url).toBeDefined();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("deactivation sends entry with correct event", () => {
    const logger = createFeatureLogger("test-feature");
    logger.deactivation();

    const msg = getLastSendMessageCall();
    expect(msg?.entry.event).toBe("deactivation");
  });

  it("error sends entry and echoes to console", () => {
    const logger = createFeatureLogger("test-feature");
    const err = new Error("boom");
    logger.error(err, { phase: "runtime" });

    const msg = getLastSendMessageCall();
    expect(msg?.entry.event).toBe("error");
    expect(msg?.entry.phase).toBe("runtime");
    expect(msg?.entry.error?.message).toBe("boom");
    expect(console.error).toHaveBeenCalled();
  });
});

describe("appendAndTrim", () => {
  const mockGet = vi.fn<() => Promise<Record<string, unknown>>>();
  const mockSet = vi.fn<(value?: unknown) => Promise<void>>();

  beforeEach(() => {
    vi.stubGlobal("chrome", {
      storage: { local: { get: mockGet, set: mockSet } },
    });
    mockGet.mockReset();
    mockSet.mockReset();
  });

  function givenExistingLogs(logs: LogEntry[]): void {
    mockGet.mockResolvedValue({ "yt-utils:logs": logs });
    mockSet.mockResolvedValue(undefined);
  }

  function getLastSetCall(): Record<string, LogEntry[]> | undefined {
    const last = mockSet.mock.calls.at(-1) as
      | [Record<string, LogEntry[]>]
      | undefined;
    return last?.[0] as Record<string, LogEntry[]> | undefined;
  }

  it("appends entry to empty storage", async () => {
    givenExistingLogs([]);

    await appendAndTrim({
      timestamp: new Date().toISOString(),
      feature: "test",
      event: "activation",
      url: "https://example.com",
    });

    const logs = getLastSetCall()?.["yt-utils:logs"];
    expect(logs).toHaveLength(1);
    expect(logs![0].feature).toBe("test");
  });

  it("trims entries to retention limit", async () => {
    const existing: LogEntry[] = Array.from({ length: 1000 }, (_, i) => ({
      timestamp: new Date().toISOString(),
      feature: `old-${i}`,
      event: "activation" as const,
      url: "https://example.com",
    }));
    givenExistingLogs(existing);

    await appendAndTrim({
      timestamp: new Date().toISOString(),
      feature: "new-feature",
      event: "activation",
      url: "https://example.com",
    });

    const logs = getLastSetCall()?.["yt-utils:logs"];
    expect(logs).toHaveLength(1000);
    expect(logs![0].feature).toBe("old-1");
    expect(logs![999].feature).toBe("new-feature");
  });

  it("preserves concurrent append bursts in order", async () => {
    let stored: LogEntry[] = [];
    mockGet.mockImplementation(async () => ({ "yt-utils:logs": stored }));
    mockSet.mockImplementation(async (value?: unknown) => {
      stored = (value as Record<string, LogEntry[]>)["yt-utils:logs"];
    });

    await Promise.all([
      appendAndTrim({
        timestamp: new Date().toISOString(),
        feature: "first",
        event: "activation",
        url: "https://example.com",
      }),
      appendAndTrim({
        timestamp: new Date().toISOString(),
        feature: "second",
        event: "deactivation",
        url: "https://example.com",
      }),
      appendAndTrim({
        timestamp: new Date().toISOString(),
        feature: "third",
        event: "activation",
        url: "https://example.com",
      }),
    ]);

    expect(stored.map((entry) => entry.feature)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });
});
