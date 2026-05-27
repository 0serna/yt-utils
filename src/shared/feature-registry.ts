import { createFeatureLogger } from "./feature-logger";
import { sendMessage } from "./messaging";
import type { Feature, FeatureLogger } from "./types";

export class FeatureRegistry {
  private features: Feature[] = [];
  private activeFeatures: Set<Feature> = new Set();
  private featureLoggers: Map<Feature, FeatureLogger> = new Map();
  private lastUrl: string = "";

  constructor() {
    this.listenForNavigation();
  }

  register(feature: Feature): void {
    this.features.push(feature);
    this.forceSync();
  }

  private listenForNavigation(): void {
    window.addEventListener("yt-navigate-finish", () => this.syncFeatures());
    window.addEventListener("popstate", () => this.syncFeatures());

    setInterval(() => {
      this.syncFeatures();
    }, 500);
  }

  private forceSync(): void {
    this.lastUrl = "";
    this.syncFeatures();
  }

  private syncFeatures(): void {
    const url = window.location.href;

    if (url === this.lastUrl) {
      return;
    }

    this.lastUrl = url;
    this.deactivateAll();
    this.activateFeaturesForUrl(new URL(url));
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
