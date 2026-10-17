import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { siteUrl } from "@/lib/env";
import { fetchGitHubIdentity } from "@/lib/oauth";
import {
  SESSION_COOKIE,
  STATE_COOKIE,
  createSessionToken,
  sessionCookieOptions,
  stateCookieOptions,
  statesMatch,
} from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  code: z.string().min(1).max(256),
  state: z.string().min(1).max(256),
});

function finish(base: string, outcome: "ok" | "failed") {
  const res = NextResponse.redirect(`${base}/?login=${outcome}`);
  res.cookies.set(STATE_COOKIE, "", { ...stateCookieOptions(), maxAge: 0 });
  return res;
}

export async function GET(req: NextRequest) {
  const base = siteUrl(req.nextUrl.origin);
  const params = req.nextUrl.searchParams;

  // User batal (`error=access_denied`), parameter hilang, atau state tidak cocok → gagal.
  const query = querySchema.safeParse({ code: params.get("code"), state: params.get("state") });
  if (params.has("error") || !query.success) return finish(base, "failed");
  if (!statesMatch(query.data.state, req.cookies.get(STATE_COOKIE)?.value)) return finish(base, "failed");

  try {
    const { login, avatar } = await fetchGitHubIdentity(query.data.code, `${base}/api/auth/github/callback`);
    const res = finish(base, "ok");
    res.cookies.set(SESSION_COOKIE, await createSessionToken(login, avatar), sessionCookieOptions());
    return res;
  } catch (err) {
    // Hanya pesan generik — jangan log code/token.
    console.error("[auth/callback] sign-in failed:", err instanceof Error ? err.message : "unknown");
    return finish(base, "failed");
  }
}
