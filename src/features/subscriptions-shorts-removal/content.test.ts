import { makeFeatureContext } from "@shared/test-helpers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function renderFeed(): void {
  document.body.innerHTML = `
    <div id="contents">
      <ytd-rich-item-renderer id="video-card"></ytd-rich-item-renderer>
      <ytd-rich-section-renderer id="shorts-section">
        <ytd-rich-shelf-renderer is-shorts>
          <div id="title">Shorts</div>
        </ytd-rich-shelf-renderer>
      </ytd-rich-section-renderer>
      <ytd-rich-section-renderer id="other-section">
        <ytd-rich-shelf-renderer>
          <div id="title">Trending</div>
        </ytd-rich-shelf-renderer>
      </ytd-rich-section-renderer>
    </div>
  `;
}

function appendShortsSection(): void {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <ytd-rich-section-renderer id="rerendered-shorts-section">
        <ytd-rich-shelf-renderer is-shorts>
          <div id="title">Shorts</div>
        </ytd-rich-shelf-renderer>
      </ytd-rich-section-renderer>
    `,
  );
}

function stubAnimationFrames(): ReturnType<typeof vi.spyOn> {
  return vi
    .spyOn(window, "requestAnimationFrame")
    .mockImplementation((callback: FrameRequestCallback): number => {
      callback(0);
      return 1;
    });
}

describe("subscriptions-shorts-removal feature", () => {
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

  it("matches the desktop Home and Subscriptions feeds", async () => {
    const { default: feature } = await importFreshFeature();

    expect(feature.matchesPage?.(new URL("https://www.youtube.com/"))).toBe(
      true,
    );
    expect(
      feature.matchesPage?.(
        new URL("https://www.youtube.com/feed/subscriptions"),
      ),
    ).toBe(true);
    expect(
      feature.matchesPage?.(new URL("https://www.youtube.com/watch?v=abc")),
    ).toBe(false);
    expect(feature.matchesPage?.(new URL("https://m.youtube.com/"))).toBe(
      false,
    );
  });

  it("removes Shorts shelves and preserves other feed content", async () => {
    renderFeed();
    const { default: feature } = await importFreshFeature();

    feature.activate(makeFeatureContext());

    expect(document.querySelector("#shorts-section")).toBeNull();
    expect(document.querySelector("#other-section")).not.toBeNull();
    expect(document.querySelector("#video-card")).not.toBeNull();

    feature.deactivate();
  });

  it("removes a Shorts shelf after the feed rerenders", async () => {
    const requestAnimationFrameSpy = stubAnimationFrames();
    const { default: feature } = await importFreshFeature();
    feature.activate(makeFeatureContext());

    appendShortsSection();
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(document.querySelector("#rerendered-shorts-section")).toBeNull();
    expect(requestAnimationFrameSpy).toHaveBeenCalled();

    feature.deactivate();
  });

  it("stops removing Shorts shelves after deactivate", async () => {
    const requestAnimationFrameSpy = stubAnimationFrames();
    const { default: feature } = await importFreshFeature();
    feature.activate(makeFeatureContext());
    feature.deactivate();

    appendShortsSection();
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(document.querySelector("#rerendered-shorts-section")).not.toBeNull();
    expect(requestAnimationFrameSpy).not.toHaveBeenCalled();
  });
});
