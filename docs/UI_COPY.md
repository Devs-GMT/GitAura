# UI Copy — GitAura

Pakai teks ini **persis** (bahasa Inggris). Simpan di `web/lib/copy.ts` sebagai satu objek konstanta.

## Meta
- Site title: `GitAura — What's your GitHub aura?`
- Description: `Sign in with GitHub, let AI read your public profile, and stamp your developer aura on BOT Chain.`
- OG per aura: `{title} — @{username} · GitAura`

## Nav
- Logo: `GitAura`
- Wallet: `Connect wallet` → setelah connect: `0x12ab…9f3c`
- Avatar chip: `@{username}` · menu: `Sign out`
- Menu mobile: `Gallery`, `How it works`

## Hero
- Eyebrow: `READ ANY DEVELOPER'S AURA`
- H1: `What's your GitHub aura?`
- Subtitle: `Sign in with GitHub and AI reads your public profile, then turns it into a personality card you can stamp on-chain.`
- Primary: `Sign in with GitHub`
- Divider: `or peek at anyone`
- Input placeholder: `username`  (prefix statis `github.com/`)
- Chips: `GitHub` · `BOT Chain`
- Peek button: `Peek`

## Loading ticker
1. `Reading repos…`
2. `Counting languages…`
3. `Sensing the aura…`

## Aura card
- Stats labels: `Repos` · `Followers` · `Stars` · `Most starred`
- Languages legend title: `Top languages`
- Badges: `✓ Verified` · `Preview` · `classic aura`
- Fresh account vibe (0 repo): title `The Fresh Account`, vibe `A blank canvas with main-character energy.`, traits `Just getting started`, `Full of potential`, `First commit loading`

## Save flow
- Button (signed in, own card): `Save my Aura on BOT Chain`
- Button (not signed in): `Sign in with GitHub to save your own Aura`
- Note (peeking someone else while signed in): `You can only save your own Aura`
- Steps: `Connect wallet` → `Getting your proof…` → `Confirm in MetaMask…` → `Stamping on BOT Chain…`
- Success heading: `Aura #{id} is stamped`
- Success links: `View transaction ↗` · `Copy share link` · `Share on X`
- Copied toast: `Link copied`
- X intent text: `My GitHub aura: "{title}" ✨ Stamped on @BOTChain_ai — find yours: {url}`

## How it works
- Eyebrow: `CHOOSE YOUR PATH`
- H2: `Three steps to your aura`
- 1 `Sign in` — `Log in with GitHub. We only read your public profile.`
- 2 `Reveal` — `AI turns your repos and languages into a personality card.`
- 3 `Stamp` — `Save it on BOT Chain as a verified wallet ↔ GitHub link.`

Kartu fitur (gaya Relume split card; eyebrow · heading · body di atas · 3 fitur):
| Step | Eyebrow | Heading | Fitur (judul — keterangan) | CTA |
|---|---|---|---|---|
| 1 | `01 · Sign in` | `Prove it's really you, in one click` | `Public data only` — `No OAuth scopes, no private repos, no write access.` · `Token never stored` — `Used once to read your username, then thrown away.` · `Peek without signing in` — `Preview anyone's aura — only owners can save theirs.` | `Sign in with GitHub` |
| 2 | `02 · Reveal` | `AI reads your repos and writes your aura` | `Built from real stats` — `Repos, followers, stars and your top 3 languages.` · `Always kind` — `Playful titles and vibes — never a roast.` · `Never stuck` — `If the AI is slow, you still get a classic aura.` | `Peek at anyone` |
| 3 | `03 · Stamp` | `Stamp it on BOT Chain, verified` | `Signed proof` — `Our server signs your username and wallet; the contract checks it.` · `One aura per account` — `Stamp again anytime to refresh your card.` · `Shareable link` — `Every stamped aura gets its own page.` | `View on explorer ↗` · `See all auras →` |

## Gallery
- H1: `Aura gallery`
- Subtitle: `Every card here was stamped by its GitHub owner.`
- Empty: `No auras yet — be the first to stamp yours.`
- Load more: `Load more`
- Teaser link: `See all auras →`
- Single-card CTA: `Find your own aura`

## Footer
- Eyebrow: `STAMPED ON-CHAIN`
- Typed text: `Built on BOT Chain · chain ID 677`
- Chip: `BOT Chain`
- Button: `View on explorer ↗`
- Bottom: `© GitAura 2026` · `Not affiliated with GitHub`

## Errors & states
| Kondisi | Teks | Aksi |
|---|---|---|
| MetaMask tidak ada | `Install MetaMask` | link ke metamask.io (tab baru) |
| Jaringan salah | `Switch to BOT Chain` | panggil switch/add chain |
| Login batal/gagal/state mismatch (`?login=failed`) | `GitHub sign-in didn't finish — try again` | tombol `Try again` |
| Username tidak ditemukan (404) | `No GitHub user by that name` | — |
| GitHub rate limit (403) | `GitHub needs a breather — try again in a few minutes` | — |
| Input kosong / tidak valid | `Enter a GitHub username` | — |
| AI fallback | badge `classic aura` | — |
| Proof expired | (otomatis minta proof baru, tanpa pesan; jika gagal lagi:) `Your proof expired — try saving again` | `Retry` |
| Tx ditolak user | `Transaction cancelled` | `Retry` |
| Tx gagal | `Something went wrong on-chain — try again` | `Retry` |
| Tx pending lama | `Still stamping… this can take a moment` | link tx |
| Rate limit server (429) | `Slow down a little — try again later` | — |
| `?aura=` tidak dikenal | `Aura not found` | `Find your own aura` |
| Galeri gagal dimuat | `Couldn't load auras — refresh to try again` | — |
