import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/lib/http";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return jsonError(401, "NOT_SIGNED_IN", "Sign in with GitHub first.", NO_STORE);
  return NextResponse.json(session, { headers: NO_STORE });
}
