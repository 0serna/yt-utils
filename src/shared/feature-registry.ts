import { sendMessage } from "./messaging";
import type { Feature } from "./types";

export class FeatureRegistry {
  private features: Feature[] = [];
  private activeFeatures: Set<Feature> = new Set();
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
    const parsedUrl = new URL(url);

    if (url === this.lastUrl) {
      return;
    }

    this.lastUrl = url;

    for (const feature of this.activeFeatures) {
      feature.deactivate();
    }

    this.activeFeatures.clear();

    for (const feature of this.features) {
      if (shouldActivateFeature(feature, parsedUrl)) {
        feature.activate({ sendMessage });
        this.activeFeatures.add(feature);
      }
    }
  }
}

function shouldActivateFeature(feature: Feature, url: URL): boolean {
  if (feature.matchesPage) {
    return feature.matchesPage(url);
  }

  if (feature.isWatchPage) {
    return (
      url.hostname === "www.youtube.com" &&
      url.pathname === "/watch" &&
      url.searchParams.has("v")
    );
  }

  return false;
}
