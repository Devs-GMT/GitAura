# GitAura — PRD (MVP)

> Versi PRD yang sudah disesuaikan dengan stack **Next.js + Solidity (Foundry)**. Perubahan dari PRD asli ditandai **[Next.js]**.

**One-liner:** Sign in with GitHub — AI membaca profil publikmu dan menulis developer personality card, yang kamu simpan di BOT Chain sebagai link wallet ↔ GitHub yang terverifikasi, lalu dibagikan.

**Kategori:** AI · Community · **Feasibility:** 🟡 Medium · **Target:** ~6–7 jam · **Build Week:** 1

## 1. Must-haves (definition of done)
- [ ] **MetaMask wallet connect** — tombol Connect, alamat pendek, auto-switch/add BOT Chain mainnet (chain ID 677)
- [ ] **Sign in with GitHub** — OAuth login menampilkan avatar + @username; hanya pemilik yang login bisa menyimpan Aura terverifikasinya
- [ ] **Fitur inti** — Sign in → AI aura card → tx [Save my Aura] sukses → kartu ✓ Verified dimuat dari kontrak via link
- [ ] **Mainnet deployment** — kontrak di BOT Chain mainnet, alamat di README + footer, terlihat di scan.botchain.ai
- [ ] **Website live** — **[Next.js]** Vercel + custom domain (frontend + API dalam satu deploy), jalan di mobile & desktop
- [ ] **Footer BOT Chain** — logo BOT Chain klikable → botchain.ai + View on explorer → kontrak mainnet

## 2. User flow
1. **Landing** — eyebrow mono pink "READ ANY DEVELOPER'S AURA", headline "What's your GitHub aura?", prompt-box card dengan dua jalur: utama [Sign in with GitHub], sekunder input "github.com/…" + [Peek] (preview saja).
2. **GitHub login** — halaman authorize GitHub → kembali ke GitAura dengan chip avatar "Signed in as @username" + [Sign out].
3. **Loading** — prompt box: "Reading repos… → Counting languages… → Sensing the aura…".
4. **Aura card** — avatar, @username, title AI, vibe satu baris, 3 trait chips, stats (repos · followers · bar top 3 bahasa · repo paling banyak star), gradient dari bahasa teratas.
5. **Save** — Connect MetaMask → [Save my Aura on BOT Chain] → situs minta signed proof ke server → MetaMask → sukses: Aura #ID + ✓ Verified, link tx, [Copy share link], [Share on X].
6. **Gallery** — grid semua aura tersimpan (terbaru dulu); `?aura=12` membuka satu kartu read-only tanpa wallet/login.

## 3. Core logic
- **OAuth:** GitHub OAuth App, callback = **[Next.js]** `/api/auth/github/callback`. Tanpa scope. Tukar code → token, `GET /user` sekali, buang token. `state` acak untuk mencegah login forgery.
- **Ownership proof:** server mengembalikan signature berumur pendek dari attester key atas (username, wallet, expiry, chainid, contract); kontrak memverifikasinya.
- **Stats:** browser mengambil `api.github.com/users/{name}` + `/repos?per_page=100&sort=updated` (tanpa key; 60 req/jam per pengunjung).
- **AI:** hanya ringkasan stats yang dikirim ke server; jawaban JSON `{ title, vibe, traits[3] }` — playful, ramah, tidak menghina.
- **Fallback:** AI gagal / timeout 8 s → template "The {TopLanguage} {Builder|Explorer|Wizard}".
- Satu Aura terverifikasi per username; save ulang = update (riwayat lewat event).

## 4. Server **[Next.js Route Handlers, menggantikan Worker]**
Lihat `API_SPEC.md`. Endpoint: login, callback, me, logout, attest, aura. Secrets: AI key, GitHub client secret, attester private key, session secret. Origin check + rate limit 20 req/IP/jam. Endpoint AI dirancang reusable untuk ChefBOT/PocketLM.

## 5. Smart contract
Lihat `CONTRACT_SPEC.md`. Tanpa token/pembayaran. Hanya info publik GitHub yang disimpan.

## 6. Tech stack
- **[Next.js]** Frontend + API: Next.js 15 App Router, ethers v6, Tailwind
- **[Foundry]** Contract: testnet (968, `https://rpc.bohr.life`, scan.bohr.life) → mainnet (677, `https://rpc.botchain.ai`, scan.botchain.ai)
- Dua GitHub OAuth App: dev & prod

## 7. UI direction
Referensi Relume. Detail di `DESIGN_SYSTEM.md`, teks di `UI_COPY.md`.

## 8. States
Lihat `UI_COPY.md` §Errors & states.

## 9. Footer (wajib)
Prompt-box bergaya Relume dengan eyebrow "STAMPED ON-CHAIN", teks ketik `Built on BOT Chain · chain ID 677 ▉`, chip [■ BOT Chain] → botchain.ai, chip alamat pendek, tombol [View on explorer ↗]. Detail di `DESIGN_SYSTEM.md`.

## 10. Out of scope (MVP)
Repo/kode privat, write access GitHub, menyimpan token GitHub, NFT, edit kartu orang lain, komentar/likes, database backend.

## 11. Submission checklist
- [ ] Alamat kontrak mainnet
- [ ] Link website live (GitHub sign-in + AI jalan di domain live)
- [ ] Repo GitHub dengan `GitAura.sol` + README sederhana (tanpa API key, client secret, signing key)
- [ ] Post X dengan demo clip, tag @BOTChain_ai
