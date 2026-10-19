import { makeFeatureContext } from "@shared/test-helpers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type VideoHarness = {
  player: HTMLElement;
  video: HTMLVideoElement;
  pause: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  setPaused: (paused: boolean) => void;
};

let activeFeature:
  | Awaited<ReturnType<typeof importFreshFeature>>["default"]
  | null = null;

async function importFreshFeature() {
  return import("./content");
}

function appendVideo(options?: {
  paused?: boolean;
  duration?: number;
  adShowing?: boolean;
}): VideoHarness {
  const player = document.createElement("div");
  player.id = "movie_player";
  if (options?.adShowing) {
    player.classList.add("ad-showing");
  }

  const video = document.createElement("video");
  player.appendChild(video);
  document.body.appendChild(player);

  let paused = options?.paused ?? false;
  const pause = vi.fn(() => {
    paused = true;
  });
  const play = vi.fn(() => {
    paused = false;
    return Promise.resolve();
  });

  Object.defineProperty(video, "paused", {
    configurable: true,
    get: () => paused,
  });
  Object.defineProperty(video, "duration", {
    configurable: true,
    value: options?.duration ?? 120,
  });
  Object.defineProperty(video, "pause", {
    configurable: true,
    value: pause,
  });
  Object.defineProperty(video, "play", {
    configurable: true,
    value: play,
  });

  return {
    player,
    video,
    pause,
    play,
    setPaused: (value: boolean) => {
      paused = value;
    },
  };
}

function dispatchPlay(video: HTMLVideoElement): void {
  video.dispatchEvent(new Event("play"));
}

describe("playback-start-gate feature", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    activeFeature?.deactivate();
    activeFeature = null;
    vi.clearAllTimers();
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("exports a watch-page feature", async () => {
    const { default: feature } = await importFreshFeature();

    expect(feature.name).toBe("playback-start-gate");
    expect(feature.isWatchPage).toBe(true);
  });

  it("holds a video that is already playing at activation", async () => {
    const harness = appendVideo({ paused: false });
    const { default: feature } = await importFreshFeature();
    activeFeature = feature;
    feature.activate(makeFeatureContext());

    expect(harness.pause).toHaveBeenCalledOnce();
    expect(harness.play).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(3000);

    expect(harness.play).toHaveBeenCalledOnce();
  });

  it("holds the first play after activation", async () => {
    const harness = appendVideo({ paused: true });
    const { default: feature } = await importFreshFeature();
    activeFeature = feature;
    feature.activate(makeFeatureContext());

    expect(harness.pause).not.toHaveBeenCalled();

    harness.setPaused(false);
    dispatchPlay(harness.video);

    expect(harness.pause).toHaveBeenCalledOnce();

    await vi.advanceTimersByTimeAsync(3000);

    expect(harness.play).toHaveBeenCalledOnce();
  });

  it("does not start playback for a video that never plays", async () => {
    const harness = appendVideo({ paused: true });
    const { default: feature } = await importFreshFeature();
    activeFeature = feature;
    feature.activate(makeFeatureContext());

    await vi.advanceTimersByTimeAsync(3000);

    expect(harness.play).not.toHaveBeenCalled();
  });

  it("cancels the hold when playback starts again", async () => {
    const harness = appendVideo({ paused: false });
    const { default: feature } = await importFreshFeature();
    activeFeature = feature;
    feature.activate(makeFeatureContext());

    harness.setPaused(false);
    dispatchPlay(harness.video);

    await vi.advanceTimersByTimeAsync(3000);

    expect(harness.pause).toHaveBeenCalledOnce();
    expect(harness.play).not.toHaveBeenCalled();
  });

  it("cancels the hold and listener on deactivate", async () => {
    const harness = appendVideo({ paused: false });
    const { default: feature } = await importFreshFeature();
    activeFeature = feature;
    feature.activate(makeFeatureContext());

    feature.deactivate();

    await vi.advanceTimersByTimeAsync(3000);

    expect(harness.play).not.toHaveBeenCalled();

    dispatchPlay(harness.video);

    expect(harness.pause).toHaveBeenCalledOnce();
  });

  it("does not hold an ad", async () => {
    const harness = appendVideo({ paused: false, adShowing: true });
    const { default: feature } = await importFreshFeature();
    activeFeature = feature;
    feature.activate(makeFeatureContext());

    expect(harness.pause).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(3000);

    expect(harness.play).not.toHaveBeenCalled();
  });

  it("does not hold a live stream", async () => {
    const harness = appendVideo({ paused: false, duration: Infinity });
    const { default: feature } = await importFreshFeature();
    activeFeature = feature;
    feature.activate(makeFeatureContext());

    expect(harness.pause).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(3000);

    expect(harness.play).not.toHaveBeenCalled();
  });

  it("holds a video with unknown duration until metadata arrives", async () => {
    const harness = appendVideo({ paused: false, duration: Number.NaN });
    const { default: feature } = await importFreshFeature();
    activeFeature = feature;
    feature.activate(makeFeatureContext());

    expect(harness.pause).toHaveBeenCalledOnce();

    await vi.advanceTimersByTimeAsync(500);
    expect(harness.play).not.toHaveBeenCalled();

    Object.defineProperty(harness.video, "duration", {
      configurable: true,
      value: 120,
    });
    harness.video.dispatchEvent(new Event("loadedmetadata"));

    await vi.advanceTimersByTimeAsync(2499);
    expect(harness.play).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(harness.play).toHaveBeenCalledOnce();
  });

  it("does not hold a live stream with a visible live badge", async () => {
    const badge = document.createElement("div");
    badge.className = "ytp-live-badge";
    badge.style.display = "inline-block";
    document.body.appendChild(badge);

    const harness = appendVideo({ paused: false, duration: 3600 });
    const { default: feature } = await importFreshFeature();
    activeFeature = feature;
    feature.activate(makeFeatureContext());

    expect(harness.pause).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(3000);

    expect(harness.play).not.toHaveBeenCalled();
  });

  it("ignores play events from other videos", async () => {
    const harness = appendVideo({ paused: true });
    const other = document.createElement("video");
    document.body.appendChild(other);

    const { default: feature } = await importFreshFeature();
    activeFeature = feature;
    feature.activate(makeFeatureContext());

    other.dispatchEvent(new Event("play"));

    expect(harness.pause).not.toHaveBeenCalled();
  });

  it("logs a failed resume and leaves the video paused", async () => {
    const harness = appendVideo({ paused: false });
    const error = new Error("playback blocked");
    harness.play.mockRejectedValue(error);

    const context = makeFeatureContext();
    const { default: feature } = await importFreshFeature();
    activeFeature = feature;
    feature.activate(context);

    await vi.advanceTimersByTimeAsync(3000);
    await Promise.resolve();

    expect(context.logger.error).toHaveBeenCalledWith(error, {
      phase: "runtime",
    });
  });
});
