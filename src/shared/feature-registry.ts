import type { Feature, FeatureContext } from "./types";
import { sendMessage } from "./messaging";

export class FeatureRegistry {
  private features: Feature[] = [];
  private activeFeatures: Set<Feature> = new Set();
  private lastUrl: string = "";
  private lastIsWatchPage: boolean | null = null;

  constructor() {
    this.listenForNavigation();
  }

  register(feature: Feature): void {
    this.features.push(feature);
    this.syncFeatures();
  }

  private listenForNavigation(): void {
    window.addEventListener("yt-navigate-finish", () => this.syncFeatures());
    window.addEventListener("popstate", () => this.syncFeatures());

    setInterval(() => {
      this.syncFeatures();
    }, 500);
  }

  private syncFeatures(): void {
    const url = window.location.href;
    const isWatchPage =
      window.location.hostname === "www.youtube.com" &&
      window.location.pathname === "/watch" &&
      new URLSearchParams(window.location.search).has("v");

    if (url === this.lastUrl) {
      return;
    }

    this.lastUrl = url;
    const watchPageChanged = isWatchPage !== this.lastIsWatchPage;
    this.lastIsWatchPage = isWatchPage;

    const context: FeatureContext = {
      sendMessage,
    };

    for (const feature of this.activeFeatures) {
      feature.deactivate();
    }

    this.activeFeatures.clear();

    if (!isWatchPage) {
      return;
    }

    for (const feature of this.features) {
      if (feature.isWatchPage) {
        feature.activate(context);
        this.activeFeatures.add(feature);
      }
    }
  }
}