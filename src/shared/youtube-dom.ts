import { createExtensionError } from "./errors";

type WaitOptions = {
  timeout?: number;
  interval?: number;
  errorCode?: string;
  errorMessage?: string;
};

const DEFAULT_WAIT_OPTIONS: Required<WaitOptions> = {
  timeout: 5000,
  interval: 100,
  errorCode: "WAIT_FAILED",
  errorMessage: "Timed out waiting for the next step.",
};

const LABELS = {
  share: [/\bshare\b/i, /\bcompartir\b/i],
  copy: [/\bcopy\b/i, /\bcopy link\b/i, /\bcopiar\b/i, /\bcopiar enlace\b/i],
  startAt: [/\bstart at\b/i, /\bempezar en\b/i],
  hide: [/\bhide\b/i, /\bocultar\b/i],
  moreActions: [/\bmore actions\b/i, /\bm[aá]s acciones\b/i],
  mostRelevant: [/\bmost relevant\b/i],
} as const;

export function waitFor<T>(
  getValue: () => T | null | undefined | false,
  options?: WaitOptions,
): Promise<NonNullable<T>> {
  const config = readWaitConfig(options);

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const check = () => {
      const value = getValue();

      if (value) {
        resolve(value as NonNullable<T>);
        return;
      }

      if (Date.now() - startedAt > config.timeout) {
        reject(createExtensionError(config.errorCode, config.errorMessage));
        return;
      }

      window.setTimeout(check, config.interval);
    };

    check();
  });
}

function readWaitConfig(options: WaitOptions = {}): Required<WaitOptions> {
  return { ...DEFAULT_WAIT_OPTIONS, ...options };
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function findButton(
  root: ParentNode,
  matchers: readonly RegExp[],
): HTMLElement | null {
  const elements = root.querySelectorAll<HTMLElement>(
    "button, [role='button'], tp-yt-paper-checkbox[role='checkbox']",
  );

  return (
    [...elements].find(
      (element) => isVisible(element) && matchesAnyLabel(element, matchers),
    ) ?? null
  );
}

function findMenuItem(
  root: ParentNode,
  matchers: readonly RegExp[],
): HTMLElement | null {
  const elements = root.querySelectorAll<HTMLElement>("[role='menuitem']");

  return (
    [...elements].find(
      (element) => isVisible(element) && matchesAnyLabel(element, matchers),
    ) ?? null
  );
}

function findWatchPageActionsContainer(): HTMLElement | null {
  const selectors = [
    "ytd-watch-metadata #top-level-buttons-computed",
    "#actions-inner ytd-menu-renderer #top-level-buttons-computed",
    "#actions-inner #top-level-buttons-computed",
  ];

  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector);

    if (element) {
      return element;
    }
  }

  return null;
}

export function placeWatchActionHost(
  host: HTMLElement,
  options?: {
    excludedHostIds?: readonly string[];
    preferredBeforeHostId?: string;
  },
): boolean {
  const placement = readWatchActionPlacement(host, options);
  if (!placement) {
    return false;
  }

  placeWatchActionHostInContainer(
    host,
    placement.actionsContainer,
    placement.excludedHostIds,
    placement.preferredBeforeHostId,
  );
  return true;
}

function readWatchActionPlacement(
  host: HTMLElement,
  options: {
    excludedHostIds?: readonly string[];
    preferredBeforeHostId?: string;
  } = {},
): {
  actionsContainer: HTMLElement;
  excludedHostIds: readonly string[];
  preferredBeforeHostId: string | undefined;
} | null {
  const actionsContainer = findWatchPageActionsContainer();
  return actionsContainer
    ? {
        actionsContainer,
        excludedHostIds: options.excludedHostIds || [host.id],
        preferredBeforeHostId: options.preferredBeforeHostId,
      }
    : null;
}

function placeWatchActionHostInContainer(
  host: HTMLElement,
  actionsContainer: HTMLElement,
  excludedHostIds: readonly string[],
  preferredBeforeHostId: string | undefined,
): void {
  const preferredBeforeHost = readPreferredBeforeHost(
    actionsContainer,
    preferredBeforeHostId,
  );
  if (preferredBeforeHost) {
    placeHostBefore(host, preferredBeforeHost);
    return;
  }

  placeWatchActionHostFallback(host, actionsContainer, excludedHostIds);
}

function placeWatchActionHostFallback(
  host: HTMLElement,
  actionsContainer: HTMLElement,
  excludedHostIds: readonly string[],
): void {
  const insertionTarget = findWatchActionInsertionTarget(
    actionsContainer,
    excludedHostIds,
  );

  if (insertionTarget) {
    placeHostBefore(host, insertionTarget);
  } else if (host.parentElement !== actionsContainer) {
    actionsContainer.prepend(host);
  }
}

function readPreferredBeforeHost(
  actionsContainer: HTMLElement,
  preferredBeforeHostId: string | undefined,
): HTMLElement | null {
  if (!preferredBeforeHostId) {
    return null;
  }

  const preferredBeforeHost = document.getElementById(preferredBeforeHostId);
  return preferredBeforeHost?.parentElement === actionsContainer
    ? preferredBeforeHost
    : null;
}

function findWatchActionInsertionTarget(
  actionsContainer: HTMLElement,
  excludedHostIds: readonly string[],
): HTMLElement | null {
  const excludedIds = new Set(excludedHostIds);
  const candidates = [...actionsContainer.children].filter(
    (child) => !excludedIds.has(child.id),
  ) as HTMLElement[];

  return (
    candidates.find((child) => {
      const label = getElementLabel(child);
      return (
        /like this video/i.test(label) ||
        child.tagName === "SEGMENTED-LIKE-DISLIKE-BUTTON-VIEW-MODEL"
      );
    }) ||
    candidates[0] ||
    null
  );
}

