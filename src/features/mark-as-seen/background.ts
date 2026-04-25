import { MESSAGE_INLINE_TRIGGER, onMessage } from "@shared/messaging";
import { clearActionStatus, runMarkAsSeenForTab } from "./automation";

chrome.action.onClicked.addListener(async (tab) => {
  const tabId = tab.id;

  if (!tabId) {
    return;
  }

  await clearActionStatus(tabId);

  const result = await runMarkAsSeenForTab(tabId, tab.url);

  if (result.ok) {
    self.setTimeout(() => {
      clearActionStatus(tabId).catch(() => {});
    }, 3000);
  }
});

export function registerMarkAsSeenHandler(): void {
  onMessage(
    (message) =>
      (message as { type?: string })?.type === MESSAGE_INLINE_TRIGGER,
    async (_message, sender) => {
      const tabId = sender.tab?.id;

      if (!tabId) {
        return {
          ok: false,
          code: "TAB_NOT_FOUND",
          message: "The current tab could not be identified.",
          details: null,
        };
      }

      try {
        await clearActionStatus(tabId).catch(() => {});
        const tab = await chrome.tabs.get(tabId);
        const result = await runMarkAsSeenForTab(tabId, tab.url);

        return {
          ok: result.ok,
          code: result.ok ? undefined : result.code,
          message: result.ok ? "Video marked as seen." : result.message,
          details: result.details ?? null,
        };
      } catch (error) {
        const messageText =
          error instanceof Error ? error.message : "The automation failed.";

        console.error("[YTUtils]", error);

        return {
          ok: false,
          code:
            (error as Error & { code?: string })?.code || "AUTOMATION_FAILED",
          message: messageText,
          details: (error as Error & { details?: unknown })?.details || null,
        };
      }
    },
  );
}
