import { createFeatureLogger } from "./feature-logger";
import { sendMessage } from "./messaging";
import type { Feature, FeatureLogger } from "./types";
import { getCurrentWatchSessionKey } from "./youtube-session";

const NAVIGATION_SYNC_DELAYS_MS = [0, 250, 1000, 2500] as const;
const YOUTUBE_NAVIGATION_EVENTS = [
  "yt-navigate-start",
  "yt-navigate-finish",
  "yt-page-data-updated",
] as const;

export class FeatureRegistry {
  private features: Feature[] = [];
  private activeFeatures: Set<Feature> = new Set();
  private featureLoggers: Map<Feature, FeatureLogger> = new Map();
  private lastSessionKey: string = "";

  constructor() {
    this.listenForNavigation();
  }

  register(feature: Feature): void {
    this.features.push(feature);
    this.forceSync();
  }

  private listenForNavigation(): void {
    for (const eventName of YOUTUBE_NAVIGATION_EVENTS) {
      window.addEventListener(eventName, () => this.scheduleSyncFeatures());
    }
    window.addEventListener("popstate", () => this.scheduleSyncFeatures());

    setInterval(() => {
      this.syncFeatures();
    }, 500);
  }

  private scheduleSyncFeatures(): void {
    for (const delay of NAVIGATION_SYNC_DELAYS_MS) {
      window.setTimeout(() => this.syncFeatures(), delay);
    }
  }

  private forceSync(): void {
    this.lastSessionKey = "";
    this.syncFeatures();
  }

  private syncFeatures(): void {
    const url = new URL(window.location.href);
    const sessionKey = getCurrentWatchSessionKey(url);

    if (sessionKey === this.lastSessionKey) {
      return;
    }

    this.lastSessionKey = sessionKey;
    this.deactivateAll();
    this.activateFeaturesForUrl(url);
  }

  private getFeatureLogger(feature: Feature): FeatureLogger {
    const existing = this.featureLoggers.get(feature);
    if (existing) {
      return existing;
    }

    const logger = createFeatureLogger(feature.name);
    this.featureLoggers.set(feature, logger);
    return logger;
  }

  private deactivateAll(): void {
    for (const feature of this.activeFeatures) {
      const logger = this.getFeatureLogger(feature);

      try {
        feature.deactivate();
        logger.deactivation();
      } catch (error) {
        logger.error(error, { phase: "deactivate" });
      }
    }

    this.activeFeatures.clear();
  }

  private activateFeaturesForUrl(url: URL): void {
    for (const feature of this.features) {
      if (!shouldActivateFeature(feature, url)) {
        continue;
      }

      const logger = this.getFeatureLogger(feature);

      try {
        feature.activate({ sendMessage, logger });
        logger.activation();
        this.activeFeatures.add(feature);
      } catch (error) {
        logger.error(error, { phase: "activate" });
      }
    }
  }
}

function shouldActivateFeature(feature: Feature, url: URL): boolean {
  if (feature.matchesPage) {
    return feature.matchesPage(url);
  }

  return !!(feature.isWatchPage && isWatchPageUrl(url));
}

function isWatchPageUrl(url: URL): boolean {
  return (
    url.hostname === "www.youtube.com" &&
    url.pathname === "/watch" &&
    url.searchParams.has("v")
  );
}
