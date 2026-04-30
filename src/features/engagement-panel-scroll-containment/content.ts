import {
  createDomSyncController,
  hasRelevantSurfaceMutation,
} from "@shared/dom-sync-controller";
import type { Feature, FeatureContext } from "@shared/types";
import { isDesktopWatchPage, isVisible } from "@shared/youtube-dom";

const POLL_INTERVAL_MS = 500;
const PANEL_SELECTOR = "ytd-engagement-panel-section-list-renderer";
const EXPANDED_PANEL_VISIBILITY = "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED";
const CONTAINMENT_VALUE = "contain";
const MIN_SCROLL_CONTAINER_HEIGHT = 120;

let sessionToken = 0;

const domSyncController = createDomSyncController({
  pollIntervalMs: POLL_INTERVAL_MS,
  observerOptions: {
    attributes: true,
    childList: true,
    subtree: true,
    attributeFilter: ["visibility", "hidden", "aria-hidden", "class", "style"],
  },
  hasRelevantMutation: (mutations) =>
    hasRelevantSurfaceMutation(mutations, isInsideEngagementPanelSurface),
  sync: syncContainment,
});

const engagementPanelScrollContainmentFeature: Feature = {
  name: "youtube-engagement-panel-scroll-containment",
  isWatchPage: true,

  activate(_context: FeatureContext): void {
    sessionToken = domSyncController.activate();
  },

  deactivate(): void {
    sessionToken = domSyncController.deactivate();
  },
};

export default engagementPanelScrollContainmentFeature;

function syncContainment(token: number): void {
  if (token !== sessionToken || !isDesktopWatchPage()) {
    return;
  }

  for (const panel of findExpandedEngagementPanels()) {
    applyContainmentToPanel(panel);
  }
}

function applyContainmentToPanel(panel: HTMLElement): void {
  const scrollContainer = findPrimaryScrollContainer(panel);
  if (
    scrollContainer &&
    scrollContainer.style.overscrollBehaviorY !== CONTAINMENT_VALUE
  ) {
    scrollContainer.style.overscrollBehaviorY = CONTAINMENT_VALUE;
  }
}

function findExpandedEngagementPanels(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(PANEL_SELECTOR)].filter(
    (panel) => isPanelExpanded(panel),
  );
}

function isPanelExpanded(panel: HTMLElement): boolean {
  const visibility = panel.getAttribute("visibility");

  if (visibility === EXPANDED_PANEL_VISIBILITY) {
    return true;
  }

  return isVisible(panel);
}

function findPrimaryScrollContainer(panel: HTMLElement): HTMLElement | null {
  const candidates = [...panel.querySelectorAll<HTMLElement>("*")]
    .filter((element) => isPrimaryScrollCandidate(element))
    .map((element) => ({
      element,
      score: scoreScrollCandidate(element),
    }))
    .sort((left, right) => right.score - left.score);

  return candidates[0]?.element ?? null;
}

function isPrimaryScrollCandidate(element: HTMLElement): boolean {
  return (
    isVisible(element) &&
    !isFormControl(element) &&
    hasScrollableOverflow(element)
  );
}

function hasScrollableOverflow(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return (
    (style.overflowY === "auto" || style.overflowY === "scroll") &&
    element.clientHeight >= MIN_SCROLL_CONTAINER_HEIGHT
  );
}

function isFormControl(element: HTMLElement): boolean {
  return (
    element.tagName === "TEXTAREA" ||
    element.tagName === "INPUT" ||
    element.tagName === "SELECT"
  );
}

function scoreScrollCandidate(element: HTMLElement): number {
  const style = window.getComputedStyle(element);
  const hasOverflow = element.scrollHeight > element.clientHeight + 4;
  const overflowBonus = hasOverflow ? 1_000_000 : 0;
  const areaScore = element.clientWidth * element.clientHeight;
  const scrollModeBonus = style.overflowY === "scroll" ? 10_000 : 0;

  return overflowBonus + scrollModeBonus + areaScore;
}

function isInsideEngagementPanelSurface(node: Node): boolean {
  if (!(node instanceof Element)) {
    return false;
  }

  return Boolean(
    node.closest(
      `${PANEL_SELECTOR}, ytd-watch-metadata, #actions-inner, #top-level-buttons-computed, ytd-menu-renderer`,
    ),
  );
}
