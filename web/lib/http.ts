import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { allowedOrigins } from "./env";

/** Format error API: `{ error: { code, message } }` (docs/API_SPEC.md). */
export function jsonError(status: number, code: string, message: string, headers?: HeadersInit) {
  return NextResponse.json({ error: { code, message } }, { status, headers });
}

export const MAX_BODY_BYTES = 4096;

/** IP klien: entri pertama `x-forwarded-for` (di-set Vercel), fallback `x-real-ip`. */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Baca body JSON dengan batas 4 KB. `{ ok:false, res }` berisi response 413/400 siap kembali. */
export async function readJsonBody(
  req: NextRequest,
): Promise<{ ok: true; data: unknown } | { ok: false; res: NextResponse }> {
  const tooLarge = () => ({ ok: false as const, res: jsonError(413, "BODY_TOO_LARGE", "Request body is too large.") });
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return tooLarge();
  const text = await req.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return tooLarge();
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false, res: jsonError(400, "INVALID_JSON", "Request body must be valid JSON.") };
  }
}

/** POST wajib datang dari origin di ALLOWED_ORIGINS. Mengembalikan response 403 atau null jika lolos. */
export function checkOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin")?.replace(/\/+$/, "");
  if (origin && allowedOrigins().includes(origin)) return null;
  return jsonError(403, "FORBIDDEN_ORIGIN", "Request origin is not allowed.");
}
