import { makeFeatureContext, requireValue } from "@shared/test-helpers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isBlockedCardText, matchesBlockedKeyword } from "./topics";
import { readCardKey, readCardVideoId } from "./video-id";

function stubHomePage(): void {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: new URL("https://www.youtube.com/"),
  });
}

function stubRect(element: Element): void {
  Object.defineProperty(element, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      width: 24,
      height: 24,
      top: 0,
      left: 0,
      right: 24,
      bottom: 24,
      x: 0,
      y: 0,
      toJSON() {},
    }),
  });
}

function renderCard(
  id: string,
  videoId: string | null,
  title: string,
  channel: string,
  handle?: string,
  withMenu = true,
): void {
  const href = videoId === null ? "" : ` href="/watch?v=${videoId}"`;
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <ytd-rich-item-renderer id="${id}">
        <yt-lockup-view-model>
          <a class="ytLockupViewModelContentImage"${href}>
            <yt-thumbnail-view-model></yt-thumbnail-view-model>
          </a>
          <yt-lockup-metadata-view-model>
            <h3><a id="video-title-link">${title}</a></h3>
            <ytd-channel-name>${channel}</ytd-channel-name>
            ${handle ? `<a href="/@${handle}">@${handle}</a>` : ""}
            ${
              withMenu
                ? `<div><button aria-label="More actions" type="button"></button></div>`
                : ""
            }
          </yt-lockup-metadata-view-model>
        </yt-lockup-view-model>
      </ytd-rich-item-renderer>
    `,
  );
  const root = document.getElementById(id) ?? document;
  for (const button of root.querySelectorAll<HTMLElement>(
    'button[aria-label="More actions"]',
  )) {
    stubRect(button);
    button.scrollIntoView = vi.fn();
  }
}

function appendNativeNotInterestedItem(label = "No me interesa"): {
  clickSpy: ReturnType<typeof vi.spyOn>;
} {
  const item = document.createElement("button");
  item.setAttribute("role", "menuitem");
  item.textContent = label;
  stubRect(item);
  item.scrollIntoView = vi.fn();
  document.body.append(item);
  return { clickSpy: vi.spyOn(item, "click") };
}

describe("home-auto-not-interested-topics matcher", () => {
  it("matches channel variants and new jargon", () => {
    expect(matchesBlockedKeyword("Surgical Goblin [ENG]")).toBe(true);
    expect(matchesBlockedKeyword("Judo Sloth Gaming")).toBe(true);
    expect(matchesBlockedKeyword("KJ Maggard")).toBe(true);
    expect(matchesBlockedKeyword("Hero Electro Wizard")).toBe(true);
    expect(matchesBlockedKeyword("EL NUEVO MAGO ELÉCTRICO SORPRENDIÓ")).toBe(
      true,
    );
    expect(
      matchesBlockedKeyword("New Troop and Equipment in October Season!"),
    ).toBe(true);
  });

  it("keeps legacy core, variants, and jargon", () => {
    expect(matchesBlockedKeyword("La MERECIDA CAÍDA de CLASH ROYALE")).toBe(
      true,
    );
    expect(matchesBlockedKeyword("【クラロワ】オクラロワ")).toBe(true);
    expect(matchesBlockedKeyword("클래시로얄 덱 추천")).toBe(true);
    expect(matchesBlockedKeyword("A POR EL TOP 10 *MEJORES MAZOS*")).toBe(true);
    expect(matchesBlockedKeyword("BENIJU SALE DEL TILT")).toBe(true);
  });

  it("does not match unrelated content", () => {
    expect(matchesBlockedKeyword("Kubernetes Simply Explained")).toBe(false);
    expect(matchesBlockedKeyword("")).toBe(false);
  });

  it("matches observed Home cases by card parts", () => {
    expect(
      isBlockedCardText(["Hero Electro Wizard", "Ken", "@kenforrest"]),
    ).toBe(true);
    expect(
      isBlockedCardText([
        "New Troop and Equipment in October Season!",
        "Judo Sloth Gaming",
      ]),
    ).toBe(true);
    expect(
      isBlockedCardText(["15k Push | Random Deck Challenge", "KJ Maggard"]),
    ).toBe(true);
    expect(isBlockedCardText(["Глобал пуш в Топ Мира", "Mamoyan"])).toBe(true);
    expect(
      isBlockedCardText([
        "THE NEW ELECTRO WIZARD IS A NIGHTMARE TO FACE",
        "Surgical Goblin [ENG]",
      ]),
    ).toBe(true);
    expect(
      isBlockedCardText(["Kubernetes Simply Explained", "Tech Channel"]),
    ).toBe(false);
  });
});

describe("home-auto-not-interested-topics video id", () => {
  it("reads watch, shorts, and live hrefs", () => {
    renderCard("vid-watch", "abc123", "t", "c");
    renderCard("vid-params", "xyz789", "t", "c");
    document
      .querySelector("#vid-params a")
      ?.setAttribute("href", "/watch?v=xyz789&t=42s");

    document.body.insertAdjacentHTML(
      "beforeend",
      `<ytd-rich-item-renderer id="vid-shorts"><a href="/shorts/shortId1">s</a></ytd-rich-item-renderer>
       <ytd-rich-item-renderer id="vid-live"><a href="/live/liveId2">l</a></ytd-rich-item-renderer>
       <ytd-rich-item-renderer id="vid-none"><span>no links</span></ytd-rich-item-renderer>`,
    );

    expect(
      readCardVideoId(
        requireValue(document.getElementById("vid-watch"), "watch"),
      ),
    ).toBe("abc123");
    expect(
      readCardVideoId(
        requireValue(document.getElementById("vid-params"), "params"),
      ),
    ).toBe("xyz789");
    expect(
      readCardVideoId(
        requireValue(document.getElementById("vid-shorts"), "shorts"),
      ),
    ).toBe("shortId1");
    expect(
      readCardVideoId(
        requireValue(document.getElementById("vid-live"), "live"),
      ),
    ).toBe("liveId2");
    expect(
      readCardVideoId(
        requireValue(document.getElementById("vid-none"), "none"),
      ),
    ).toBeNull();
  });

  it("maps repeated renders to the same key and falls back per element", () => {
    renderCard("same-a", "dupId", "t", "c");
    renderCard("same-b", "dupId", "t", "c");
    renderCard("noid-a", null, "t", "c");
    renderCard("noid-b", null, "t", "c");

    const cardA = requireValue(document.getElementById("same-a"), "a");
    const cardB = requireValue(document.getElementById("same-b"), "b");
    const noIdA = requireValue(document.getElementById("noid-a"), "noid-a");
    const noIdB = requireValue(document.getElementById("noid-b"), "noid-b");

    expect(readCardKey(cardA)).toBe("dupId");
    expect(readCardKey(cardB)).toBe("dupId");
    expect(readCardKey(noIdA)).toBe(readCardKey(noIdA));
    expect(readCardKey(noIdA)).not.toBe(readCardKey(noIdB));
  });
});

describe("home-auto-not-interested-topics feature", () => {
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

  it("auto-marks the observed Electro Wizard card without hiding it locally", async () => {
    renderCard(
      "electro",
      "WHM15z2QJ78",
      "Hero Electro Wizard",
      "Ken",
      "kenforrest",
    );
    const menuButton = requireValue(
      document.querySelector<HTMLButtonElement>(
        "#electro button[aria-label='More actions']",
      ),
      "missing menu button",
    );
    const menuClickSpy = vi.spyOn(menuButton, "click");
    const { clickSpy: itemClickSpy } = appendNativeNotInterestedItem();

    const { default: feature } = await importFreshFeature();
    feature.activate(makeFeatureContext());

    await vi.waitFor(() => {
      expect(menuClickSpy).toHaveBeenCalledTimes(1);
      expect(itemClickSpy).toHaveBeenCalledTimes(1);
    });

    const card = requireValue(document.getElementById("electro"), "card");
    expect(card.style.display).not.toBe("none");
    expect(card.hasAttribute("style")).toBe(false);

    feature.deactivate();
  });

  it("leaves unrelated videos untouched", async () => {
    renderCard(
      "tech",
      "tech999",
      "Kubernetes Simply Explained",
      "Tech Channel",
    );
    const menuButton = requireValue(
      document.querySelector<HTMLButtonElement>(
        "#tech button[aria-label='More actions']",
      ),
      "missing menu button",
    );
    const menuClickSpy = vi.spyOn(menuButton, "click");
    appendNativeNotInterestedItem();

    const { default: feature } = await importFreshFeature();
    const context = makeFeatureContext();
    feature.activate(context);

    await new Promise((resolve) => window.setTimeout(resolve, 150));
    expect(menuClickSpy).not.toHaveBeenCalled();
    expect(context.logger.error).not.toHaveBeenCalled();

    feature.deactivate();
  });

  it("does not reprocess the same video on later scans", async () => {
    renderCard("dupe", "DUP123", "Hero Electro Wizard", "Ken");
    const menuButton = requireValue(
      document.querySelector<HTMLButtonElement>(
        "#dupe button[aria-label='More actions']",
      ),
      "missing menu button",
    );
    const menuClickSpy = vi.spyOn(menuButton, "click");
    appendNativeNotInterestedItem();

    const { default: feature } = await importFreshFeature();
    const context = makeFeatureContext();
    feature.activate(context);

    await vi.waitFor(() => {
      expect(menuClickSpy).toHaveBeenCalledTimes(1);
    });

    feature.activate(context);
    await new Promise((resolve) => window.setTimeout(resolve, 150));
    expect(menuClickSpy).toHaveBeenCalledTimes(1);
    expect(context.logger.error).not.toHaveBeenCalled();

    feature.deactivate();
  });

  it("retries failures up to the limit, then logs once and stays visible", async () => {
    renderCard(
      "nobutton",
      "FAIL456",
      "Hero Electro Wizard",
      "Ken",
      undefined,
      false,
    );

    const { default: feature, MAX_AUTO_ATTEMPTS } = await importFreshFeature();
    expect(MAX_AUTO_ATTEMPTS).toBe(3);
    const context = makeFeatureContext();

    feature.activate(context);
    await new Promise((resolve) => window.setTimeout(resolve, 100));
    feature.activate(context);
    await new Promise((resolve) => window.setTimeout(resolve, 100));
    expect(context.logger.error).not.toHaveBeenCalled();

    feature.activate(context);
    await new Promise((resolve) => window.setTimeout(resolve, 100));
    expect(context.logger.error).toHaveBeenCalledTimes(1);

    const card = requireValue(document.getElementById("nobutton"), "card");
    expect(card.style.display).not.toBe("none");

    feature.deactivate();
  });
});
