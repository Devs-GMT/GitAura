import "server-only";
import type { Metadata } from "next";
import { cache } from "react";
import { getAuraById, parseAuraId, type OnchainAura } from "./chain";
import { COPY } from "./copy";

export type AuraLoad = { aura: OnchainAura | null; failed: boolean };

/** Satu RPC per request untuk metadata + halaman. RPC error ≠ "not found". */
export const loadAura = cache(async (raw: string | string[] | undefined): Promise<AuraLoad> => {
  const id = parseAuraId(raw);
  if (id === null) return { aura: null, failed: false };
  try {
    return { aura: await getAuraById(id), failed: false };
  } catch {
    return { aura: null, failed: true };
  }
});

/** Metadata OG per aura: judul = title aura (UI_COPY §Meta). */
export function auraMetadata({ aura }: AuraLoad, path: string): Metadata {
  if (!aura) return { title: `${COPY.errors.auraNotFound} · GitAura`, robots: { index: false } };
  const title = COPY.meta.ogAura(aura.title, aura.username);
  return {
    title,
    description: aura.vibe,
    alternates: { canonical: path },
    openGraph: { title, description: aura.vibe, url: path, siteName: "GitAura", type: "profile" },
    twitter: { card: "summary", title, description: aura.vibe },
  };
}
