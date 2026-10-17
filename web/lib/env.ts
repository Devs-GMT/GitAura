import "server-only";

/** Ambil env server wajib; lempar error tanpa membocorkan nilai. */
export function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

/** Origin publik situs, tanpa trailing slash (dipakai untuk redirect_uri & redirect). */
export function siteUrl(fallbackOrigin?: string): string {
  const v = process.env.NEXT_PUBLIC_SITE_URL?.trim() || fallbackOrigin;
  if (!v) throw new Error("Missing env: NEXT_PUBLIC_SITE_URL");
  return v.replace(/\/+$/, "");
}

export function allowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

export const isProd = () => process.env.NODE_ENV === "production";
