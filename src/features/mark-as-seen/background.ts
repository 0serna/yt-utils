import {
  type ExtensionResult,
  MESSAGE_INLINE_TRIGGER,
  onMessage,
} from "@shared/messaging";
import {
  clearActionStatus,
  normalizeExtensionError,
  runMarkAsSeenForTab,
} from "./automation";

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
    handleInlineTriggerMessage,
  );
}

async function handleInlineTriggerMessage(
  _message: unknown,
  sender: chrome.runtime.MessageSender,
): Promise<ExtensionResult> {
  const tabId = sender.tab?.id;

  if (!tabId) {
    return makeErrorResult(
      "TAB_NOT_FOUND",
      "The current tab could not be identified.",
    );
  }

  try {
    const result = await execAutomationForTab(tabId);
    return buildAutomationResult(result);
  } catch (error) {
    const props = normalizeExtensionError(error);
    return makeErrorResult(props.code, props.message, props.details);
  }
}

async function execAutomationForTab(tabId: number): Promise<ExtensionResult> {
  await clearActionStatus(tabId).catch(() => {});
  const tab = await chrome.tabs.get(tabId);
  return runMarkAsSeenForTab(tabId, tab.url);
}

function buildAutomationResult(result: ExtensionResult): ExtensionResult {
  return {
    ok: result.ok,
    code: result.ok ? undefined : result.code,
    message: result.ok ? "Video marked as seen." : result.message,
    details: result.details ?? null,
  };
}

function makeErrorResult(
  code: string,
  message: string,
  details?: unknown,
): ExtensionResult {
  return { ok: false, code, message, details: details ?? null };
}
