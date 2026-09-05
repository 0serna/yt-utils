import { vi } from "vitest";
import type { FeatureContext } from "./types";

export function requireValue<T>(
  value: T | null | undefined,
  message: string,
): T {
  if (value == null) {
    throw new Error(message);
  }
  return value;
}

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
