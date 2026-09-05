import { registerGoogleSearchHandler } from "./features/global-selection-search/background";
import { registerMarkAsSeenHandler } from "./features/mark-as-seen/background";
import type { LogEntry } from "./shared/feature-logger";
import { appendAndTrim } from "./shared/feature-logger";
import { MESSAGE_LOG_EVENT, onMessage } from "./shared/messaging";

registerMarkAsSeenHandler();
registerGoogleSearchHandler();
registerLogEventHandler();

function registerLogEventHandler(): void {
  onMessage(
    (message) => (message as { type?: string })?.type === MESSAGE_LOG_EVENT,
    async (message) => {
      const entry = (message as { entry: LogEntry }).entry;
      await appendAndTrim(entry);
      return { ok: true };
    },
  );
}
