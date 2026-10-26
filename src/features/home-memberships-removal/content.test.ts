import { makeFeatureContext } from "@shared/test-helpers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function renderHome(): void {
  document.body.innerHTML = `
    <div id="contents">
      <ytd-rich-item-renderer id="video-card"></ytd-rich-item-renderer>
      <ytd-rich-section-renderer id="memberships-section">
        <div id="content">
          <ytd-brand-video-shelf-renderer>
            <a href="/channel_memberships">Explore now</a>
            <a href="/watch?v=members-only">A members-only video</a>
          </ytd-brand-video-shelf-renderer>
        </div>
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

function appendMembershipsSection(): void {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <ytd-rich-section-renderer id="rerendered-memberships-section">
        <div id="content">
          <ytd-brand-video-shelf-renderer>
            <a href="/channel_memberships">Explore now</a>
          </ytd-brand-video-shelf-renderer>
        </div>
      </ytd-rich-section-renderer>
    `,
  );
}

describe("home-memberships-removal feature", () => {
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
      feature.matchesPage?.(
        new URL("https://www.youtube.com/channel_memberships"),
      ),
    ).toBe(false);
  });

  it("removes the memberships section and preserves other Home content", async () => {
    renderHome();

    const { findMembershipShelves } = await import("@shared/youtube-dom");
    const { default: feature } = await importFreshFeature();

    expect(findMembershipShelves()).toHaveLength(1);

    feature.activate(makeFeatureContext());

    expect(document.querySelector("#memberships-section")).toBeNull();
    expect(
      document.querySelector('a[href^="/channel_memberships"]'),
    ).toBeNull();
    expect(document.querySelector("#other-shelf-section")).not.toBeNull();
    expect(document.querySelector("#video-card")).not.toBeNull();
    expect(document.querySelector("#another-video-card")).not.toBeNull();

    feature.deactivate();
  });

  it("leaves brand shelves without a memberships link in place", async () => {
    document.body.innerHTML = `
      <ytd-rich-section-renderer id="promo-section">
        <div id="content">
          <ytd-brand-video-shelf-renderer>
            <a href="/premium">Explore now</a>
          </ytd-brand-video-shelf-renderer>
        </div>
      </ytd-rich-section-renderer>
    `;

    const { default: feature } = await importFreshFeature();
    feature.activate(makeFeatureContext());

    expect(document.querySelector("#promo-section")).not.toBeNull();

    feature.deactivate();
  });

  it("removes the memberships section after Home rerenders", async () => {
    const requestAnimationFrameSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback): number => {
        callback(0);
        return 1;
      });

    const { default: feature } = await importFreshFeature();
    feature.activate(makeFeatureContext());

    appendMembershipsSection();
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(requestAnimationFrameSpy).toHaveBeenCalled();
    expect(
      document.querySelector("#rerendered-memberships-section"),
    ).toBeNull();

    feature.deactivate();
  });
});
