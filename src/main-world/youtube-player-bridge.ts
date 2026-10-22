import type {
  AudioTrack,
  AvailableAudioTrack,
  BridgeRequest,
  BridgeResponse,
  CaptionTrack,
  PlayerSnapshot,
  SubtitleSelection,
  TranslationLanguage,
} from "@shared/youtube-player-model";
import {
  readAudioTrackIdentity,
  readAudioTrackMetadata,
  summarizeAvailableAudioTrack,
} from "@shared/youtube-player-model";

type PlayerResponse = {
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[];
    };
  };
  videoDetails?: {
    videoId?: string;
    video_id?: string;
    title?: string;
    shortDescription?: string;
  };
};

type YoutubePlayer = HTMLElement & {
  getPlayerResponse?: () => PlayerResponse | null;
  getVideoData?: () => PlayerResponse["videoDetails"] | null;
  getAudioTrack?: () => AudioTrack | null;
  getAvailableAudioTracks?: () => AudioTrack[] | null;
  setAudioTrack?: (track: AudioTrack) => void;
  getOption?: (namespace: string, key: string) => unknown;
  isSubtitlesOn?: () => boolean;
  toggleSubtitles?: () => void;
  toggleSubtitlesOn?: () => void;
  setOption?: (namespace: string, key: string, value: unknown) => void;
};

type SnapshotInputs = {
  response: PlayerResponse | null;
  captionTracks: CaptionTrack[];
  videoData: PlayerResponse["videoDetails"] | null;
  audioTrack: AudioTrack | null;
  availableAudioTracks: AvailableAudioTrack[];
  currentCaptionTrack: CaptionTrack | null;
  translationLanguages: TranslationLanguage[];
};

type SnapshotSource = {
  player: YoutubePlayer;
  response: PlayerResponse | null;
};

type BridgeResult = PlayerSnapshot | boolean | null;

type BridgeRequestHandler = (request: BridgeRequest) => BridgeResult;

const BRIDGE_SOURCE = "yt-utils:youtube-player-bridge";
const BRIDGE_FLAG = "__ytUtilsYoutubePlayerBridgeInstalled";

const bridgeWindow = window as unknown as Window &
  Record<string, boolean | undefined>;

const bridgeRequestHandlers: Record<
  BridgeRequest["action"],
  BridgeRequestHandler
> = {
  readSnapshot: () => readPlayerSnapshot(),
  applySelection: (request) =>
    applySubtitleSelection(request.selection ?? null),
  applyAudioTrack: (request) =>
    applyAudioTrackSelection(request.audioTrackId ?? null),
};

if (!bridgeWindow[BRIDGE_FLAG]) {
  bridgeWindow[BRIDGE_FLAG] = true;
  window.addEventListener("message", handleBridgeMessage);
}

function handleBridgeMessage(event: MessageEvent<BridgeRequest>): void {
  if (!isBridgeRequestEvent(event)) {
    return;
  }

  let result: BridgeResult = null;
  try {
    result = handleBridgeRequest(event.data);
  } catch {
    result = null;
  }

  window.postMessage(
    createBridgeResponse(event.data, result),
    window.location.origin,
  );
}

function isBridgeRequestEvent(
  event: MessageEvent<BridgeRequest>,
): event is MessageEvent<BridgeRequest> {
  return event.source === window && hasBridgeRequestShape(event.data);
}

function hasBridgeRequestShape(data: BridgeRequest | undefined): boolean {
  return data?.source === BRIDGE_SOURCE && data?.kind === "request";
}

function handleBridgeRequest(request: BridgeRequest): BridgeResult {
  return bridgeRequestHandlers[request.action]?.(request) ?? null;
}

function createBridgeResponse(
  request: BridgeRequest,
  result: BridgeResult,
): BridgeResponse {
  return {
    source: BRIDGE_SOURCE,
    kind: "response",
    id: request.id,
    result,
  };
}

function getMoviePlayer(): YoutubePlayer | null {
  const element = document.getElementById("movie_player");
  return element instanceof HTMLElement ? (element as YoutubePlayer) : null;
}

