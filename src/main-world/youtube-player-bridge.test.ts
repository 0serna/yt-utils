import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import type {
  BridgeRequest,
  BridgeResponse,
  PlayerSnapshot,
} from "@shared/youtube-player-model";

const BRIDGE_SOURCE = "yt-utils:youtube-player-bridge";
const BRIDGE_FLAG = "__ytUtilsYoutubePlayerBridgeInstalled";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BridgeWindow = Window & Record<string, any>;

describe("youtube-player-bridge", () => {
  let playerElement: HTMLElement | null = null;
  let bridgeHandler: ((event: MessageEvent) => void) | null = null;

  beforeAll(async () => {
    delete (window as BridgeWindow)[BRIDGE_FLAG];

    // Capture the bridge's message handler
    const origAddEventListener = window.addEventListener.bind(window);
    let captured = false;
    window.addEventListener = ((
      type: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      listener: any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ) => {
      if (type === "message" && !captured) {
        bridgeHandler = listener;
        captured = true;
      }
      return origAddEventListener(type, listener, ...args);
    }) as typeof window.addEventListener;

    // Import bridge to register the listener
    await import("./youtube-player-bridge");

    // Restore original addEventListener
    window.addEventListener = origAddEventListener;
  });

  beforeEach(() => {
    playerElement = null;
  });

  afterEach(() => {
    if (playerElement) {
      playerElement.remove();
      playerElement = null;
    }
  });

  function createFakePlayer(options: {
    videoId?: string;
    responseVideoId?: string;
    videoDataVideoId?: string;
    captionTracks?: unknown[];
    audioTrack?: unknown;
    subtitlesOn?: boolean;
    currentCaptionTrack?: unknown;
    translationLanguages?: unknown[];
  }): HTMLElement {
    const element = document.createElement("div");
    element.id = "movie_player";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const player = element as any;
    player.getPlayerResponse = () => ({
      captions: {
        playerCaptionsTracklistRenderer: {
          captionTracks: options.captionTracks || [],
        },
      },
      videoDetails: {
        videoId: options.responseVideoId ?? options.videoId ?? "test-video-id",
      },
    });
    player.getVideoData = () => ({
      videoId: options.videoDataVideoId ?? options.videoId ?? "test-video-id",
    });
    player.getAudioTrack = () => options.audioTrack || null;
    player.getOption = (namespace: string, key: string) => {
      if (namespace === "captions" && key === "track") {
        return options.currentCaptionTrack || null;
      }
      if (namespace === "captions" && key === "translationLanguages") {
        return options.translationLanguages || [];
      }
      return null;
    };
    player.isSubtitlesOn = () => options.subtitlesOn || false;
    player.toggleSubtitles = () => {};

    return element;
  }

  function createMutableSubtitlesPlayer(): {
    element: HTMLElement;
    isSubtitlesOn: () => boolean;
  } {
    let subtitlesOn = true;
    const element = createFakePlayer({
      videoId: "test-video",
      subtitlesOn: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const player = element as any;
    player.isSubtitlesOn = () => subtitlesOn;
    player.toggleSubtitles = () => {
      subtitlesOn = !subtitlesOn;
    };
    return { element, isSubtitlesOn: () => subtitlesOn };
  }

  async function sendBridgeRequest(
    request: Omit<BridgeRequest, "source" | "kind">,
  ): Promise<BridgeResponse> {
    if (!bridgeHandler) {
      throw new Error("Bridge message handler was not captured");
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Bridge request timed out"));
      }, 2000);

      // Listen for the response via postMessage
      const responseHandler = (event: MessageEvent<BridgeResponse>) => {
        if (
          event.data?.source === BRIDGE_SOURCE &&
          event.data?.kind === "response" &&
          event.data?.id === request.id
        ) {
          clearTimeout(timeout);
          window.removeEventListener("message", responseHandler);
          resolve(event.data);
        }
      };
      window.addEventListener("message", responseHandler);

      // Call the bridge handler directly with a synthetic event
      // (jsdom's postMessage doesn't set event.source === window)
      const fullRequest: BridgeRequest = {
        source: BRIDGE_SOURCE,
        kind: "request",
        ...request,
      };

      const syntheticEvent = new MessageEvent("message", {
        data: fullRequest,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        source: window as any,
        origin: window.location.origin,
      });

      bridgeHandler!(syntheticEvent);
    });
  }

  describe("readSnapshot", () => {
    beforeEach(() => {
      window.history.replaceState({}, "", "/watch?v=baseline-video");
    });

    it("returns null when no movie_player exists", async () => {
      const response = await sendBridgeRequest({
        id: "test-1",
        action: "readSnapshot",
      });

      expect(response.result).toBeNull();
    });

    it("returns snapshot from fake player", async () => {
      const fakePlayer = createFakePlayer({
        videoId: "abc123",
        captionTracks: [
          {
            languageCode: "en",
            kind: "asr",
            vssId: ".en",
          },
        ],
        subtitlesOn: true,
      });
      document.body.appendChild(fakePlayer);
      playerElement = fakePlayer;

      const response = await sendBridgeRequest({
        id: "test-2",
        action: "readSnapshot",
      });

      const snapshot = response.result as PlayerSnapshot;
      expect(snapshot).not.toBeNull();
      expect(snapshot!.videoId).toBe("abc123");
      expect(snapshot!.subtitlesOn).toBe(true);
      expect(snapshot!.captionTracks).toHaveLength(1);
      expect(snapshot!.captionTracks[0].languageCode).toBe("en");
    });

    it("returns snapshot with audio track", async () => {
      const fakePlayer = createFakePlayer({
        videoId: "xyz789",
        audioTrack: {
          hs: {
            id: "es",
            name: "Spanish",
            isDefault: false,
            isAutoDubbed: false,
          },
        },
        subtitlesOn: false,
      });
      document.body.appendChild(fakePlayer);
      playerElement = fakePlayer;

      const response = await sendBridgeRequest({
        id: "test-3",
        action: "readSnapshot",
      });

      const snapshot = response.result as PlayerSnapshot;
      expect(snapshot).not.toBeNull();
      expect(snapshot!.videoId).toBe("xyz789");
      expect(snapshot!.subtitlesOn).toBe(false);
      expect(snapshot!.audioTrack).not.toBeNull();
      expect(snapshot!.audioLanguage).toBe("es");
    });

    it("prefers caption tracks from the active audio track without inferring audio language from them", async () => {
      const audioCaptionTrack = {
        languageCode: "en",
        kind: "asr",
        vssId: "a.en",
        url: "https://www.youtube.com/api/timedtext?pot=token",
      };
      const fakePlayer = createFakePlayer({
        videoId: "audio-caption-video",
        captionTracks: [
          {
            languageCode: "en",
            kind: "asr",
            vssId: "a.en",
            baseUrl: "https://www.youtube.com/api/timedtext",
          },
        ],
        audioTrack: {
          captionTracks: [audioCaptionTrack],
        },
        subtitlesOn: false,
      });
      document.body.appendChild(fakePlayer);
      playerElement = fakePlayer;

      const response = await sendBridgeRequest({
        id: "test-3b",
        action: "readSnapshot",
      });

      const snapshot = response.result as PlayerSnapshot;
      expect(snapshot!.captionTracks).toEqual([audioCaptionTrack]);
      expect(snapshot!.audioLanguage).toBeNull();
    });

    it("infers English audio language from the current YouTube metadata shape", async () => {
      const fakePlayer = createFakePlayer({
        videoId: "current-shape-english-video",
        audioTrack: {
          C_: {
            id: "en-US.4",
            name: "English (US) original",
          },
        },
        captionTracks: [{ languageCode: "es" }],
        subtitlesOn: false,
      });
      document.body.appendChild(fakePlayer);
      playerElement = fakePlayer;

      const response = await sendBridgeRequest({
        id: "test-3c",
        action: "readSnapshot",
      });

      const snapshot = response.result as PlayerSnapshot;
      expect(snapshot).not.toBeNull();
      expect(snapshot!.audioLanguage).toBe("en-us");
    });

    it("infers Spanish audio language from the current YouTube metadata shape", async () => {
      const fakePlayer = createFakePlayer({
        videoId: "current-shape-spanish-video",
        audioTrack: {
          C_: {
            id: "es-MX.4",
            name: "Spanish (Mexico)",
          },
        },
        captionTracks: [{ languageCode: "en" }],
        subtitlesOn: false,
      });
      document.body.appendChild(fakePlayer);
      playerElement = fakePlayer;

      const response = await sendBridgeRequest({
        id: "test-3d",
        action: "readSnapshot",
      });

      const snapshot = response.result as PlayerSnapshot;
      expect(snapshot).not.toBeNull();
      expect(snapshot!.audioLanguage).toBe("es-mx");
    });

    it("infers Spanish audio language from the Iw YouTube metadata shape", async () => {
      const fakePlayer = createFakePlayer({
        videoId: "iw-shape-spanish-video",
        audioTrack: {
          id: "251;ChEKBWFjb250EghvcmlnaW5hbAoICgNkcmMSATEKDQoEbGFuZxIFZXMtVVM",
          Iw: {
            id: "es-US.4",
            name: "Spanish (US) original",
          },
        },
        captionTracks: [{ languageCode: "en" }],
        subtitlesOn: false,
      });
      document.body.appendChild(fakePlayer);
      playerElement = fakePlayer;

      const response = await sendBridgeRequest({
        id: "test-3e",
        action: "readSnapshot",
      });

      const snapshot = response.result as PlayerSnapshot;
      expect(snapshot).not.toBeNull();
      expect(snapshot!.audioLanguage).toBe("es-us");
    });

    it("infers Spanish audio language from the Z1 YouTube metadata shape", async () => {
      const fakePlayer = createFakePlayer({
        videoId: "z1-shape-spanish-video",
        audioTrack: {
          id: "251;ChEKBWFjb250EghvcmlnaW5hbAoNCgRsYW5nEgVlcy1VUwoHCgJ2YhIBMQ",
          Z1: {
            id: "es-US.4",
            name: "Spanish (US) original",
          },
        },
        captionTracks: [{ languageCode: "en" }],
        subtitlesOn: false,
      });
      document.body.appendChild(fakePlayer);
      playerElement = fakePlayer;

      const response = await sendBridgeRequest({
        id: "test-3f",
        action: "readSnapshot",
      });

      const snapshot = response.result as PlayerSnapshot;
      expect(snapshot).not.toBeNull();
      expect(snapshot!.audioLanguage).toBe("es-us");
    });

    it("returns snapshot with translation languages", async () => {
      const fakePlayer = createFakePlayer({
        videoId: "test-video",
        translationLanguages: [
          { languageCode: "en", languageName: "English" },
          { languageCode: "es", languageName: "Spanish" },
        ],
        subtitlesOn: false,
      });
      document.body.appendChild(fakePlayer);
      playerElement = fakePlayer;

      const response = await sendBridgeRequest({
        id: "test-4",
        action: "readSnapshot",
      });

      const snapshot = response.result as PlayerSnapshot;
      expect(snapshot).not.toBeNull();
      expect(snapshot!.translationLanguages).toHaveLength(2);
      expect(snapshot!.translationLanguages[0].languageCode).toBe("en");
      expect(snapshot!.translationLanguages[1].languageCode).toBe("es");
    });

    it("falls back to the URL video id and filters invalid translation languages", async () => {
      window.history.replaceState({}, "", "/watch?v=url-video-id");

      const fakePlayer = createFakePlayer({
        responseVideoId: "   ",
        videoDataVideoId: "",
        translationLanguages: [
          { languageCode: "en", languageName: "English" },
          { languageName: "Missing code" },
          null,
        ],
        subtitlesOn: false,
      });
      document.body.appendChild(fakePlayer);
      playerElement = fakePlayer;

      const response = await sendBridgeRequest({
        id: "test-4b",
        action: "readSnapshot",
      });

      const snapshot = response.result as PlayerSnapshot;
      expect(snapshot).not.toBeNull();
      expect(snapshot!.videoId).toBe("url-video-id");
      expect(snapshot!.translationLanguages).toEqual([
        { languageCode: "en", languageName: "English" },
      ]);
    });

    it("infers audio language from the audio track name when ids are not usable", async () => {
      const fakePlayer = createFakePlayer({
        videoId: "audio-name-video",
        audioTrack: {
          hs: {
            id: "und",
            name: "English - Descriptive",
          },
        },
        captionTracks: [{ languageCode: "" }],
        subtitlesOn: false,
      });
      document.body.appendChild(fakePlayer);
      playerElement = fakePlayer;

      const response = await sendBridgeRequest({
        id: "test-4c",
        action: "readSnapshot",
      });

      const snapshot = response.result as PlayerSnapshot;
      expect(snapshot).not.toBeNull();
      expect(snapshot!.audioLanguage).toBe("en");
    });
  });

  describe("applySelection", () => {
    it("returns false when no movie_player exists", async () => {
      const response = await sendBridgeRequest({
        id: "test-5",
        action: "applySelection",
        selection: { mode: "off" },
      });

      expect(response.result).toBe(false);
    });

    it("toggles subtitles off when they are on", async () => {
      const { element, isSubtitlesOn } = createMutableSubtitlesPlayer();
      document.body.appendChild(element);
      playerElement = element;

      const response = await sendBridgeRequest({
        id: "test-6",
        action: "applySelection",
        selection: { mode: "off" },
      });

      expect(response.result).toBe(true);
      expect(isSubtitlesOn()).toBe(false);
    });

    it("returns true when subtitles are already off", async () => {
      const fakePlayer = createFakePlayer({
        videoId: "test-video",
        subtitlesOn: false,
      });
      document.body.appendChild(fakePlayer);
      playerElement = fakePlayer;

      const response = await sendBridgeRequest({
        id: "test-7",
        action: "applySelection",
        selection: { mode: "off" },
      });

      expect(response.result).toBe(true);
    });

    it("returns false when selection is null", async () => {
      const fakePlayer = createFakePlayer({
        videoId: "test-video",
        subtitlesOn: true,
      });
      document.body.appendChild(fakePlayer);
      playerElement = fakePlayer;

      const response = await sendBridgeRequest({
        id: "test-8",
        action: "applySelection",
        selection: undefined,
      });

      expect(response.result).toBe(false);
    });

    it("handles multiple applySelection calls correctly", async () => {
      const { element, isSubtitlesOn } = createMutableSubtitlesPlayer();
      document.body.appendChild(element);
      playerElement = element;

      const response1 = await sendBridgeRequest({
        id: "test-9a",
        action: "applySelection",
        selection: { mode: "off" },
      });

      expect(response1.result).toBe(true);
      expect(isSubtitlesOn()).toBe(false);

      const response2 = await sendBridgeRequest({
        id: "test-9b",
        action: "applySelection",
        selection: { mode: "off" },
      });

      expect(response2.result).toBe(true);
    });
  });
});
