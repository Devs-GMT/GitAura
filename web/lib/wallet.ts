// MetaMask / EIP-1193 + kontrak GitAura (client only). Chain & alamat dari lib/config (aturan #5).
import { BrowserProvider, Contract, Interface, getAddress, type Eip1193Provider } from "ethers";
import { GITAURA_ABI } from "./abi";
import { CHAIN, CONTRACT_ADDRESS } from "./config";

export type InjectedProvider = Eip1193Provider & {
  on?: (event: string, cb: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, cb: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: InjectedProvider;
  }
}

export const getInjected = (): InjectedProvider | null =>
  typeof window !== "undefined" && window.ethereum ? window.ethereum : null;

export const CHAIN_HEX = `0x${CHAIN.id.toString(16)}`;

const iface = new Interface(GITAURA_ABI);

// ---------- klasifikasi error ----------

export type WalletErrorKind = "no_wallet" | "rejected" | "wrong_chain" | "proof_expired" | "reverted" | "unknown";

export class WalletError extends Error {
  constructor(public kind: WalletErrorKind, message: string = kind) {
    super(message);
  }
}

type AnyErr = {
  code?: unknown;
  data?: unknown;
  revert?: { name?: string } | null;
  info?: { error?: { code?: unknown; data?: unknown } };
  error?: { code?: unknown; data?: unknown };
};

function revertName(e: AnyErr): string | null {
  if (e.revert?.name) return e.revert.name;
  for (const d of [e.data, e.info?.error?.data, e.error?.data]) {
    const hex = typeof d === "string" ? d : typeof (d as { data?: unknown })?.data === "string" ? (d as { data: string }).data : null;
    if (hex?.startsWith("0x") && hex.length >= 10) {
      try {
        return iface.parseError(hex)?.name ?? null;
      } catch {
        /* bukan error kontrak */
      }
    }
  }
  return null;
}

/** Petakan error ethers/MetaMask ke kategori yang punya teks di UI_COPY. */
export function classifyWalletError(err: unknown): WalletErrorKind {
  if (err instanceof WalletError) return err.kind;
  const e = (err ?? {}) as AnyErr;
  const codes = [e.code, e.info?.error?.code, e.error?.code];
  if (codes.includes("ACTION_REJECTED") || codes.includes(4001)) return "rejected";
  const name = revertName(e);
  if (name === "ProofExpired") return "proof_expired";
  if (name || e.code === "CALL_EXCEPTION") return "reverted";
  return "unknown";
}

// ---------- koneksi & chain ----------

export async function requestAccount(): Promise<string> {
  const eth = getInjected();
  if (!eth) throw new WalletError("no_wallet");
  const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts?.[0]) throw new WalletError("rejected");
  return getAddress(accounts[0]);
}

export async function currentChainId(): Promise<number | null> {
  const eth = getInjected();
  if (!eth) return null;
  return Number.parseInt((await eth.request({ method: "eth_chainId" })) as string, 16);
}

/** wallet_switchEthereumChain → jika chain belum dikenal (4902) → wallet_addEthereumChain. */
export async function ensureChain(): Promise<void> {
  const eth = getInjected();
  if (!eth) throw new WalletError("no_wallet");
  if ((await currentChainId()) === CHAIN.id) return;
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_HEX }] });
  } catch (err) {
    const code = (err as AnyErr).code ?? (err as AnyErr).info?.error?.code;
    if (code === 4902 || code === -32603) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: CHAIN_HEX,
            chainName: CHAIN.name,
            nativeCurrency: CHAIN.nativeCurrency,
            rpcUrls: [CHAIN.rpcUrl],
            blockExplorerUrls: [CHAIN.explorerUrl],
          },
        ],
      });
    } else if (code === 4001) {
      throw new WalletError("wrong_chain");
    } else {
      throw err;
    }
  }
  if ((await currentChainId()) !== CHAIN.id) throw new WalletError("wrong_chain");
}

// ---------- save ----------

export type Attestation = { username: string; wallet: string; expiry: string; signature: string };

export type SaveInput = { title: string; vibe: string; topLang: number };

export type SaveHooks = {
  getProof: (wallet: string) => Promise<Attestation>;
  onStep?: (step: "proof" | "confirm" | "stamping", txHash?: string) => void;
};

/**
 * Minta proof → kirim `saveAura` → tunggu receipt → id dari event AuraSaved.
 * `ProofExpired` saat simulasi/estimasi → minta proof baru & coba lagi SEKALI (BUILD_PLAN Fase 7).
 */
export async function saveAuraOnChain(input: SaveInput, hooks: SaveHooks): Promise<{ id: bigint; txHash: string }> {
  const eth = getInjected();
  if (!eth) throw new WalletError("no_wallet");
  const signer = await new BrowserProvider(eth).getSigner();
  const wallet = getAddress(await signer.getAddress());
  const contract = new Contract(CONTRACT_ADDRESS, GITAURA_ABI, signer);

  for (let attempt = 0; attempt < 2; attempt++) {
    hooks.onStep?.("proof");
    const proof = await hooks.getProof(wallet);
    hooks.onStep?.("confirm");
    try {
      const tx = await contract.saveAura(proof.username, input.title, input.vibe, input.topLang, BigInt(proof.expiry), proof.signature);
      hooks.onStep?.("stamping", tx.hash);
      const receipt = await tx.wait();
      if (!receipt || receipt.status !== 1) throw new WalletError("reverted");
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === "AuraSaved") return { id: parsed.args.id as bigint, txHash: tx.hash };
        } catch {
          /* log lain */
        }
      }
      throw new WalletError("reverted", "AuraSaved event not found");
    } catch (err) {
      if (attempt === 0 && classifyWalletError(err) === "proof_expired") continue;
      throw err;
    }
  }
  throw new WalletError("proof_expired");
}
