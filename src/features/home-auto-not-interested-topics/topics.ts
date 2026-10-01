export function normalizeFilterText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export type TopicSeed = {
  id: string;
  channels: readonly string[];
  keywords: readonly string[];
};

const RAW_TOPIC_SEEDS: readonly TopicSeed[] = [
  {
    id: "clash-royale",
    channels: ["judo sloth", "surgical goblin", "kj maggard", "mamoyan", "ken"],
    keywords: [
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
      "electro wizard",
      "mago electrico",
      "troop",
      "equipment",
    ],
  },
] as const;

export type Topic = {
  id: string;
  channels: readonly string[];
  keywords: readonly string[];
};

export const TOPICS: readonly Topic[] = RAW_TOPIC_SEEDS.map((seed) => ({
  id: seed.id,
  channels: seed.channels.map((entry) => normalizeFilterText(entry)),
  keywords: seed.keywords.map((entry) => normalizeFilterText(entry)),
}));

export function matchesBlockedKeyword(text: string): boolean {
  const normalized = normalizeFilterText(text);
  if (normalized.length === 0) {
    return false;
  }

  return TOPICS.some(
    (topic) =>
      topic.channels.some((channel) => normalized.includes(channel)) ||
      topic.keywords.some((keyword) => normalized.includes(keyword)),
  );
}

export function isBlockedCardText(parts: readonly string[]): boolean {
  return parts.some((part) => matchesBlockedKeyword(part));
}
