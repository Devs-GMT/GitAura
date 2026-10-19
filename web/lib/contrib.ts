import "server-only";
import { USERNAME_RE } from "./github";

// Kalender kontribusi publik GitHub (grid hijau di profil). Tidak ada di REST API tanpa token,
// jadi diambil dari halaman publik `github.com/users/{u}/contributions` di SERVER (tanpa CORS)
// dan di-cache. Best-effort: format HTML bisa berubah → null → banner kembali ke warna solid.

export type ContribWeeks = number[][]; // [minggu][hari 0=Min..6=Sab] → level 0..4, -1 = di luar rentang

const REVALIDATE_S = 6 * 60 * 60;
const CELL_RE = /<td\b[^>]*?data-date="(\d{4}-\d{2}-\d{2})"[^>]*?data-level="([0-4])"/g;

/** Parse HTML kalender → minggu (kolom) × 7 hari, urut lama → baru. */
export function parseContributions(html: string): ContribWeeks | null {
  const days: { t: number; level: number }[] = [];
  for (const m of html.matchAll(CELL_RE)) days.push({ t: Date.parse(`${m[1]}T00:00:00Z`), level: Number(m[2]) });
  if (days.length < 7) return null;
  days.sort((a, b) => a.t - b.t);

  const DAY = 86_400_000;
  const first = days[0].t - new Date(days[0].t).getUTCDay() * DAY; // Minggu pada minggu pertama
  const weeks: ContribWeeks = [];
  for (const d of days) {
    const col = Math.floor((d.t - first) / (7 * DAY));
    weeks[col] ??= Array(7).fill(-1);
    weeks[col][new Date(d.t).getUTCDay()] = d.level;
  }
  return weeks.map((w) => w ?? Array(7).fill(-1));
}

export async function fetchContributions(username: string): Promise<ContribWeeks | null> {
  const u = username.toLowerCase();
  if (!USERNAME_RE.test(u)) return null;
  try {
    const res = await fetch(`https://github.com/users/${u}/contributions`, {
      headers: { Accept: "text/html", "User-Agent": "GitAura" },
      next: { revalidate: REVALIDATE_S },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return parseContributions(await res.text());
  } catch {
    return null;
  }
}
