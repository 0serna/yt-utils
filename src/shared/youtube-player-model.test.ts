import { describe, expect, it } from "vitest";
import {
  type AudioTrack,
  type CaptionTrack,
  determineSubtitleSelection,
  isEnglishLanguage,
  isSpanishLanguage,
  matchesSubtitleSelection,
  type PlayerSnapshot,
  readAudioTrackMetadata,
  readSubtitleSignature,
} from "./youtube-player-model";

const defaultSnapshot: PlayerSnapshot = {
  videoId: "test",
  audioTrack: null,
  audioLanguage: null,
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

    it("returns off for non-English audio even when a direct English track exists", () => {
      expect(
        determineSubtitleSelection({
          ...defaultSnapshot,
          audioLanguage: "fr",
          captionTracks: [{ languageCode: "en", vssId: ".en" }],
        }),
      ).toEqual({ mode: "off" });
    });

    it("returns off for non-English audio even when an English ASR track exists", () => {
      expect(
        determineSubtitleSelection({
          ...defaultSnapshot,
          audioLanguage: "fr",
          captionTracks: [{ languageCode: "en", kind: "asr", vssId: "a.en" }],
        }),
      ).toEqual({ mode: "off" });
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

    it("returns off for unknown audio when the English track is not auto-generated", () => {
      expect(
        determineSubtitleSelection({
          ...defaultSnapshot,
          audioLanguage: null,
          captionTracks: [{ languageCode: "en", vssId: ".en" }],
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
      expect(readSubtitleSignature(defaultSnapshot)).toBe(
        "off|caption:none|audio:none",
      );
    });

    it("generates signature with subtitles on", () => {
      expect(
        readSubtitleSignature({ ...defaultSnapshot, subtitlesOn: true }),
      ).toBe("on|caption:none|audio:none");
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
        "on|caption:en:asr:.en:none|audio:none",
      );
    });

    it("generates signature with audio track", () => {
      const audioTrack: AudioTrack = {
        hs: {
          id: "en",
          name: "English",
          isDefault: true,
          isAutoDubbed: false,
        },
      };
      const snapshot: PlayerSnapshot = {
        ...defaultSnapshot,
        audioTrack,
        audioLanguage: "en",
      };
      expect(readSubtitleSignature(snapshot)).toBe(
        "off|caption:none|audio:en:english:original",
      );
    });

    it("generates signature with current YouTube audio metadata shape", () => {
      const audioTrack: AudioTrack = {
        C_: {
          id: "en-US.4",
          name: "English (US) original",
          isDefault: true,
          isAutoDubbed: false,
        },
      };
      const snapshot: PlayerSnapshot = {
        ...defaultSnapshot,
        audioTrack,
        audioLanguage: "en-US",
      };
      expect(readSubtitleSignature(snapshot)).toBe(
        "off|caption:none|audio:en-us:english (us) original:original",
      );
    });

    it("generates signature with Z1 YouTube audio metadata shape", () => {
      const audioTrack: AudioTrack = {
        id: "251;ChEKBWFjb250EghvcmlnaW5hbAoNCgRsYW5nEgVlcy1VUwoHCgJ2YhIBMQ",
        Z1: {
          id: "es-US.4",
          name: "Spanish (US) original",
          isDefault: true,
          isAutoDubbed: false,
        },
      };
      const snapshot: PlayerSnapshot = {
        ...defaultSnapshot,
        audioTrack,
        audioLanguage: "es-US",
      };
      expect(readSubtitleSignature(snapshot)).toBe(
        "off|caption:none|audio:es-us:spanish (us) original:original",
      );
    });

    it("generates signature with auto-dubbed audio track", () => {
      const audioTrack: AudioTrack = {
        hs: {
          id: "es",
          name: "Spanish",
          isDefault: false,
          isAutoDubbed: true,
        },
      };
      const snapshot: PlayerSnapshot = {
        ...defaultSnapshot,
        audioTrack,
        audioLanguage: "es",
      };
      expect(readSubtitleSignature(snapshot)).toBe(
        "off|caption:none|audio:es:spanish:auto",
      );
    });

    it("uses the shared alias precedence for conflicting metadata", () => {
      const snapshot: PlayerSnapshot = {
        ...defaultSnapshot,
        audioTrack: {
          US: { id: "es-MX.4", name: "Spanish (Mexico)" },
          hs: { id: "en.4", name: "English", isAutoDubbed: true },
        },
      };

      expect(readSubtitleSignature(snapshot)).toBe(
        "off|caption:none|audio:es-mx:spanish (mexico):auto",
      );
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
      expect(readSubtitleSignature(snapshot)).toBe(
        "on|caption:es:asr:.es:en|audio:none",
      );
    });
  });

  describe("readAudioTrackMetadata", () => {
    it.each(["C_", "Iw", "Z1", "US", "yG", "hs"] as const)(
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
