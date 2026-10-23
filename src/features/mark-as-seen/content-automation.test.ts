import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@shared/messaging", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/messaging")>();
  return { ...actual, onMessage: vi.fn() };
});

vi.mock("@shared/youtube-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/youtube-dom")>();
  return {
    ...actual,
    delay: vi.fn(() => Promise.resolve()),
    isDesktopWatchPage: vi.fn(() => true),
  };
});

function createVideo(): {
  video: HTMLVideoElement;
  muteStates: boolean[];
  play: ReturnType<typeof vi.fn>;
} {
  const video = document.createElement("video");
  let paused = true;
  let currentTime = 0;
  const duration = 100;
  const muteStates: boolean[] = [];

  Object.defineProperty(video, "duration", {
    configurable: true,
    get: () => duration,
  });
  Object.defineProperty(video, "paused", {
    configurable: true,
    get: () => paused,
  });
  Object.defineProperty(video, "currentTime", {
    configurable: true,
    get: () => currentTime,
    set: (value: number) => {
      currentTime = value;
    },
  });

  const play = vi.fn(async () => {
    muteStates.push(video.muted);
    paused = false;
  });
  video.play = play as unknown as HTMLMediaElement["play"];
  video.pause = vi.fn(() => {
    paused = true;
  });

  document.body.append(video);
  return { video, muteStates, play };
}

async function getAutomationHandler() {
  const { registerMarkAsSeenAutomationHandler } = await import(
    "./content-automation"
  );
  registerMarkAsSeenAutomationHandler();

  const { onMessage } = await import("@shared/messaging");
  const handler = vi.mocked(onMessage).mock.calls[0]?.[1];
  if (!handler) {
    throw new Error("missing automation handler");
  }

  return handler;
}

describe("mark-as-seen automation", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("retries muted playback when autoplay is blocked", async () => {
    const { video, muteStates, play } = createVideo();
    play.mockRejectedValueOnce(new DOMException("blocked", "NotAllowedError"));
    const handler = await getAutomationHandler();

    const result = await handler({}, {} as chrome.runtime.MessageSender);

    expect(result).toEqual({ ok: true });
    expect(play).toHaveBeenCalledTimes(2);
    expect(muteStates).toEqual([true]);
    expect(video.muted).toBe(false);
  });

  it("reports PLAYBACK_FAILED when both play attempts fail", async () => {
    const { video, play } = createVideo();
    play.mockRejectedValue(new DOMException("blocked", "NotAllowedError"));
    const handler = await getAutomationHandler();

    const result = await handler({}, {} as chrome.runtime.MessageSender);

    expect(result).toMatchObject({ ok: false, code: "PLAYBACK_FAILED" });
    expect(video.muted).toBe(false);
  });

  it("does not retry muted playback for a non-autoplay error", async () => {
    const { video, play } = createVideo();
    play.mockRejectedValueOnce(new DOMException("aborted", "AbortError"));
    const handler = await getAutomationHandler();

    const result = await handler({}, {} as chrome.runtime.MessageSender);

    expect(result).toMatchObject({ ok: false, code: "PLAYBACK_FAILED" });
    expect(play).toHaveBeenCalledTimes(1);
    expect(video.muted).toBe(false);
  });
});
