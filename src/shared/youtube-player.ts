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

export type AudioTrack = {
	id?: string;
	hs?: {
		id?: string;
		name?: string;
		isDefault?: boolean;
		isAutoDubbed?: boolean;
	};
	captionTracks?: CaptionTrack[];
};

export type SubtitleSelection =
	| { mode: "off" }
	| { mode: "direct"; track: CaptionTrack }
	| {
			mode: "translated";
			track: CaptionTrack;
			translationLanguage: TranslationLanguage;
	  };

export type PlayerSnapshot = {
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
const BRIDGE_RESPONSE_TIMEOUT_MS = 2000;

let requestCounter = 0;

export async function readPlayerSnapshot(): Promise<PlayerSnapshot | null> {
	const snapshot = await sendBridgeRequest("readSnapshot");
	if (!snapshot || typeof snapshot !== "object") {
		return null;
	}

	return snapshot as PlayerSnapshot;
}

export function isSpanishLanguage(value: string | null | undefined): boolean {
	return normalizeLanguageCode(value)?.startsWith("es") ?? false;
}

export function isEnglishLanguage(value: string | null | undefined): boolean {
	return normalizeLanguageCode(value)?.startsWith("en") ?? false;
}

export function inferAudioLanguage(
	audioTrack: AudioTrack | null,
	captionTracks: CaptionTrack[],
): string | null {
	const direct = normalizeLanguageCode(audioTrack?.hs?.id || audioTrack?.id);
	if (direct && direct !== "und") {
		return direct;
	}

	const captionLanguage = normalizeLanguageCode(captionTracks[0]?.languageCode);
	if (captionLanguage && captionLanguage !== "und") {
		return captionLanguage;
	}

	const audioName = audioTrack?.hs?.name?.trim() || null;
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

export function determineSubtitleSelection(
	snapshot: PlayerSnapshot,
): SubtitleSelection | null {
	if (!snapshot.audioLanguage) {
		return { mode: "off" };
	}

	if (
		isSpanishLanguage(snapshot.audioLanguage) ||
		isEnglishLanguage(snapshot.audioLanguage)
	) {
		return { mode: "off" };
	}

	if (snapshot.captionTracks.length === 0) {
		return { mode: "off" };
	}

	const directEnglishTrack = findDirectEnglishTrack(snapshot.captionTracks);
	if (directEnglishTrack) {
		return { mode: "direct", track: directEnglishTrack };
	}

	const translationLanguage = findEnglishTranslationLanguage(
		snapshot.translationLanguages,
	);
	const translatableSourceTrack = findTranslatableSourceTrack(
		snapshot.captionTracks,
	);
	if (translationLanguage && translatableSourceTrack) {
		return {
			mode: "translated",
			track: translatableSourceTrack,
			translationLanguage,
		};
	}

	return { mode: "off" };
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
	switch (selection.mode) {
		case "off":
			return snapshot.subtitlesOn === false;
		case "direct":
			return (
				snapshot.subtitlesOn &&
				isEnglishLanguage(snapshot.currentCaptionTrack?.languageCode) &&
				!snapshot.currentCaptionTrack?.translationLanguage
			);
		case "translated":
			return (
				snapshot.subtitlesOn &&
				normalizeLanguageCode(
					snapshot.currentCaptionTrack?.translationLanguage?.languageCode,
				) === "en"
			);
	}

	return false;
}

export async function applySubtitleSelection(
	selection: SubtitleSelection,
): Promise<boolean> {
	const result = await sendBridgeRequest("applySelection", selection);
	return result === true;
}

export async function waitForSubtitleSelection(
	getSnapshot: () => Promise<PlayerSnapshot | null>,
	selection: SubtitleSelection,
	options?: {
		timeoutMs?: number;
		intervalMs?: number;
	},
): Promise<boolean> {
	const timeoutMs = options?.timeoutMs ?? 1500;
	const intervalMs = options?.intervalMs ?? 100;
	const startedAt = Date.now();

	while (Date.now() - startedAt <= timeoutMs) {
		const snapshot = await getSnapshot();
		if (snapshot && matchesSubtitleSelection(snapshot, selection)) {
			return true;
		}

		await delay(intervalMs);
	}

	return false;
}

async function sendBridgeRequest(
	action: BridgeRequest["action"],
	selection?: SubtitleSelection,
): Promise<PlayerSnapshot | boolean | null> {
	const id = `${Date.now()}-${requestCounter++}`;

	return new Promise((resolve) => {
		let settled = false;
		const timeout = window.setTimeout(() => {
			cleanup();
			resolve(null);
		}, BRIDGE_RESPONSE_TIMEOUT_MS);

		const onMessage = (event: MessageEvent<BridgeResponse>) => {
			if (
				event.source !== window ||
				event.data?.source !== BRIDGE_SOURCE ||
				event.data?.kind !== "response" ||
				event.data?.id !== id
			) {
				return;
			}

			cleanup();
			resolve(event.data.result ?? null);
		};

		const cleanup = () => {
			if (settled) {
				return;
			}

			settled = true;
			window.clearTimeout(timeout);
			window.removeEventListener("message", onMessage);
		};

		window.addEventListener("message", onMessage);
		const request: BridgeRequest = {
			source: BRIDGE_SOURCE,
			kind: "request",
			id,
			action,
			selection,
		};
		window.postMessage(request, window.location.origin);
	});
}

function findDirectEnglishTrack(tracks: CaptionTrack[]): CaptionTrack | null {
	return (
		tracks.find(
			(track) =>
				isEnglishLanguage(track.languageCode) && !track.translationLanguage,
		) || null
	);
}

function findTranslatableSourceTrack(
	tracks: CaptionTrack[],
): CaptionTrack | null {
	return (
		tracks.find((track) =>
			Boolean(track.isTranslatable || track.isTranslateable),
		) ||
		tracks[0] ||
		null
	);
}

function findEnglishTranslationLanguage(
	languages: TranslationLanguage[],
): TranslationLanguage | null {
	return (
		languages.find((language) => isEnglishLanguage(language.languageCode)) ||
		null
	);
}

function getCaptionTrackSignature(track: CaptionTrack | null): string {
	if (!track) {
		return "caption:none";
	}

	const translation =
		normalizeLanguageCode(track.translationLanguage?.languageCode) || "none";
	const languageCode = normalizeLanguageCode(track.languageCode) || "none";
	const kind = track.kind || "none";
	const vssId = track.vssId || "none";

	return `caption:${languageCode}:${kind}:${vssId}:${translation}`;
}

function getAudioTrackSignature(track: AudioTrack | null): string {
	if (!track) {
		return "audio:none";
	}

	const id = normalizeLanguageCode(track.hs?.id || track.id) || "none";
	const name = normalizeText(track.hs?.name) || "none";
	const autoDubbed = track.hs?.isAutoDubbed ? "auto" : "original";

	return `audio:${id}:${name}:${autoDubbed}`;
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

function normalizeText(value: string | null | undefined): string | null {
	if (!value) {
		return null;
	}

	const normalized = value.trim().toLowerCase();
	return normalized.length > 0 ? normalized : null;
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => {
		window.setTimeout(resolve, ms);
	});
}
