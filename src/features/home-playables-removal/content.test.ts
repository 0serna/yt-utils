import { makeFeatureContext } from "@shared/test-helpers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function renderHome(): void {
  document.body.innerHTML = `
    <div id="contents">
      <ytd-rich-item-renderer id="video-card"></ytd-rich-item-renderer>
      <ytd-rich-section-renderer id="playables-section">
        <ytd-rich-shelf-renderer>
          <a href="/playables">YouTube Playables</a>
          <a href="/playables/game-one">Game One</a>
        </ytd-rich-shelf-renderer>
      </ytd-rich-section-renderer>
      <ytd-rich-section-renderer id="other-shelf-section">
        <ytd-rich-shelf-renderer>
          <a href="/feed/trending">Trending</a>
        </ytd-rich-shelf-renderer>
      </ytd-rich-section-renderer>
      <ytd-rich-item-renderer id="another-video-card"></ytd-rich-item-renderer>
    </div>
  `;
}

function appendPlayablesSection(): void {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <ytd-rich-section-renderer id="rerendered-playables-section">
        <ytd-rich-shelf-renderer>
          <a href="/playables">YouTube Playables</a>
        </ytd-rich-shelf-renderer>
      </ytd-rich-section-renderer>
    `,
  );
}

describe("home-playables-removal feature", () => {
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

  it("matches only the desktop Home page", async () => {
    const { default: feature } = await importFreshFeature();

    expect(feature.matchesPage?.(new URL("https://www.youtube.com/"))).toBe(
      true,
    );
    expect(
      feature.matchesPage?.(
        new URL("https://www.youtube.com/feed/subscriptions"),
      ),
    ).toBe(false);
    expect(feature.matchesPage?.(new URL("https://m.youtube.com/"))).toBe(
      false,
    );
    expect(
      feature.matchesPage?.(new URL("https://www.youtube.com/playables")),
    ).toBe(false);
  });

  it("removes Playables shelves and preserves other Home content", async () => {
    renderHome();

    const { findPlayablesShelves } = await import("@shared/youtube-dom");
    const { default: feature } = await importFreshFeature();

    expect(findPlayablesShelves()).toHaveLength(1);
    expect(document.querySelector("#playables-section")).not.toBeNull();

    feature.activate(makeFeatureContext());

    expect(document.querySelector("#playables-section")).toBeNull();
    expect(document.querySelector('a[href*="/playables"]')).toBeNull();
    expect(document.querySelector("#other-shelf-section")).not.toBeNull();
    expect(document.querySelector("#video-card")).not.toBeNull();
    expect(document.querySelector("#another-video-card")).not.toBeNull();

    feature.deactivate();
  });

  it("removes every Playables shelf when several are present", async () => {
    document.body.innerHTML = `
      <ytd-rich-section-renderer id="playables-one">
        <ytd-rich-shelf-renderer>
          <a href="/playables">YouTube Playables</a>
        </ytd-rich-shelf-renderer>
      </ytd-rich-section-renderer>
      <ytd-rich-section-renderer id="playables-two">
        <ytd-rich-shelf-renderer>
          <a href="/playables/other">Another game</a>
        </ytd-rich-shelf-renderer>
      </ytd-rich-section-renderer>
      <ytd-rich-item-renderer id="video-card"></ytd-rich-item-renderer>
    `;

    const { default: feature } = await importFreshFeature();
    feature.activate(makeFeatureContext());

    expect(document.querySelector("#playables-one")).toBeNull();
    expect(document.querySelector("#playables-two")).toBeNull();
    expect(document.querySelector("#video-card")).not.toBeNull();

    feature.deactivate();
  });

  it("removes a Playables shelf after Home rerenders", async () => {
    const requestAnimationFrameSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback): number => {
        callback(0);
        return 1;
      });

    const { default: feature } = await importFreshFeature();
    feature.activate(makeFeatureContext());

    appendPlayablesSection();
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(requestAnimationFrameSpy).toHaveBeenCalled();
    expect(document.querySelector("#rerendered-playables-section")).toBeNull();

    feature.deactivate();
  });
});
