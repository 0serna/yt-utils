import type { Feature, FeatureContext } from "@shared/types";
import {
	applySubtitleSelection,
	determineSubtitleSelection,
	matchesSubtitleSelection,
	readPlayerSnapshot,
	readSubtitleSignature,
	waitForSubtitleSelection,
} from "@shared/youtube-player";

const POLL_INTERVAL_MS = 500;

let pollTimer: number | null = null;
let syncQueued = false;
let sessionToken = 0;
let appliedStateByVideo = new Map<string, string>();
let overriddenVideos = new Set<string>();

const audioLanguageSubtitlePolicyFeature: Feature = {
	name: "audio-language-subtitle-policy",
	isWatchPage: true,

	activate(_context: FeatureContext): void {
		sessionToken += 1;
		appliedStateByVideo = new Map();
		overriddenVideos = new Set();
		startPolling();
		void queueSync();
	},

	deactivate(): void {
		sessionToken += 1;
		stopPolling();
		appliedStateByVideo.clear();
		overriddenVideos.clear();
	},
};

export default audioLanguageSubtitlePolicyFeature;

function startPolling(): void {
	if (pollTimer !== null) {
		return;
	}

	pollTimer = window.setInterval(() => {
		void queueSync();
	}, POLL_INTERVAL_MS);
}

function stopPolling(): void {
	if (pollTimer !== null) {
		window.clearInterval(pollTimer);
		pollTimer = null;
	}
}

async function queueSync(): Promise<void> {
	if (syncQueued) {
		return;
	}

	syncQueued = true;
	try {
		await syncPolicy(sessionToken);
	} finally {
		syncQueued = false;
	}
}

async function syncPolicy(token: number): Promise<void> {
	if (token !== sessionToken) {
		return;
	}

	const snapshot = await readPlayerSnapshot();
	if (!snapshot?.videoId) {
		return;
	}

	if (overriddenVideos.has(snapshot.videoId)) {
		return;
	}

	const currentSignature = readSubtitleSignature(snapshot);
	const appliedSignature = appliedStateByVideo.get(snapshot.videoId);

	if (appliedSignature && currentSignature !== appliedSignature) {
		overriddenVideos.add(snapshot.videoId);
		return;
	}

	const desiredSelection = determineSubtitleSelection(snapshot);
	if (!desiredSelection) {
		return;
	}

	if (!appliedSignature) {
		if (matchesSubtitleSelection(snapshot, desiredSelection)) {
			appliedStateByVideo.set(snapshot.videoId, currentSignature);
			return;
		}

		const started = await applySubtitleSelection(desiredSelection);
		if (!started) {
			return;
		}

		const applied = await waitForSubtitleSelection(
			readPlayerSnapshot,
			desiredSelection,
			{ timeoutMs: 1800, intervalMs: 100 },
		);

		if (!applied || token !== sessionToken) {
			return;
		}

		const verifiedSnapshot = await readPlayerSnapshot();
		if (
			!verifiedSnapshot?.videoId ||
			verifiedSnapshot.videoId !== snapshot.videoId
		) {
			return;
		}

		if (!matchesSubtitleSelection(verifiedSnapshot, desiredSelection)) {
			return;
		}

		appliedStateByVideo.set(
			verifiedSnapshot.videoId,
			readSubtitleSignature(verifiedSnapshot),
		);
		return;
	}

	if (currentSignature !== appliedSignature) {
		overriddenVideos.add(snapshot.videoId);
		return;
	}
}

function isSupportedWatchPage(): boolean {
	return (
		window.location.hostname === "www.youtube.com" &&
		window.location.pathname === "/watch" &&
		new URLSearchParams(window.location.search).has("v")
	);
}

if (!isSupportedWatchPage()) {
	stopPolling();
}
