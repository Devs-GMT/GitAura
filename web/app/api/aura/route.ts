import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { generateAura } from "@/lib/ai";
import { checkOrigin, clientIp, jsonError, readJsonBody } from "@/lib/http";
import { auraLimiter } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const str60 = z.string().trim().min(1).max(60);
const count = z.number().int().min(0).max(100_000_000);

// Hanya ringkasan stats (API_SPEC). Field lain dibuang oleh zod → tidak pernah sampai ke prompt.
const statsSchema = z.object({
  login: z.string().regex(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/),
  name: str60.optional(),
  publicRepos: count,
  followers: count,
  accountAgeYears: z.number().int().min(0).max(100),
  totalStars: count,
  topLanguages: z.array(z.object({ name: str60, share: z.number().min(0).max(1) })).max(3),
  mostStarred: z.object({ name: str60, stars: count }).nullable(),
  recentActivity: z.enum(["active", "quiet", "dormant"]),
});

export async function POST(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const limit = auraLimiter(clientIp(req));
  if (!limit.ok) {
    return jsonError(429, "RATE_LIMITED", "Too many requests — try again later.", {
      "Retry-After": String(limit.retryAfterS),
    });
  }

  const body = await readJsonBody(req);
  if (!body.ok) return body.res;
  const parsed = statsSchema.safeParse(body.data);
  if (!parsed.success) return jsonError(400, "INVALID_STATS", "Stats summary is invalid.");

  const aura = await generateAura(parsed.data);
  return NextResponse.json(aura, { headers: { "Cache-Control": "no-store" } });
}
