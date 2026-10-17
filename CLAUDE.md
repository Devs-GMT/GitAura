# CLAUDE.md — GitAura

File ini dibaca otomatis oleh Claude Code di setiap sesi. Jaga tetap ringkas; detail ada di `docs/`.

## Apa ini
**GitAura** — Sign in with GitHub (OAuth) → fetch public stats → AI menulis personality card (`title`, `vibe`, 3 `traits`) → **[Save my Aura]** di BOT Chain dengan tanda tangan server (attester) yang membuktikan kepemilikan akun GitHub → kartu **✓ Verified** + galeri publik. Siapa pun bisa **Peek** username mana pun tanpa login (preview, tidak bisa disimpan).

## Peta dokumen (baca yang relevan SEBELUM menulis kode)
| Dokumen | Isi | Baca saat |
|---|---|---|
| `docs/PRD.md` | Kebutuhan produk (sumber kebenaran fitur) | Ragu soal scope |
| `docs/BUILD_PLAN.md` | Fase build + prompt per fase | Memulai fase |
| `docs/ARCHITECTURE.md` | Alur sistem, trust model, keputusan desain | Menyentuh lebih dari satu lapisan |
| `docs/CONTRACT_SPEC.md` | Interface Solidity, skema signature, tabel `topLang`, test matrix | Kerja di `contracts/` atau `lib/attest.ts` |
| `docs/API_SPEC.md` | Semua route handler: request, response, error, cookie | Kerja di `web/app/api/` |
| `docs/DESIGN_SYSTEM.md` | Token, tipografi, komponen, layout (referensi Relume) | Kerja di UI |
| `docs/UI_COPY.md` | Semua teks UI & pesan error (pakai persis) | Menulis teks yang tampil ke user |
| `docs/SETUP.md` | Env vars, OAuth App, wallet, chain, deploy | Setup / deploy |
| `docs/PROGRESS.md` | Status fase & catatan keputusan | **Update di akhir setiap fase** |

## Stack
- `web/` — Next.js 15 App Router, TypeScript strict, Tailwind v4, ethers v6, jose, zod; AI = Google Gemini API (REST `generateContent` via `fetch`, tanpa SDK)
- `contracts/` — Solidity ^0.8.20, Foundry, OpenZeppelin (ECDSA, MessageHashUtils)
- Hosting: Vercel. Chain: BOT Chain (testnet 968, mainnet 677)

## Perintah
```bash
# contracts
cd contracts && forge build && forge test -vv
forge script script/Deploy.s.sol --rpc-url bohr --broadcast       # testnet
# web
cd web && npm run dev
npm run lint && npm run typecheck && npm test
```

## Aturan keras (jangan dilanggar)
1. **Tidak ada secret di kode/repo.** Baca dari `process.env`. Jangan pernah membuat file `.env.local` berisi nilai asli; jangan cetak secret ke log.
2. **Token GitHub** hanya hidup di dalam handler callback: tidak disimpan, tidak dikirim ke browser. OAuth scope kosong.
3. **Skema signature harus identik** antara `contracts/src/GitAura.sol` dan `web/lib/attest.ts` (lihat `docs/CONTRACT_SPEC.md` §3). Jika mengubah salah satu, ubah keduanya dan jalankan test e2e.
4. Variabel `NEXT_PUBLIC_*` hanya untuk nilai publik. `ATTESTER_PRIVATE_KEY`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET`, `GEMINI_API_KEY` hanya di server (`import "server-only"`).
5. Alamat kontrak, chain ID, RPC, explorer URL **hanya** dari `web/lib/config.ts`.
6. Out of scope: DB backend, NFT/token/pembayaran, repo privat, write access GitHub, edit kartu orang lain, likes/komentar.
7. Jangan menjalankan deploy mainnet atau transaksi yang memakai private key asli tanpa diminta eksplisit.

## Konvensi
- Server code di `web/lib/*` yang memakai secret → tambahkan `import "server-only"`.
- Validasi semua input API dengan `zod`. Response error: `{ error: { code, message } }`.
- Komponen UI di `web/components/`, satu komponen per file, PascalCase.
- Username GitHub selalu dinormalisasi **lowercase** sebelum di-hash / ditandatangani.
- Teks UI diambil dari `docs/UI_COPY.md` — jangan improvisasi pesan error.
- Commit kecil per fase: `feat(contract): ...`, `feat(api): ...`, `feat(ui): ...`.

## Alur kerja per sesi
1. Baca `docs/PROGRESS.md` untuk tahu fase berikutnya.
2. Baca bagian fase itu di `docs/BUILD_PLAN.md` + spec terkait.
3. Kerjakan, jalankan test/lint/typecheck.
4. Update `docs/PROGRESS.md` (centang, catat keputusan & TODO).
