# GitAura — Build Plan untuk Claude Code

> File ini ada di `docs/`. Konteks tetap proyek ada di `CLAUDE.md` (root); spesifikasi detail di `docs/*_SPEC.md`, `DESIGN_SYSTEM.md`, `UI_COPY.md`, `SETUP.md`.
> Cara cepat: jalankan `/next-phase` di Claude Code.
> Kerjakan **satu fase per sesi/prompt** di Claude Code. Setiap fase punya: tujuan, file yang dibuat, prompt siap-tempel, dan cek "selesai".

---

## 0. Konteks proyek (ringkasan — versi aktif ada di `CLAUDE.md`)

**GitAura** — Sign in with GitHub (OAuth) → fetch public stats → AI menulis personality card (`title`, `vibe`, 3 `traits`) → **[Save my Aura]** di BOT Chain dengan tanda tangan server yang membuktikan kamu pemilik akun GitHub tsb → kartu **✓ Verified** + galeri publik. Siapa pun tetap bisa **Peek** username mana pun tanpa login (preview saja, tidak bisa disimpan).

**Stack (berbeda dari PRD — PRD pakai index.html + Cloudflare Worker):**

| Lapisan | Pilihan | Catatan |
|---|---|---|
| Frontend + API | **Next.js 15 (App Router) + TypeScript** | Endpoint Worker di PRD jadi **Route Handlers** `app/api/**/route.ts` |
| Styling | Tailwind CSS v4 | Token warna dari bagian UI di bawah |
| Web3 client | **ethers v6** (MetaMask via `BrowserProvider`) | Sesuai PRD |
| Server signing | ethers v6 `Wallet` (attester key) | Hanya di server |
| Session | `jose` (JWT HS256) di cookie httpOnly | Tanpa database |
| AI | Anthropic API (`@anthropic-ai/sdk`) — model kecil/cepat | Bisa diganti provider lain; isolasi di `lib/ai.ts` |
| Contract | **Solidity ^0.8.20 + Foundry** + OpenZeppelin | Remix tetap boleh untuk cek cepat |
| Hosting | **Vercel** (+ custom domain) | GitHub Pages tidak bisa menjalankan API routes |

**Jaringan:**
- Testnet: chain ID **968**, RPC `https://rpc.bohr.life`, explorer `https://scan.bohr.life`
- Mainnet: chain ID **677**, RPC `https://rpc.botchain.ai`, explorer `https://scan.botchain.ai`
- ⚠️ TODO: konfirmasi nama & simbol native currency BOT Chain (untuk `wallet_addEthereumChain`).

**Aturan keras:**
- Token GitHub **tidak pernah** disimpan & tidak pernah dikirim ke browser. Scope OAuth: **kosong** (public only).
- Tidak ada secret di repo. `.env.local` ada di `.gitignore`; sediakan `.env.example`.
- Attester key = wallet baru khusus signing, **tanpa dana**.
- Tidak ada DB backend, NFT, token, pembayaran, akses repo privat.

---

## 1. Struktur repo target

