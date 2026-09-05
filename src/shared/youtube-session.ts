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

export type WatchSession = {
  readonly videoId: string;
  isCurrent: () => boolean;
  readSnapshot: () => Promise<PlayerSnapshot | null>;
};

/** Owns one feature's activation lifetime and serializes work per watch session. */
export function createWatchSessionController() {
  const navigationEvents = [
    "yt-navigate-start",
    "yt-navigate-finish",
    "yt-page-data-updated",
    "popstate",
  ] as const;
  let active = false;
  let current: WatchSession | null = null;
  let running: WatchSession | null = null;

  function checkNavigation(): void {
    current?.isCurrent();
  }

  function deactivate(): void {
    for (const event of navigationEvents)
      window.removeEventListener(event, checkNavigation);
    active = false;
    current = null;
    running = null;
  }

  function activate(): void {
    deactivate();
    active = true;
    for (const event of navigationEvents)
      window.addEventListener(event, checkNavigation);
  }

  function getSession(): WatchSession | null {
    if (!active) return null;

    const videoId = getCurrentWatchVideoId();
    if (!videoId || !isDesktopWatchPage()) {
      current = null;
      return null;
    }

    if (current?.videoId === videoId && current.isCurrent()) return current;

    const session: WatchSession = {
      videoId,
      isCurrent: () => {
        if (current !== session || !active) return false;
        if (isDesktopWatchPage() && getCurrentWatchVideoId() === videoId)
          return true;
        // Once observed stale, this session must not revive on an A → B → A visit.
        current = null;
        return false;
      },
      readSnapshot: async () => {
        if (!session.isCurrent()) return null;
        const snapshot = await readPlayerSnapshot();
        return session.isCurrent() && snapshot?.videoId === videoId
          ? snapshot
          : null;
      },
    };
    current = session;
    return session;
  }

  async function run(
    sync: (session: WatchSession) => Promise<void>,
  ): Promise<void> {
    const session = getSession();
    if (!session || running === session) return;

    running = session;
    try {
      await sync(session);
    } finally {
      if (running === session) running = null;
    }
  }

  return { activate, deactivate, run };
}
