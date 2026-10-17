// E2E: buktikan signature dari web/lib/attest.ts diterima GitAura.sol di chain aktif.
//
//   npm run e2e:attest -- --wallet 0xYourDeployer            # simulasi eth_call saja (tanpa key, tanpa gas)
//   npm run e2e:attest -- --wallet 0xYourDeployer --send     # kirim tx via `cast send --account deployer`
//
// Opsi: --username <lowercase> (default gitaura-e2e) · --account <keystore foundry> (default deployer)
// Membaca web/.env.local: ATTESTER_PRIVATE_KEY, NEXT_PUBLIC_CHAIN_ID, NEXT_PUBLIC_CONTRACT_ADDRESS.
// --wallet HARUS alamat keystore --account, karena kontrak mencocokkan msg.sender dengan wallet di proof.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    wallet: { type: "string" },
    username: { type: "string", default: "gitaura-e2e" },
    account: { type: "string", default: "deployer" },
    send: { type: "boolean", default: false },
  },
});

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

// Import setelah env dimuat — config.ts membaca NEXT_PUBLIC_* saat load.
const { Contract, JsonRpcProvider, getAddress, isAddress } = await import("ethers");
const { ATTEST_TTL_S, attesterWallet, signAttestation } = await import("../lib/attest");
const { CHAIN, CONTRACT_ADDRESS, topLangIndex } = await import("../lib/config");
const { GITAURA_ABI } = await import("../lib/abi");

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

if (!args.wallet || !isAddress(args.wallet)) fail("pass --wallet 0x… (the address of your --account keystore)");
if (!isAddress(CONTRACT_ADDRESS)) fail("NEXT_PUBLIC_CONTRACT_ADDRESS is not set in .env.local");
const username = args.username!;
if (!/^[a-z0-9-]{1,39}$/.test(username)) fail("--username must be lowercase a-z, 0-9, - (1..39)");

const wallet = getAddress(args.wallet);
const contractAddr = getAddress(CONTRACT_ADDRESS);
const provider = new JsonRpcProvider(CHAIN.rpcUrl, CHAIN.id, { staticNetwork: true });
const ga = new Contract(contractAddr, GITAURA_ABI, provider);

const signer = attesterWallet();
const onchainAttester: string = await ga.attester();
console.log(`chain     ${CHAIN.name} (${CHAIN.id})`);
console.log(`contract  ${contractAddr}`);
console.log(`attester  env=${signer.address} on-chain=${onchainAttester}`);
if (onchainAttester !== signer.address) fail("ATTESTER_PRIVATE_KEY does not match the contract's attester");

const expiry = BigInt(Math.floor(Date.now() / 1000) + ATTEST_TTL_S);
const signature = await signAttestation(
  { username, wallet, expiry, chainId: BigInt(CHAIN.id), contract: contractAddr },
  signer,
);
const title = "The E2E TypeScript Tester";
const vibe = "Proves that TS and Solidity agree on every byte.";
const topLang = topLangIndex("TypeScript");
const callArgs = [username, title, vibe, topLang, expiry, signature] as const;

// 1) Simulasi: kontrak menjalankan _checkProof dengan msg.sender = wallet.
try {
  const id: bigint = await ga.saveAura.staticCall(...callArgs, { from: wallet });
  console.log(`✓ eth_call accepted the proof for @${username} from ${wallet} → would be Aura #${id}`);
} catch (err) {
  const reason = ga.interface.parseError((err as { data?: string }).data ?? "0x")?.name;
  fail(`eth_call reverted: ${reason ?? (err as Error).message}`);
}

if (!args.send) {
  console.log("(simulation only — add --send to broadcast with cast)");
  process.exit(0);
}

// 2) Broadcast lewat Foundry keystore (password diminta interaktif; key tidak menyentuh Node).
const cast = spawnSync(
  "cast",
  [
    "send", contractAddr,
    "saveAura(string,string,string,uint8,uint64,bytes)",
    username, title, vibe, String(topLang), expiry.toString(), signature,
    "--rpc-url", CHAIN.rpcUrl,
    "--account", args.account!,
  ],
  { stdio: "inherit" },
);
if (cast.status !== 0) fail("cast send failed");

// 3) Baca balik dari kontrak.
const [exists, id]: [boolean, bigint] = await ga.auraIdOf(username);
if (!exists) fail("auraIdOf returned exists=false after send");
const aura = await ga.getAura(id);
console.log(`✓ on-chain Aura #${id}: @${aura.username} owner=${aura.owner} title="${aura.title}" topLang=${aura.topLang}`);
if (aura.owner !== wallet) fail(`owner mismatch (expected ${wallet})`);
console.log(`  ${CHAIN.explorerUrl}/address/${contractAddr}`);
