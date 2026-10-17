import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Interface } from "ethers";

const { WALLET, CONTRACT, saveAuraMock } = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_CHAIN_ID = "968";
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = "0x54004efF59C672BB94BD662741589e9Ae6ECFcA8";
  return {
    WALLET: "0x5219fFbF9A44F96A8931A50A31021E4724518735",
    CONTRACT: "0x54004efF59C672BB94BD662741589e9Ae6ECFcA8",
    saveAuraMock: vi.fn(),
  };
});

vi.mock("ethers", async (importOriginal) => {
  const real = await importOriginal<typeof import("ethers")>();
  return {
    ...real,
    BrowserProvider: class {
      async getSigner() {
        return { getAddress: async () => WALLET };
      }
    },
    Contract: class {
      saveAura = saveAuraMock;
    },
  };
});

import { GITAURA_ABI } from "@/lib/abi";
import { COPY } from "@/lib/copy";
import { auraShareUrl, clampBytes, tweetIntentUrl } from "@/lib/share";
import { classifyWalletError, saveAuraOnChain, WalletError } from "@/lib/wallet";

const iface = new Interface(GITAURA_ABI);
const expiredData = iface.encodeErrorResult("ProofExpired", []);

function minedTx(id: bigint, hash = "0xabc") {
  const log = iface.encodeEventLog("AuraSaved", [id, WALLET, "octocat"]);
  return { hash, wait: async () => ({ status: 1, logs: [{ ...log, address: CONTRACT }] }) };
}

const proof = (n: number) => ({ username: "octocat", wallet: WALLET, expiry: String(1000 + n), signature: `0x${"11".repeat(65)}` });

beforeEach(() => {
  vi.stubGlobal("window", { ethereum: { request: vi.fn() } });
  saveAuraMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("classifyWalletError", () => {
  it("detects user rejection from ethers and raw EIP-1193 errors", () => {
    expect(classifyWalletError({ code: "ACTION_REJECTED" })).toBe("rejected");
    expect(classifyWalletError({ code: 4001 })).toBe("rejected");
    expect(classifyWalletError({ info: { error: { code: 4001 } } })).toBe("rejected");
  });

  it("decodes ProofExpired from revert name or raw revert data", () => {
    expect(classifyWalletError({ code: "CALL_EXCEPTION", revert: { name: "ProofExpired" } })).toBe("proof_expired");
    expect(classifyWalletError({ data: expiredData })).toBe("proof_expired");
    expect(classifyWalletError({ info: { error: { data: expiredData } } })).toBe("proof_expired");
    expect(classifyWalletError({ code: "CALL_EXCEPTION", revert: { name: "InvalidProof" } })).toBe("reverted");
    expect(classifyWalletError(new WalletError("wrong_chain"))).toBe("wrong_chain");
    expect(classifyWalletError(new Error("boom"))).toBe("unknown");
  });
});

describe("saveAuraOnChain", () => {
  const input = { title: "T", vibe: "V", topLang: 1 };

  it("returns the id from AuraSaved and reports steps in order", async () => {
    saveAuraMock.mockResolvedValueOnce(minedTx(7n, "0xfeed"));
    const steps: string[] = [];
    const getProof = vi.fn(async () => proof(0));
    const out = await saveAuraOnChain(input, { getProof, onStep: (s) => steps.push(s) });
    expect(out).toEqual({ id: 7n, txHash: "0xfeed" });
    expect(getProof).toHaveBeenCalledWith(WALLET);
    expect(steps).toEqual(["proof", "confirm", "stamping"]);
    expect(saveAuraMock).toHaveBeenCalledWith("octocat", "T", "V", 1, 1000n, proof(0).signature);
  });

  it("ProofExpired → fetches a fresh proof and retries exactly once", async () => {
    saveAuraMock.mockRejectedValueOnce({ code: "CALL_EXCEPTION", revert: { name: "ProofExpired" } }).mockResolvedValueOnce(minedTx(3n));
    let n = 0;
    const getProof = vi.fn(async () => proof(n++));
    const out = await saveAuraOnChain(input, { getProof });
    expect(out.id).toBe(3n);
    expect(getProof).toHaveBeenCalledTimes(2);
    expect(saveAuraMock.mock.calls[1][4]).toBe(1001n); // expiry dari proof baru
  });

  it("gives up after the second ProofExpired", async () => {
    saveAuraMock.mockRejectedValue({ code: "CALL_EXCEPTION", revert: { name: "ProofExpired" } });
    const err = await saveAuraOnChain(input, { getProof: async () => proof(0) }).catch((e) => e);
    expect(classifyWalletError(err)).toBe("proof_expired");
    expect(saveAuraMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry when the user rejects", async () => {
    saveAuraMock.mockRejectedValue({ code: "ACTION_REJECTED" });
    const err = await saveAuraOnChain(input, { getProof: async () => proof(0) }).catch((e) => e);
    expect(classifyWalletError(err)).toBe("rejected");
    expect(saveAuraMock).toHaveBeenCalledTimes(1);
  });

  it("no injected wallet → no_wallet", async () => {
    vi.stubGlobal("window", {});
    const err = await saveAuraOnChain(input, { getProof: async () => proof(0) }).catch((e) => e);
    expect(classifyWalletError(err)).toBe("no_wallet");
  });
});

describe("lib/share", () => {
  it("clampBytes respects UTF-8 bytes without splitting characters", () => {
    expect(clampBytes("hello", 80)).toBe("hello");
    const emoji = "✨".repeat(30); // 3 byte per char = 90 byte
    const out = clampBytes(emoji, 80);
    expect(new TextEncoder().encode(out).length).toBeLessThanOrEqual(80);
    expect(out).toBe("✨".repeat(26));
  });

  it("builds share + tweet URLs with the exact UI_COPY text", () => {
    const url = auraShareUrl(12n, "https://gitaura.xyz");
    expect(url).toBe("https://gitaura.xyz/?aura=12");
    const tweet = new URL(tweetIntentUrl("The Rust Wizard", url));
    expect(tweet.searchParams.get("text")).toBe(COPY.save.tweet("The Rust Wizard", url));
    expect(tweet.searchParams.get("text")).toContain("@BOTChain_ai");
  });
});
