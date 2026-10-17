import { NextResponse, type NextRequest } from "next/server";
import { getAddress, isAddress } from "ethers";
import { z } from "zod";
import { ATTEST_TTL_S, attesterWallet, signAttestation } from "@/lib/attest";
import { CHAIN_ID, CONTRACT_ADDRESS } from "@/lib/config";
import { checkOrigin, clientIp, jsonError, readJsonBody } from "@/lib/http";
import { attestLimiter } from "@/lib/ratelimit";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  wallet: z.string().refine((w) => isAddress(w)),
});

export async function POST(req: NextRequest) {
  const forbidden = checkOrigin(req);
  if (forbidden) return forbidden;

  const limit = attestLimiter(clientIp(req));
  if (!limit.ok) {
    return jsonError(429, "RATE_LIMITED", "Too many requests — try again later.", {
      "Retry-After": String(limit.retryAfterS),
    });
  }

  const session = await getSession(req);
  if (!session) return jsonError(401, "NOT_SIGNED_IN", "Sign in with GitHub first.");

  const body = await readJsonBody(req);
  if (!body.ok) return body.res;
  const parsed = bodySchema.safeParse(body.data);
  if (!parsed.success) return jsonError(400, "INVALID_WALLET", "That doesn't look like a wallet address.");
  const wallet = getAddress(parsed.data.wallet);

  let signer;
  try {
    signer = attesterWallet();
    if (!isAddress(CONTRACT_ADDRESS)) throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS not set");
  } catch (err) {
    console.error("[auth/attest]", err instanceof Error ? err.message : "signer error");
    return jsonError(500, "SIGNER_NOT_CONFIGURED", "Signing is not configured on the server.");
  }

  const contract = getAddress(CONTRACT_ADDRESS);
  const expiry = BigInt(Math.floor(Date.now() / 1000) + ATTEST_TTL_S);
  const signature = await signAttestation(
    { username: session.login, wallet, expiry, chainId: BigInt(CHAIN_ID), contract },
    signer,
  );

  return NextResponse.json(
    { username: session.login, wallet, expiry: expiry.toString(), signature, chainId: CHAIN_ID, contract },
    { headers: { "Cache-Control": "no-store" } },
  );
}
