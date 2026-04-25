import type { Feature, FeatureContext } from "@shared/types";
import { isDesktopSubscriptionsFeedPage } from "@shared/youtube-dom";

const STYLE_ELEMENT_ID = "yt-utils-subscriptions-grid-density";

const CSS_CONTENT = `
/* YT Utils: Show 4 videos per row on subscriptions feed */
/* Scoped to #contents to avoid affecting other sections */
#contents > ytd-rich-item-renderer {
  width: min(400px, calc((100% - 48px) / 4)) !important;
  max-width: 400px !important;
  flex-basis: auto !important;
}

/* Remove container max-width constraints using semantic ID */
ytd-rich-grid-renderer > #contents {
  width: 100% !important;
  max-width: none !important;
}
`;

const subscriptionsGridDensityFeature: Feature = {
  name: "subscriptions-grid-density",
  matchesPage(url: URL): boolean {
    return isDesktopSubscriptionsFeedPage(url);
  },

  activate(_context: FeatureContext): void {
    injectStylesheet();
  },

  deactivate(): void {
    removeStylesheet();
  },
};

export default subscriptionsGridDensityFeature;

function injectStylesheet(): void {
  if (document.getElementById(STYLE_ELEMENT_ID)) {
    return;
  }

  const styleElement = document.createElement("style");
  styleElement.id = STYLE_ELEMENT_ID;
  styleElement.textContent = CSS_CONTENT;
  document.head.append(styleElement);
}

function removeStylesheet(): void {
  document.getElementById(STYLE_ELEMENT_ID)?.remove();
}
