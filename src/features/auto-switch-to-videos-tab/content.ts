import type { Feature, FeatureContext } from "@shared/types";

const CHANNEL_PATH_PREFIXES = ["/@", "/c/", "/user/", "/channel/"];

const autoSwitchToVideosTabFeature: Feature = {
  name: "auto-switch-to-videos-tab",

  matchesPage(url: URL): boolean {
    return (
      url.hostname === "www.youtube.com" &&
      CHANNEL_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
    );
  },

  activate(context: FeatureContext): void {
    trySwitchToVideosTab(context.previousUrl);
  },

  deactivate(): void {},
};

export default autoSwitchToVideosTabFeature;

function getChannelBasePath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);

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

function isChannelHomePath(pathname: string): boolean {
  const normalizedPath = pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
  const basePath = getChannelBasePath(pathname);
  return (
    normalizedPath === basePath || normalizedPath === `${basePath}/featured`
  );
}

function isSameChannel(previousUrl: URL | null, basePath: string): boolean {
  return (
    previousUrl?.hostname === "www.youtube.com" &&
    getChannelBasePath(previousUrl.pathname) === basePath
  );
}

function trySwitchToVideosTab(previousUrl: URL | null): void {
  const pathname = window.location.pathname;
  const basePath = getChannelBasePath(pathname);

  if (!isChannelHomePath(pathname) || isSameChannel(previousUrl, basePath)) {
    return;
  }

  window.location.assign(`${window.location.origin}${basePath}/videos`);
}
