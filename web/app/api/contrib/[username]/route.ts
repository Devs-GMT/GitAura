import { NextResponse } from "next/server";
import { fetchContributions } from "@/lib/contrib";
import { normalizeUsername } from "@/lib/github";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

// Data publik (kalender kontribusi) → boleh di-cache CDN; tanpa origin check (GET, tidak memakai secret).
export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const username = normalizeUsername((await params).username);
  if (!username) return jsonError(400, "INVALID_USERNAME", "Enter a GitHub username");
  const weeks = await fetchContributions(username);
  return NextResponse.json(
    { weeks },
    { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } },
  );
}
