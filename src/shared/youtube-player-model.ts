export const BRIDGE_SOURCE = "yt-utils:youtube-player-bridge";

type PlayerTextRun = {
  text?: string;
};

export type TranslationLanguage = {
  languageCode?: string;
  languageName?: string;
};

export type CaptionTrack = {
  languageCode?: string;
  kind?: string;
  name?: {
    simpleText?: string;
    runs?: PlayerTextRun[];
  };
  displayName?: string;
  isTranslatable?: boolean;
  isTranslateable?: boolean;
  translationLanguage?: TranslationLanguage | null;
  vssId?: string;
};

type AudioTrackMetadata = {
  id?: string;
  name?: string;
  isDefault?: boolean;
  isAutoDubbed?: boolean;
};

export type AudioTrack = {
  id?: string;
  C_?: AudioTrackMetadata;
  Iw?: AudioTrackMetadata;
  hs?: AudioTrackMetadata;
  yG?: AudioTrackMetadata;
  captionTracks?: CaptionTrack[];
};

export type SubtitleSelection =
  | { mode: "off" }
  | { mode: "track"; track: CaptionTrack };

export type PlayerSnapshot = {
  videoId: string | null;
  audioTrack: AudioTrack | null;
  audioLanguage: string | null;
  captionTracks: CaptionTrack[];
  translationLanguages: TranslationLanguage[];
  currentCaptionTrack: CaptionTrack | null;
  subtitlesOn: boolean;
};

export type BridgeRequest = {
  source: typeof BRIDGE_SOURCE;
  kind: "request";
  id: string;
  action: "readSnapshot" | "applySelection";
  selection?: SubtitleSelection;
};

export type BridgeResponse = {
  source: typeof BRIDGE_SOURCE;
  kind: "response";
  id: string;
  result: PlayerSnapshot | boolean | null;
};

export function isSpanishLanguage(value: string | null | undefined): boolean {
  return normalizeLanguageCode(value)?.startsWith("es") ?? false;
}

export function isEnglishLanguage(value: string | null | undefined): boolean {
  return normalizeLanguageCode(value)?.startsWith("en") ?? false;
}

export function determineSubtitleSelection(
  snapshot: PlayerSnapshot,
): SubtitleSelection {
  if (!isEnglishLanguage(snapshot.audioLanguage)) {
    return { mode: "off" };
  }

  const directEnglishTrack = snapshot.captionTracks.find((track) =>
    isEnglishLanguage(track.languageCode),
  );
  return directEnglishTrack
    ? { mode: "track", track: directEnglishTrack }
    : { mode: "off" };
}

export function readSubtitleSignature(snapshot: PlayerSnapshot): string {
  const subtitlesPart = snapshot.subtitlesOn ? "on" : "off";
  const captionPart = getCaptionTrackSignature(snapshot.currentCaptionTrack);
  const audioPart = getAudioTrackSignature(snapshot.audioTrack);

  return [subtitlesPart, captionPart, audioPart].join("|");
}

export function matchesSubtitleSelection(
  snapshot: PlayerSnapshot,
  selection: SubtitleSelection,
): boolean {
  if (selection.mode === "off") {
    return snapshot.subtitlesOn === false;
  }

  return (
    snapshot.subtitlesOn === true &&
    getCaptionTrackSignature(snapshot.currentCaptionTrack) ===
      getCaptionTrackSignature(selection.track)
  );
}

function normalizeLanguageCode(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .split(".")[0]
    .replaceAll("_", "-");
  return normalized.length > 0 ? normalized : null;
}

function getCaptionTrackSignature(track: CaptionTrack | null): string {
  if (!track) {
    return "caption:none";
  }

  return [
    "caption",
    signaturePart(normalizeLanguageCode(track.languageCode)),
    signaturePart(track.kind),
    signaturePart(track.vssId),
    signaturePart(
      normalizeLanguageCode(track.translationLanguage?.languageCode),
    ),
  ].join(":");
}

function getAudioTrackSignature(track: AudioTrack | null): string {
  if (!track) {
    return "audio:none";
  }

  return [
    "audio",
    readAudioTrackLanguagePart(track),
    readAudioTrackNamePart(track),
    readAudioTrackDubPart(track),
  ].join(":");
}

function readAudioTrackMetadata(track: AudioTrack): AudioTrackMetadata | null {
  return track.C_ || track.hs || track.yG || null;
}

function readAudioTrackLanguagePart(track: AudioTrack): string {
  const metadata = readAudioTrackMetadata(track);
  return signaturePart(normalizeLanguageCode(metadata?.id || track.id));
}

function readAudioTrackNamePart(track: AudioTrack): string {
  return signaturePart(normalizeText(readAudioTrackMetadata(track)?.name));
}

function readAudioTrackDubPart(track: AudioTrack): string {
  return readAudioTrackMetadata(track)?.isAutoDubbed ? "auto" : "original";
}

function signaturePart(value: string | null | undefined): string {
  return value || "none";
}

function normalizeText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}
