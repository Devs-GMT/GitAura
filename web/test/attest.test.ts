import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { Wallet, getBytes, verifyMessage } from "ethers";

// config.ts membaca NEXT_PUBLIC_* saat modul dimuat → set sebelum import.
const { CONTRACT, ATTESTER_PK } = vi.hoisted(() => {
  const CONTRACT = "0x54004efF59C672BB94BD662741589e9Ae6ECFcA8";
  // Key tes publik (anvil #0) — bukan secret.
  const ATTESTER_PK = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  process.env.NEXT_PUBLIC_CHAIN_ID = "968";
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = CONTRACT;
  return { CONTRACT, ATTESTER_PK };
});

import { attestDigest, signAttestation } from "@/lib/attest";
import { createRateLimiter } from "@/lib/ratelimit";
import { createSessionToken } from "@/lib/session";
import { POST as attest } from "@/app/api/auth/attest/route";

const SITE = "http://localhost:3000";
const ATTESTER = new Wallet(ATTESTER_PK).address;
const USER_WALLET = "0x5219fFbF9A44F96A8931A50A31021E4724518735";

beforeEach(() => {
  vi.stubEnv("SESSION_SECRET", "test-session-secret-0123456789-abcdefghij");
  vi.stubEnv("ATTESTER_PRIVATE_KEY", ATTESTER_PK);
  vi.stubEnv("ALLOWED_ORIGINS", SITE);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

let ipCounter = 0;
async function call(opts: { body?: string; session?: string | null; origin?: string | null; ip?: string } = {}) {
  const headers = new Headers({ "content-type": "application/json" });
  if (opts.origin !== null) headers.set("origin", opts.origin ?? SITE);
  headers.set("x-forwarded-for", opts.ip ?? `10.0.0.${++ipCounter}`);
  const session = opts.session === undefined ? await createSessionToken("OctoCat", "https://a/x.png") : opts.session;
  if (session) headers.set("cookie", `ga_session=${session}`);
  return attest(
    new NextRequest(`${SITE}/api/auth/attest`, {
      method: "POST",
      headers,
      body: opts.body ?? JSON.stringify({ wallet: USER_WALLET.toLowerCase() }),
    }),
  );
}

describe("lib/attest", () => {
  it("digest matches the Solidity abi.encode layout (cast vector)", () => {
    // cast keccak $(cast abi-encode "f(string,address,uint64,uint256,address)" octocat <wallet> 1760700000 968 <contract>)
    expect(attestDigest("octocat", USER_WALLET, 1760700000n, 968n, CONTRACT)).toBe(
      "0x36b267c0866fcff09fae472ff4f56093e36ae4d58916bd00e5a0866c3d12c0bd",
    );
  });

  it("signature recovers to the attester via EIP-191", async () => {
    const input = { username: "octocat", wallet: USER_WALLET, expiry: 1760700000n, chainId: 968n, contract: CONTRACT };
    const sig = await signAttestation(input);
    const digest = attestDigest(input.username, input.wallet, input.expiry, input.chainId, input.contract);
    expect(verifyMessage(getBytes(digest), sig)).toBe(ATTESTER);
    // Field lain → signer berbeda
    const other = attestDigest("octocat", USER_WALLET, 1760700000n, 677n, CONTRACT);
    expect(verifyMessage(getBytes(other), sig)).not.toBe(ATTESTER);
  });

  it("refuses non-lowercase usernames", async () => {
    await expect(
      signAttestation({ username: "OctoCat", wallet: USER_WALLET, expiry: 1n, chainId: 968n, contract: CONTRACT }),
    ).rejects.toThrow(/lowercase/);
  });
});

describe("lib/ratelimit", () => {
  it("allows `limit` hits per window then returns Retry-After", () => {
    const hit = createRateLimiter(3, 60_000);
    const t = 1_000_000;
    expect([hit("a", t), hit("a", t), hit("a", t)].every((r) => r.ok)).toBe(true);
    expect(hit("a", t + 1000)).toEqual({ ok: false, retryAfterS: 59 });
    expect(hit("b", t).ok).toBe(true);
    expect(hit("a", t + 60_000).ok).toBe(true);
  });
});

describe("POST /api/auth/attest", () => {
  it("200: signs session login for the checksummed wallet; signature verifies", async () => {
    const before = Math.floor(Date.now() / 1000);
    const res = await call();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(body).toMatchObject({ username: "octocat", wallet: USER_WALLET, chainId: 968, contract: CONTRACT });
    expect(typeof body.expiry).toBe("string");
    expect(Number(body.expiry) - before).toBeGreaterThanOrEqual(600);
    expect(Number(body.expiry) - before).toBeLessThanOrEqual(601);

    const digest = attestDigest(body.username, body.wallet, BigInt(body.expiry), BigInt(body.chainId), body.contract);
    expect(verifyMessage(getBytes(digest), body.signature)).toBe(ATTESTER);
  });

  it("401 NOT_SIGNED_IN without a valid session", async () => {
    for (const session of [null, "garbage"]) {
      const res = await call({ session });
      expect(res.status).toBe(401);
      expect((await res.json()).error.code).toBe("NOT_SIGNED_IN");
    }
  });

  it.each([
    ["not an address", JSON.stringify({ wallet: "0x123" })],
    ["missing field", JSON.stringify({})],
    ["bad checksum", JSON.stringify({ wallet: "0x5219FFBF9A44F96A8931A50A31021E4724518735".replace("F9A", "f9A") })],
  ])("400 INVALID_WALLET: %s", async (_n, body) => {
    const res = await call({ body });
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("INVALID_WALLET");
  });

  it("400 INVALID_JSON and 413 BODY_TOO_LARGE", async () => {
    expect((await call({ body: "{nope" })).status).toBe(400);
    const big = await call({ body: JSON.stringify({ wallet: USER_WALLET, pad: "x".repeat(5000) }) });
    expect(big.status).toBe(413);
    expect((await big.json()).error.code).toBe("BODY_TOO_LARGE");
  });

  it.each([["https://evil.example"], [null]])("403 FORBIDDEN_ORIGIN for origin %s", async (origin) => {
    const res = await call({ origin });
    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe("FORBIDDEN_ORIGIN");
  });

  it("429 RATE_LIMITED after 20 requests per IP, with Retry-After", async () => {
    const ip = "203.0.113.7";
    for (let i = 0; i < 20; i++) expect((await call({ ip })).status).toBe(200);
    const res = await call({ ip });
    expect(res.status).toBe(429);
    expect((await res.json()).error.code).toBe("RATE_LIMITED");
    expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  it("500 SIGNER_NOT_CONFIGURED when the attester key is missing", async () => {
    vi.stubEnv("ATTESTER_PRIVATE_KEY", "");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await call();
    expect(res.status).toBe(500);
    expect((await res.json()).error.code).toBe("SIGNER_NOT_CONFIGURED");
  });
});
