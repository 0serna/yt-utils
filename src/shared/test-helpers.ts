import { vi } from "vitest";
import type { FeatureContext } from "./types";

export function makeFeatureContext(
  overrides: Partial<FeatureContext> = {},
): FeatureContext {
  return {
    sendMessage: vi.fn(),
    logger: {
      activation: vi.fn(),
      deactivation: vi.fn(),
      error: vi.fn(),
    },
    ...overrides,
  };
}
