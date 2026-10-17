# Progress — GitAura

Claude Code: update file ini di akhir setiap fase. Jangan hapus catatan lama.

## Status fase
| Fase | Nama | Status | Catatan |
|---|---|---|---|
| 0 | Scaffold | ✅ | Next 15.5 + Tailwind v4, Foundry + OZ v5.7.0; `forge build`, lint, typecheck, test, `npm run dev` OK |
| 1 | Smart contract + test | ✅ | `forge test -vv`: 25/25 hijau (matrix §4 #1–#11 + edge case + fuzz); `Deploy.s.sol` tersimulasi lokal |
| 2 | Deploy testnet | ✅ | alamat: [`0x54004efF59C672BB94BD662741589e9Ae6ECFcA8`](https://scan.bohr.life/address/0x54004efF59C672BB94BD662741589e9Ae6ECFcA8) · tx `0x2a42…f976` · attester test `0x50b4Fd0E7485299ce250b275e24BA91564EAc848` · deployer `0x5219fFbF9A44F96A8931A50A31021E4724518735` |
| 3 | Auth GitHub + session | ✅ | 15 test vitest; login → `/api/auth/me` OK di browser; logout 204 → `/me` 401; state palsu → `?login=failed` |
| 4 | Attestation endpoint + e2e | ✅ | 29 test vitest; e2e testnet: Aura #0 `@gitaura-e2e` tersimpan, tx `0x30f3…9af61` (gas 241 289); `getAura`/`auraIdOf`/event dicek via `cast` |
| 5 | Stats GitHub + AI + fallback | ✅ | 59 test vitest; curl `/api/aura`: Gemini `gemini-3.5-flash-lite` → `source:"ai"` (1,5–3,7 s, stats asli octocat/sindresorhus); key kosong → `source:"fallback"`; 0 repo → `source:"fresh"`; stats invalid → 400 |
| 6 | UI shell & design system | ✅ | landing (nav, hero+PromptBox, marquee, how it works, footer) dicek screenshot headless di 360/375/1440 tanpa scroll horizontal; link footer benar |
| 7 | Flow utama | ✅ | 68 test vitest; user stamp lewat UI di testnet: Aura #1 `@adityazulkarnaen` (tx `0x699e…b8`); peek/404/375px dicek via Chrome CDP |
| 8 | Gallery & share link | ✅ | 72 test; `/a/1` & `/?aura=1` → 200 + `og:title` per aura; id tak ada/invalid → "Aura not found"; dibuka di profil Chrome baru tanpa `window.ethereum` (incognito-setara) + `/gallery` memuat 2 aura dari chain |
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
- 2026-10-17 · 3 · Satu kali `?login=failed` saat uji browser (gagal di cek state, sebelum ke GitHub; percobaan berikutnya OK) · perilaku aman; pantau jika berulang di alur normal
- 2026-10-17 · 4 · `lib/config.ts` = satu-satunya sumber chain/RPC/explorer/`CONTRACT_ADDRESS`/tabel `LANGUAGES` (topLang) · aturan #5; `nativeCurrency` sementara `BOT/BOT/18` (TODO konfirmasi)
- 2026-10-17 · 4 · Digest TS dicocokkan dengan vektor `cast abi-encode` + `cast keccak` di test, plus `eth_call` ke kontrak testnet di script e2e · bukti independen dari ethers bahwa encoding identik
- 2026-10-17 · 4 · Script e2e mengirim tx via `cast send --account deployer` (bukan key di Node) · key deployer tetap di keystore Foundry; default username `gitaura-e2e`
- 2026-10-17 · 4 · Urutan cek `/api/auth/attest`: origin → rate limit → session → body (4 KB) → wallet → signer · request asing/berlebih ditolak sebelum kerja mahal
- 2026-10-17 · 4 · `tsconfig` target ES2017 → ES2020; `tsx` sebagai devDep (`--conditions=react-server` agar `server-only` jadi no-op di script) · BigInt literal & menjalankan lib server dari CLI
- 2026-10-17 · 4 · Aura #0 di kontrak testnet adalah data uji `@gitaura-e2e` (owner deployer) · gallery Fase 8 akan menampilkannya; deploy ulang testnet/mainnet tidak terpengaruh
- 2026-10-17 · 5 · **Provider AI: Google Gemini (free tier)**, bukan Anthropic. REST `generateContent` via `fetch` (tanpa SDK; `@anthropic-ai/sdk` dihapus). Env `GEMINI_API_KEY` + `GEMINI_MODEL` (default `gemini-3.5-flash-lite`, alternatif `gemini-3.8-flash`) · permintaan user (gratis); PRD tidak menetapkan provider. Free tier: data request boleh dipakai Google → hanya ringkasan stats publik yang dikirim
- 2026-10-17 · 5 · `source` punya nilai ketiga `"fresh"` (0 repo → aura "The Fresh Account" dari UI_COPY, tanpa memanggil AI) · Fresh bukan "classic aura"; UI Fase 7: badge `classic aura` hanya untuk `"fallback"`
- 2026-10-17 · 5 · Fork diabaikan untuk bahasa/stars/aktivitas; `publicRepos` dari profil · bahasa repo fork bukan karya user
- 2026-10-17 · 5 · Hanya 1 halaman repo (100 terbaru, `sort=updated`) sesuai BUILD_PLAN §2.4 · akun >100 repo: stars/bahasa dihitung dari 100 repo terbaru (batasan MVP, catat di README)
- 2026-10-17 · 5 · Archetype fallback deterministik: stars ≥100 → Wizard, repo ≥20 → Builder, selain itu Explorer; tanpa bahasa → "The Code Explorer". Teks vibe/traits fallback ditulis baru (UI_COPY tidak mengaturnya)
- 2026-10-17 · 5 · Zod `/api/aura` membuang field tak dikenal (mis. `bio`) sebelum prompt · cegah prompt injection; test memastikan teks injeksi tidak sampai ke Gemini
- 2026-10-17 · 5 · Output AI di-`trim()` lalu divalidasi ketat (title ≤80, vibe ≤160, tepat 3 traits ≤24); gagal → fallback · sesuai API_SPEC
- 2026-10-17 · 6 · ~~Tombol pink memakai teks `#111`~~ → **diganti: semua CTA pink teks putih semibold** (permintaan user, gaya Relume) · rasio ≈3,5:1 di bawah AA 4,5:1; DESIGN_SYSTEM §7 diperbarui; eyebrow pink kecil ~3,1:1 juga diterima — catat untuk audit a11y
- 2026-10-17 · 6 · Font Geist via `next/font/google` (bukan paket npm `geist`) · font sama, tanpa dependensi tambahan
- 2026-10-17 · 6 · Teks footer `Built on BOT Chain · chain ID {CHAIN_ID}` mengambil chain dari config (968 di testnet, 677 di mainnet) · UI_COPY menulis 677; nilai mengikuti chain aktif agar tidak menyesatkan di testnet
- 2026-10-17 · 6 · `AuraCard`/`SaveBar`/`SuccessPanel`/`Toast` dibuat di Fase 7, teaser galeri di Fase 8; Peek di Fase 6 hanya demo ticker · fase 6 = shell; komponen kartu langsung dibangun dengan data nyata
- 2026-10-17 · 6 · Uji visual: Chrome headless + iframe 360/375px (headless Windows punya lebar jendela minimum ~500px) · screenshot di scratchpad, tidak di-commit
- 2026-10-17 · 6 · How it works dirombak ke gaya Relume (permintaan user): 3 `StepCard` split (panel grid kuning/pink/oranye + tepi pixel `PixelEdge` + mockup `SignInMock`/`RevealMock`/`StampMock` yang terpotong di tepi; sisi bergantian), teks: ikon, eyebrow, heading, body, CTA, 3 fitur · copy baru ditambahkan ke UI_COPY.md + `copy.ts`; DESIGN_SYSTEM §4 diperbarui
- 2026-10-17 · 6 · Dekorasi kubus `Voxels` diganti `PixelSparkles` (gugus bintang kilau pixel-art kuning/oranye/pink, berfaset, twinkle) — pilihan user dari 3 opsi (sparkle / contribution grid / stamp seal) · nyambung dengan tepi pixel StepCard & tema "aura"; token warna `voxel-*` tetap dipakai
- 2026-10-17 · 7 · `HomeClient` (client) memegang session + wallet untuk NavBar & Hero; LangMarquee/HowItWorks tetap server component via `children` · state bersama tanpa context global
- 2026-10-17 · 7 · Setelah login, aura milik sendiri langsung di-reveal otomatis (sekali per kunjungan); `?login=` dibersihkan dari URL · tidak perlu tombol/teks baru di luar UI_COPY
- 2026-10-17 · 7 · Tombol SaveBar berurutan: `Connect wallet` → `Switch to BOT Chain` (bila chain salah) → `Save my Aura on BOT Chain`; langkah ditampilkan dari `COPY.save.steps` · sesuai DESIGN_SYSTEM SaveBar
- 2026-10-17 · 7 · `ProofExpired` (dari simulasi/estimasi ethers) → proof baru + retry otomatis sekali; kedua kali → "Your proof expired — try saving again" + Retry · BUILD_PLAN Fase 7; diuji dengan ethers di-mock
- 2026-10-17 · 7 · title/vibe dipotong per **byte** (`clampBytes`) sebelum `saveAura` · kontrak mengukur `bytes(...).length`; emoji/non-ASCII bisa melebihi batas walau ≤80 karakter
- 2026-10-17 · 7 · GitHub error jaringan dipetakan ke teks rate-limit GitHub; `/api/aura` gagal (selain 429) → template lokal `source:"fallback"` · UI_COPY tidak punya teks "network error"; jangan improvisasi
- 2026-10-17 · 7 · Link share: `{SITE}/?aura={id}`; tweet via `twitter.com/intent/tweet` dengan teks persis `COPY.save.tweet` · halaman read-only dibuat Fase 8
- 2026-10-17 · 7 · /check-states: semua baris UI_COPY §Errors tertangani via `COPY` kecuali `Aura not found` & `Couldn't load auras` (lingkup Fase 8)
- 2026-10-17 · 8 · Baca kontrak langsung dari browser/server via `JsonRpcProvider` (`lib/chain.ts`) · RPC 968 & 677 mengizinkan CORS `*`; tanpa wallet/login
- 2026-10-17 · 8 · `/?aura=ID` dirender langsung (bukan redirect) dengan metadata OG yang sama seperti `/a/ID` · crawler share tidak perlu mengikuti redirect
- 2026-10-17 · 8 · `loadAura` dibungkus `React.cache` (1 RPC untuk metadata + halaman); `/a/[id]` `revalidate = 60` · aura bisa di-stamp ulang
- 2026-10-17 · 8 · RPC gagal pada halaman share → "Couldn't load auras — refresh to try again" (bukan "Aura not found") · bedakan data tidak ada vs jaringan; not-found tetap HTTP 200 + `robots: noindex`
- 2026-10-17 · 8 · Kartu on-chain hanya menampilkan data tersimpan (title, vibe, topLang, owner, tanggal) — traits & stats tidak disimpan di kontrak · label baru ditambahkan ke UI_COPY
- 2026-10-17 · 8 · Teaser 6 aura terbaru di landing (server component dalam `Suspense`) + `SiteHeader` dipakai bersama landing/galeri/share · DESIGN_SYSTEM §5

## TODO / terbuka
- [ ] Konfirmasi native currency BOT Chain (nama, simbol, decimals)
- [ ] Putuskan: tandatangani title/vibe? (CONTRACT_SPEC §6)
- [ ] Logo BOT Chain resmi untuk chip footer (SVG)
- [x] Konfirmasi versi EVM BOT Chain → Cancun-compatible, `evm_version = "cancun"` (fase 1)
- [ ] Boilerplate create-next-app (`web/app/page.tsx`, `web/public/*.svg`, `web/README.md`) diganti di Fase 6
- [ ] Drive C hampir penuh (~0,6 GB): npm install memakai `--cache D:/npm-cache`

- [x] Isi `GEMINI_API_KEY` (AI Studio) — terisi, AI teruji di Fase 5

- [ ] Dev tooling: `TaskStop` pada `npm run dev` bisa meninggalkan proses `next` yatim di port 3000 → cek `Get-NetTCPConnection -LocalPort 3000` bila hasil uji aneh

- [ ] Verifikasi animasi ketik footer & ticker di perangkat mobile asli (di iframe headless IntersectionObserver tidak memicu)

- [x] Uji manual Fase 7: stamp sukses via UI (Aura #1). Belum dicoba eksplisit: tx ditolak, jaringan salah, copy link/share X — cek sekilas sebelum go-live

## Bug diketahui
