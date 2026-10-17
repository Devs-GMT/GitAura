# Progress — GitAura

Claude Code: update file ini di akhir setiap fase. Jangan hapus catatan lama.

## Status fase
| Fase | Nama | Status | Catatan |
|---|---|---|---|
| 0 | Scaffold | ✅ | Next 15.5 + Tailwind v4, Foundry + OZ v5.7.0; `forge build`, lint, typecheck, test, `npm run dev` OK |
| 1 | Smart contract + test | ⬜ | |
| 2 | Deploy testnet | ⬜ | alamat: |
| 3 | Auth GitHub + session | ⬜ | |
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

## TODO / terbuka
- [ ] Konfirmasi native currency BOT Chain (nama, simbol, decimals)
- [ ] Putuskan: tandatangani title/vibe? (CONTRACT_SPEC §6)
- [ ] Logo BOT Chain resmi untuk chip footer (SVG)
- [ ] Konfirmasi versi EVM BOT Chain (Shanghai/Cancun?) → sesuaikan `evm_version`
- [ ] Boilerplate create-next-app (`web/app/page.tsx`, `web/public/*.svg`, `web/README.md`) diganti di Fase 6
- [ ] Drive C hampir penuh (~0,6 GB): npm install memakai `--cache D:/npm-cache`

## Bug diketahui
