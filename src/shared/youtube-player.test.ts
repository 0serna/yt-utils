import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlayerSnapshot } from "./youtube-player";
import type { BridgeRequest, BridgeResponse } from "./youtube-player-model";

const SNAPSHOT: PlayerSnapshot = {
  videoId: "video-1",
  audioTrack: null,
  audioLanguage: "es",
  contentLanguage: null,
  availableAudioTracks: [],
  captionTracks: [],
  translationLanguages: [],
  currentCaptionTrack: null,
  subtitlesOn: false,
};

type TestState = {
  requests: BridgeRequest[];
  respond: ((request: BridgeRequest) => BridgeResponse["result"]) | null;
};

const state: TestState = { requests: [], respond: null };

function buildBridgeResponse(
  request: BridgeRequest,
  result: BridgeResponse["result"],
): BridgeResponse {
  return {
    source: "yt-utils:youtube-player-bridge",
    kind: "response",
    id: request.id,
    result,
  };
}

describe("youtube-player bridge", () => {
  beforeEach(() => {
    vi.resetModules();
    state.requests = [];
    state.respond = null;

    window.postMessage = ((data: unknown) => {
      const request = data as BridgeRequest;
      state.requests.push(request);
      const respond = state.respond;
      if (respond) {
        const result = respond(request);
        window.dispatchEvent(
          new MessageEvent("message", {
            data: buildBridgeResponse(request, result),
            source: window,
          }),
        );
      }
    }) as typeof window.postMessage;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("readPlayerSnapshot", () => {
    it("returns the snapshot from one bridge request", async () => {
      state.respond = () => SNAPSHOT;

      const { readPlayerSnapshot } = await import("./youtube-player");
      const snapshot = await readPlayerSnapshot();

      expect(snapshot).toEqual(SNAPSHOT);
      expect(state.requests).toHaveLength(1);
    }, 10000);

    it("returns null when the bridge does not answer", async () => {
      const { readPlayerSnapshot } = await import("./youtube-player");
      const snapshot = await readPlayerSnapshot();

      expect(snapshot).toBeNull();
      expect(state.requests).toHaveLength(1);
    }, 10000);

    it("ignores a response that is not a player snapshot", async () => {
      state.respond = () => true;

      const { readPlayerSnapshot } = await import("./youtube-player");
      const snapshot = await readPlayerSnapshot();

      expect(snapshot).toBeNull();
    }, 10000);

    it("shares one request across readers within the cache window", async () => {
      state.respond = () => SNAPSHOT;

      const { readPlayerSnapshot } = await import("./youtube-player");
      await Promise.all([readPlayerSnapshot(), readPlayerSnapshot()]);

      expect(state.requests).toHaveLength(1);
    }, 10000);
  });

  describe("applySubtitleSelection", () => {
    it("returns false when the bridge is missing", async () => {
      const { applySubtitleSelection } = await import("./youtube-player");
      const applied = await applySubtitleSelection({ mode: "off" });

      expect(applied).toBe(false);
      expect(state.requests).toHaveLength(1);
    }, 10000);
  });

  describe("applyAudioTrackSelection", () => {
    it("sends the audio track id when applying an audio track", async () => {
      state.respond = () => true;

      const { applyAudioTrackSelection } = await import("./youtube-player");
      const applied = await applyAudioTrackSelection("251;en");

      expect(applied).toBe(true);
      expect(state.requests).toHaveLength(1);
      expect(state.requests[0]).toMatchObject({
        action: "applyAudioTrack",
        audioTrackId: "251;en",
      });
    }, 10000);

    it("returns false when the audio track could not be applied", async () => {
      state.respond = () => false;

      const { applyAudioTrackSelection } = await import("./youtube-player");
      const applied = await applyAudioTrackSelection("251;en");

      expect(applied).toBe(false);
    }, 10000);
  });
});
