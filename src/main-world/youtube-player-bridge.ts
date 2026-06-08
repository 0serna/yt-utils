import type {
  AudioTrack,
  BridgeRequest,
  BridgeResponse,
  CaptionTrack,
  PlayerSnapshot,
  SubtitleSelection,
  TranslationLanguage,
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
  };
};

type YoutubePlayer = HTMLElement & {
  getPlayerResponse?: () => PlayerResponse | null;
  getVideoData?: () => PlayerResponse["videoDetails"] | null;
  getAudioTrack?: () => AudioTrack | null;
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
};

if (!bridgeWindow[BRIDGE_FLAG]) {
  bridgeWindow[BRIDGE_FLAG] = true;
  window.addEventListener("message", handleBridgeMessage);
}

function handleBridgeMessage(event: MessageEvent<BridgeRequest>): void {
  if (!isBridgeRequestEvent(event)) {
    return;
  }

  window.postMessage(
    createBridgeResponse(event.data, handleBridgeRequest(event.data)),
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
    audioLanguage: inferAudioLanguage(inputs.audioTrack),
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
    audioTrack: cloneValue(audioTrack),
    currentCaptionTrack: cloneValue(readCurrentCaptionTrack(source.player)),
    captionTracks: cloneValue(readCaptionTracks(audioTrack, source.response)),
    translationLanguages: cloneValue(readTranslationLanguages(source.player)),
  };
}

function applySubtitleSelection(selection: SubtitleSelection | null): boolean {
  const player = getMoviePlayer();
  return Boolean(
    player && selection && applySelectionToPlayer(player, selection),
  );
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
  if (track.vssId === undefined && track.vss_id !== undefined) {
    track.vssId = track.vss_id;
  }

  return track as CaptionTrack;
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
  const id = readAudioTrackId(audioTrack);
  const normalized = normalizeLanguageCode(id);
  return isKnownLanguageCode(normalized)
    ? normalized
    : inferLanguageFromName(readAudioTrackName(audioTrack));
}

function readAudioTrackId(
  audioTrack: AudioTrack | null,
): string | null | undefined {
  return readFirstValue([
    audioTrack?.C_?.id,
    audioTrack?.Iw?.id,
    audioTrack?.Z1?.id,
    audioTrack?.yG?.id,
    audioTrack?.hs?.id,
    audioTrack?.id,
  ]);
}

function readAudioTrackName(
  audioTrack: AudioTrack | null,
): string | null | undefined {
  return readFirstValue([
    audioTrack?.C_?.name,
    audioTrack?.Iw?.name,
    audioTrack?.Z1?.name,
    audioTrack?.yG?.name,
    audioTrack?.hs?.name,
  ]);
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
  return Boolean(value && value !== "und");
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

function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length > 0,
  );
}

function cloneValue<T>(value: T): T {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}