```
gitaura/
├─ CLAUDE.md
├─ .claude/commands/          # /next-phase, /security-check, /check-states
├─ docs/                      # PRD, BUILD_PLAN, ARCHITECTURE, specs, PROGRESS
├─ contracts/                 # Foundry project
│  ├─ src/GitAura.sol
│  ├─ test/GitAura.t.sol
│  ├─ script/Deploy.s.sol
│  └─ foundry.toml
├─ web/                       # Next.js app
│  ├─ app/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx             # Landing + hero prompt box + aura card + save flow
│  │  ├─ gallery/page.tsx     # Grid semua aura
│  │  ├─ a/[id]/page.tsx      # (opsional) share URL rapi; tetap dukung ?aura=ID
│  │  └─ api/
│  │     ├─ auth/github/login/route.ts
│  │     ├─ auth/github/callback/route.ts
│  │     ├─ auth/me/route.ts
│  │     ├─ auth/logout/route.ts
│  │     ├─ auth/attest/route.ts
│  │     └─ aura/route.ts     # AI
│  ├─ components/             # PromptBox, AuraCard, NavBar, WalletButton, Footer, Voxels, LangMarquee, Badges…
│  ├─ lib/
│  │  ├─ config.ts            # chain, CONTRACT_ADDRESS (satu konstanta), explorer URL
│  │  ├─ abi.ts               # ABI GitAura
│  │  ├─ github.ts            # fetch stats publik + agregasi
│  │  ├─ ai.ts                # prompt + parsing JSON + timeout 8s
│  │  ├─ fallback.ts          # template "The {Lang} {Builder|Explorer|Wizard}"
│  │  ├─ session.ts           # JWT cookie helpers
│  │  ├─ attest.ts            # hash + sign (harus identik dengan kontrak)
│  │  ├─ ratelimit.ts
│  │  └─ wallet.ts            # connect, switch/add chain, contract instance
│  └─ .env.example
└─ README.md
```

---

## 2. Spesifikasi inti (acuan semua fase)

### 2.1 Kontrak `GitAura.sol`

```solidity
address public immutable attester;
struct Aura { address owner; string username; string title; string vibe; uint8 topLang; uint64 savedAt; }
Aura[] public auras;
mapping(bytes32 => uint256) public auraOfUser;   // keccak256(bytes(lowercaseUsername)) => id + 1

function saveAura(
  string calldata username,   // HARUS lowercase (server menandatangani versi lowercase)
  string calldata title,
  string calldata vibe,
  uint8 topLang,
  uint64 expiry,
  bytes calldata sig
) external returns (uint256 id);

function getAura(uint256 id) external view returns (Aura memory);
function total() external view returns (uint256);
event AuraSaved(uint256 indexed id, address indexed owner, string username);
```

**Pesan yang ditandatangani (harus identik di Solidity dan TypeScript):**
```
digest = keccak256(abi.encode(username, msg.sender, expiry, block.chainid, address(this)))
signer = ECDSA.recover(MessageHashUtils.toEthSignedMessageHash(digest), sig)
require(signer == attester)
```
Server: `keccak256(AbiCoder.defaultAbiCoder().encode(["string","address","uint64","uint256","address"], [...]))` lalu `wallet.signMessage(getBytes(digest))`.
Pakai `abi.encode` (bukan `encodePacked`) supaya tidak ada ambiguitas.

**Validasi:** `block.timestamp < expiry`; panjang `username ≤ 39`, `title ≤ 80`, `vibe ≤ 160`; `username` hanya `[a-z0-9-]` (cek loop murah). Jika user sudah punya Aura → **update di tempat** (id sama, `owner`/`title`/`vibe`/`topLang`/`savedAt` baru), event tetap di-emit (riwayat lewat event).

> 💡 Opsional (direkomendasikan jika sempat): ikutkan `keccak256(title, vibe)` di digest agar teks AI tidak bisa diedit sebelum disimpan. MVP boleh tanpa ini — catat di README.

### 2.2 API Route Handlers

| Endpoint | Fungsi |
|---|---|
| `GET /api/auth/github/login` | Buat `state` acak → cookie httpOnly `ga_state` (10 menit) → redirect ke `github.com/login/oauth/authorize?client_id=…&state=…&scope=` |
| `GET /api/auth/github/callback` | Cek `state` == cookie (gagal → redirect `/?login=failed`). Tukar `code` → token, `GET https://api.github.com/user` sekali, **buang token**. Set cookie `ga_session` = JWT `{ login(lowercase), avatar_url }` exp 2 jam. Redirect `/` |
| `GET /api/auth/me` | Kembalikan `{ login, avatar_url }` atau 401 |
| `POST /api/auth/logout` | Hapus cookie |
| `POST /api/auth/attest` | Body `{ wallet }`. Butuh session. Validasi alamat. `expiry = now + 10 menit`. Kembalikan `{ username, expiry, signature }` |
| `POST /api/aura` | Body = ringkasan stats (bukan data mentah). AI → JSON `{ title, vibe, traits[3] }`. Timeout 8 s → `{ fallback: true, ...template }` |