function readPlayerSnapshot(): PlayerSnapshot | null {
  const player = getMoviePlayer();
  if (!player) {
    return null;
  }

  const inputs = readSnapshotInputs({
    player,
    response: player.getPlayerResponse?.() || null,
  });
  return buildPlayerSnapshot(inputs, player);
}

function buildPlayerSnapshot(
  inputs: SnapshotInputs,
  player: YoutubePlayer,
): PlayerSnapshot {
  return {
    videoId: readVideoId(inputs.videoData, inputs.response),
    audioTrack: inputs.audioTrack,
    availableAudioTracks: inputs.availableAudioTracks,
    audioLanguage: inferAudioLanguage(inputs.audioTrack),
    contentLanguage: inferContentLanguage(inputs.response),
    captionTracks: inputs.captionTracks,
    translationLanguages: inputs.translationLanguages,
    currentCaptionTrack: inputs.currentCaptionTrack,
    subtitlesOn: Boolean(player.isSubtitlesOn?.()),
  };
}

function readSnapshotInputs(source: SnapshotSource): SnapshotInputs {
  const audioTrack = source.player.getAudioTrack?.() || null;

  return {
    response: source.response,
    videoData: readVideoData(source),
    audioTrack,
    availableAudioTracks: readAvailableAudioTracks(source.player),
    currentCaptionTrack: readCurrentCaptionTrack(source.player),
    captionTracks: readCaptionTracks(audioTrack, source.response),
    translationLanguages: readTranslationLanguages(source.player),
  };
}

function applySubtitleSelection(selection: SubtitleSelection | null): boolean {
  const player = getMoviePlayer();
  return Boolean(
    player && selection && applySelectionToPlayer(player, selection),
  );
}

function applyAudioTrackSelection(audioTrackId: string | null): boolean {
  const player = getMoviePlayer();
  if (!player || !audioTrackId || !player.setAudioTrack) {
    return false;
  }

  const track = readAvailableAudioTrackObjects(player).find(
    (candidate) => readAudioTrackIdentity(candidate) === audioTrackId,
  );
  if (!track) {
    return false;
  }

  player.setAudioTrack(track);
  return true;
}

function readAvailableAudioTracks(
  player: YoutubePlayer,
): AvailableAudioTrack[] {
  return readAvailableAudioTrackObjects(player).map(
    summarizeAvailableAudioTrack,
  );
}

function readAvailableAudioTrackObjects(player: YoutubePlayer): AudioTrack[] {
  const tracks = player.getAvailableAudioTracks?.();
  return Array.isArray(tracks) ? tracks : [];
}

function applySelectionToPlayer(
  player: YoutubePlayer,
  selection: SubtitleSelection,
): boolean {
  if (selection.mode === "off") {
    if (player.isSubtitlesOn?.()) {
      player.toggleSubtitles?.();
    }

    return true;
  }

  if (!player.isSubtitlesOn?.()) {
    if (player.toggleSubtitlesOn) {
      player.toggleSubtitlesOn();
    } else {
      player.toggleSubtitles?.();
    }
  }

  player.setOption?.("captions", "track", selection.track);
  player.setOption?.("captions", "reload", true);
  return true;
}

function readCurrentCaptionTrack(player: YoutubePlayer): CaptionTrack | null {
  const raw = player.getOption?.("captions", "track");
  if (!isNonEmptyObject(raw)) {
    return null;
  }

  const track = raw as Record<string, unknown>;
  return {
    ...(track as CaptionTrack),
    vssId:
      typeof track.vssId === "string"
        ? track.vssId
        : typeof track.vss_id === "string"
          ? track.vss_id
          : undefined,
  };
}

function readTranslationLanguages(
  player: YoutubePlayer,
): TranslationLanguage[] {
  const raw = player.getOption?.("captions", "translationLanguages");
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((value): value is TranslationLanguage =>
    Boolean(
      value &&
        typeof value === "object" &&
        "languageCode" in value &&
        typeof (value as TranslationLanguage).languageCode === "string",
    ),
  );
}