function placeHostBefore(host: HTMLElement, target: HTMLElement): void {
  if (target.previousSibling !== host) {
    target.insertAdjacentElement("beforebegin", host);
  }
}

export const RELEVANT_MUTATION_SELECTORS =
  "ytd-watch-metadata, #actions-inner, #top-level-buttons-computed, segmented-like-dislike-button-view-model, ytd-menu-renderer";

export function isDesktopYouTubePage(
  url: URL = new URL(window.location.href),
): boolean {
  return url.hostname === "www.youtube.com";
}

export function isDesktopSubscriptionsFeedPage(
  url: URL = new URL(window.location.href),
): boolean {
  return isDesktopYouTubePage(url) && url.pathname === "/feed/subscriptions";
}

export function isDesktopFeedPage(
  url: URL = new URL(window.location.href),
): boolean {
  return (
    url.hostname === "www.youtube.com" &&
    (url.pathname === "/feed/subscriptions" || url.pathname === "/")
  );
}

export function isDesktopHomePage(
  url: URL = new URL(window.location.href),
): boolean {
  return isDesktopYouTubePage(url) && url.pathname === "/";
}

export function isDesktopWatchPage(): boolean {
  return (
    window.location.hostname === "www.youtube.com" &&
    window.location.pathname === "/watch" &&
    new URLSearchParams(window.location.search).has("v")
  );
}

export function findSubscriptionsFeedCards(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>("ytd-rich-item-renderer")];
}

export function findDesktopYouTubeVideoListCards(): HTMLElement[] {
  return [
    ...document.querySelectorAll<HTMLElement>(
      [
        "ytd-rich-item-renderer",
        "ytd-compact-video-renderer",
        "ytd-video-renderer",
        "ytd-playlist-video-renderer",
        "ytd-grid-video-renderer",
        "yt-lockup-view-model",
      ].join(","),
    ),
  ];
}

export function findSubscriptionsCardHidePlacement(
  card: HTMLElement,
): HTMLElement | null {
  return (
    card.querySelector<HTMLElement>("yt-thumbnail-view-model") ??
    findSubscriptionsCardThumbnailLink(card)
  );
}

function findSubscriptionsCardThumbnailLink(
  card: ParentNode,
): HTMLElement | null {
  return (
    card.querySelector<HTMLElement>("a.ytLockupViewModelContentImage") ??
    [...card.querySelectorAll<HTMLAnchorElement>("a[href*='/watch']")].find(
      (link) => Boolean(link.querySelector("yt-thumbnail-view-model, img")),
    ) ??
    null
  );
}

export function findSubscriptionsCardMenuButton(
  card: ParentNode,
): HTMLElement | null {
  return findButton(card, LABELS.moreActions);
}

export function findSubscriptionsHideMenuItem(
  root: ParentNode = document,
): HTMLElement | null {
  return findMenuItem(root, LABELS.hide);
}

export function findShortsShelf(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    "ytd-rich-shelf-renderer[is-shorts]",
  );
}

function findShortsShelves(): HTMLElement[] {
  return [
    ...document.querySelectorAll<HTMLElement>(
      "ytd-rich-shelf-renderer[is-shorts]",
    ),
  ];
}

export function removeAllShortsSections(): void {
  removeRichSectionsForShelves(findShortsShelves());
}

export function findMostRelevantShelves(): HTMLElement[] {
  return findRichShelves(isMostRelevantShelf);
}

export function removeAllMostRelevantSections(): void {
  removeRichSectionsForShelves(findMostRelevantShelves());
}

function isMostRelevantShelf(shelf: HTMLElement): boolean {
  const title = shelf.querySelector<HTMLElement>("[id='title']");
  return title
    ? LABELS.mostRelevant.some((matcher) =>
        matcher.test(title.textContent ?? ""),
      )
    : false;
}

export function findPlayablesShelves(): HTMLElement[] {
  return findRichShelves(isPlayablesShelf);
}

export function removeAllPlayablesSections(): void {
  removeRichSectionsForShelves(findPlayablesShelves());
}

function isPlayablesShelf(shelf: HTMLElement): boolean {
  return shelf.querySelector('a[href*="/playables"]') !== null;
}

function findRichShelves(
  isMatch: (shelf: HTMLElement) => boolean,
): HTMLElement[] {
  return [
    ...document.querySelectorAll<HTMLElement>("ytd-rich-shelf-renderer"),
  ].filter(isMatch);
}

function removeRichSectionsForShelves(shelves: HTMLElement[]): void {
  for (const shelf of shelves) {
    shelf.closest<HTMLElement>("ytd-rich-section-renderer")?.remove();
  }
}

export function isVisible(element: Element): boolean {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    rect.width > 0 &&
    rect.height > 0
  );
}

function getElementLabel(element: Element): string {
  const values = [
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element instanceof HTMLElement ? element.innerText : "",
    element instanceof HTMLElement ? element.textContent : "",
  ];

  return values.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export function clickElement(element: HTMLElement): void {
  element.scrollIntoView({ block: "center", inline: "center" });
  element.dispatchEvent(
    new MouseEvent("mouseover", { bubbles: true, cancelable: true }),
  );
  element.dispatchEvent(
    new MouseEvent("mousedown", { bubbles: true, cancelable: true, button: 0 }),
  );
  element.dispatchEvent(
    new MouseEvent("mouseup", { bubbles: true, cancelable: true, button: 0 }),
  );
  element.click();
}

function matchesAnyLabel(
  element: Element,
  matchers: readonly RegExp[],
): boolean {
  const label = getElementLabel(element);
  return matchers.some((matcher) => matcher.test(label));
}