- **CORS / origin:** cek header `Origin` ∈ daftar domain (`ALLOWED_ORIGINS`) untuk POST.
- **Rate limit:** 20 req / IP / jam untuk `/api/aura` & `/api/attest`. In-memory `Map` cukup untuk demo; catat bahwa di Vercel serverless ini tidak global (upgrade: Upstash Redis).
- Endpoint `/api/aura` dirancang generik agar nanti bisa dipakai ChefBOT/PocketLM (`/api/recipes`, `/api/study`, `/api/ask`).

### 2.3 `.env.example`
```
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
SESSION_SECRET=                 # 32+ char random
ATTESTER_PRIVATE_KEY=           # wallet khusus, tanpa dana
ANTHROPIC_API_KEY=
ALLOWED_ORIGINS=http://localhost:3000
NEXT_PUBLIC_CHAIN_ID=968        # 677 di produksi
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
Dua GitHub OAuth App: **dev** (callback `http://localhost:3000/api/auth/github/callback`) dan **prod** (callback domain live).

### 2.4 Stats GitHub (di browser, tanpa key)
- `GET api.github.com/users/{name}` + `/users/{name}/repos?per_page=100&sort=updated`
- Hitung: jumlah repo, followers, top 3 bahasa (berdasar jumlah repo per `language`), total stars, most-starred repo.
- `topLang` (uint8) = indeks ke array bahasa tetap di `lib/config.ts` (mis. 0=Other, 1=TypeScript, 2=JavaScript, 3=Python, 4=Rust, 5=Go, …). Array yang sama dipakai untuk gradient kartu.
- 404 → "No GitHub user by that name"; 0 repo → aura "Fresh account"; 403 → "GitHub needs a breather — try again in a few minutes".

### 2.5 Prompt AI
System: playful, ramah, **tidak pernah menghina**, output **hanya JSON** `{ "title": string ≤80, "vibe": string ≤160, "traits": [3 string ≤24] }`. Input: ringkasan stats. Validasi hasil (skema + panjang); jika gagal parse → fallback template + label "classic aura".

---

## 3. Arah UI (referensi Relume)

- **Mood:** terang, crafted, "AI tool for builders"; kanvas off-white hangat, satu aksen pink panas, voxel 3D playful.
- **Token warna** (taruh di `@theme` Tailwind):
  `bg #F2F0EC` · `surface #FAFAF8` · `border #E4E1DA` · `text #111111` · `muted #5E5B55` · `accent #E83AD6` · `voxel-yellow #F6C945` · `voxel-orange #E8642C`
- **Tipografi:** heading grotesk (Geist / Inter Display via `next/font`), body grotesk, **eyebrow monospace UPPERCASE pink** (Geist Mono).
- **Hero:** eyebrow "READ ANY DEVELOPER'S AURA", headline besar "What's your GitHub aura?", subtitle, lalu **prompt-box card** besar (rounded-3xl, soft shadow, glow pink tipis):
  - tombol hitam **[Sign in with GitHub]** + GitHub mark (ikuti logo guidelines GitHub)
  - divider tipis "or peek at anyone"
  - input `github.com/…` + chip "GitHub", "BOT Chain" + tombol pink **[Peek]**
  - saat loading, prompt-box menampilkan teks berjalan: "Reading repos… → Counting languages… → Sensing the aura…"
