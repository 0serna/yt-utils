import { makeFeatureContext } from "@shared/test-helpers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BLOCKED_KEYWORDS,
  isBlockedCardText,
  matchesBlockedKeyword,
  normalizeFilterText,
} from "./keywords";

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
          <yt-lockup-metadata-view-model>
            <h3><a id="video-title-link">${title}</a></h3>
            <ytd-channel-name>${channel}</ytd-channel-name>
            ${handle ? `<a href="/@${handle}">@${handle}</a>` : ""}
          </yt-lockup-metadata-view-model>
        </yt-lockup-view-model>
      </ytd-rich-item-renderer>
    `,
  );
}

function renderHome(): void {
  renderCard(
    "clash-title",
    "La MERECIDA CAÍDA de CLASH ROYALE...",
    "Some Channel",
  );
  renderCard("beniju-channel", "BENIJU SALE DEL TILT...", "BENIJUGOSO");
  renderCard("tech-video", "Kubernetes Simply Explained", "Tech Channel");
}

describe("home-keyword-filter keywords", () => {
  it("normalizes case and diacritics", () => {
    expect(normalizeFilterText("CAÍDA GIGANTE")).toBe("caida gigante");
  });

  it("matches core variants and channel keywords", () => {
    expect(matchesBlockedKeyword("La MERECIDA CAÍDA de CLASH ROYALE")).toBe(
      true,
    );
    expect(matchesBlockedKeyword("【クラロワ】オクラロワ")).toBe(true);
    expect(matchesBlockedKeyword("클래시로얄 덱 추천")).toBe(true);
    expect(matchesBlockedKeyword("BENIJU SALE DEL TILT")).toBe(true);
    expect(matchesBlockedKeyword("A POR EL TOP 10 *MEJORES MAZOS*")).toBe(true);
    expect(matchesBlockedKeyword("#clashroyale best deck")).toBe(true);
  });

  it("does not match unrelated tech content", () => {
    expect(matchesBlockedKeyword("Kubernetes Simply Explained")).toBe(false);
    expect(matchesBlockedKeyword("")).toBe(false);
  });

  it("matches broad clash mentions including Clash of Clans", () => {
    expect(matchesBlockedKeyword("Nomgar Clash / RONIN")).toBe(true);
  });

  it("matches any blocked part of a card", () => {
    expect(isBlockedCardText(["Kubernetes Simply Explained", "BENIJU"])).toBe(
      true,
    );
    expect(isBlockedCardText(["Kubernetes Simply Explained", "Tech"])).toBe(
      false,
    );
  });

  it("keeps the blocklist normalized", () => {
    for (const keyword of BLOCKED_KEYWORDS) {
      expect(keyword).toBe(normalizeFilterText(keyword));
    }
    expect(BLOCKED_KEYWORDS).toContain("clash royale");
  });
});

describe("home-keyword-filter feature", () => {
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
      feature.matchesPage?.(new URL("https://www.youtube.com/watch?v=abc")),
    ).toBe(false);
  });

  it("hides matching cards and preserves unrelated videos", async () => {
    renderHome();

    const { default: feature } = await importFreshFeature();
    feature.activate(makeFeatureContext());

    expect(document.querySelector("#clash-title")).not.toBeNull();
    expect(
      (document.querySelector("#clash-title") as HTMLElement).style.display,
    ).toBe("none");
    expect(
      (document.querySelector("#beniju-channel") as HTMLElement).style.display,
    ).toBe("none");
    expect(
      (document.querySelector("#tech-video") as HTMLElement).style.display,
    ).not.toBe("none");

    feature.deactivate();
  });

  it("hides handle, jargon, and broad clash variants", async () => {
    renderCard("jp-card", "【クラロワ】オクラロワ", "JP Channel");
    renderCard("kr-card", "클래시로얄 덱", "KR Channel");
    renderCard("handle-card", "Nuevo video", "Random", "BaleGG");
    renderCard("jargon-card", "gigante noble mejor mazo", "Deck Channel");
    renderCard("coc-card", "Nomgar Clash / RONIN", "CoC Channel");
    renderCard("tech-card", "Kubernetes Simply Explained", "Tech Channel");

    const { default: feature } = await importFreshFeature();
    feature.activate(makeFeatureContext());

    for (const id of [
      "jp-card",
      "kr-card",
      "handle-card",
      "jargon-card",
      "coc-card",
    ]) {
      expect(
        (document.querySelector(`#${id}`) as HTMLElement).style.display,
      ).toBe("none");
    }
    for (const id of ["tech-card"]) {
      expect(
        (document.querySelector(`#${id}`) as HTMLElement).style.display,
      ).not.toBe("none");
    }

    feature.deactivate();
  });

  it("hides cards added after activation and restores on deactivate", async () => {
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(
      (callback: FrameRequestCallback): number => {
        callback(0);
        return 1;
      },
    );

    const { default: feature } = await importFreshFeature();
    feature.activate(makeFeatureContext());

    renderCard("late-clash", "CLASH ROYALE EN VIVO", "Live Channel");
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    const lateCard = document.querySelector("#late-clash") as HTMLElement;
    expect(lateCard.style.display).toBe("none");

    feature.deactivate();
    expect(lateCard.style.display).not.toBe("none");
    expect(
      lateCard.hasAttribute("data-yt-utils-home-keyword-filter-hidden"),
    ).toBe(false);
  });

  it("restores every hidden card on deactivate", async () => {
    renderHome();

    const { default: feature } = await importFreshFeature();
    feature.activate(makeFeatureContext());
    feature.deactivate();

    for (const id of ["clash-title", "beniju-channel", "tech-video"]) {
      const card = document.querySelector(`#${id}`) as HTMLElement;
      expect(card.style.display).not.toBe("none");
      expect(
        card.hasAttribute("data-yt-utils-home-keyword-filter-hidden"),
      ).toBe(false);
    }
  });
});
