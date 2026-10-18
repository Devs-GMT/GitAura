// Satu-satunya sumber chain ID, RPC, explorer, alamat kontrak, dan tabel topLang (CLAUDE.md aturan #5).
// Aman untuk client: hanya nilai publik.

export type ChainConfig = {
  id: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  // Dikonfirmasi 2026-10-18 dari envs.js explorer resmi (scan.botchain.ai / scan.bohr.life): BOT / BOT / 18.
  nativeCurrency: { name: string; symbol: string; decimals: number };
};

export const CHAINS = {
  968: {
    id: 968,
    name: "BOT Chain Testnet",
    rpcUrl: "https://rpc.bohr.life",
    explorerUrl: "https://scan.bohr.life",
    nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  },
  677: {
    id: 677,
    name: "BOT Chain",
    rpcUrl: "https://rpc.botchain.ai",
    explorerUrl: "https://scan.botchain.ai",
    nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  },
} as const satisfies Record<number, ChainConfig>;

export type SupportedChainId = keyof typeof CHAINS;

function resolveChainId(): SupportedChainId {
  const id = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 968);
  if (id !== 968 && id !== 677) throw new Error(`Unsupported NEXT_PUBLIC_CHAIN_ID: ${id}`);
  return id;
}

export const CHAIN_ID: SupportedChainId = resolveChainId();
export const CHAIN: ChainConfig = CHAINS[CHAIN_ID];

/** Alamat kontrak GitAura di CHAIN aktif ("" jika belum di-deploy/di-set). */
export const CONTRACT_ADDRESS: string = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.trim() ?? "";

export const explorerAddressUrl = (address: string) => `${CHAIN.explorerUrl}/address/${address}`;
export const explorerTxUrl = (hash: string) => `${CHAIN.explorerUrl}/tx/${hash}`;

/** Tabel topLang — CONTRACT_SPEC §5. Indeks = nilai uint8 di kontrak. */
export const LANGUAGES = [
  { name: "Other", from: "#5E5B55", to: "#111111" },
  { name: "TypeScript", from: "#3178C6", to: "#E83AD6" },
  { name: "JavaScript", from: "#F6C945", to: "#E8642C" },
  { name: "Python", from: "#3776AB", to: "#F6C945" },
  { name: "Rust", from: "#E8642C", to: "#111111" },
  { name: "Go", from: "#00ADD8", to: "#3178C6" },
  { name: "Java", from: "#E8642C", to: "#B07219" },
  { name: "C++", from: "#F34B7D", to: "#3178C6" },
  { name: "C", from: "#555555", to: "#3178C6" },
  { name: "C#", from: "#178600", to: "#3178C6" },
  { name: "PHP", from: "#777BB4", to: "#E83AD6" },
  { name: "Ruby", from: "#CC342D", to: "#E83AD6" },
  { name: "Swift", from: "#F05138", to: "#F6C945" },
  { name: "Kotlin", from: "#A97BFF", to: "#E83AD6" },
  { name: "Dart", from: "#00B4AB", to: "#3178C6" },
  { name: "Solidity", from: "#363636", to: "#E83AD6" },
  { name: "HTML", from: "#E34C26", to: "#F6C945" },
  { name: "CSS", from: "#663399", to: "#E83AD6" },
  { name: "Shell", from: "#89E051", to: "#111111" },
  { name: "Jupyter Notebook", from: "#DA5B0B", to: "#F6C945" },
] as const;

/** Nama bahasa GitHub → indeks topLang; tidak dikenal → 0 (Other). */
export function topLangIndex(language: string | null | undefined): number {
  const i = LANGUAGES.findIndex((l) => l.name === language);
  return i < 0 ? 0 : i;
}

/** Indeks dari kontrak → entri tabel; di luar jangkauan → Other. */
export const languageAt = (index: number) => LANGUAGES[index] ?? LANGUAGES[0];
