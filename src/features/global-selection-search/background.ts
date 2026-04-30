import { MESSAGE_GOOGLE_SEARCH, onMessage } from "@shared/messaging";

function isGoogleSearchMessage(message: unknown): message is {
  type: typeof MESSAGE_GOOGLE_SEARCH;
  query: string;
} {
  const msg = message as { type?: string; query?: unknown };
  return (
    msg.type === MESSAGE_GOOGLE_SEARCH &&
    typeof msg.query === "string" &&
    msg.query.trim().length > 0
  );
}

export function registerGoogleSearchHandler(): void {
  onMessage(isGoogleSearchMessage, async (message, sender) => {
    const query = (message as { query: string }).query.trim();
    const url = new URL("https://www.google.com/search");
    url.searchParams.set("q", query);

    await chrome.tabs.create({
      active: false,
      openerTabId: sender.tab?.id,
      url: url.toString(),
    });

    return {
      ok: true,
      message: "Opened Google search results.",
      details: null,
    };
  });
}
