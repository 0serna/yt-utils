import { isDesktopWatchPage } from "./youtube-dom";
import type { PlayerSnapshot } from "./youtube-player";
import { readPlayerSnapshot } from "./youtube-player";

export function getCurrentWatchVideoId(
  url: URL = new URL(window.location.href),
): string | null {
  if (url.hostname !== "www.youtube.com" || url.pathname !== "/watch") {
    return null;
  }

  return url.searchParams.get("v");
}

export function getCurrentWatchSessionKey(
  url: URL = new URL(window.location.href),
): string {
  const videoId = getCurrentWatchVideoId(url);
  return videoId ? `watch:${videoId}` : url.href;
}

export async function readConfirmedCurrentVideoSnapshot(): Promise<PlayerSnapshot | null> {
  if (!isDesktopWatchPage()) {
    return null;
  }

  const videoId = getCurrentWatchVideoId();
  if (!videoId) {
    return null;
  }

  const snapshot = await readPlayerSnapshot();
  return snapshot?.videoId === videoId ? snapshot : null;
}

export function isCurrentWatchVideo(videoId: string): boolean {
  return isDesktopWatchPage() && getCurrentWatchVideoId() === videoId;
}
