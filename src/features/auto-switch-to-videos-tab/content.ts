import type { Feature, FeatureContext } from "@shared/types";
import { clickElement, waitFor } from "@shared/youtube-dom";

const SESSION_STORAGE_KEY_PREFIX = "yt-utils:auto-switch-to-videos-tab:";
const WAIT_TIMEOUT_MS = 2000;

const CHANNEL_PATH_PREFIXES = ["/@", "/c/", "/user/", "/channel/"];

const autoSwitchToVideosTabFeature: Feature = {
  name: "auto-switch-to-videos-tab",

  matchesPage(url: URL): boolean {
    return (
      url.hostname === "www.youtube.com" &&
      CHANNEL_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
    );
  },

  activate(_context: FeatureContext): void {
    void trySwitchToVideosTab();
  },

  deactivate(): void {
    // No-op: no persistent observers or timers
  },
};

export default autoSwitchToVideosTabFeature;

function getChannelBasePath(): string {
  const path = window.location.pathname;
  const segments = path.split("/").filter(Boolean);

  if (segments.length === 0) {
    return "";
  }

  if (segments[0].startsWith("@")) {
    return `/${segments[0]}`;
  }

  // For /c/name, /user/name, /channel/ID
  if (segments.length >= 2) {
    return `/${segments[0]}/${segments[1]}`;
  }

  return `/${segments[0]}`;
}

function getSessionStorageKey(): string {
  return `${SESSION_STORAGE_KEY_PREFIX}${getChannelBasePath()}`;
}

function getVideosTabIfHomeSelected(): HTMLElement | null {
  const tabs = [...document.querySelectorAll<HTMLElement>('[role="tab"]')];
  const homeSelected = tabs.some(
    (tab) =>
      tab.textContent?.trim() === "Home" &&
      tab.getAttribute("aria-selected") === "true",
  );

  if (!homeSelected) {
    return null;
  }

  return tabs.find((tab) => tab.textContent?.trim() === "Videos") ?? null;
}

async function trySwitchToVideosTab(): Promise<void> {
  const sessionKey = getSessionStorageKey();
  if (sessionStorage.getItem(sessionKey)) {
    return;
  }

  try {
    const videosTab = await waitFor(() => getVideosTabIfHomeSelected(), {
      timeout: WAIT_TIMEOUT_MS,
      interval: 100,
    });

    if (sessionStorage.getItem(sessionKey)) {
      return;
    }

    clickElement(videosTab);
    sessionStorage.setItem(sessionKey, "1");
  } catch {
    // Intentionally silent: tablist may not appear or Home isn't selected
  }
}
