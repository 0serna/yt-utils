import { makeFeatureContext, requireValue } from "@shared/test-helpers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isBlockedCardText, matchesBlockedKeyword } from "./topics";

const HIDDEN_ATTRIBUTE = "data-yt-utils-home-auto-hide-topics-hidden";

function stubHomePage(): void {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: new URL("https://www.youtube.com/"),
  });
}

function renderCard(
  id: string,
  title: string,
  channel: string,
  handle?: string,
): void {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <ytd-rich-item-renderer id="${id}">
        <yt-lockup-view-model>
          <a class="ytLockupViewModelContentImage" href="/watch?v=${id}">
            <yt-thumbnail-view-model></yt-thumbnail-view-model>
          </a>
          <yt-lockup-metadata-view-model>
            <h3><a id="video-title-link">${title}</a></h3>
            <ytd-channel-name>${channel}</ytd-channel-name>
            ${handle ? `<a href="/@${handle}">@${handle}</a>` : ""}
            <div><button aria-label="More actions" type="button"></button></div>
          </yt-lockup-metadata-view-model>
        </yt-lockup-view-model>
      </ytd-rich-item-renderer>
    `,
  );
}

function appendNativeNotInterestedItem(label = "No me interesa"): {
  clickSpy: ReturnType<typeof vi.spyOn>;
} {
  const item = document.createElement("button");
  item.setAttribute("role", "menuitem");
  item.textContent = label;
  document.body.append(item);
  return { clickSpy: vi.spyOn(item, "click") };
}

function stubAnimationFrames(): void {
  vi.spyOn(window, "requestAnimationFrame").mockImplementation(
    (callback: FrameRequestCallback): number => {
      callback(0);
      return 1;
    },
  );
}

async function flushObserverPass(): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, 0));
}

describe("home-auto-hide-topics matcher", () => {
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

describe("home-auto-hide-topics feature", () => {
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

  it("hides a matching card without opening the native menu", async () => {
    renderCard("electro", "Hero Electro Wizard", "Ken", "kenforrest");
    const menuButton = requireValue(
      document.querySelector<HTMLButtonElement>(
        "#electro button[aria-label='More actions']",
      ),
      "missing menu button",
    );
    const menuClickSpy = vi.spyOn(menuButton, "click");
    const { clickSpy: itemClickSpy } = appendNativeNotInterestedItem();

    const { default: feature } = await importFreshFeature();
    const context = makeFeatureContext();
    feature.activate(context);

    const card = requireValue(document.getElementById("electro"), "card");
    expect(card.style.display).toBe("none");
    expect(card.getAttribute(HIDDEN_ATTRIBUTE)).toBe("true");
    expect(menuClickSpy).not.toHaveBeenCalled();
    expect(itemClickSpy).not.toHaveBeenCalled();
    expect(context.logger.error).not.toHaveBeenCalled();

    feature.deactivate();
  });

  it("leaves unrelated videos untouched", async () => {
    renderCard("tech", "Kubernetes Simply Explained", "Tech Channel");
    const menuButton = requireValue(
      document.querySelector<HTMLButtonElement>(
        "#tech button[aria-label='More actions']",
      ),
      "missing menu button",
    );
    const menuClickSpy = vi.spyOn(menuButton, "click");
    const { clickSpy: itemClickSpy } = appendNativeNotInterestedItem();

    const { default: feature } = await importFreshFeature();
    const context = makeFeatureContext();
    feature.activate(context);

    const card = requireValue(document.getElementById("tech"), "card");
    expect(card.style.display).not.toBe("none");
    expect(card.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(false);
    expect(menuClickSpy).not.toHaveBeenCalled();
    expect(itemClickSpy).not.toHaveBeenCalled();
    expect(context.logger.error).not.toHaveBeenCalled();

    feature.deactivate();
  });

  it("restores a recycled card whose text no longer matches", async () => {
    stubAnimationFrames();
    renderCard("recycle", "Hero Electro Wizard", "Ken");
    const card = requireValue(document.getElementById("recycle"), "card");
    card.style.display = "grid";

    const { default: feature } = await importFreshFeature();
    feature.activate(makeFeatureContext());
    expect(card.style.display).toBe("none");

    const title = requireValue(card.querySelector("h3"), "title");
    const channel = requireValue(
      card.querySelector("ytd-channel-name"),
      "channel",
    );
    title.textContent = "Kubernetes Simply Explained";
    channel.textContent = "Tech Channel";
    await flushObserverPass();

    expect(card.style.display).toBe("grid");
    expect(card.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(false);

    feature.deactivate();
  });

  it("stops observing on deactivate and leaves hidden cards hidden", async () => {
    stubAnimationFrames();
    renderCard("stays", "Hero Electro Wizard", "Ken");

    const { default: feature } = await importFreshFeature();
    feature.activate(makeFeatureContext());

    const hiddenCard = requireValue(document.getElementById("stays"), "card");
    expect(hiddenCard.style.display).toBe("none");

    feature.deactivate();

    renderCard("late", "CLASH ROYALE EN VIVO", "Live Channel");
    await flushObserverPass();

    const lateCard = requireValue(document.getElementById("late"), "card");
    expect(lateCard.style.display).not.toBe("none");
    expect(lateCard.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(false);
    expect(hiddenCard.style.display).toBe("none");
    expect(hiddenCard.getAttribute(HIDDEN_ATTRIBUTE)).toBe("true");
  });

  it("is idempotent across repeated passes", async () => {
    stubAnimationFrames();
    renderCard("idem", "Hero Electro Wizard", "Ken");
    const card = requireValue(document.getElementById("idem"), "card");

    const { default: feature } = await importFreshFeature();
    const context = makeFeatureContext();
    feature.activate(context);
    feature.activate(context);

    document.body.append(document.createElement("div"));
    await flushObserverPass();
    document.body.append(document.createElement("div"));
    await flushObserverPass();

    expect(card.style.display).toBe("none");
    expect(card.getAttribute(HIDDEN_ATTRIBUTE)).toBe("true");

    feature.deactivate();
  });
});
