// Aura tanpa AI: template "The {Lang} {Builder|Explorer|Wizard}" (PRD) dan "Fresh account" (UI_COPY).
// Aman untuk client & server.

export type AuraText = { title: string; vibe: string; traits: [string, string, string] };

export type AuraStatsLike = {
  publicRepos: number;
  totalStars: number;
  topLanguages: { name: string }[];
};

/** UI_COPY §Aura card — akun dengan 0 repo publik. */
export const FRESH_AURA: AuraText = {
  title: "The Fresh Account",
  vibe: "A blank canvas with main-character energy.",
  traits: ["Just getting started", "Full of potential", "First commit loading"],
};

const ARCHETYPES = {
  Wizard: {
    vibe: (lang: string) => `Casts ${lang} spells that other developers keep starring.`,
    traits: ["Star magnet", "Quietly brilliant", "Open-source heart"],
  },
  Builder: {
    vibe: (lang: string) => `Ships ${lang} project after project and keeps the momentum going.`,
    traits: ["Serial shipper", "Hands-on maker", "Always building"],
  },
  Explorer: {
    vibe: (lang: string) => `Wanders through ${lang} with curiosity and a fresh repo for every idea.`,
    traits: ["Curious mind", "Idea collector", "Learning in public"],
  },
} as const;

/** Archetype deterministik dari stats: banyak stars → Wizard, banyak repo → Builder, selain itu Explorer. */
export function archetypeFor(s: AuraStatsLike): keyof typeof ARCHETYPES {
  if (s.totalStars >= 100) return "Wizard";
  if (s.publicRepos >= 20) return "Builder";
  return "Explorer";
}

export function fallbackAura(s: AuraStatsLike): AuraText {
  if (s.publicRepos === 0) return FRESH_AURA;
  const lang = s.topLanguages[0]?.name ?? "Code";
  const kind = archetypeFor(s);
  const a = ARCHETYPES[kind];
  return {
    title: `The ${lang} ${kind}`.slice(0, 80),
    vibe: a.vibe(lang === "Code" ? "code" : lang).slice(0, 160),
    traits: [...a.traits],
  };
}