- **Nav:** logo kiri; kanan: chip avatar GitHub (saat login) + [Sign out], pill pink **[Connect wallet]** (alamat pendek setelah connect), hamburger di mobile.
- **Badge:** `✓ Verified` (outline pink) untuk kartu tersimpan; `Preview` (abu) untuk kartu peek; `classic aura` untuk fallback.
- **Aura card:** avatar, @username, title AI, vibe satu baris, 3 trait chips, stats (repos · followers · bar top 3 bahasa · repo paling banyak star), gradient dari bahasa teratas.
- **Dekorasi:** kubus voxel isometrik kuning/oranye dengan tekstur grid — **SVG buatan sendiri**, mengintip dari tepi hero & sudut footer.
- **Logo strip:** card rounded dengan marquee lambat berisi nama bahasa (TypeScript, Rust, Python…).
- **How it works:** eyebrow "CHOOSE YOUR PATH" → 3 langkah: Sign in → Reveal → Stamp.
- **Footer (wajib):** eyebrow "STAMPED ON-CHAIN"; prompt-box lebar glow pink berisi teks mono yang diketik: `Built on BOT Chain · chain ID 677 ▉` (kursor berkedip); kanan-bawah: chip **[■ BOT Chain]** → `https://botchain.ai` (tab baru), chip mono alamat pendek `0x12ab…9f3c`, tombol pink **[View on explorer ↗]** → `https://scan.botchain.ai/address/<CONTRACT_ADDRESS>` (tab baru). Voxel di kedua sudut bawah. Baris bawah: "© GitAura 2026" kiri, "Not affiliated with GitHub" kanan (muted). Mobile: chip stack full-width.
- Responsif dari 360px; tanpa horizontal scroll; `prefers-reduced-motion` mematikan marquee & typing.

---

## 4. Fase build (urut, ~6–7 jam)

### Fase 0 — Scaffold (15 menit)
**Prompt Claude Code:**
> Baca `BUILD_PLAN.md`. Buat monorepo sesuai bagian 1: inisialisasi Foundry di `contracts/` (install `OpenZeppelin/openzeppelin-contracts`), dan Next.js 15 App Router + TypeScript + Tailwind v4 di `web/` dengan dependensi `ethers@6`, `jose`, `@anthropic-ai/sdk`, `zod`. Pertahankan `CLAUDE.md`, `docs/`, `.claude/`, dan `web/.env.example` yang sudah ada (jangan ditimpa). Buat `.gitignore` yang mengecualikan `.env*` (kecuali example), `contracts/out`, `contracts/cache`, `broadcast`. Tambahkan script `typecheck` (`tsc --noEmit`) dan `test` (vitest) di `web/package.json`. Jangan tulis fitur dulu.

**Selesai jika:** `forge build` dan `npm run dev` jalan; `git status` tidak berisi secret.

### Fase 1 — Smart contract + test (45 menit)
**Prompt:**
> Implementasikan `contracts/src/GitAura.sol` persis sesuai `docs/CONTRACT_SPEC.md` (§1–§3) dan tulis test sesuai test matrix §4 (pakai OZ `ECDSA` + `MessageHashUtils`, custom errors). Tulis `test/GitAura.t.sol` dengan Foundry: (1) save sukses dengan signature valid dari `vm.sign`, (2) tolak signer salah, (3) tolak expired, (4) tolak jika `msg.sender` beda dengan wallet yang ditandatangani, (5) tolak chainid/kontrak lain (replay), (6) save kedua untuk username sama meng-update id yang sama, (7) batas panjang & karakter username, (8) `total()` dan `getAura()`. Buat `script/Deploy.s.sol` yang membaca `ATTESTER_ADDRESS` dari env.

**Selesai jika:** `forge test -vv` hijau semua.

### Fase 2 — Deploy testnet (15 menit)
**Prompt:**
> Tambahkan profil RPC `bohr` (968) dan `botchain` (677) di `foundry.toml`. Deploy ke testnet dengan `forge script ... --rpc-url bohr --broadcast` memakai attester address dari wallet signing tes. Ekspor ABI ke `web/lib/abi.ts`. Tulis alamat ke `.env.local` sebagai `NEXT_PUBLIC_CONTRACT_ADDRESS`.

