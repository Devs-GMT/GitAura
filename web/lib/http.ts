import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { allowedOrigins } from "./env";

/** Format error API: `{ error: { code, message } }` (docs/API_SPEC.md). */
export function jsonError(status: number, code: string, message: string, headers?: HeadersInit) {
  return NextResponse.json({ error: { code, message } }, { status, headers });
}

/** POST wajib datang dari origin di ALLOWED_ORIGINS. Mengembalikan response 403 atau null jika lolos. */
export function checkOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin")?.replace(/\/+$/, "");
  if (origin && allowedOrigins().includes(origin)) return null;
  return jsonError(403, "FORBIDDEN_ORIGIN", "Request origin is not allowed.");
}
