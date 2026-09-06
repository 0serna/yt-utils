import { makeFeatureContext, requireValue } from "@shared/test-helpers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function stubSubscriptionsPage(): void {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: new URL("https://www.youtube.com/feed/subscriptions"),
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

function renderCurrentLockupCard(id = "card-1"): void {
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

describe("subscriptions-feed-controls feature", () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    stubSubscriptionsPage();
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

  it("mounts an owned hide control at the top-left of the thumbnail", async () => {
    renderCurrentLockupCard();

    const { default: feature } = await importFreshFeature();
    feature.activate(makeFeatureContext());

    const host = document.querySelector<HTMLElement>(
      "[id^='yt-utils-subscriptions-hide-host-']",
    );
    const button = document.querySelector<HTMLButtonElement>(
      "[id^='yt-utils-subscriptions-hide-button-']",
    );
    const thumbnail = document.querySelector("yt-thumbnail-view-model");
    const styles = document.getElementById(
      "yt-utils-subscriptions-hide-styles",
    );

    expect(host).not.toBeNull();
    expect(button).not.toBeNull();
    expect(button?.getAttribute("aria-label")).toBe("Hide");
    expect(host?.parentElement).toBe(thumbnail);
    expect(host?.style.position).toBe("absolute");
    expect(host?.style.left).toBe("8px");
    expect(host?.style.top).toBe("8px");
    expect(styles?.textContent).toContain(
      'yt-thumbnail-view-model:hover > [id^="yt-utils-subscriptions-hide-host-"]',
    );
    expect(styles?.textContent).toContain("opacity: 0");

    feature.deactivate();
    expect(
      document.getElementById("yt-utils-subscriptions-hide-styles"),
    ).toBeNull();
  });

  it("does not mount a hide control when the card menu is missing", async () => {
    document.body.innerHTML = `
      <ytd-rich-item-renderer id="no-menu">
        <yt-thumbnail-view-model></yt-thumbnail-view-model>
      </ytd-rich-item-renderer>
    `;

    const { default: feature } = await importFreshFeature();
    feature.activate(makeFeatureContext());

    expect(
      document.querySelector("[id^='yt-utils-subscriptions-hide-host-']"),
    ).toBeNull();

    feature.deactivate();
  });

  it("keeps a single hide control per card across rerenders", async () => {
    renderCurrentLockupCard();

    const { default: feature } = await importFreshFeature();
    feature.activate(makeFeatureContext());

    const firstHost = document.querySelector(
      "[id^='yt-utils-subscriptions-hide-host-']",
    );
    expect(firstHost).not.toBeNull();

    renderCurrentLockupCard("card-2");
    document
      .querySelector("#card-1 yt-thumbnail-view-model")
      ?.append(document.createElement("div"));

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });

    const hosts = document.querySelectorAll(
      "[id^='yt-utils-subscriptions-hide-host-']",
    );
    expect(hosts).toHaveLength(2);

    feature.deactivate();
  });

  it("opens the native menu and activates Hide when clicked", async () => {
    renderCurrentLockupCard();

    const menuButton = requireValue(
      document.querySelector<HTMLButtonElement>(
        'button[aria-label="More actions"]',
      ),
      "missing menu button",
    );
    menuButton.scrollIntoView = vi.fn();
    const clickSpy = vi.spyOn(menuButton, "click");

    const { default: feature } = await importFreshFeature();
    feature.activate(makeFeatureContext());

    const hideButton = requireValue(
      document.querySelector<HTMLButtonElement>(
        "[id^='yt-utils-subscriptions-hide-button-']",
      ),
      "missing hide button",
    );

    const hideItem = document.createElement("div");
    hideItem.setAttribute("role", "menuitem");
    hideItem.setAttribute("aria-label", "Hide");
    makeVisible(hideItem);
    hideItem.scrollIntoView = vi.fn();
    document.body.append(hideItem);

    const hideClickSpy = vi.spyOn(hideItem, "click");

    hideButton.click();

    await vi.waitFor(() => {
      expect(clickSpy).toHaveBeenCalled();
      expect(hideClickSpy).toHaveBeenCalled();
    });

    feature.deactivate();
  });

  it("waits for the first card's delayed menu before opening another card's menu", async () => {
    renderCurrentLockupCard("card-1");
    renderCurrentLockupCard("card-2");

    const menuButtons = [
      ...document.querySelectorAll<HTMLButtonElement>(
        'button[aria-label="More actions"]',
      ),
    ];
    const menuClickSpies = menuButtons.map((button) => {
      button.scrollIntoView = vi.fn();
      return vi.spyOn(button, "click").mockImplementation(() => {
        window.setTimeout(() => {
          const item = document.createElement("div");
          item.setAttribute("role", "menuitem");
          item.setAttribute("aria-label", "Hide");
          item.scrollIntoView = vi.fn();
          makeVisible(item);
          item.onclick = () => item.remove();
          document.body.append(item);
        }, 20);
      });
    });

    const { default: feature } = await importFreshFeature();
    feature.activate(makeFeatureContext());

    const hideButtons = [
      ...document.querySelectorAll<HTMLButtonElement>(
        "[id^='yt-utils-subscriptions-hide-button-']",
      ),
    ];
    expect(hideButtons).toHaveLength(2);
    hideButtons[0]?.click();
    hideButtons[1]?.click();

    await vi.waitFor(() => expect(menuClickSpies[0]).toHaveBeenCalledTimes(1));
    expect(menuClickSpies[1]).not.toHaveBeenCalled();

    await vi.waitFor(() => {
      expect(menuClickSpies[1]).toHaveBeenCalledTimes(1);
      expect(document.querySelectorAll("[role='menuitem']")).toHaveLength(0);
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
