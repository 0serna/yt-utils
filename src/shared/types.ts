export interface Feature {
	name: string;
	isWatchPage?: boolean;
	matchesPage?: (url: URL) => boolean;
	activate(context: FeatureContext): void;
	deactivate(): void;
}

export interface FeatureContext {
	sendMessage: (message: unknown) => Promise<unknown>;
}
