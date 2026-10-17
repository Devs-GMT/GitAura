import { NextResponse, type NextRequest } from "next/server";
import { checkOrigin } from "@/lib/http";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function POST(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const res = new NextResponse(null, { status: 204 });
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  return res;
}
