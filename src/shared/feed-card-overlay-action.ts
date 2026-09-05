import {
  type BootstrapIconName,
  getBootstrapIconMarkup,
} from "@shared/bootstrap-icons";
import { hasRelevantSelectorMutation } from "@shared/dom-mutations";
import { applyExtensionButtonStyles } from "@shared/extension-button";
import type { Feature, FeatureContext } from "@shared/types";
import {
  clickElement,
  findRichItemCards,
  findRichItemMenuButton,
  findRichItemThumbnailPlacement,
  waitFor,
} from "@shared/youtube-dom";

const ACTION_TIMEOUT_MS = 3000;
const CARD_SELECTOR = "ytd-rich-item-renderer";
const RELEVANT_CARD_SELECTOR = [
  CARD_SELECTOR,
  "yt-thumbnail-view-model",
  "yt-lockup-metadata-view-model",
  "a.ytLockupViewModelContentImage",
  "[role='menuitem']",
].join(", ");

export type FeedCardOverlayActionConfig = {
  name: string;
  matchesPage: (url?: URL) => boolean;
  idPrefix: string;
  buttonLabel: string;
  pendingLabel: string;
  icon: BootstrapIconName;
  findMenuItem: () => HTMLElement | null;
  actionUnavailableCode: string;
  actionUnavailableMessage: string;
  placementFailureMessage: string;
};

