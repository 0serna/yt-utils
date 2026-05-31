import type { Feature, FeatureContext } from "@shared/types";

const LAST_YEAR_SP = "EgIIBQ==";

const searchDateFilterFeature: Feature = {
  name: "search-date-filter",

  matchesPage(url: URL): boolean {
    return (
      url.hostname === "www.youtube.com" &&
      url.pathname === "/results" &&
      url.searchParams.has("search_query")
    );
  },

  activate(_context: FeatureContext): void {
    applyLastYearFilter();
  },

  deactivate(): void {
    // No-op: redirect is a one-time action
  },
};

export default searchDateFilterFeature;

function applyLastYearFilter(): void {
  const url = new URL(window.location.href);

  if (url.searchParams.has("sp")) {
    return;
  }

  url.searchParams.set("sp", LAST_YEAR_SP);
  window.location.replace(url.toString());
}
