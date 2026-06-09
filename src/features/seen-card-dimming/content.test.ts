import { makeFeatureContext } from "@shared/test-helpers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const PROGRESS_SEGMENT_CLASS =
  "ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment";
const DIMMED_ATTRIBUTE = "data-yt-utils-seen-dimmed";

type SeenCardDimmingFeature = Awaited<
  ReturnType<typeof importFreshFeature>
>["default"];

function setLocation(url: string): void {
  const parsed = new URL(url);

  Object.defineProperty(window, "location", {
    value: {
      href: parsed.href,
      origin: parsed.origin,
      hostname: parsed.hostname,
      pathname: parsed.pathname,
      search: parsed.search,
    },
    writable: true,
    configurable: true,
  });
}

function renderCard({
  id,
  progress,
  renderer = "ytd-rich-item-renderer",
  hasLockup = true,
  isShorts = false,
}: {
  id: string;
  progress: number;
  renderer?: string;
  hasLockup?: boolean;
  isShorts?: boolean;
}): void {
  const shortsLink = isShorts ? '<a href="/shorts/short-id">Shorts</a>' : "";
  const contents = `
    ${shortsLink}
    ${hasLockup ? "<yt-lockup-view-model></yt-lockup-view-model>" : ""}
    <div class="${PROGRESS_SEGMENT_CLASS}" style="width: ${progress}%;"></div>
  `;

  document.body.insertAdjacentHTML(
    "beforeend",
    `<${renderer} id="${id}">${contents}</${renderer}>`,
  );
}

async function importFreshFeature() {
  return import("./content");
}

function lockupFor(id: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`#${id} yt-lockup-view-model`);
}

describe("seen-card-dimming feature", () => {
  let activeFeature: SeenCardDimmingFeature | null;

  beforeEach(() => {
    vi.resetModules();
    setLocation("https://www.youtube.com/feed/subscriptions");
    document.body.innerHTML = "";
    activeFeature = null;
  });

  afterEach(() => {
    activeFeature?.deactivate();
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("matches desktop YouTube pages and excludes mobile or embed hosts", async () => {
    const { default: feature } = await importFreshFeature();

    expect(
      feature.matchesPage?.(
        new URL("https://www.youtube.com/feed/subscriptions"),
      ),
    ).toBe(true);
    expect(
      feature.matchesPage?.(
        new URL("https://www.youtube.com/@rachelsenglish/videos"),
      ),
    ).toBe(true);
    expect(
      feature.matchesPage?.(new URL("https://www.youtube.com/watch?v=abc")),
    ).toBe(true);
    expect(
      feature.matchesPage?.(new URL("https://m.youtube.com/watch?v=abc")),
    ).toBe(false);
    expect(
      feature.matchesPage?.(
        new URL("https://www.youtube-nocookie.com/embed/abc"),
      ),
    ).toBe(false);
  });

  it("dims seen cards on a channel Videos tab", async () => {
    setLocation("https://www.youtube.com/@rachelsenglish/videos");
    renderCard({ id: "channel-video", progress: 95 });

    const { default: feature } = await importFreshFeature();
    activeFeature = feature;
    feature.activate(makeFeatureContext());

    const lockup = lockupFor("channel-video");
    expect(lockup?.style.opacity).toBe("0.4");
    expect(lockup?.getAttribute(DIMMED_ATTRIBUTE)).toBe("true");
  });

  it("dims seen watch-page recommendations", async () => {
    setLocation("https://www.youtube.com/watch?v=current-video");
    renderCard({
      id: "watch-recommendation",
      progress: 92,
      renderer: "ytd-compact-video-renderer",
    });

    const { default: feature } = await importFreshFeature();
    activeFeature = feature;
    feature.activate(makeFeatureContext());

    expect(lockupFor("watch-recommendation")?.style.opacity).toBe("0.4");
  });

  it("uses a 90 percent watched threshold", async () => {
    renderCard({ id: "below-threshold", progress: 89 });
    renderCard({ id: "at-threshold", progress: 90 });

    const { default: feature } = await importFreshFeature();
    activeFeature = feature;
    feature.activate(makeFeatureContext());

    expect(lockupFor("below-threshold")?.style.opacity).toBe("");
    expect(lockupFor("below-threshold")?.hasAttribute(DIMMED_ATTRIBUTE)).toBe(
      false,
    );
    expect(lockupFor("at-threshold")?.style.opacity).toBe("0.4");
  });

  it("skips cards without lockup targets and Shorts cards", async () => {
    renderCard({ id: "unsupported", progress: 99, hasLockup: false });
    renderCard({ id: "shorts-card", progress: 99, isShorts: true });

    const { default: feature } = await importFreshFeature();
    activeFeature = feature;
    feature.activate(makeFeatureContext());

    expect(lockupFor("unsupported")).toBeNull();
    expect(lockupFor("shorts-card")?.style.opacity).toBe("");
    expect(lockupFor("shorts-card")?.hasAttribute(DIMMED_ATTRIBUTE)).toBe(
      false,
    );
  });

  it("removes only extension-owned dimming on deactivation", async () => {
    renderCard({ id: "owned", progress: 99 });
    renderCard({ id: "unowned", progress: 0 });
    const unownedLockup = lockupFor("unowned");
    unownedLockup?.style.setProperty("opacity", "0.2");

    const { default: feature } = await importFreshFeature();
    activeFeature = feature;
    feature.activate(makeFeatureContext());

    expect(lockupFor("owned")?.style.opacity).toBe("0.4");

    feature.deactivate();
    activeFeature = null;

    expect(lockupFor("owned")?.style.opacity).toBe("");
    expect(lockupFor("owned")?.hasAttribute(DIMMED_ATTRIBUTE)).toBe(false);
    expect(lockupFor("unowned")?.style.opacity).toBe("0.2");
  });

  it("dims dynamically inserted eligible cards", async () => {
    const requestAnimationFrameSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback): number => {
        callback(0);
        return 1;
      });

    const { default: feature } = await importFreshFeature();
    activeFeature = feature;
    feature.activate(makeFeatureContext());

    renderCard({ id: "dynamic-card", progress: 91 });
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(requestAnimationFrameSpy).toHaveBeenCalled();
    expect(lockupFor("dynamic-card")?.style.opacity).toBe("0.4");
  });

  it("dims existing cards when watched progress style reaches the threshold", async () => {
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(
      (callback: FrameRequestCallback): number => {
        callback(0);
        return 1;
      },
    );
    renderCard({ id: "updated-progress", progress: 50 });

    const { default: feature } = await importFreshFeature();
    activeFeature = feature;
    feature.activate(makeFeatureContext());

    expect(lockupFor("updated-progress")?.style.opacity).toBe("");

    document
      .querySelector<HTMLElement>(
        `#updated-progress .${PROGRESS_SEGMENT_CLASS}`,
      )
      ?.style.setProperty("width", "90%");
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(lockupFor("updated-progress")?.style.opacity).toBe("0.4");
  });
});
