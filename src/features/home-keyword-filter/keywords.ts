export function normalizeFilterText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const RAW_BLOCKED_KEYWORDS = [
  "clash",
  "clash royale",
  "clashroyale",
  "#clashroyale",
  "クラロワ",
  "클래시로얄",
  "beniju",
  "benijugoso",
  "balegg",
  "mazo",
  "mazos",
  "gigante noble",
  "montapuerc",
  "supercell",
] as const;

export const BLOCKED_KEYWORDS: readonly string[] = RAW_BLOCKED_KEYWORDS.map(
  (keyword) => normalizeFilterText(keyword),
);

export function matchesBlockedKeyword(text: string): boolean {
  const normalized = normalizeFilterText(text);
  if (normalized.length === 0) {
    return false;
  }

  return BLOCKED_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function isBlockedCardText(parts: readonly string[]): boolean {
  return parts.some((part) => matchesBlockedKeyword(part));
}
