---
description: Audit keamanan GitAura sebelum commit/deploy
---

Periksa repo dan laporkan temuan (jangan mengubah apa pun kecuali saya minta):

1. Secret ter-commit: cari `PRIVATE_KEY`, `SECRET`, `sk-ant`, `ghp_`, `gho_`, hex 64 char di file yang di-track dan di `git log -p`.
2. File yang memakai `process.env` rahasia punya `import "server-only"` dan tidak diimpor oleh client component.
3. Token GitHub tidak keluar dari handler callback (tidak di cookie, response, atau log).
4. `lib/attest.ts` dan `GitAura.sol` memakai digest identik (urutan & tipe: string, address, uint64, uint256, address; EIP-191 prefix).
5. Username dinormalisasi lowercase sebelum sign.
6. Cookie: httpOnly, secure di produksi, sameSite=lax; `state` diverifikasi.
7. Origin check + rate limit aktif di `/api/aura` dan `/api/auth/attest`.
8. Semua alamat/chain/explorer dari `lib/config.ts`.
9. Output AI divalidasi zod; input ke AI hanya stats (tanpa bio/deskripsi repo).

Format laporan: tabel `cek | status (✅/⚠️/❌) | file:baris | saran`.
