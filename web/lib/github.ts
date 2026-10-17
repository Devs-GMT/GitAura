// Stats GitHub publik — dijalankan di BROWSER (tanpa token; kuota per pengunjung). ARCHITECTURE.md §2.
// Hanya ringkasan (`toAuraRequest`) yang dikirim ke server; bio/deskripsi repo tidak pernah dikirim.

const API = "https://api.github.com";

/** Aturan username GitHub: alfanumerik + `-` tunggal di tengah, 1..39 char. */
export const USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function normalizeUsername(input: string): string | null {
  const v = input
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?github\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/.*$/, "");
  return USERNAME_RE.test(v) ? v.toLowerCase() : null;
}

export type GitHubErrorKind = "invalid" | "not_found" | "rate_limited" | "network";

export class GitHubError extends Error {
  constructor(public kind: GitHubErrorKind) {
    super(`github: ${kind}`);
  }
}

type GhUser = {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  created_at: string;
};

type GhRepo = {
  name: string;
  fork: boolean;
  language: string | null;
  stargazers_count: number;
  pushed_at: string | null;
};

export type Activity = "active" | "quiet" | "dormant";

export type GitHubStats = {
  login: string; // lowercase
  displayLogin: string; // casing asli dari GitHub
  name: string | null;
  avatarUrl: string;
  profileUrl: string;
  publicRepos: number;
  followers: number;
  accountAgeYears: number;
  totalStars: number;
  topLanguages: { name: string; share: number }[]; // maks 3, share 0..1
  mostStarred: { name: string; stars: number } | null;
  recentActivity: Activity;
};

/** Body untuk POST /api/aura (API_SPEC). */
export type AuraRequest = {
  login: string;
  name?: string;
  publicRepos: number;
  followers: number;
  accountAgeYears: number;
  totalStars: number;
  topLanguages: { name: string; share: number }[];
  mostStarred: { name: string; stars: number } | null;
  recentActivity: Activity;
};

const DAY_MS = 86_400_000;

/** Agregasi murni (mudah dites). Fork diabaikan untuk bahasa, stars, dan aktivitas. */
export function aggregate(user: GhUser, repos: GhRepo[], now = Date.now()): GitHubStats {
  const own = repos.filter((r) => !r.fork);

  const langCount = new Map<string, number>();
  for (const r of own) if (r.language) langCount.set(r.language, (langCount.get(r.language) ?? 0) + 1);
  const withLang = [...langCount.values()].reduce((a, b) => a + b, 0);
  const topLanguages = [...langCount.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([name, n]) => ({ name, share: Math.round((n / withLang) * 100) / 100 }));

  const totalStars = own.reduce((s, r) => s + r.stargazers_count, 0);
  const best = own.reduce<GhRepo | null>((m, r) => (!m || r.stargazers_count > m.stargazers_count ? r : m), null);
  const mostStarred = best && best.stargazers_count > 0 ? { name: best.name, stars: best.stargazers_count } : null;

  const lastPush = Math.max(0, ...own.map((r) => (r.pushed_at ? Date.parse(r.pushed_at) : 0)));
  const idleDays = lastPush ? (now - lastPush) / DAY_MS : Infinity;
  const recentActivity: Activity = idleDays <= 30 ? "active" : idleDays <= 180 ? "quiet" : "dormant";

  return {
    login: user.login.toLowerCase(),
    displayLogin: user.login,
    name: user.name,
    avatarUrl: user.avatar_url,
    profileUrl: user.html_url,
    publicRepos: user.public_repos,
    followers: user.followers,
    accountAgeYears: Math.max(0, Math.floor((now - Date.parse(user.created_at)) / (365.25 * DAY_MS))),
    totalStars,
    topLanguages,
    mostStarred,
    recentActivity,
  };
}

export function toAuraRequest(s: GitHubStats): AuraRequest {
  return {
    login: s.login,
    ...(s.name ? { name: s.name.slice(0, 60) } : {}),
    publicRepos: s.publicRepos,
    followers: s.followers,
    accountAgeYears: s.accountAgeYears,
    totalStars: s.totalStars,
    topLanguages: s.topLanguages.map((l) => ({ name: l.name.slice(0, 60), share: l.share })),
    mostStarred: s.mostStarred && { name: s.mostStarred.name.slice(0, 60), stars: s.mostStarred.stars },
    recentActivity: s.recentActivity,
  };
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: "application/vnd.github+json" }, signal });
  } catch {
    throw new GitHubError("network");
  }
  if (res.status === 404) throw new GitHubError("not_found");
  if (res.status === 403 || res.status === 429) throw new GitHubError("rate_limited");
  if (!res.ok) throw new GitHubError("network");
  return res.json() as Promise<T>;
}

export async function fetchGitHubStats(input: string, signal?: AbortSignal): Promise<GitHubStats> {
  const username = normalizeUsername(input);
  if (!username) throw new GitHubError("invalid");
  const user = await getJson<GhUser>(`${API}/users/${username}`, signal);
  const repos =
    user.public_repos > 0
      ? await getJson<GhRepo[]>(`${API}/users/${username}/repos?per_page=100&sort=updated`, signal)
      : [];
  return aggregate(user, repos);
}
