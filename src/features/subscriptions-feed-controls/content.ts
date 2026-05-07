import { getBootstrapIconMarkup } from "@shared/bootstrap-icons";
import { hasRelevantSelectorMutation } from "@shared/dom-mutations";
import { applyExtensionButtonStyles } from "@shared/extension-button";
import type { Feature, FeatureContext } from "@shared/types";
import {
  clickElement,
  findSubscriptionsCardMenuButton,
  findSubscriptionsCardOverlayActionsHost,
  findSubscriptionsFeedCards,
  findSubscriptionsHideMenuItem,
  isDesktopSubscriptionsFeedPage,
  waitFor,
} from "@shared/youtube-dom";

const BUTTON_HOST_ID_PREFIX = "yt-utils-subscriptions-hide-host-";
const BUTTON_ID_PREFIX = "yt-utils-subscriptions-hide-button-";
const CARD_KEY_ATTRIBUTE = "ytUtilsSubscriptionsHideKey";
const HIDE_ACTION_TIMEOUT_MS = 3000;
const RELEVANT_HIDE_SELECTOR =
  "ytd-rich-item-renderer, yt-thumbnail-hover-overlay-toggle-actions-view-model, yt-lockup-metadata-view-model, [role='menuitem']";

let observer: MutationObserver | null = null;
let ensureQueued = false;
let nextCardKey = 0;
const pendingCardKeys = new Set<string>();

const subscriptionsFeedControlsFeature: Feature = {
  name: "youtube-subscriptions-feed-controls",
  matchesPage(url: URL): boolean {
    return isDesktopSubscriptionsFeedPage(url);
  },

  activate(_context: FeatureContext): void {
    ensureHideButtons();
    observePage();
  },

  deactivate(): void {
    pendingCardKeys.clear();
    removeHideButtons();
    stopObserving();
  },
};

export default subscriptionsFeedControlsFeature;

function ensureHideButtons(): void {
  if (!isDesktopSubscriptionsFeedPage()) {
    removeHideButtons();
    return;
  }

  for (const card of findSubscriptionsFeedCards()) {
    ensureHideButton(card);
  }
}

function ensureHideButton(card: HTMLElement): void {
  const overlayActionsHost = findSubscriptionsCardOverlayActionsHost(card);
  const menuButton = findSubscriptionsCardMenuButton(card);

  if (!overlayActionsHost || !menuButton) {
    removeHideButton(card);
    return;
  }

  const cardKey = getCardKey(card);
  const host = getOrCreateHideButtonHost(cardKey);
  appendIfNeeded(host, overlayActionsHost);
  syncHideButtonState(cardKey);
}

function getOrCreateHideButtonHost(cardKey: string): HTMLElement {
  const hostId = getHostId(cardKey);
  return (
    document.getElementById(hostId) ??
    createHideButtonHost(cardKey, getButtonId(cardKey))
  );
}

function appendIfNeeded(host: HTMLElement, parent: HTMLElement): void {
  if (host.parentElement !== parent) {
    parent.append(host);
  }
}

function createHideButtonHost(cardKey: string, buttonId: string): HTMLElement {
  const host = document.createElement("div");
  host.id = getHostId(cardKey);
  host.className = "ytThumbnailHoverOverlayToggleActionsViewModelButton";
  host.style.display = "flex";
  host.style.alignItems = "center";
  host.style.justifyContent = "center";
  host.style.pointerEvents = "auto";

  const button = document.createElement("button");
  button.id = buttonId;
  button.type = "button";
  button.setAttribute("aria-label", "Hide");
  button.title = "Hide";
  button.innerHTML = getBootstrapIconMarkup("x");
  button.onclick = (event) => {
    void onHideButtonClick(cardKey, event);
  };
  styleHideButton(button);

  host.append(button);
  return host;
}

function styleHideButton(button: HTMLButtonElement): void {
  applyExtensionButtonStyles(button, {
    background: "rgba(15, 15, 15, 0.72)",
    hoverBackground: "rgba(15, 15, 15, 0.88)",
    activeBackground: "rgba(15, 15, 15, 0.94)",
    color: "#fff",
    position: "relative",
    zIndex: "1",
  });
  button.style.width = "32px";
  button.style.height = "32px";
  button.style.borderRadius = "16px";
  button.style.boxShadow = "0 1px 4px rgba(0, 0, 0, 0.35)";
  button.style.backdropFilter = "blur(12px)";
  button.style.setProperty("-webkit-backdrop-filter", "blur(12px)");
  button.style.margin = "0";
  button.style.padding = "0";
  button.style.pointerEvents = "auto";
  button.style.touchAction = "manipulation";
}

