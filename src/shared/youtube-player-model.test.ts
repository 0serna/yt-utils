import { describe, expect, it } from "vitest";
import {
  type AudioTrack,
  type CaptionTrack,
  determineSubtitleSelection,
  isEnglishLanguage,
  isSpanishLanguage,
  matchesSubtitleSelection,
  type PlayerSnapshot,
  readAudioTrackIdentity,
  readAudioTrackMetadata,
  readSubtitleSignature,
  selectOriginalAudioTrack,
  summarizeAvailableAudioTrack,
} from "./youtube-player-model";

const defaultSnapshot: PlayerSnapshot = {
  videoId: "test",
  audioTrack: null,
  audioLanguage: null,
  availableAudioTracks: [],
  captionTracks: [],
  translationLanguages: [],
  currentCaptionTrack: null,
  subtitlesOn: false,
};

describe("youtube-player-model", () => {
  describe("isSpanishLanguage", () => {
    it("returns true for 'es'", () => {
      expect(isSpanishLanguage("es")).toBe(true);
    });

    it("returns true for 'es-MX'", () => {
      expect(isSpanishLanguage("es-MX")).toBe(true);
    });

    it("returns true for 'es_419' (underscore)", () => {
      expect(isSpanishLanguage("es_419")).toBe(true);
    });

    it("returns true for 'es.ES' (with dot)", () => {
      expect(isSpanishLanguage("es.ES")).toBe(true);
    });

    it("returns false for 'en'", () => {
      expect(isSpanishLanguage("en")).toBe(false);
    });

    it("returns false for null", () => {
      expect(isSpanishLanguage(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isSpanishLanguage(undefined)).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isSpanishLanguage("")).toBe(false);
    });

    it("handles whitespace", () => {
      expect(isSpanishLanguage("  es  ")).toBe(true);
    });
  });

  describe("isEnglishLanguage", () => {
    it("returns true for 'en'", () => {
      expect(isEnglishLanguage("en")).toBe(true);
    });

    it("returns true for 'en-US'", () => {
      expect(isEnglishLanguage("en-US")).toBe(true);
    });

    it("returns true for 'en_GB' (underscore)", () => {
      expect(isEnglishLanguage("en_GB")).toBe(true);
    });

    it("returns false for 'es'", () => {
      expect(isEnglishLanguage("es")).toBe(false);
    });

    it("returns false for null", () => {
      expect(isEnglishLanguage(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isEnglishLanguage(undefined)).toBe(false);
    });
  });

  describe("determineSubtitleSelection", () => {
    it("returns off for Spanish audio", () => {
      expect(
        determineSubtitleSelection({ ...defaultSnapshot, audioLanguage: "es" }),
      ).toEqual({ mode: "off" });
    });

    it("selects a direct English track for English audio", () => {
      const englishTrack: CaptionTrack = { languageCode: "en", vssId: ".en" };

      expect(
        determineSubtitleSelection({
          ...defaultSnapshot,
          audioLanguage: "en-US",
          captionTracks: [englishTrack],
        }),
      ).toEqual({ mode: "track", track: englishTrack });
    });

    it("returns off for Spanish audio even when a direct English track exists", () => {
      expect(
        determineSubtitleSelection({
          ...defaultSnapshot,
          audioLanguage: "es-US",
          captionTracks: [{ languageCode: "en", vssId: ".en" }],
        }),
      ).toEqual({ mode: "off" });
    });

    it("selects a direct English track for non-Spanish audio", () => {
      const englishTrack: CaptionTrack = { languageCode: "en", vssId: ".en" };

      expect(
        determineSubtitleSelection({
          ...defaultSnapshot,
          audioLanguage: "fr",
          captionTracks: [englishTrack],
        }),
      ).toEqual({ mode: "track", track: englishTrack });
    });

    it("selects an English ASR track for non-Spanish audio", () => {
      const englishAsrTrack: CaptionTrack = {
        languageCode: "en",
        kind: "asr",
        vssId: "a.en",
      };

      expect(
        determineSubtitleSelection({
          ...defaultSnapshot,
          audioLanguage: "fr",
          captionTracks: [englishAsrTrack],
        }),
      ).toEqual({ mode: "track", track: englishAsrTrack });
    });

    it("selects an English ASR track for unknown audio", () => {
      const englishAsrTrack: CaptionTrack = {
        languageCode: "en",
        kind: "asr",
        vssId: "a.en",
      };

      expect(
        determineSubtitleSelection({
          ...defaultSnapshot,
          audioLanguage: null,
          captionTracks: [englishAsrTrack],
        }),
      ).toEqual({ mode: "track", track: englishAsrTrack });
    });

    it("selects an English ASR vssId track for unknown audio", () => {
      const englishAsrTrack: CaptionTrack = {
        languageCode: "en",
        vssId: "a.en",
      };

      expect(
        determineSubtitleSelection({
          ...defaultSnapshot,
          audioLanguage: null,
          captionTracks: [englishAsrTrack],
        }),
      ).toEqual({ mode: "track", track: englishAsrTrack });
    });

    it("selects a direct English track for unknown audio", () => {
      const englishTrack: CaptionTrack = { languageCode: "en", vssId: ".en" };

      expect(
        determineSubtitleSelection({
          ...defaultSnapshot,
          audioLanguage: null,
          captionTracks: [englishTrack],
        }),
      ).toEqual({ mode: "track", track: englishTrack });
    });

    it("prefers a direct English track over an English ASR track", () => {
      const englishTrack: CaptionTrack = { languageCode: "en", vssId: ".en" };
      const englishAsrTrack: CaptionTrack = {
        languageCode: "en",
        kind: "asr",
        vssId: "a.en",
      };

      expect(
        determineSubtitleSelection({
          ...defaultSnapshot,
          audioLanguage: null,
          captionTracks: [englishAsrTrack, englishTrack],
        }),
      ).toEqual({ mode: "track", track: englishTrack });
    });

    it("returns off when no English track exists", () => {
      expect(
        determineSubtitleSelection({
          ...defaultSnapshot,
          audioLanguage: "fr",
          captionTracks: [{ languageCode: "es", vssId: ".es" }],
        }),
      ).toEqual({ mode: "off" });
    });

    it("does not fall back to English auto-translation for English audio", () => {
      expect(
        determineSubtitleSelection({
          ...defaultSnapshot,
          audioLanguage: "en",
          captionTracks: [
            { languageCode: "es", isTranslatable: true, vssId: ".es" },
          ],
          translationLanguages: [
            { languageCode: "en", languageName: "English" },
          ],
        }),
      ).toEqual({ mode: "off" });
    });
  });

  describe("matchesSubtitleSelection", () => {
    it("returns true when selection is off and subtitles are off", () => {
      expect(matchesSubtitleSelection(defaultSnapshot, { mode: "off" })).toBe(
        true,
      );
    });

    it("returns false when selection is off but subtitles are on", () => {
      expect(
        matchesSubtitleSelection(
          { ...defaultSnapshot, subtitlesOn: true },
          { mode: "off" },
        ),
      ).toBe(false);
    });

    it("returns true when selected track is active and subtitles are on", () => {
      const englishTrack: CaptionTrack = { languageCode: "en", vssId: ".en" };

      expect(
        matchesSubtitleSelection(
          {
            ...defaultSnapshot,
            currentCaptionTrack: englishTrack,
            subtitlesOn: true,
          },
          { mode: "track", track: englishTrack },
        ),
      ).toBe(true);
    });
  });

  describe("readSubtitleSignature", () => {
    it("generates signature with no tracks", () => {
      expect(readSubtitleSignature(defaultSnapshot)).toBe("off|caption:none");
    });

    it("generates signature with subtitles on", () => {
      expect(
        readSubtitleSignature({ ...defaultSnapshot, subtitlesOn: true }),
      ).toBe("on|caption:none");
    });

    it("generates signature with caption track", () => {
      const captionTrack: CaptionTrack = {
        languageCode: "en",
        kind: "asr",
        vssId: ".en",
      };
      const snapshot: PlayerSnapshot = {
        ...defaultSnapshot,
        captionTracks: [captionTrack],
        currentCaptionTrack: captionTrack,
        subtitlesOn: true,
      };
      expect(readSubtitleSignature(snapshot)).toBe(
        "on|caption:en:asr:.en:none",
      );
    });

    it("ignores the audio track", () => {
      const snapshot: PlayerSnapshot = {
        ...defaultSnapshot,
        audioTrack: {
          hs: {
            id: "es",
            name: "Spanish",
            isDefault: false,
            isAutoDubbed: true,
          },
        },
        audioLanguage: "es",
      };

      expect(readSubtitleSignature(snapshot)).toBe("off|caption:none");
    });

    it("generates signature with translation language", () => {
      const captionTrack: CaptionTrack = {
        languageCode: "es",
        kind: "asr",
        vssId: ".es",
        translationLanguage: {
          languageCode: "en",
          languageName: "English",
        },
      };
      const snapshot: PlayerSnapshot = {
        ...defaultSnapshot,
        captionTracks: [captionTrack],
        translationLanguages: [{ languageCode: "en", languageName: "English" }],
        currentCaptionTrack: captionTrack,
        subtitlesOn: true,
      };
      expect(readSubtitleSignature(snapshot)).toBe("on|caption:es:asr:.es:en");
    });
  });

  describe("selectOriginalAudioTrack", () => {
    it("prefers the non-dubbed track over the default one", () => {
      const dubbed = {
        id: "es-US.10",
        name: "Spanish (US)",
        isDefault: true,
        isAutoDubbed: true,
        languageCode: "es-us",
      };
      const original = {
        id: "en-US.4",
        name: "English (US) original",
        isDefault: false,
        isAutoDubbed: false,
        languageCode: "en-us",
      };

      expect(selectOriginalAudioTrack([dubbed, original])).toEqual(original);
    });

    it("prefers the original track from the id content when flags are unreliable", () => {
      const dubbed = {
        id: "251;Cg8KBWFjb250EgZkdWJiZWQKCgoEbGFuZxICYXI",
        name: "Arabic",
        isDefault: true,
        isAutoDubbed: false,
        languageCode: "ar",
      };
      const original = {
        id: "251;ChEKBWFjb250EghvcmlnaW5hbAoKCgRsYW5nEgJlbg",
        name: "English original",
        isDefault: false,
        isAutoDubbed: false,
        languageCode: "en",
      };

      expect(selectOriginalAudioTrack([dubbed, original])).toEqual(original);
    });

    it("uses the id content when the name is missing", () => {
      const dubbed = {
        id: "251;Cg8KBWFjb250EgZkdWJiZWQKCgoEbGFuZxICYXI",
        name: null,
        isDefault: null,
        isAutoDubbed: null,
        languageCode: "ar",
      };
      const original = {
        id: "251;ChEKBWFjb250EghvcmlnaW5hbAoKCgRsYW5nEgJlbg",
        name: null,
        isDefault: null,
        isAutoDubbed: null,
        languageCode: "en",
      };

      expect(selectOriginalAudioTrack([dubbed, original])).toEqual(original);
    });

    it("falls back to an original-like name", () => {
      const plain = {
        id: "es.4",
        name: "Spanish",
        isDefault: true,
        isAutoDubbed: null,
        languageCode: "es",
      };
      const original = {
        id: "en.4",
        name: "English original",
        isDefault: false,
        isAutoDubbed: null,
        languageCode: "en",
      };

      expect(selectOriginalAudioTrack([plain, original])).toEqual(original);
    });

    it("ignores dubbed content in the flag fallback", () => {
      const dubbed = {
        id: "251;Cg8KBWFjb250EgZkdWJiZWQKCgoEbGFuZxICYXI",
        name: "Arabic",
        isDefault: false,
        isAutoDubbed: false,
        languageCode: "ar",
      };
      const defaultTrack = {
        id: "default.4",
        name: "Default",
        isDefault: true,
        isAutoDubbed: null,
        languageCode: null,
      };

      expect(selectOriginalAudioTrack([dubbed, defaultTrack])).toEqual(
        defaultTrack,
      );
    });

    it("falls back to flags when the id is invalid", () => {
      const dubbed = {
        id: "251;???",
        name: "Spanish",
        isDefault: true,
        isAutoDubbed: true,
        languageCode: "es",
      };
      const original = {
        id: "251;not-valid-base64!",
        name: "English",
        isDefault: false,
        isAutoDubbed: false,
        languageCode: "en",
      };

      expect(selectOriginalAudioTrack([dubbed, original])).toEqual(original);
    });

    it("falls back to the default track when no track declares dubbing", () => {
      const plain = {
        id: "en.4",
        name: "English",
        isDefault: null,
        isAutoDubbed: null,
        languageCode: "en",
      };
      const defaultTrack = {
        id: "es.4",
        name: "Spanish",
        isDefault: true,
        isAutoDubbed: null,
        languageCode: "es",
      };

      expect(selectOriginalAudioTrack([plain, defaultTrack])).toEqual(
        defaultTrack,
      );
    });

    it("returns null when no track is identifiable", () => {
      expect(
        selectOriginalAudioTrack([
          {
            id: "und",
            name: null,
            isDefault: null,
            isAutoDubbed: null,
            languageCode: null,
          },
        ]),
      ).toBeNull();
    });
  });

  describe("readAudioTrackIdentity", () => {
    it("prefers the player track id", () => {
      expect(
        readAudioTrackIdentity({
          id: "251;track-id",
          hs: { id: "en-US.4", name: "English (US) original" },
        }),
      ).toBe("251;track-id");
    });

    it("falls back to the metadata id", () => {
      expect(
        readAudioTrackIdentity({
          hs: { id: "en-US.4", name: "English (US) original" },
        }),
      ).toBe("en-US.4");
    });

    it("returns null without any id", () => {
      expect(readAudioTrackIdentity({ hs: { name: "English" } })).toBeNull();
      expect(readAudioTrackIdentity(null)).toBeNull();
    });
  });

  describe("summarizeAvailableAudioTrack", () => {
    it("summarizes metadata and language code", () => {
      expect(
        summarizeAvailableAudioTrack({
          id: "251;track-id",
          hs: {
            id: "en-US.4",
            name: "English (US) original",
            isDefault: true,
            isAutoDubbed: false,
          },
        }),
      ).toEqual({
        id: "251;track-id",
        name: "English (US) original",
        isDefault: true,
        isAutoDubbed: false,
        languageCode: "en-us",
      });
    });

    it("keeps unknown fields null", () => {
      expect(summarizeAvailableAudioTrack({})).toEqual({
        id: null,
        name: null,
        isDefault: null,
        isAutoDubbed: null,
        languageCode: null,
      });
    });
  });

  describe("readAudioTrackMetadata", () => {
    it.each(["wM", "C_", "Iw", "Z1", "s1", "US", "yG", "hs"] as const)(
      "reads the %s metadata alias",
      (key) => {
        expect(
          readAudioTrackMetadata({
            [key]: {
              id: "en.4",
              name: "English",
              isDefault: true,
              isAutoDubbed: false,
            },
          }),
        ).toEqual({
          id: "en.4",
          name: "English",
          isDefault: true,
          isAutoDubbed: false,
        });
      },
    );

    it("reads Spanish audio under the wM key with an opaque top-level id", () => {
      expect(
        readAudioTrackMetadata({
          id: "251;opaque-top-level-id",
          wM: {
            id: "es-US.4",
            name: "Spanish (US) original",
            isDefault: true,
            isAutoDubbed: false,
          },
        }),
      ).toEqual({
        id: "es-US.4",
        name: "Spanish (US) original",
        isDefault: true,
        isAutoDubbed: false,
      });
    });

    it("prefers wM over older aliases", () => {
      expect(
        readAudioTrackMetadata({
          wM: { id: "es-US.4", name: "Spanish (US) original" },
          C_: { id: "en-US.4", name: "English (US) original" },
        }),
      ).toMatchObject({
        id: "es-US.4",
        name: "Spanish (US) original",
      });
    });

    it("falls back to an unknown future key with metadata shape", () => {
      expect(
        readAudioTrackMetadata({
          id: "251;opaque-top-level-id",
          qX: {
            id: "es-MX.4",
            name: "Spanish (Mexico)",
          },
        } as AudioTrack),
      ).toMatchObject({
        id: "es-MX.4",
        name: "Spanish (Mexico)",
      });
    });

    it("ignores S/W slots and caption tracks when scanning for metadata", () => {
      expect(
        readAudioTrackMetadata({
          id: "251;opaque-top-level-id",
          captionTracks: [{ languageCode: "en", kind: "asr", vssId: "a.en" }],
          S: { id: "en.4", name: "English" },
          W: { id: "en.4", name: "English" },
        } as unknown as AudioTrack),
      ).toEqual({
        id: "251;opaque-top-level-id",
        name: undefined,
        isDefault: undefined,
        isAutoDubbed: undefined,
      });
    });

    it("falls through each field across partially populated aliases", () => {
      expect(
        readAudioTrackMetadata({
          C_: { id: "en-US.4" },
          Iw: { name: "English (US)", isAutoDubbed: false },
          hs: {
            id: "es.4",
            name: "Spanish",
            isDefault: true,
            isAutoDubbed: true,
          },
        }),
      ).toEqual({
        id: "en-US.4",
        name: "English (US)",
        isDefault: true,
        isAutoDubbed: false,
      });
    });

    it("uses the top-level id only after every metadata alias", () => {
      expect(
        readAudioTrackMetadata({
          id: "opaque-top-level-id",
          yG: { name: "Spanish" },
        }),
      ).toEqual({
        id: "opaque-top-level-id",
        name: "Spanish",
        isDefault: undefined,
        isAutoDubbed: undefined,
      });
    });
  });
});
