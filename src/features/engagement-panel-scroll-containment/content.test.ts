import { makeFeatureContext } from "@shared/test-helpers";
import type { Feature } from "@shared/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function makeScrollable(
  element: HTMLElement,
  width: number,
  height: number,
): void {
  element.style.overflowY = "auto";
  Object.defineProperty(element, "clientWidth", {
    configurable: true,
    get: () => width,
  });
  Object.defineProperty(element, "clientHeight", {
    configurable: true,
    get: () => height,
  });
  Object.defineProperty(element, "scrollHeight", {
    configurable: true,
    get: () => height + 100,
  });
  element.getBoundingClientRect = () => ({ width, height }) as DOMRect;
}

describe("engagement-panel-scroll-containment", () => {
  let activeFeature: Feature | null = null;

  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    document.body.innerHTML = "";

    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        href: "https://www.youtube.com/watch?v=test-video",
        hostname: "www.youtube.com",
        pathname: "/watch",
        search: "?v=test-video",
      },
    });
  });

  afterEach(() => {
    activeFeature?.deactivate();
    activeFeature = null;
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("revalidates a cached scroll container after the panel changes", async () => {
    const panel = document.createElement(
      "ytd-engagement-panel-section-list-renderer",
    );
    panel.setAttribute("visibility", "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED");

    const first = document.createElement("div");
    const second = document.createElement("div");
    panel.append(first, second);
    document.body.append(panel);
    makeScrollable(first, 1000, 300);
    makeScrollable(second, 200, 200);

    const { default: feature } = await import("./content");
    activeFeature = feature;
    feature.activate(makeFeatureContext());
    await vi.advanceTimersByTimeAsync(500);

    expect(first.style.overscrollBehaviorY).toBe("contain");
    expect(second.style.overscrollBehaviorY).toBe("");

    makeScrollable(first, 100, 130);
    makeScrollable(second, 1000, 300);
    panel.append(document.createElement("div"));
    await vi.advanceTimersByTimeAsync(500);

    expect(second.style.overscrollBehaviorY).toBe("contain");
  });
});