function readVideoData(
  source: SnapshotSource,
): PlayerResponse["videoDetails"] | null {
  return readFirstValue([
    source.player.getVideoData?.(),
    source.response?.videoDetails,
  ]);
}

function readCaptionTracks(
  audioTrack: AudioTrack | null,
  response: PlayerResponse | null,
): CaptionTrack[] {
  return (
    audioTrack?.captionTracks ||
    response?.captions?.playerCaptionsTracklistRenderer?.captionTracks ||
    []
  );
}

function readVideoId(
  videoData: PlayerResponse["videoDetails"] | null,
  response: PlayerResponse | null,
): string | null {
  return readFirstNormalizedVideoId(readVideoIdCandidates(videoData, response));
}

function readVideoIdCandidates(
  videoData: PlayerResponse["videoDetails"] | null,
  response: PlayerResponse | null,
): Array<string | null | undefined> {
  return [
    ...readVideoDataIdCandidates(videoData),
    ...readVideoDataIdCandidates(response?.videoDetails || null),
    readUrlVideoId(),
  ];
}

function readVideoDataIdCandidates(
  videoData: PlayerResponse["videoDetails"] | null,
): Array<string | null | undefined> {
  return [videoData?.video_id, videoData?.videoId];
}

function readUrlVideoId(): string | null {
  return new URLSearchParams(window.location.search).get("v");
}

function inferAudioLanguage(audioTrack: AudioTrack | null): string | null {
  const metadata = readAudioTrackMetadata(audioTrack);
  const normalized = normalizeLanguageCode(metadata?.id);
  return isKnownLanguageCode(normalized)
    ? normalized
    : inferLanguageFromName(metadata?.name);
}

const SPANISH_MARKERS = new Set([
  "asi",
  "ciencia",
  "como",
  "con",
  "cual",
  "de",
  "dias",
  "el",
  "en",
  "exito",
  "falla",
  "formas",
  "historias",
  "la",
  "las",
  "los",
  "para",
  "por",
  "que",
  "todos",
  "una",
]);

const ENGLISH_MARKERS = new Set([
  "about",
  "and",
  "are",
  "for",
  "from",
  "how",
  "is",
  "of",
  "on",
  "that",
  "the",
  "this",
  "to",
  "what",
  "when",
  "where",
  "with",
  "why",
  "you",
  "your",
]);

function inferContentLanguage(response: PlayerResponse | null): string | null {
  const title = response?.videoDetails?.title;
  if (isSpanishDecisive(readLanguageWords(title))) {
    return "es";
  }

  const text = [title, response?.videoDetails?.shortDescription]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ");
  return isSpanishDecisive(readLanguageWords(text)) ? "es" : null;
}

function readLanguageWords(value: string | null | undefined): string[] {
  const text = value?.trim() ? value : "";
  return normalizeLanguageText(text).match(/[a-z]+/g) ?? [];
}

function isSpanishDecisive(words: string[]): boolean {
  const spanishScore = words.filter((word) => SPANISH_MARKERS.has(word)).length;
  const englishScore = words.filter((word) => ENGLISH_MARKERS.has(word)).length;
  return spanishScore >= 3 && spanishScore > englishScore + 1;
}

function readFirstValue<T>(values: Array<T | null | undefined>): T | null {
  return values.find((value): value is T => value != null) ?? null;
}

function readFirstNormalizedVideoId(
  values: Array<string | null | undefined>,
): string | null {
  return values.map(normalizeVideoId).find(Boolean) ?? null;
}

function inferLanguageFromName(
  value: string | null | undefined,
): string | null {
  const name = value?.trim() || "";
  return (
    [
      { pattern: /spanish/i, language: "es" },
      { pattern: /english/i, language: "en" },
    ].find(({ pattern }) => pattern.test(name))?.language ?? null
  );
}

function isKnownLanguageCode(value: string | null): value is string {
  return Boolean(
    value && value !== "und" && /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(value),
  );
}

function normalizeVideoId(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeLanguageCode(
  value: string | null | undefined,
): string | null {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized.length === 0) {
    return null;
  }

  return normalized.split(".", 1)[0].replaceAll("_", "-");
}

function normalizeLanguageText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length > 0,
  );
}
