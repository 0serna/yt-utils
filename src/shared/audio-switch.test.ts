import { beforeEach, describe, expect, it, vi } from "vitest";

async function importFreshModule() {
  return import("./audio-switch");
}

describe("audio switch flag", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("starts clear", async () => {
    const { isAudioSwitchPending } = await importFreshModule();

    expect(isAudioSwitchPending()).toBe(false);
  });

  it("reports pending after marking", async () => {
    const { isAudioSwitchPending, markAudioSwitchPending } =
      await importFreshModule();

    markAudioSwitchPending();

    expect(isAudioSwitchPending()).toBe(true);
  });

  it("clears a pending switch", async () => {
    const {
      clearAudioSwitchPending,
      isAudioSwitchPending,
      markAudioSwitchPending,
    } = await importFreshModule();

    markAudioSwitchPending();
    clearAudioSwitchPending();

    expect(isAudioSwitchPending()).toBe(false);
  });

  it("shares state between importers", async () => {
    const first = await importFreshModule();
    const second = await import("./audio-switch");

    first.markAudioSwitchPending();

    expect(second.isAudioSwitchPending()).toBe(true);
  });
});
