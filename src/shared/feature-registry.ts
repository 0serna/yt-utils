import { sendMessage } from "./messaging";
import type { Feature, FeatureContext } from "./types";

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
		const isWatchPage =
			window.location.hostname === "www.youtube.com" &&
			window.location.pathname === "/watch" &&
			new URLSearchParams(window.location.search).has("v");

		if (url === this.lastUrl) {
			return;
		}

		this.lastUrl = url;

		for (const feature of this.activeFeatures) {
			feature.deactivate();
		}

		this.activeFeatures.clear();

		if (!isWatchPage) {
			return;
		}

		const context: FeatureContext = {
			sendMessage,
		};

		for (const feature of this.features) {
			if (feature.isWatchPage) {
				feature.activate(context);
				this.activeFeatures.add(feature);
			}
		}
	}
}
