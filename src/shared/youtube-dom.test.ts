import { afterEach, describe, expect, it, vi } from "vitest";
import { findButton } from "./youtube-dom";

function appendVisibleButton(label: string, text = label): HTMLButtonElement {
  const button = document.createElement("button");
  button.setAttribute("aria-label", label);
  button.textContent = text;
  vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
    width: 100,
    height: 40,
  } as DOMRect);
  document.body.appendChild(button);
  return button;
}

describe("findButton", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("matches an exact label when aria-label and text repeat", () => {
    const button = appendVisibleButton("Ask");

    expect(findButton(document, [/^ask$/i])).toBe(button);
  });

  it("matches an exact label when aria-label and text differ by whitespace", () => {
    const button = appendVisibleButton("Ask", "Ask ");

    expect(findButton(document, [/^ask$/i])).toBe(button);
  });
});
