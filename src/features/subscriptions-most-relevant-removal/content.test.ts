import { makeFeatureContext } from "@shared/test-helpers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function renderFeed(): void {
  document.body.innerHTML = `
    <div id="contents">
      <ytd-rich-section-renderer id="latest-section">
        <ytd-rich-shelf-renderer>
          <span id="title">Latest</span>
        </ytd-rich-shelf-renderer>
      </ytd-rich-section-renderer>
      <ytd-rich-section-renderer id="most-relevant-section">
        <ytd-rich-shelf-renderer>
          <span id="title">Most relevant</span>
          <button aria-label="Show more">Show more</button>
          <button aria-label="Show less">Show less</button>
        </ytd-rich-shelf-renderer>
      </ytd-rich-section-renderer>
      <ytd-rich-item-renderer id="chronological-card"></ytd-rich-item-renderer>
    </div>
  `;
}

function appendMostRelevantSection(): void {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <ytd-rich-section-renderer id="rerendered-most-relevant-section">
        <ytd-rich-shelf-renderer>
          <span id="title">Most relevant</span>
          <button aria-label="Show more">Show more</button>
        </ytd-rich-shelf-renderer>
      </ytd-rich-section-renderer>
    `,
  );
}

describe("subscriptions-most-relevant-removal feature", () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  async function importFreshFeature() {
    return import("./content");
  }

  it("matches only the desktop subscriptions feed", async () => {
    const { default: feature } = await importFreshFeature();

    expect(
      feature.matchesPage?.(
        new URL("https://www.youtube.com/feed/subscriptions"),
      ),
    ).toBe(true);
    expect(feature.matchesPage?.(new URL("https://www.youtube.com/"))).toBe(
      false,
    );
    expect(
      feature.matchesPage?.(
        new URL("https://m.youtube.com/feed/subscriptions"),
      ),
    ).toBe(false);
  });

  it("removes the Most relevant shelf and preserves regular feed cards", async () => {
    renderFeed();

    const { findMostRelevantShelves } = await import("@shared/youtube-dom");
    const { default: feature } = await importFreshFeature();

    expect(document.querySelectorAll("ytd-rich-shelf-renderer")).toHaveLength(
      2,
    );
    expect(
      document
        .querySelector("#most-relevant-section #title")
        ?.textContent?.trim(),
    ).toBe("Most relevant");
    expect(findMostRelevantShelves()).toHaveLength(1);

    feature.activate(makeFeatureContext());

    expect(document.querySelector("#most-relevant-section")).toBeNull();
    expect(document.querySelector("button[aria-label='Show more']")).toBeNull();
    expect(document.querySelector("#latest-section")).not.toBeNull();
    expect(document.querySelector("#chronological-card")).not.toBeNull();

    feature.deactivate();
  });

  it("removes the Most relevant shelf after feed rerenders", async () => {
    const requestAnimationFrameSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback): number => {
        callback(0);
        return 1;
      });

    const { default: feature } = await importFreshFeature();
    feature.activate(makeFeatureContext());

    appendMostRelevantSection();
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(requestAnimationFrameSpy).toHaveBeenCalled();
    expect(
      document.querySelector("#rerendered-most-relevant-section"),
    ).toBeNull();

    feature.deactivate();
  });
});
