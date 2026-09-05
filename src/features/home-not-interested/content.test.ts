import { makeFeatureContext } from "@shared/test-helpers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function stubHomePage(): void {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: new URL("https://www.youtube.com/"),
  });
}

function stubRect(
  element: Element,
  rect: {
    width: number;
    height: number;
    top: number;
    left: number;
    right?: number;
    bottom?: number;
  },
): void {
  Object.defineProperty(element, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      right: rect.right ?? rect.left + rect.width,
      bottom: rect.bottom ?? rect.top + rect.height,
      x: rect.left,
      y: rect.top,
      toJSON() {},
    }),
  });
}

function makeVisible(element: Element): void {
  stubRect(element, { width: 24, height: 24, top: 0, left: 0 });
}

function makeCardMenusVisible(root: ParentNode = document): void {
  for (const button of root.querySelectorAll<HTMLElement>(
    'button[aria-label="More actions"], button[aria-label="Más acciones"]',
  )) {
    makeVisible(button);
  }
}

function renderHomeCard(id = "card-1"): void {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <ytd-rich-item-renderer id="${id}">
        <yt-lockup-view-model>
          <a class="ytLockupViewModelContentImage" href="/watch?v=abc123">
            <yt-thumbnail-view-model>
              <div class="ytThumbnailViewModelImage">
                <img alt="" />
              </div>
              <yt-thumbnail-bottom-overlay-view-model></yt-thumbnail-bottom-overlay-view-model>
            </yt-thumbnail-view-model>
          </a>
          <yt-lockup-metadata-view-model>
            <div class="ytLockupMetadataViewModelMenuButton">
              <button aria-label="More actions" type="button"></button>
            </div>
          </yt-lockup-metadata-view-model>
        </yt-lockup-view-model>
      </ytd-rich-item-renderer>
    `,
  );
  makeCardMenusVisible(document.getElementById(id) ?? document);
}

describe("home-not-interested feature", () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    stubHomePage();
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
      feature.matchesPage?.(new URL("https://www.youtube.com/watch?v=abc")),
    ).toBe(false);
  });

  it("mounts an owned not-interested control at the top-left of the thumbnail", async () => {
    renderHomeCard();

    const { default: feature } = await importFreshFeature();
    feature.activate(makeFeatureContext());

    const host = document.querySelector<HTMLElement>(
      "[id^='yt-utils-home-not-interested-host-']",
    );
    const button = document.querySelector<HTMLButtonElement>(
      "[id^='yt-utils-home-not-interested-button-']",
    );
    const thumbnail = document.querySelector("yt-thumbnail-view-model");
    const styles = document.getElementById(
      "yt-utils-home-not-interested-styles",
    );

    expect(host).not.toBeNull();
    expect(button).not.toBeNull();
    expect(button?.getAttribute("aria-label")).toBe("No me interesa");
    expect(button?.innerHTML).toContain("M13.359 11.238");
    expect(host?.parentElement).toBe(thumbnail);
    expect(host?.style.position).toBe("absolute");
    expect(host?.style.left).toBe("8px");
    expect(host?.style.top).toBe("8px");
    expect(styles?.textContent).toContain(
      'yt-thumbnail-view-model:hover > [id^="yt-utils-home-not-interested-host-"]',
    );
    expect(styles?.textContent).toContain("opacity: 0");

    feature.deactivate();
    expect(
      document.getElementById("yt-utils-home-not-interested-styles"),
    ).toBeNull();
  });

  it("does not mount a control when the card menu is missing", async () => {
    document.body.innerHTML = `
      <ytd-rich-item-renderer id="no-menu">
        <yt-thumbnail-view-model></yt-thumbnail-view-model>
      </ytd-rich-item-renderer>
    `;

    const { default: feature } = await importFreshFeature();
    feature.activate(makeFeatureContext());

    expect(
      document.querySelector("[id^='yt-utils-home-not-interested-host-']"),
    ).toBeNull();

    feature.deactivate();
  });

  it("keeps a single control per card across rerenders", async () => {
    renderHomeCard();

    const { default: feature } = await importFreshFeature();
    feature.activate(makeFeatureContext());

    const firstHost = document.querySelector(
      "[id^='yt-utils-home-not-interested-host-']",
    );
    expect(firstHost).not.toBeNull();

    renderHomeCard("card-2");
    document
      .querySelector("#card-1 yt-thumbnail-view-model")
      ?.append(document.createElement("div"));

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });

    const hosts = document.querySelectorAll(
      "[id^='yt-utils-home-not-interested-host-']",
    );
    expect(hosts).toHaveLength(2);

    feature.deactivate();
  });

  it("opens the native menu and activates Not interested when clicked", async () => {
    renderHomeCard();

    const menuButton = document.querySelector<HTMLButtonElement>(
      'button[aria-label="More actions"]',
    )!;
    menuButton.scrollIntoView = vi.fn();
    const clickSpy = vi.spyOn(menuButton, "click");

    const { default: feature } = await importFreshFeature();
    feature.activate(makeFeatureContext());

    const actionButton = document.querySelector<HTMLButtonElement>(
      "[id^='yt-utils-home-not-interested-button-']",
    )!;

    const notInterestedItem = document.createElement("button");
    notInterestedItem.setAttribute("role", "menuitem");
    notInterestedItem.textContent = "Not interested";
    makeVisible(notInterestedItem);
    notInterestedItem.scrollIntoView = vi.fn();

    const dontRecommendItem = document.createElement("button");
    dontRecommendItem.setAttribute("role", "menuitem");
    dontRecommendItem.textContent = "Don't recommend channel";
    makeVisible(dontRecommendItem);
    dontRecommendItem.scrollIntoView = vi.fn();

    document.body.append(notInterestedItem, dontRecommendItem);

    const notInterestedClickSpy = vi.spyOn(notInterestedItem, "click");
    const dontRecommendClickSpy = vi.spyOn(dontRecommendItem, "click");

    actionButton.click();

    await vi.waitFor(() => {
      expect(clickSpy).toHaveBeenCalled();
      expect(notInterestedClickSpy).toHaveBeenCalled();
    });
    expect(dontRecommendClickSpy).not.toHaveBeenCalled();

    feature.deactivate();
  });

  it("activates the Spanish native menu item", async () => {
    renderHomeCard();

    const menuButton = document.querySelector<HTMLButtonElement>(
      'button[aria-label="More actions"]',
    )!;
    menuButton.scrollIntoView = vi.fn();

    const { default: feature } = await importFreshFeature();
    feature.activate(makeFeatureContext());

    const actionButton = document.querySelector<HTMLButtonElement>(
      "[id^='yt-utils-home-not-interested-button-']",
    )!;

    const spanishItem = document.createElement("button");
    spanishItem.setAttribute("role", "menuitem");
    spanishItem.textContent = "No me interesa";
    makeVisible(spanishItem);
    spanishItem.scrollIntoView = vi.fn();
    document.body.append(spanishItem);

    const spanishClickSpy = vi.spyOn(spanishItem, "click");

    actionButton.click();

    await vi.waitFor(() => {
      expect(spanishClickSpy).toHaveBeenCalled();
    });

    feature.deactivate();
  });

  it("logs once when cards have menus but no placement surface", async () => {
    document.body.innerHTML = `
      <ytd-rich-item-renderer id="menu-only">
        <button aria-label="More actions" type="button"></button>
      </ytd-rich-item-renderer>
    `;
    makeCardMenusVisible();

    const { default: feature } = await importFreshFeature();
    const context = makeFeatureContext();
    feature.activate(context);

    expect(context.logger.error).toHaveBeenCalledTimes(1);
    expect(String(vi.mocked(context.logger.error).mock.calls[0]?.[0])).toMatch(
      /placement surface/i,
    );

    feature.deactivate();
  });
});
