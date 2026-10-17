import "server-only";
import { z } from "zod";
import { requireEnv } from "./env";

const TIMEOUT_MS = 8000;

const tokenSchema = z.object({ access_token: z.string().min(1) });
const userSchema = z.object({ login: z.string().min(1).max(39), avatar_url: z.url() });

export const authorizeUrl = (clientId: string, redirectUri: string, state: string) => {
  const u = new URL("https://github.com/login/oauth/authorize");
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("state", state);
  u.searchParams.set("allow_signup", "true");
  // Tanpa `scope` → hanya data publik.
  return u.toString();
};

/**
 * Tukar `code` → access token → `GET /user`. Token hanya hidup di dalam fungsi ini:
 * tidak dikembalikan, tidak disimpan, tidak di-log (aturan keras #2).
 */
export async function fetchGitHubIdentity(code: string, redirectUri: string) {
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: requireEnv("GITHUB_CLIENT_ID"),
      client_secret: requireEnv("GITHUB_CLIENT_SECRET"),
      code,
      redirect_uri: redirectUri,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!tokenRes.ok) throw new Error(`token exchange failed (${tokenRes.status})`);
  // GitHub membalas 200 + `{ error }` untuk code tidak valid → gagal parse di sini.
  const token = tokenSchema.safeParse(await tokenRes.json());
  if (!token.success) throw new Error("token exchange rejected");

  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token.data.access_token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "GitAura",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!userRes.ok) throw new Error(`user fetch failed (${userRes.status})`);
  const user = userSchema.safeParse(await userRes.json());
  if (!user.success) throw new Error("unexpected user payload");

  return { login: user.data.login.toLowerCase(), avatar: user.data.avatar_url };
}
