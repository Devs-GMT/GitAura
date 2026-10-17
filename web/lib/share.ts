import { COPY } from "./copy";

/** Origin publik: NEXT_PUBLIC_SITE_URL, atau origin browser saat dev. */
export function siteOrigin(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (env) return env.replace(/\/+$/, "");
  return typeof window !== "undefined" ? window.location.origin : "";
}

/** Link share satu kartu (dibuka read-only di Fase 8). */
export const auraShareUrl = (id: bigint | number | string, origin = siteOrigin()) => `${origin}/?aura=${id}`;

export const tweetIntentUrl = (title: string, url: string) =>
  `https://twitter.com/intent/tweet?text=${encodeURIComponent(COPY.save.tweet(title, url))}`;

/**
 * Potong string agar ≤ `maxBytes` UTF-8 (kontrak mengukur byte, bukan karakter) tanpa memotong
 * di tengah karakter multi-byte/emoji.
 */
export function clampBytes(s: string, maxBytes: number): string {
  const enc = new TextEncoder();
  if (enc.encode(s).length <= maxBytes) return s;
  let out = "";
  for (const ch of s) {
    if (enc.encode(out + ch).length > maxBytes) break;
    out += ch;
  }
  return out.trimEnd();
}
