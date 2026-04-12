export const PLAYBACK_SPEED_MIN = 0.5;
export const PLAYBACK_SPEED_MAX = 2.0;
export const PLAYBACK_SPEED_STEP = 0.05;
export const PLAYBACK_SPEED_DEFAULT = 1.0;
export const PLAYBACK_SPEED_STORAGE_KEY = "yt-utils:playback-speed";

export function normalizePlaybackSpeed(value: number): number {
	const rounded = Math.round(value * 20) / 20;
	return Math.min(PLAYBACK_SPEED_MAX, Math.max(PLAYBACK_SPEED_MIN, rounded));
}

export function formatPlaybackSpeed(value: number): string {
	const rounded = normalizePlaybackSpeed(value);
	return `${rounded.toFixed(2)}x`;
}

export async function getSavedPlaybackSpeed(): Promise<number> {
	try {
		const result = await chrome.storage.local.get(PLAYBACK_SPEED_STORAGE_KEY);
		const stored = result[PLAYBACK_SPEED_STORAGE_KEY];
		if (typeof stored === "number") {
			return normalizePlaybackSpeed(stored);
		}
	} catch {
		// Fall back to default if storage is unavailable
	}
	return PLAYBACK_SPEED_DEFAULT;
}

export async function savePlaybackSpeed(value: number): Promise<void> {
	try {
		await chrome.storage.local.set({
			[PLAYBACK_SPEED_STORAGE_KEY]: normalizePlaybackSpeed(value),
		});
	} catch {
		// Silently fail if storage is unavailable
	}
}