function syncHideButtonState(cardKey: string): void {
  const button = document.getElementById(
    getButtonId(cardKey),
  ) as HTMLButtonElement | null;

  if (!button) {
    return;
  }

  applyButtonPendingState(button, pendingCardKeys.has(cardKey));
}

function applyButtonPendingState(
  button: HTMLButtonElement,
  pending: boolean,
): void {
  const state = pending
    ? { opacity: "0.65", cursor: "default", label: "Hiding..." }
    : { opacity: "1", cursor: "pointer", label: "Hide" };
  button.disabled = pending;
  button.style.opacity = state.opacity;
  button.style.cursor = state.cursor;
  button.setAttribute("aria-label", state.label);
  button.title = state.label;
}

async function onHideButtonClick(cardKey: string, event: Event): Promise<void> {
  event.preventDefault();
  event.stopPropagation();

  if (pendingCardKeys.has(cardKey)) {
    return;
  }

  const card = getCardByKey(cardKey);
  if (!card) {
    return;
  }

  pendingCardKeys.add(cardKey);
  syncHideButtonState(cardKey);

  try {
    await executeHideAction(card);
  } catch (error) {
    console.error("[YTUtils:subscriptions-feed-controls]", error);
  } finally {
    pendingCardKeys.delete(cardKey);
    syncHideButtonState(cardKey);
    queueEnsureHideButtons();
  }
}

async function executeHideAction(card: HTMLElement): Promise<void> {
  const menuButton = findSubscriptionsCardMenuButton(card);
  if (!menuButton) {
    throw new Error("The card menu button is unavailable.");
  }

  clickElement(menuButton);

  const hideMenuItem = await waitFor(() => findSubscriptionsHideMenuItem(), {
    timeout: HIDE_ACTION_TIMEOUT_MS,
    errorCode: "HIDE_ACTION_UNAVAILABLE",
    errorMessage: "The native Hide action did not appear.",
  });

  clickElement(hideMenuItem);
}

function observePage(): void {
  if (observer) {
    return;
  }

  observer = new MutationObserver((mutations) => {
    if (mutations.some(isRelevantHideMutation)) {
      queueEnsureHideButtons();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

function isRelevantHideMutation(mutation: MutationRecord): boolean {
  return hasRelevantSelectorMutation([mutation], {
    isInsideOwnedSurface: isInsideHideButton,
    isExternalNode: isExternalHideNode,
    selector: RELEVANT_HIDE_SELECTOR,
  });
}

function isExternalHideNode(node: Element): boolean {
  return (
    !node.id.startsWith(BUTTON_HOST_ID_PREFIX) &&
    !node.querySelector?.(`[id^="${BUTTON_HOST_ID_PREFIX}"]`)
  );
}

function stopObserving(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

function queueEnsureHideButtons(): void {
  if (ensureQueued) {
    return;
  }

  ensureQueued = true;

  window.requestAnimationFrame(() => {
    ensureQueued = false;
    ensureHideButtons();
  });
}

function removeHideButtons(): void {
  for (const host of document.querySelectorAll<HTMLElement>(
    `[id^="${BUTTON_HOST_ID_PREFIX}"]`,
  )) {
    host.remove();
  }
  for (const card of findSubscriptionsFeedCards()) {
    delete card.dataset[CARD_KEY_ATTRIBUTE];
  }
}

function removeHideButton(card: HTMLElement): void {
  const cardKey = card.dataset[CARD_KEY_ATTRIBUTE];
  if (!cardKey) {
    return;
  }

  document.getElementById(getHostId(cardKey))?.remove();
  delete card.dataset[CARD_KEY_ATTRIBUTE];
  pendingCardKeys.delete(cardKey);
}

function getCardKey(card: HTMLElement): string {
  const existingKey = card.dataset[CARD_KEY_ATTRIBUTE];
  if (existingKey) {
    return existingKey;
  }

  nextCardKey += 1;
  const nextKey = `${nextCardKey}`;
  card.dataset[CARD_KEY_ATTRIBUTE] = nextKey;
  return nextKey;
}

function getCardByKey(cardKey: string): HTMLElement | null {
  const attr = CARD_KEY_ATTRIBUTE.replace(
    /[A-Z]/g,
    (match) => `-${match.toLowerCase()}`,
  );
  return document.querySelector<HTMLElement>(
    `ytd-rich-item-renderer[data-${attr}="${cardKey}"]`,
  );
}

function getHostId(cardKey: string): string {
  return `${BUTTON_HOST_ID_PREFIX}${cardKey}`;
}

function getButtonId(cardKey: string): string {
  return `${BUTTON_ID_PREFIX}${cardKey}`;
}

function isInsideHideButton(node: Node): boolean {
  return (
    node instanceof Element &&
    Boolean(node.closest(`[id^="${BUTTON_HOST_ID_PREFIX}"]`))
  );
}
