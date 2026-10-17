# Progress — GitAura

Claude Code: update file ini di akhir setiap fase. Jangan hapus catatan lama.

## Status fase
| Fase | Nama | Status | Catatan |
|---|---|---|---|
| 0 | Scaffold | ✅ | Next 15.5 + Tailwind v4, Foundry + OZ v5.7.0; `forge build`, lint, typecheck, test, `npm run dev` OK |
| 1 | Smart contract + test | ✅ | `forge test -vv`: 25/25 hijau (matrix §4 #1–#11 + edge case + fuzz); `Deploy.s.sol` tersimulasi lokal |
| 2 | Deploy testnet | ✅ | alamat: [`0x54004efF59C672BB94BD662741589e9Ae6ECFcA8`](https://scan.bohr.life/address/0x54004efF59C672BB94BD662741589e9Ae6ECFcA8) · tx `0x2a42…f976` · attester test `0x50b4Fd0E7485299ce250b275e24BA91564EAc848` · deployer `0x5219fFbF9A44F96A8931A50A31021E4724518735` |
| 3 | Auth GitHub + session | 🟨 | route + 15 test vitest OK; smoke test dev server OK (401 /me, redirect GitHub tanpa scope, state palsu → `?login=failed`, logout origin asing → 403); **menunggu uji login di browser** |
| 4 | Attestation endpoint + e2e | ⬜ | |
| 5 | Stats GitHub + AI + fallback | ⬜ | |
| 6 | UI shell & design system | ⬜ | |
| 7 | Flow utama | ⬜ | |
| 8 | Gallery & share link | ⬜ | |
| 9 | Mainnet & live | ⬜ | alamat mainnet: · URL: |
| 10 | README, demo, submission | ⬜ | |

Legenda: ⬜ belum · 🟨 sedang · ✅ selesai · ⛔ terblokir

## Keputusan (log)
<!-- format: YYYY-MM-DD · fase · keputusan · alasan -->
- 2026-10-17 · 0 · `solc 0.8.24`, `evm_version = "paris"` di `foundry.toml` · aman bila BOT Chain belum dukung PUSH0/MCOPY; naikkan setelah dikonfirmasi
- 2026-10-17 · 0 · forge-std & openzeppelin-contracts sebagai git submodule (`contracts/lib/`), remapping `@openzeppelin/contracts/` · standar Foundry
- 2026-10-17 · 0 · `@types/node@^22` (bukan ^20 bawaan create-next-app) · peer dep vitest 5; Node lokal v22
- 2026-10-17 · 0 · vitest: `vitest.config.mts`, env node, alias `@` & stub `server-only` (`web/test/server-only.ts`) · supaya modul `lib/*` ber-`import "server-only"` bisa dites
- 2026-10-17 · 0 · `web/.gitignore` ditambah `!.env.example` · template bawaan mengabaikan semua `.env*`
- 2026-10-17 · 1 · `evm_version` paris → **cancun** · OZ 5.7 `MessageHashUtils` → `Bytes.sol` butuh MCOPY; `eth_call` ke rpc.bohr.life & rpc.botchain.ai membuktikan PUSH0/MCOPY/TSTORE didukung (kontrol `INVALID` gagal seperti seharusnya)
- 2026-10-17 · 1 · Recover memakai `ECDSA.tryRecover`, semua kegagalan → `InvalidProof` · spec §2 langkah 4; signature malformed tidak bocor sebagai error OZ
- 2026-10-17 · 1 · Validasi & cek proof dipecah ke `_checkLengths` / `_checkUsername` / `_checkProof` · hindari "stack too deep" tanpa `via_ir`; urutan §2 tetap
- 2026-10-17 · 1 · Update di tempat tidak mengubah `username` (key sama); `topLang` tidak divalidasi ≤19 · tidak diminta spec; UI memetakan indeks tak dikenal → 0
- 2026-10-17 · 2 · `rpc_endpoints` `bohr`/`botchain` di `foundry.toml`; ABI diekspor via `npm run abi` (`web/scripts/export-abi.mjs` → `web/lib/abi.ts`, `as const`) · satu sumber dari artefak Foundry, regenerasi tiap kontrak berubah
- 2026-10-17 · 2 · Simulasi deploy ke 968 (`--sender` deployer, tanpa broadcast): ~2,23 jt gas, ~0,045 token · saldo deployer testnet 10
- 2026-10-17 · 2 · Deploy testnet sukses; dicek via RPC: bytecode 7686 B, `attester()` = attester test, `total()` = 0, explorer 200 · `NEXT_PUBLIC_CONTRACT_ADDRESS` diisi di `web/.env.local` (lokal saja)
- 2026-10-17 · 3 · Ikuti API_SPEC (bukan BUILD_PLAN) untuk bentuk session: JWT `{ sub: login, avatar }`, `/api/auth/me` → `{ login, avatar }`, callback sukses → `/?login=ok` · API_SPEC lebih rinci; UI (Fase 7) pakai field `avatar`
- 2026-10-17 · 3 · Route handler hanya memakai `req.cookies` / `res.cookies` (bukan `next/headers`) · bisa dites langsung di vitest tanpa konteks request Next
- 2026-10-17 · 3 · Token GitHub hanya di dalam `fetchGitHubIdentity` (`lib/oauth.ts`); log error hanya pesan generik · aturan keras #2; test memastikan token tidak muncul di header/cookie
- 2026-10-17 · 3 · State dibandingkan `timingSafeEqual`; `ga_state` dihapus di semua jalur callback · cegah login CSRF & reuse state
- 2026-10-17 · 3 · `ga_return` (opsional) belum diimplementasikan · tidak dibutuhkan selama login selalu kembali ke `/`
- 2026-10-17 · 3 · OAuth App dev memakai form baru GitHub ("Redirect URIs"), "Expire user access tokens" dimatikan · token dibuang setelah `GET /user`, refresh token tak perlu

## TODO / terbuka
- [ ] Konfirmasi native currency BOT Chain (nama, simbol, decimals)
- [ ] Putuskan: tandatangani title/vibe? (CONTRACT_SPEC §6)
- [ ] Logo BOT Chain resmi untuk chip footer (SVG)
- [x] Konfirmasi versi EVM BOT Chain → Cancun-compatible, `evm_version = "cancun"` (fase 1)
- [ ] Boilerplate create-next-app (`web/app/page.tsx`, `web/public/*.svg`, `web/README.md`) diganti di Fase 6
- [ ] Drive C hampir penuh (~0,6 GB): npm install memakai `--cache D:/npm-cache`

## Bug diketahui
