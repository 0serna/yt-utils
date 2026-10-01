const cardIdentityKeys = new WeakMap<HTMLElement, string>();
let nextIdentityKey = 0;

function getCardIdentityKey(card: HTMLElement): string {
  const existingKey = cardIdentityKeys.get(card);
  if (existingKey) {
    return existingKey;
  }

  nextIdentityKey += 1;
  const nextKey = `card-${nextIdentityKey}`;
  cardIdentityKeys.set(card, nextKey);
  return nextKey;
}

function readVideoIdFromHref(href: string): string | null {
  let url: URL;
  try {
    url = new URL(href, "https://www.youtube.com");
  } catch {
    return null;
  }

  if (url.pathname === "/watch") {
    const videoId = url.searchParams.get("v");
    return videoId && videoId.length > 0 ? videoId : null;
  }

  const segments = url.pathname
    .split("/")
    .filter((segment) => segment.length > 0);
  if (
    segments.length === 2 &&
    (segments[0] === "shorts" || segments[0] === "live")
  ) {
    return segments[1] ?? null;
  }

  return null;
}

export function readCardVideoId(card: HTMLElement): string | null {
  const anchors = card.querySelectorAll<HTMLAnchorElement>("a[href]");

  for (const anchor of anchors) {
    const videoId = readVideoIdFromHref(anchor.getAttribute("href") ?? "");
    if (videoId) {
      return videoId;
    }
  }

  return null;
}

export function readCardKey(card: HTMLElement): string {
  return readCardVideoId(card) ?? getCardIdentityKey(card);
}
