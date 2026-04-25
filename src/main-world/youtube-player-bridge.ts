type PlayerTextRun = {
  text?: string;
};

type TranslationLanguage = {
  languageCode?: string;
  languageName?: string;
};

type CaptionTrack = {
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

type AudioTrack = {
  id?: string;
  hs?: {
    id?: string;
    name?: string;
    isDefault?: boolean;
    isAutoDubbed?: boolean;
  };
  yG?: {
    id?: string;
    name?: string;
    isDefault?: boolean;
    isAutoDubbed?: boolean;
  };
  captionTracks?: CaptionTrack[];
};

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

type SubtitleSelection = { mode: "off" };

type PlayerSnapshot = {
  videoId: string | null;
  audioTrack: AudioTrack | null;
  audioLanguage: string | null;
  captionTracks: CaptionTrack[];
  translationLanguages: TranslationLanguage[];
  currentCaptionTrack: CaptionTrack | null;
  subtitlesOn: boolean;
};

type BridgeRequest = {
  source: typeof BRIDGE_SOURCE;
  kind: "request";
  id: string;
  action: "readSnapshot" | "applySelection";
  selection?: SubtitleSelection;
};

type BridgeResponse = {
  source: typeof BRIDGE_SOURCE;
  kind: "response";
  id: string;
  result: PlayerSnapshot | boolean | null;
};

const BRIDGE_SOURCE = "yt-utils:youtube-player-bridge";
const BRIDGE_FLAG = "__ytUtilsYoutubePlayerBridgeInstalled";

const bridgeWindow = window as unknown as Window &
  Record<string, boolean | undefined>;

if (!bridgeWindow[BRIDGE_FLAG]) {
  bridgeWindow[BRIDGE_FLAG] = true;
  window.addEventListener("message", (event: MessageEvent<BridgeRequest>) => {
    if (
      event.source !== window ||
      event.data?.source !== BRIDGE_SOURCE ||
      event.data?.kind !== "request"
    ) {
      return;
    }

    let result: PlayerSnapshot | boolean | null = null;
    if (event.data.action === "readSnapshot") {
      result = readPlayerSnapshot();
    } else if (event.data.action === "applySelection") {
      result = applySubtitleSelection(event.data.selection ?? null);
    }

    const response: BridgeResponse = {
      source: BRIDGE_SOURCE,
      kind: "response",
      id: event.data.id,
      result,
    };
    window.postMessage(response, window.location.origin);
  });
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

  const response = player.getPlayerResponse?.() || null;
  const captionTracklist =
    response?.captions?.playerCaptionsTracklistRenderer || null;
  const videoData = player.getVideoData?.() || response?.videoDetails || null;
  const audioTrack = cloneValue(player.getAudioTrack?.() || null);
  const currentCaptionTrack = cloneValue(readCurrentCaptionTrack(player));
  const captionTracks = cloneValue(captionTracklist?.captionTracks || []);
  const translationLanguages = cloneValue(readTranslationLanguages(player));

  return {
    videoId: readVideoId(videoData, response),
    audioTrack,
    audioLanguage: inferAudioLanguage(audioTrack, captionTracks),
    captionTracks,
    translationLanguages,
    currentCaptionTrack,
    subtitlesOn: Boolean(player.isSubtitlesOn?.()),
  };
}

function applySubtitleSelection(selection: SubtitleSelection | null): boolean {
  const player = getMoviePlayer();
  if (!player || !selection) {
    return false;
  }

  if (player.isSubtitlesOn?.()) {
    player.toggleSubtitles?.();
  }

  return true;
}

function readCurrentCaptionTrack(player: YoutubePlayer): CaptionTrack | null {
  const raw = player.getOption?.("captions", "track");
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  if (Object.keys(raw).length === 0) {
    return null;
  }

  return raw as CaptionTrack;
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

function readVideoId(
  videoData: PlayerResponse["videoDetails"] | null,
  response: PlayerResponse | null,
): string | null {
  return (
    normalizeVideoId(videoData?.video_id) ||
    normalizeVideoId(videoData?.videoId) ||
    normalizeVideoId(response?.videoDetails?.video_id) ||
    normalizeVideoId(response?.videoDetails?.videoId) ||
    normalizeVideoId(new URLSearchParams(window.location.search).get("v"))
  );
}

function inferAudioLanguage(
  audioTrack: AudioTrack | null,
  captionTracks: CaptionTrack[],
): string | null {
  const audioTrackCaptionLanguage = normalizeLanguageCode(
    audioTrack?.captionTracks?.[0]?.languageCode,
  );
  if (audioTrackCaptionLanguage && audioTrackCaptionLanguage !== "und") {
    return audioTrackCaptionLanguage;
  }

  const direct = normalizeLanguageCode(
    audioTrack?.yG?.id || audioTrack?.hs?.id || audioTrack?.id,
  );
  if (direct && direct !== "und") {
    return direct;
  }

  const captionLanguage = normalizeLanguageCode(captionTracks[0]?.languageCode);
  if (captionLanguage && captionLanguage !== "und") {
    return captionLanguage;
  }

  const audioName =
    audioTrack?.yG?.name?.trim() || audioTrack?.hs?.name?.trim() || null;
  if (audioName) {
    if (/spanish/i.test(audioName)) {
      return "es";
    }

    if (/english/i.test(audioName)) {
      return "en";
    }
  }

  return null;
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

function cloneValue<T>(value: T): T {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}