(Kamu jalankan deploy sendiri dengan private key deployer di terminal — jangan tempel key ke chat.)

**Selesai jika:** kontrak terlihat di `scan.bohr.life`.

### Fase 3 — Auth GitHub + session (60 menit)
**Prompt:**
> Implementasikan `lib/session.ts` dan route `auth/github/login`, `auth/github/callback`, `auth/me`, `auth/logout` sesuai `docs/API_SPEC.md`. Cookie `httpOnly`, `secure` di produksi, `sameSite=lax`. Username disimpan lowercase. Token GitHub hanya hidup di dalam handler callback. Error/cancel/state mismatch → redirect ke `/?login=failed`.

**Selesai jika:** login lokal menampilkan `{login, avatar_url}` dari `/api/auth/me`; menolak `state` yang diubah manual.

### Fase 4 — Attestation endpoint (30 menit)
**Prompt:**
> Implementasikan `lib/attest.ts` (digest identik dengan kontrak — lihat bagian 2.1) dan `POST /api/auth/attest`. Tambah cek Origin + rate limit (`lib/ratelimit.ts`). Tulis test kecil (vitest) yang menandatangani dengan key tes lalu memverifikasi dengan `verifyMessage` menghasilkan alamat attester. Tambahkan script `web/scripts/attest-e2e.ts` yang memanggil `saveAura` di testnet memakai signature dari fungsi yang sama, untuk membuktikan TS ↔ Solidity cocok.

**Selesai jika:** script e2e berhasil menyimpan aura di testnet.

### Fase 5 — Stats GitHub + AI + fallback (45 menit)
**Prompt:**
> Implementasikan `lib/github.ts` (bagian 2.4), `lib/fallback.ts`, `lib/ai.ts` dan `POST /api/aura` (bagian 2.5) dengan validasi `zod`, timeout 8 detik (`AbortController`), dan fallback. Hanya ringkasan stats yang dikirim ke server.

**Selesai jika:** `curl` ke `/api/aura` mengembalikan JSON valid; dengan API key kosong mengembalikan fallback berlabel classic.

### Fase 6 — UI shell & design system (60 menit)
**Prompt:**
> Bangun design system & layout sesuai `docs/DESIGN_SYSTEM.md` dan teks dari `docs/UI_COPY.md` (buat `lib/copy.ts`): token Tailwind, font, komponen `NavBar`, `PromptBox`, `Eyebrow`, `Chip`, `Badge` (Verified/Preview/Classic), `Voxels` (SVG isometrik buatan sendiri), `LangMarquee`, section "How it works", dan `Footer` lengkap (wajib, dengan `CONTRACT_ADDRESS` dari satu konstanta di `lib/config.ts`). Gunakan data dummy dulu. Responsif mobile & desktop.

**Selesai jika:** landing tampil rapi di 375px dan 1440px; link footer benar.

### Fase 7 — Flow utama (75 menit)
**Prompt:**
> Sambungkan flow end-to-end di `app/page.tsx`: sign-in → loading ticker di prompt box → fetch stats → `/api/aura` → `AuraCard`. Peek username lain → kartu `Preview`, tombol Save disembunyikan ("You can only save your own Aura"). Untuk kartu milik user yang login: `WalletButton` (connect MetaMask, auto switch/add chain via `wallet_switchEthereumChain` → fallback `wallet_addEthereumChain`), lalu [Save my Aura on BOT Chain]: minta `/api/auth/attest` → `saveAura` → tunggu receipt → tampilkan Aura #ID + ✓ Verified, link tx, [Copy share link], [Share on X] (intent tweet dengan link + tag @BOTChain_ai). Jika revert karena expired → minta proof baru dan coba lagi sekali otomatis. Tangani semua state di `docs/UI_COPY.md` §Errors & states, lalu jalankan `/check-states`.

