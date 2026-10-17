import { NextResponse, type NextRequest } from "next/server";
import { requireEnv, siteUrl } from "@/lib/env";
import { authorizeUrl } from "@/lib/oauth";
import { STATE_COOKIE, newState, stateCookieOptions } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const base = siteUrl(req.nextUrl.origin);
  let clientId: string;
  try {
    clientId = requireEnv("GITHUB_CLIENT_ID");
  } catch {
    return NextResponse.redirect(`${base}/?login=failed`);
  }

  const state = newState();
  const res = NextResponse.redirect(authorizeUrl(clientId, `${base}/api/auth/github/callback`, state));
  res.cookies.set(STATE_COOKIE, state, stateCookieOptions());
  return res;
}
