import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { SignJWT } from "jose";
import { GET as login } from "@/app/api/auth/github/login/route";
import { GET as callback } from "@/app/api/auth/github/callback/route";
import { GET as me } from "@/app/api/auth/me/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { createSessionToken, verifySessionToken } from "@/lib/session";

const SITE = "http://localhost:3000";
const SECRET = "test-session-secret-0123456789-abcdefghij";
const FAKE_TOKEN = "gho_FAKE_TOKEN_SHOULD_NEVER_LEAK";

function req(path: string, init: { method?: string; cookies?: Record<string, string>; origin?: string } = {}) {
  const headers = new Headers();
  if (init.cookies) {
    headers.set("cookie", Object.entries(init.cookies).map(([k, v]) => `${k}=${v}`).join("; "));
  }
  if (init.origin) headers.set("origin", init.origin);
  return new NextRequest(new URL(path, SITE), { method: init.method ?? "GET", headers });
}

function mockGitHub(user: unknown = { login: "OctoCat", avatar_url: "https://avatars.githubusercontent.com/u/1" }) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith("https://github.com/login/oauth/access_token")) {
      return Response.json({ access_token: FAKE_TOKEN, token_type: "bearer", scope: "" });
    }
    if (url === "https://api.github.com/user") return Response.json(user);
    throw new Error(`unexpected fetch ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.stubEnv("SESSION_SECRET", SECRET);
  vi.stubEnv("GITHUB_CLIENT_ID", "test-client-id");
  vi.stubEnv("GITHUB_CLIENT_SECRET", "test-client-secret");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", SITE);
  vi.stubEnv("ALLOWED_ORIGINS", SITE);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("session token", () => {
  it("round-trips and lowercases login", async () => {
    const t = await createSessionToken("OctoCat", "https://a/x.png");
    expect(await verifySessionToken(t)).toEqual({ login: "octocat", avatar: "https://a/x.png" });
  });

  it("rejects tampered, wrong-secret, expired and missing tokens", async () => {
    const t = await createSessionToken("octocat", "https://a/x.png");
    const [h, p, s] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "admin", avatar: "x" })).toString("base64url");
    expect(await verifySessionToken(`${h}.${forged}.${s}`)).toBeNull();
    expect(await verifySessionToken(`${h}.${p}.${s.slice(0, -2)}AA`)).toBeNull();

    const otherKey = new TextEncoder().encode("another-secret-that-is-long-enough-123");
    const wrong = await new SignJWT({ avatar: "x" }).setProtectedHeader({ alg: "HS256" }).setSubject("a").sign(otherKey);
    expect(await verifySessionToken(wrong)).toBeNull();

    const expired = await new SignJWT({ avatar: "x" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("a")
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(new TextEncoder().encode(SECRET));
    expect(await verifySessionToken(expired)).toBeNull();
    expect(await verifySessionToken(undefined)).toBeNull();
  });

  it("refuses a short SESSION_SECRET", async () => {
    vi.stubEnv("SESSION_SECRET", "short");
    await expect(createSessionToken("a", "b")).rejects.toThrow(/at least 32/);
  });
});

describe("GET /api/auth/github/login", () => {
  it("redirects to GitHub with state, redirect_uri and no scope; sets ga_state", () => {
    const res = login(req("/api/auth/github/login"));
    expect(res.status).toBe(307);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.origin + loc.pathname).toBe("https://github.com/login/oauth/authorize");
    expect(loc.searchParams.get("client_id")).toBe("test-client-id");
    expect(loc.searchParams.get("redirect_uri")).toBe(`${SITE}/api/auth/github/callback`);
    expect(loc.searchParams.has("scope")).toBe(false);

    const state = res.cookies.get("ga_state");
    expect(state?.value).toBe(loc.searchParams.get("state"));
    expect(state?.value).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(state?.httpOnly).toBe(true);
    expect(state?.path).toBe("/api/auth");
    expect(state?.sameSite).toBe("lax");
  });
});

describe("GET /api/auth/github/callback", () => {
  it("success: sets ga_session (lowercase login), clears state, never exposes the token", async () => {
    const fetchMock = mockGitHub();
    const res = await callback(req("/api/auth/github/callback?code=abc&state=S1", { cookies: { ga_state: "S1" } }));

    expect(res.headers.get("location")).toBe(`${SITE}/?login=ok`);
    expect(res.cookies.get("ga_state")?.value).toBe("");
    const session = res.cookies.get("ga_session");
    expect(session?.httpOnly).toBe(true);
    expect(session?.path).toBe("/");
    expect(await verifySessionToken(session?.value)).toEqual({
      login: "octocat",
      avatar: "https://avatars.githubusercontent.com/u/1",
    });

    // Token hanya dipakai untuk GET /user, tidak muncul di response mana pun.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const raw = JSON.stringify([...res.headers.entries()]);
    expect(raw).not.toContain(FAKE_TOKEN);
    expect(session?.value).not.toContain(FAKE_TOKEN);
  });

  it.each([
    ["state tampered", "/api/auth/github/callback?code=abc&state=EVIL", { ga_state: "S1" }],
    ["state cookie missing", "/api/auth/github/callback?code=abc&state=S1", undefined],
    ["user cancelled", "/api/auth/github/callback?error=access_denied&state=S1", { ga_state: "S1" }],
    ["code missing", "/api/auth/github/callback?state=S1", { ga_state: "S1" }],
  ])("%s → /?login=failed without calling GitHub", async (_name, path, cookies) => {
    const fetchMock = mockGitHub();
    const res = await callback(req(path, { cookies }));
    expect(res.headers.get("location")).toBe(`${SITE}/?login=failed`);
    expect(res.cookies.get("ga_session")).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("GitHub rejects the code → /?login=failed", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: "bad_verification_code" })));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await callback(req("/api/auth/github/callback?code=bad&state=S1", { cookies: { ga_state: "S1" } }));
    expect(res.headers.get("location")).toBe(`${SITE}/?login=failed`);
    expect(res.cookies.get("ga_session")).toBeUndefined();
  });
});

describe("GET /api/auth/me", () => {
  it("returns { login, avatar } with a valid session", async () => {
    const token = await createSessionToken("OctoCat", "https://a/x.png");
    const res = await me(req("/api/auth/me", { cookies: { ga_session: token } }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ login: "octocat", avatar: "https://a/x.png" });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("401 NOT_SIGNED_IN without / with invalid session", async () => {
    for (const cookies of [undefined, { ga_session: "garbage" }]) {
      const res = await me(req("/api/auth/me", { cookies }));
      expect(res.status).toBe(401);
      expect((await res.json()).error.code).toBe("NOT_SIGNED_IN");
    }
  });
});

describe("POST /api/auth/logout", () => {
  it("204 and clears ga_session for an allowed origin", () => {
    const res = logout(req("/api/auth/logout", { method: "POST", origin: SITE }));
    expect(res.status).toBe(204);
    const c = res.cookies.get("ga_session");
    expect(c?.value).toBe("");
    expect(c?.maxAge).toBe(0);
  });

  it.each([["https://evil.example"], [undefined]])("403 FORBIDDEN_ORIGIN for origin %s", async (origin) => {
    const res = logout(req("/api/auth/logout", { method: "POST", origin }));
    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe("FORBIDDEN_ORIGIN");
  });
});