**Selesai jika:** di testnet, alur sign in → reveal → stamp berjalan tanpa reload manual.

### Fase 8 — Gallery & share link (30 menit)
**Prompt:**
> Buat `app/gallery/page.tsx`: baca `total()` lalu `getAura` (newest first, paginasi 24) via `JsonRpcProvider` read-only (tanpa wallet/login). Dukung `/?aura=12` (dan `/a/12`) membuka satu kartu read-only dengan badge Verified; id tidak ada → "Aura not found". Avatar diambil dari `github.com/{username}.png`. Tambah metadata OG per aura (judul = title aura).

**Selesai jika:** link share dibuka di jendela incognito tanpa MetaMask tetap tampil.

### Fase 9 — Mainnet & live (45 menit)
Langkah (sebagian manual):
1. Buat attester wallet produksi (baru, tanpa dana) → deploy kontrak ke mainnet 677 dengan `ATTESTER_ADDRESS` tersebut.
2. Verifikasi/cek kontrak di `scan.botchain.ai`; update `NEXT_PUBLIC_CONTRACT_ADDRESS` & `NEXT_PUBLIC_CHAIN_ID=677`.
3. GitHub OAuth App produksi → callback `https://<domain>/api/auth/github/callback`.
4. Deploy `web/` ke Vercel, isi env vars, sambungkan custom domain, set `ALLOWED_ORIGINS`.

**Prompt:**
> Jalankan `/security-check`, lalu audit repo sebelum go-live: pastikan tidak ada secret ter-commit (`git log -p | grep -i key` dsb.), semua URL chain/explorer membaca dari `lib/config.ts`, footer mengarah ke alamat mainnet, dan tidak ada `console.log` data sensitif.

### Fase 10 — README, demo, submission (45 menit)
**Prompt:**
> Tulis `README.md` berbahasa sederhana: apa itu GitAura, cara kerja verifikasi (diagram singkat OAuth → attest → kontrak), alamat kontrak mainnet + link explorer, link live, cara menjalankan lokal, env vars (tanpa nilai), batasan MVP (judul/vibe tidak ditandatangani jika opsi 2.1 tidak dipakai; rate limit in-memory).

Lalu rekam demo clip (sign in → reveal → stamp) dan post di X dengan tag @BOTChain_ai.

---

## 5. Checklist state (uji manual di Fase 7)

- [ ] Tanpa MetaMask → "Install MetaMask"
- [ ] Jaringan salah → "Switch to BOT Chain"
- [ ] Belum login → Peek jalan; Save = "Sign in with GitHub to save your own Aura"
- [ ] Login batal / gagal / state mismatch → "GitHub sign-in didn't finish — try again"
- [ ] Login tapi peek orang lain → Save tersembunyi
- [ ] Proof expired → minta proof baru & retry otomatis
- [ ] Username tidak ada → "No GitHub user by that name"
- [ ] 0 repo publik → aura "Fresh account"
- [ ] GitHub 403 → "GitHub needs a breather — try again in a few minutes"
- [ ] AI timeout → template + label "classic aura"
- [ ] Tx pending / ditolak / gagal → pesan + retry
- [ ] `?aura=` tidak dikenal → "Aura not found"

## 6. Definition of done (dari PRD)

- [ ] MetaMask connect, alamat pendek, auto switch/add BOT Chain 677
- [ ] Sign in with GitHub, avatar + @username; hanya pemilik bisa save
- [ ] Sign in → aura card → Save tx sukses → ✓ Verified card dimuat dari kontrak via link
- [ ] Kontrak di mainnet, alamat di README + footer, terlihat di scan.botchain.ai
- [ ] Website live (Vercel + custom domain), AI + login jalan di domain live, mobile & desktop
- [ ] Footer BOT Chain lengkap
- [ ] Repo tanpa API key / client secret / signing key
- [ ] Post X dengan demo, tag @BOTChain_ai
