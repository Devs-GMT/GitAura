---
description: Kerjakan fase build GitAura berikutnya (atau fase tertentu jika diberi nomor)
argument-hint: [nomor fase opsional]
---

1. Baca `docs/PROGRESS.md`. Fase target = $ARGUMENTS jika diisi, selain itu fase pertama yang belum ✅.
2. Baca bagian fase itu di `docs/BUILD_PLAN.md`, lalu spesifikasi yang dirujuk (CONTRACT_SPEC, API_SPEC, DESIGN_SYSTEM, UI_COPY, SETUP).
3. Tulis rencana singkat (file yang akan dibuat/diubah) lalu kerjakan.
4. Jalankan cek yang relevan: `forge test -vv` dan/atau `npm run lint && npm run typecheck && npm test`.
5. Pastikan kriteria "Selesai jika" terpenuhi. Jika butuh langkah manual (secret, deploy, OAuth App), berhenti dan tulis instruksinya untuk saya.
6. Update `docs/PROGRESS.md` (status, catatan, keputusan, TODO).
7. Ringkas apa yang berubah dan usulkan pesan commit.
