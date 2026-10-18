# Setup & Deploy — GitAura

Langkah yang **kamu** kerjakan manual (Claude Code tidak boleh memegang secret asli).

## 1. Prasyarat
- Node.js 20+ dan npm
- Foundry (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- MetaMask
- Akun GitHub, Vercel, Google AI Studio (Gemini API key, free tier)

## 2. Wallet
| Wallet | Kegunaan | Dana? | Disimpan di |
|---|---|---|---|
| **Deployer** | Deploy kontrak | Ya, sedikit gas (testnet & mainnet) | Hanya di terminal kamu (`--interactive` / keystore cast) |
| **Attester (test)** | Menandatangani proof di lokal/testnet | Tidak | `.env.local` |
| **Attester (prod)** | Menandatangani proof di produksi | Tidak | Env Vercel |

Buat attester: `cast wallet new` → catat address & private key.
Simpan key deployer dengan keystore: `cast wallet import deployer --interactive`, lalu deploy pakai `--account deployer`.

## 3. Chain
| | Testnet | Mainnet |
|---|---|---|
| Chain ID | 968 (`0x3c8`) | 677 (`0x2a5`) |
| RPC | https://rpc.bohr.life | https://rpc.botchain.ai |
| Explorer | https://scan.bohr.life | https://scan.botchain.ai |
| Native currency | `BOT` (BOT, 18 decimals) | `BOT` (BOT, 18 decimals) |

> Sumber: `NEXT_PUBLIC_NETWORK_CURRENCY_*` di `/assets/envs.js` explorer resmi (dicek 2026-10-18). Catatan: chain ID **968** juga terdaftar di chainlist atas nama jaringan lain ("Datagram", DGRAM) — MetaMask bisa menampilkan peringatan "network details don't match" saat menambah testnet; aman diabaikan untuk testnet. Chain 677 belum terdaftar di chainlist.

`nativeCurrency` di `web/lib/config.ts` sudah diisi sesuai tabel di atas.

## 4. GitHub OAuth Apps
GitHub → Settings → Developer settings → OAuth Apps → New.
| | Dev | Prod |
|---|---|---|
| Homepage URL | `http://localhost:3000` | `https://<domain>` |
| Callback URL | `http://localhost:3000/api/auth/github/callback` | `https://<domain>/api/auth/github/callback` |
Ambil Client ID, buat Client Secret.

## 5. Env vars (`web/.env.local` untuk lokal, Vercel untuk produksi)
| Nama | Contoh / cara buat | Publik? |
|---|---|---|
| `GITHUB_CLIENT_ID` | dari OAuth App | tidak |
| `GITHUB_CLIENT_SECRET` | dari OAuth App | **rahasia** |
| `SESSION_SECRET` | `openssl rand -base64 48` | **rahasia** |
| `ATTESTER_PRIVATE_KEY` | dari `cast wallet new` | **rahasia** |
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey → Create API key | **rahasia** |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` (default; lihat API_SPEC §AI) | tidak |
| `ALLOWED_ORIGINS` | `http://localhost:3000` / `https://<domain>` | tidak |
| `NEXT_PUBLIC_CHAIN_ID` | `968` / `677` | ya |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | hasil deploy | ya |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` / `https://<domain>` | ya |

`contracts/.env` (tidak di-commit): `ATTESTER_ADDRESS=0x...`

## 6. Deploy kontrak
```bash
cd contracts
forge test -vv
# testnet
ATTESTER_ADDRESS=0x<test-attester> forge script script/Deploy.s.sol --rpc-url bohr --account deployer --broadcast
# mainnet (setelah semua fase lolos di testnet)
ATTESTER_ADDRESS=0x<prod-attester> forge script script/Deploy.s.sol --rpc-url botchain --account deployer --broadcast
```
Cek alamat di explorer, lalu isi `NEXT_PUBLIC_CONTRACT_ADDRESS`.
Jika explorer mendukung verifikasi (Blockscout-like), coba `forge verify-contract`; kalau tidak, upload source manual.

## 7. Deploy web (Vercel)
1. Import repo di Vercel, **Root Directory = `web`**.
2. Isi semua env vars produksi.
3. Tambah custom domain → update OAuth App prod + `ALLOWED_ORIGINS` + `NEXT_PUBLIC_SITE_URL`.
4. Redeploy, uji login + AI + save di domain live (mobile & desktop).

## 8. Checklist keamanan sebelum push
- [ ] `git ls-files | grep -E '\.env($|\.)'` hanya mengembalikan `.env.example`
- [ ] `git log -p | grep -iE 'private_key|secret|AIza'` kosong
- [ ] Attester prod ≠ attester test
- [ ] `broadcast/` tidak berisi key (aman, tapi boleh di-gitignore)
