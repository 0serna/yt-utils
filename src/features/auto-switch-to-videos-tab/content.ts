import type { Feature, FeatureContext } from "@shared/types";
import { clickElement, waitFor } from "@shared/youtube-dom";

const SESSION_STORAGE_KEY_PREFIX = "yt-utils:auto-switch-to-videos-tab:";
const WAIT_TIMEOUT_MS = 2000;

const autoSwitchToVideosTabFeature: Feature = {
  name: "auto-switch-to-videos-tab",

  matchesPage(url: URL): boolean {
    if (url.hostname !== "www.youtube.com") {
      return false;
    }

    const path = url.pathname;
    return (
      path.startsWith("/@") ||
      path.startsWith("/c/") ||
      path.startsWith("/user/") ||
      path.startsWith("/channel/")
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
  const tabs = document.querySelectorAll<HTMLElement>('[role="tab"]');
  let homeSelected = false;
  let videosTab: HTMLElement | null = null;

  for (const tab of tabs) {
    const text = tab.textContent?.trim();
    if (text === "Home" && tab.getAttribute("aria-selected") === "true") {
      homeSelected = true;
    } else if (text === "Videos") {
      videosTab = tab;
    }
    if (homeSelected && videosTab) {
      break;
    }
  }

  return homeSelected ? videosTab : null;
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
