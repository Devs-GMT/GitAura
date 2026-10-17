// Baca kontrak GitAura secara read-only (tanpa wallet/login). Aman di server & browser:
// RPC BOT Chain mengizinkan CORS (*). Alamat & RPC dari lib/config (aturan #5).
import { Contract, JsonRpcProvider } from "ethers";
import { GITAURA_ABI } from "./abi";
import { CHAIN, CONTRACT_ADDRESS } from "./config";

export type OnchainAura = {
  id: number;
  owner: string;
  username: string;
  title: string;
  vibe: string;
  topLang: number;
  savedAt: number; // unix detik
};

export const PAGE_SIZE = 24;

let cached: Contract | null = null;
function contract(): Contract {
  if (!CONTRACT_ADDRESS) throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS not set");
  if (!cached) {
    const provider = new JsonRpcProvider(CHAIN.rpcUrl, CHAIN.id, { staticNetwork: true });
    cached = new Contract(CONTRACT_ADDRESS, GITAURA_ABI, provider);
  }
  return cached;
}

/** Id share yang valid: bilangan bulat ≥ 0 tanpa tanda/desimal. */
export function parseAuraId(raw: string | string[] | undefined | null): number | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v && /^\d{1,9}$/.test(v) ? Number(v) : null;
}

export async function getTotal(): Promise<number> {
  return Number(await contract().total());
}

async function fetchAura(id: number): Promise<OnchainAura> {
  const a = await contract().getAura(id);
  return {
    id,
    owner: a.owner as string,
    username: a.username as string,
    title: a.title as string,
    vibe: a.vibe as string,
    topLang: Number(a.topLang),
    savedAt: Number(a.savedAt),
  };
}

/** null jika id di luar jangkauan (kontrak akan revert `AuraNotFound`). Error RPC lain dilempar. */
export async function getAuraById(id: number): Promise<OnchainAura | null> {
  if (id >= (await getTotal())) return null;
  return fetchAura(id);
}

/** Halaman aura terbaru dulu. `page` mulai 0. */
export async function listAuras(page = 0, pageSize = PAGE_SIZE): Promise<{ items: OnchainAura[]; total: number; hasMore: boolean }> {
  const total = await getTotal();
  const start = total - 1 - page * pageSize;
  const ids: number[] = [];
  for (let id = start; id > start - pageSize && id >= 0; id--) ids.push(id);
  const items = await Promise.all(ids.map(fetchAura)); // total() cukup sekali per halaman
  return { items, total, hasMore: start - pageSize >= 0 };
}

export const avatarUrl = (username: string, size = 160) =>
  `https://github.com/${encodeURIComponent(username)}.png?size=${size}`;
