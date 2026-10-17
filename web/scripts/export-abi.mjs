// Ekspor ABI GitAura dari artefak Foundry ke web/lib/abi.ts.
// Pemakaian: (cd contracts && forge build) lalu `npm run abi` di web/.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const artifact = fileURLToPath(new URL("../../contracts/out/GitAura.sol/GitAura.json", import.meta.url));
const target = fileURLToPath(new URL("../lib/abi.ts", import.meta.url));

const { abi } = JSON.parse(readFileSync(artifact, "utf8"));

mkdirSync(dirname(target), { recursive: true });
writeFileSync(
  target,
  `// AUTO-GENERATED oleh scripts/export-abi.mjs dari contracts/out — jangan edit manual.\n` +
    `export const GITAURA_ABI = ${JSON.stringify(abi, null, 2)} as const;\n`,
);
console.log(`ABI (${abi.length} entri) → lib/abi.ts`);
