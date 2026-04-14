export const PLAYBACK_SPEED_MIN = 0.5;
export const PLAYBACK_SPEED_MAX = 2.0;
export const PLAYBACK_SPEED_STEP = 0.05;
export const PLAYBACK_SPEED_DEFAULT = 1.0;

export function normalizePlaybackSpeed(value: number): number {
	const rounded = Math.round(value * 20) / 20;
	return Math.min(PLAYBACK_SPEED_MAX, Math.max(PLAYBACK_SPEED_MIN, rounded));
}

export function formatPlaybackSpeed(value: number): string {
	const rounded = normalizePlaybackSpeed(value);
	return `${rounded.toFixed(2)}x`;
}
