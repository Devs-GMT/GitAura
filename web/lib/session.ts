import "server-only";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { isProd, requireEnv } from "./env";

export const SESSION_COOKIE = "ga_session";
export const STATE_COOKIE = "ga_state";

const SESSION_TTL_S = 2 * 60 * 60;
const STATE_TTL_S = 10 * 60;

export type Session = { login: string; avatar: string };

function secretKey(): Uint8Array {
  const s = requireEnv("SESSION_SECRET");
  if (s.length < 32) throw new Error("SESSION_SECRET must be at least 32 chars");
  return new TextEncoder().encode(s);
}

/** JWT HS256 `{ sub: login(lowercase), avatar }`, exp 2 jam. */
export async function createSessionToken(login: string, avatar: string): Promise<string> {
  return new SignJWT({ avatar })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(login.toLowerCase())
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_S}s`)
    .sign(secretKey());
}

/** Verifikasi token; null jika tidak ada / tidak valid / kedaluwarsa. */
export async function verifySessionToken(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.avatar !== "string") return null;
    return { login: payload.sub, avatar: payload.avatar };
  } catch {
    return null;
  }
}

export function getSession(req: NextRequest): Promise<Session | null> {
  return verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}

export const sessionCookieOptions = () => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_S,
});

export const stateCookieOptions = () => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: "lax" as const,
  path: "/api/auth",
  maxAge: STATE_TTL_S,
});

/** 32 byte acak, base64url. */
export const newState = () => randomBytes(32).toString("base64url");

export function statesMatch(a: string | undefined | null, b: string | undefined | null): boolean {
  if (!a || !b) return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
