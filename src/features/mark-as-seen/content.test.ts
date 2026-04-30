import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isDesktopWatchPage, placeWatchActionHost } from "@shared/youtube-dom";

vi.mock("@shared/youtube-dom", () => ({
  isDesktopWatchPage: vi.fn(() => true),
  placeWatchActionHost: vi.fn((host: HTMLElement) => {
    document.body.appendChild(host);
    return true;
  }),
  delay: vi.fn(() => Promise.resolve()),
  waitFor: vi.fn(),
  RELEVANT_MUTATION_SELECTORS: "ytd-video-primary-info-renderer, #top-row",
}));

vi.mock("@shared/messaging", () => ({
  sendMessage: vi.fn(() => Promise.resolve({ ok: true })),
  MESSAGE_INLINE_TRIGGER: "YT_UTILS_INLINE_TRIGGER",
}));

vi.mock("@shared/extension-button", () => ({
  applyExtensionButtonStyles: vi.fn(),
}));

vi.mock("@shared/bootstrap-icons", () => ({
  getBootstrapIconMarkup: vi.fn(() => "<svg></svg>"),
}));

vi.mock("./content-automation", () => ({
  registerMarkAsSeenAutomationHandler: vi.fn(),
}));

async function importFreshFeature() {
  return import("./content");
}

describe("mark-as-seen content feature", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(isDesktopWatchPage).mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("exports a feature with correct name", async () => {
    const feature = await importFreshFeature();
    expect(feature.default.name).toBe("mark-as-seen");
  });

  it("feature is a watch-page feature", async () => {
    const feature = await importFreshFeature();
    expect(feature.default.isWatchPage).toBe(true);
  });

  it("activate creates inline button host", async () => {
    const feature = await importFreshFeature();
    feature.default.activate({ sendMessage: vi.fn() });

    const host = document.getElementById("yt-utils-inline-host");
    expect(host).not.toBeNull();
    expect(placeWatchActionHost).toHaveBeenCalled();
  });

  it("activate does not create button on non-watch page", async () => {
    vi.mocked(isDesktopWatchPage).mockReturnValue(false);
    const feature = await importFreshFeature();
    feature.default.activate({ sendMessage: vi.fn() });

    const host = document.getElementById("yt-utils-inline-host");
    expect(host).toBeNull();
  });

  it("deactivate removes inline button", async () => {
    const feature = await importFreshFeature();
    feature.default.activate({ sendMessage: vi.fn() });

    const hostBefore = document.getElementById("yt-utils-inline-host");
    expect(hostBefore).not.toBeNull();

    feature.default.deactivate();

    const hostAfter = document.getElementById("yt-utils-inline-host");
    expect(hostAfter).toBeNull();
  });

  it("inline button has correct initial state", async () => {
    const feature = await importFreshFeature();
    feature.default.activate({ sendMessage: vi.fn() });

    const button = document.getElementById(
      "yt-utils-inline-button",
    ) as HTMLButtonElement;
    expect(button).not.toBeNull();
    expect(button.type).toBe("button");
  });

  it("deactivate is idempotent", async () => {
    const feature = await importFreshFeature();
    feature.default.activate({ sendMessage: vi.fn() });
    feature.default.deactivate();
    expect(() => feature.default.deactivate()).not.toThrow();
  });
});