export function createFeedCardOverlayActionFeature(
  config: FeedCardOverlayActionConfig,
): Feature {
  const hostIdPrefix = `${config.idPrefix}-host-`;
  const buttonIdPrefix = `${config.idPrefix}-button-`;
  const styleElementId = `${config.idPrefix}-styles`;
  const cardKeyAttribute = `data-${config.idPrefix}-key`;
  const hoverVisibilityStyles = buildHoverVisibilityStyles(hostIdPrefix);

  let observer: MutationObserver | null = null;
  let ensureQueued = false;
  let nextCardKey = 0;
  let hasLoggedPlacementFailure = false;
  let activeContext: FeatureContext | null = null;
  const pendingCardKeys = new Set<string>();

  const feature: Feature = {
    name: config.name,
    matchesPage: config.matchesPage,
    activate(context: FeatureContext): void {
      activeContext = context;
      hasLoggedPlacementFailure = false;
      ensureHoverVisibilityStyles();
      ensureButtons();
      observePage();
    },
    deactivate(): void {
      activeContext = null;
      pendingCardKeys.clear();
      removeButtons();
      removeHoverVisibilityStyles();
      stopObserving();
    },
  };

  function ensureButtons(): void {
    if (!config.matchesPage()) {
      removeButtons();
      return;
    }

    let cardsWithMenu = 0;
    let cardsWithPlacement = 0;

    for (const card of findRichItemCards()) {
      const menuButton = findRichItemMenuButton(card);
      const placement = findRichItemThumbnailPlacement(card);

      if (menuButton) {
        cardsWithMenu += 1;
      }
      if (placement) {
        cardsWithPlacement += 1;
      }

      ensureButton(card, menuButton, placement);
    }

    maybeLogPlacementFailure(cardsWithMenu, cardsWithPlacement);
  }

  function ensureButton(
    card: HTMLElement,
    menuButton: HTMLElement | null,
    placementRoot: HTMLElement | null,
  ): void {
    if (!menuButton || !placementRoot) {
      removeButton(card);
      return;
    }

    const cardKey = getCardKey(card);
    placeButtonHost(getOrCreateButtonHost(cardKey), placementRoot);
    syncButtonState(cardKey);
  }

  function maybeLogPlacementFailure(
    cardsWithMenu: number,
    cardsWithPlacement: number,
  ): void {
    if (
      hasLoggedPlacementFailure ||
      cardsWithMenu === 0 ||
      cardsWithPlacement > 0
    ) {
      return;
    }

    hasLoggedPlacementFailure = true;
    activeContext?.logger.error(new Error(config.placementFailureMessage), {
      phase: "runtime",
    });
  }

  function getOrCreateButtonHost(cardKey: string): HTMLElement {
    return (
      document.getElementById(`${hostIdPrefix}${cardKey}`) ??
      createButtonHost(cardKey)
    );
  }

  function placeButtonHost(host: HTMLElement, root: HTMLElement): void {
    ensureRelativePosition(root);
    applyOwnedOverlayStyles(host);
    if (host.parentElement !== root) {
      root.append(host);
    }
  }

  function ensureHoverVisibilityStyles(): void {
    if (document.getElementById(styleElementId)) {
      return;
    }

    const style = document.createElement("style");
    style.id = styleElementId;
    style.textContent = hoverVisibilityStyles;
    document.documentElement.append(style);
  }

  function removeHoverVisibilityStyles(): void {
    document.getElementById(styleElementId)?.remove();
  }

  function createButtonHost(cardKey: string): HTMLElement {
    const host = document.createElement("div");
    host.id = `${hostIdPrefix}${cardKey}`;

    const button = document.createElement("button");
    button.id = `${buttonIdPrefix}${cardKey}`;
    button.type = "button";
    button.setAttribute("aria-label", config.buttonLabel);
    button.title = config.buttonLabel;
    button.innerHTML = getBootstrapIconMarkup(config.icon);
    button.onclick = (event) => {
      void onButtonClick(cardKey, event);
    };
    styleOverlayButton(button);

    host.append(button);
    return host;
  }

  function syncButtonState(cardKey: string): void {
    const host = document.getElementById(`${hostIdPrefix}${cardKey}`);
    const button = document.getElementById(
      `${buttonIdPrefix}${cardKey}`,
    ) as HTMLButtonElement | null;

    if (!host || !button) {
      return;
    }

    applyButtonPendingState(host, button, pendingCardKeys.has(cardKey));
  }

  function applyButtonPendingState(
    host: HTMLElement,
    button: HTMLButtonElement,
    pending: boolean,
  ): void {
    const label = pending ? config.pendingLabel : config.buttonLabel;
    button.disabled = pending;
    button.style.opacity = pending ? "0.65" : "1";
    button.style.cursor = pending ? "default" : "pointer";
    button.setAttribute("aria-label", label);
    button.title = label;

    if (pending) {
      host.dataset.pending = "true";
    } else {
      delete host.dataset.pending;
    }
  }

  async function onButtonClick(cardKey: string, event: Event): Promise<void> {
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
    syncButtonState(cardKey);

    try {
      await executeNativeMenuAction(card);
    } catch (error) {
      activeContext?.logger.error(error, { phase: "runtime" });
    } finally {
      pendingCardKeys.delete(cardKey);
      syncButtonState(cardKey);
      queueEnsureButtons();
    }
  }

  async function executeNativeMenuAction(card: HTMLElement): Promise<void> {
    const menuButton = findRichItemMenuButton(card);
    if (!menuButton) {
      throw new Error("The card menu button is unavailable.");
    }

    clickElement(menuButton);

    const menuItem = await waitFor(() => config.findMenuItem(), {
      timeout: ACTION_TIMEOUT_MS,
      errorCode: config.actionUnavailableCode,
      errorMessage: config.actionUnavailableMessage,
    });

    clickElement(menuItem);
  }

  function observePage(): void {
    if (observer) {
      return;
    }

    observer = new MutationObserver((mutations) => {
      if (
        hasRelevantSelectorMutation(mutations, {
          isInsideOwnedSurface: isInsideButton,
          isExternalNode,
          selector: RELEVANT_CARD_SELECTOR,
        })
      ) {
        queueEnsureButtons();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function isExternalNode(node: Element): boolean {
    return (
      !node.id.startsWith(hostIdPrefix) &&
      !node.querySelector?.(`[id^="${hostIdPrefix}"]`)
    );
  }

  function stopObserving(): void {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function queueEnsureButtons(): void {
    if (ensureQueued) {
      return;
    }

    ensureQueued = true;

    window.requestAnimationFrame(() => {
      ensureQueued = false;
      ensureButtons();
    });
  }

  function removeButtons(): void {
    for (const host of document.querySelectorAll<HTMLElement>(
      `[id^="${hostIdPrefix}"]`,
    )) {
      host.remove();
    }
    for (const card of findRichItemCards()) {
      card.removeAttribute(cardKeyAttribute);
    }
  }

  function removeButton(card: HTMLElement): void {
    const cardKey = card.getAttribute(cardKeyAttribute);
    if (!cardKey) {
      return;
    }

    document.getElementById(`${hostIdPrefix}${cardKey}`)?.remove();
    card.removeAttribute(cardKeyAttribute);
    pendingCardKeys.delete(cardKey);
  }

  function getCardKey(card: HTMLElement): string {
    const existingKey = card.getAttribute(cardKeyAttribute);
    if (existingKey) {
      return existingKey;
    }

    nextCardKey += 1;
    const nextKey = `${nextCardKey}`;
    card.setAttribute(cardKeyAttribute, nextKey);
    return nextKey;
  }

  function getCardByKey(cardKey: string): HTMLElement | null {
    return document.querySelector<HTMLElement>(
      `${CARD_SELECTOR}[${cardKeyAttribute}="${cardKey}"]`,
    );
  }

  function isInsideButton(node: Node): boolean {
    return (
      node instanceof Element &&
      Boolean(node.closest(`[id^="${hostIdPrefix}"]`))
    );
  }

  return feature;
}

function buildHoverVisibilityStyles(hostIdPrefix: string): string {
  return `
[id^="${hostIdPrefix}"] {
  opacity: 0;
  pointer-events: none;
  transition: opacity 120ms ease;
}
yt-thumbnail-view-model:hover > [id^="${hostIdPrefix}"],
a.ytLockupViewModelContentImage:hover > [id^="${hostIdPrefix}"],
[id^="${hostIdPrefix}"]:focus-within,
[id^="${hostIdPrefix}"][data-pending="true"] {
  opacity: 1;
  pointer-events: auto;
}
`.trim();
}

function ensureRelativePosition(element: HTMLElement): void {
  if (window.getComputedStyle(element).position === "static") {
    element.style.position = "relative";
  }
}

function applyOwnedOverlayStyles(host: HTMLElement): void {
  // Top-left avoids YouTube hover preview controls (top-right) and duration badge (bottom-right).
  host.style.position = "absolute";
  host.style.top = "8px";
  host.style.left = "8px";
  host.style.zIndex = "3";
  host.style.display = "flex";
  host.style.alignItems = "center";
  host.style.justifyContent = "center";
}

function styleOverlayButton(button: HTMLButtonElement): void {
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
  button.style.touchAction = "manipulation";
}
