import type { Feature, FeatureContext } from "@shared/types";

const SESSION_STORAGE_KEY_PREFIX = "yt-utils:auto-switch-to-videos-tab:";

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

  deactivate(): void {},
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

  if (segments.length >= 2) {
    return `/${segments[0]}/${segments[1]}`;
  }

  return `/${segments[0]}`;
}

function getSessionStorageKey(): string {
  return `${SESSION_STORAGE_KEY_PREFIX}${getChannelBasePath()}`;
}

function isChannelHomePath(): boolean {
  const path = window.location.pathname;
  const normalizedPath = path.endsWith("/") ? path.slice(0, -1) : path;
  return normalizedPath === getChannelBasePath();
}

async function trySwitchToVideosTab(): Promise<void> {
  const sessionKey = getSessionStorageKey();
  if (sessionStorage.getItem(sessionKey) || !isChannelHomePath()) {
    return;
  }

  window.location.assign(
    `${window.location.origin}${getChannelBasePath()}/videos`,
  );
  sessionStorage.setItem(sessionKey, "1");
}
