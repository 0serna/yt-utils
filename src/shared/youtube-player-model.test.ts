import { describe, it, expect } from "vitest";
import {
  isSpanishLanguage,
  isEnglishLanguage,
  determineSubtitleSelection,
  readSubtitleSignature,
  matchesSubtitleSelection,
  type PlayerSnapshot,
  type CaptionTrack,
  type AudioTrack,
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

    it("falls back to English auto-translation for non-Spanish audio", () => {
      const spanishTrack: CaptionTrack = {
        languageCode: "es",
        isTranslatable: true,
        vssId: ".es",
      };

      expect(
        determineSubtitleSelection({
          ...defaultSnapshot,
          audioLanguage: "fr",
          captionTracks: [spanishTrack],
          translationLanguages: [
            { languageCode: "en", languageName: "English" },
          ],
        }),
      ).toEqual({
        mode: "track",
        track: {
          ...spanishTrack,
          translationLanguage: { languageCode: "en", languageName: "English" },
        },
      });
    });

    it("returns off when English cannot be selected", () => {
      expect(
        determineSubtitleSelection({
          ...defaultSnapshot,
          audioLanguage: "fr",
          captionTracks: [{ languageCode: "fr", vssId: ".fr" }],
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
});
