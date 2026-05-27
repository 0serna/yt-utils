export interface Feature {
  name: string;
  isWatchPage?: boolean;
  matchesPage?: (url: URL) => boolean;
  activate(context: FeatureContext): void;
  deactivate(): void;
}

export interface FeatureLogger {
  activation(): void;
  deactivation(): void;
  error(error: unknown, meta?: FeatureLoggerMeta): void;
}

export interface FeatureLoggerMeta {
  phase?: "activate" | "deactivate" | "runtime";
}

export interface FeatureContext {
  sendMessage: (message: unknown) => Promise<unknown>;
  logger: FeatureLogger;
}
