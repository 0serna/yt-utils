import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlayerSnapshot } from "./youtube-player";
import type { BridgeRequest, BridgeResponse } from "./youtube-player-model";

const MANIFEST_STUB = {
  web_accessible_resources: [
    {
      resources: [
        "assets/youtube-player-model-XYZ.js",
        "assets/youtube-player-bridge.ts-ABC.js",
        "assets/extension-button-DEF.js",
      ],
    },
  ],
};

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

describe("youtube-player bridge fallback", () => {
  beforeEach(() => {
    vi.resetModules();
    state.requests = [];
    state.respond = null;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: unknown) => ({
        ok: url === "chrome-extension://fake-id/manifest.json",
        json: async () => MANIFEST_STUB,
      })),
    );
    vi.stubGlobal("chrome", {
      runtime: {
        getURL: (path: string) => `chrome-extension://fake-id/${path}`,
      },
    });

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
    document.querySelectorAll('script[type="module"]').forEach((element) => {
      element.remove();
    });
  });

  describe("readPlayerSnapshot", () => {
    it("reinstalls the bridge and retries once when the first snapshot request fails", async () => {
      state.respond = () => (state.requests.length === 1 ? null : SNAPSHOT);

      const { readPlayerSnapshot } = await import("./youtube-player");
      const snapshot = await readPlayerSnapshot();

      expect(snapshot).toEqual(SNAPSHOT);
      expect(state.requests).toHaveLength(2);

      const script = document.querySelector('script[type="module"]');
      expect(script).not.toBeNull();
      expect((script as HTMLScriptElement).src).toBe(
        "chrome-extension://fake-id/assets/youtube-player-bridge.ts-ABC.js",
      );
      expect(fetch).toHaveBeenCalledWith(
        "chrome-extension://fake-id/manifest.json",
      );
    }, 10000);

    it("does not reinstall the bridge when the snapshot request succeeds", async () => {
      state.respond = () => SNAPSHOT;

      const { readPlayerSnapshot } = await import("./youtube-player");
      await readPlayerSnapshot();

      expect(state.requests).toHaveLength(1);
      expect(document.querySelector('script[type="module"]')).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    }, 10000);

    it("reinstalls the bridge at most once per document", async () => {
      state.respond = () => null;

      const { readPlayerSnapshot } = await import("./youtube-player");
      const first = await readPlayerSnapshot();
      const second = await readPlayerSnapshot();

      expect(first).toBeNull();
      expect(second).toBeNull();
      expect(state.requests).toHaveLength(3);
      expect(document.querySelectorAll('script[type="module"]')).toHaveLength(
        1,
      );
    }, 10000);

    it("does not retry applySelection when the bridge is missing", async () => {
      const { applySubtitleSelection } = await import("./youtube-player");
      const applied = await applySubtitleSelection({ mode: "off" });

      expect(applied).toBe(false);
      expect(state.requests).toHaveLength(1);
      expect(document.querySelector('script[type="module"]')).toBeNull();
    }, 10000);

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

  describe("findBridgeModuleResource", () => {
    it("resolves the hashed bridge module from web accessible resources", async () => {
      const { findBridgeModuleResource } = await import("./youtube-player");

      expect(findBridgeModuleResource(MANIFEST_STUB)).toBe(
        "assets/youtube-player-bridge.ts-ABC.js",
      );
      expect(findBridgeModuleResource({})).toBeNull();
      expect(
        findBridgeModuleResource({
          web_accessible_resources: [{ resources: ["assets/other.js"] }],
        }),
      ).toBeNull();
    });
  });
});
