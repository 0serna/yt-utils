import type { Feature, FeatureContext } from "@shared/types";

const LAST_YEAR_SP = "EgIIBQ==";
const REDIRECT_GUARD_MS = 5000;

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

  deactivate(): void {},
};

export default searchDateFilterFeature;

function applyLastYearFilter(): void {
  const url = new URL(window.location.href);
  const redirectKey = `yt-utils:search-date-filter:${url.searchParams.get("search_query") ?? ""}`;

  if (url.searchParams.has("sp")) {
    return;
  }

  const lastRedirectAt = Number(sessionStorage.getItem(redirectKey) ?? 0);
  if (Date.now() - lastRedirectAt < REDIRECT_GUARD_MS) {
    return;
  }

  sessionStorage.setItem(redirectKey, String(Date.now()));
  url.searchParams.set("sp", LAST_YEAR_SP);
  window.location.replace(url.toString());
}
