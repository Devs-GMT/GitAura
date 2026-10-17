# Design System — GitAura (referensi Relume)

Mood: terang, crafted, "AI tool for builders". Kanvas off-white hangat, **satu** aksen pink panas, voxel 3D playful. Banyak whitespace, kartu rounded besar, bayangan lembut.

## 1. Token (Tailwind v4 `@theme` di `app/globals.css`)
```css
@theme {
  --color-bg: #F2F0EC;
  --color-surface: #FAFAF8;
  --color-border: #E4E1DA;
  --color-ink: #111111;
  --color-muted: #5E5B55;
  --color-accent: #E83AD6;
  --color-accent-soft: #FBE3F8;
  --color-voxel-yellow: #F6C945;
  --color-voxel-orange: #E8642C;
  --color-success: #1F8A4C;
  --color-danger: #D23B3B;

  --radius-card: 28px;
  --radius-pill: 999px;
  --shadow-card: 0 1px 2px rgb(17 17 17 / .04), 0 12px 32px -12px rgb(17 17 17 / .12);
  --shadow-glow: 0 0 0 1px rgb(232 58 214 / .10), 0 20px 60px -20px rgb(232 58 214 / .35);

  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;
}
```
Font via `next/font` (paket `geist`). Body `bg-bg text-ink`.

## 2. Tipografi
| Peran | Ukuran (mobile → desktop) | Gaya |
|---|---|---|
| Display (hero H1) | 44 → 80px, leading 1.0, tracking -0.03em | sans 600 |
| H2 section | 32 → 48px, tracking -0.02em | sans 600 |
| Aura title | 26 → 34px | sans 600 |
| Body | 16 → 18px, leading 1.55 | sans 400, `text-muted` untuk subtitle |
| **Eyebrow** | 12–13px, tracking 0.12em, UPPERCASE | **mono 500, `text-accent`** |
| Chip/label | 13px | mono atau sans 500 |

## 3. Layout
- Container maks 1200px, gutter 16px (mobile) / 32px (desktop).
- Section padding vertikal 72px mobile / 120px desktop.
- Breakpoint uji: 360, 375, 768, 1024, 1440. Tanpa horizontal scroll.

## 4. Komponen
| Komponen | Spesifikasi |
|---|---|
| `NavBar` | Sticky, `bg-bg/80 backdrop-blur`, tinggi 64px. Kiri: logo (wordmark "GitAura" + titik pink). Kanan: `AvatarChip` (saat login) + `WalletButton` (pill pink) + hamburger (< md, buka sheet berisi Gallery, How it works, Sign out). |
| `PromptBox` | Card `surface`, radius-card, border 1px `border`, `shadow-card` + `shadow-glow`. Padding 24/32px. Slot: aksi utama, divider, input baris. Mode `loading` menampilkan `TickerText`. |
| `GitHubButton` | Hitam `#111`, teks putih, radius 14px, tinggi 52px, ikon Octocat mark resmi (SVG dari GitHub logo guidelines, tidak diubah warnanya selain hitam/putih). |
| `Divider` | Garis tipis dengan label tengah mono kecil "or peek at anyone". |
| `PeekInput` | Prefix statis `github.com/` (muted) + input; chip "GitHub" & "BOT Chain" (outline, mono kecil); tombol pink [Peek]. Enter = submit. |
| `Chip` | Pill, border `border`, bg `surface`, 13px. Varian `accent` (outline pink). |
| `Badge` | `Verified`: outline pink + ✓; `Preview`: bg `#ECEAE5` teks muted; `Classic`: outline muted, label "classic aura". |
| `AuraCard` | Radius-card, header gradient dari `topLang` (tabel di CONTRACT_SPEC §5) dengan grain halus; avatar 72px ring putih; @username mono; title besar; vibe muted; 3 `Chip` traits; stats grid 2×2 (repos, followers, stars, most-starred); bar bahasa bertumpuk (3 warna) dengan legend. Rasio ramah screenshot (≈ 4:5 di mobile). |
| `SaveBar` | Di bawah AuraCard: status langkah (Connect → Prove → Sign → Confirmed) + tombol utama. |
| `SuccessPanel` | "Aura #ID" + Verified badge, link tx (explorer), [Copy share link], [Share on X]. |
| `TickerText` | Mono, ganti kalimat tiap ~900ms dengan fade + caret ▉ berkedip. |
| `Voxels` | SVG isometrik buatan sendiri: kubus 3 sisi (top lebih terang), isi kuning/oranye, tekstur grid tipis (pattern 6px, opacity 0.15). Prop `corner`, `size`, `rotate`. Posisi absolute, `pointer-events-none`, sebagian keluar layar. |
| `LangMarquee` | Card rounded berisi baris nama bahasa (mono, muted) bergulir pelan (40s loop), mask fade di kiri-kanan. |
| `HowItWorks` | Eyebrow "CHOOSE YOUR PATH" + H2, lalu 3 `StepCard` bergaya Relume (split card, sisi visual bergantian). Teks: ikon tile pink, eyebrow, heading 28→36px, body muted, CTA, garis, 3 fitur (ikon kotak + judul + 1 baris muted). Visual: panel berwarna (kuning / pink / oranye — pakai warna aksen & voxel saja) dengan grid putih 24px, tepi "pixel" bertangga ke sisi teks, mockup buatan sendiri (`SignInMock`, `RevealMock`, `StampMock`) terpotong keluar panel. Mobile: visual di atas, teks di bawah. |
| `GalleryGrid` | 1 / 2 / 3 kolom; kartu mini (gradient strip, avatar, title, @username, Verified). Skeleton saat load. |
| `Footer` | Lihat §6. |
| `Toast` | Pojok bawah, untuk "Link copied", error tx. |

## 5. Halaman
**`/` (landing)**
1. Hero: eyebrow → H1 "What's your GitHub aura?" → subtitle → `PromptBox`. `Voxels` mengintip dari kiri-atas & kanan-bawah hero.
2. Hasil: `AuraCard` + `SaveBar` muncul menggantikan/di bawah PromptBox (scroll halus ke kartu).
3. `LangMarquee`
4. `HowItWorks`
5. Teaser galeri (6 aura terbaru) + link "See all auras →"
6. `Footer`

**`/gallery`** — header kecil + `GalleryGrid` + "Load more".
**`/?aura=ID` atau `/a/[id]`** — satu `AuraCard` read-only + Verified + tombol "Find your own aura".

## 6. Footer (wajib)
- Eyebrow "STAMPED ON-CHAIN".
- Prompt-box lebar (glow pink) berisi teks mono diketik: `Built on BOT Chain · chain ID 677` + caret ▉ berkedip.
- Kanan-bawah box: chip **[■ BOT Chain]** (logo BOT Chain) → `https://botchain.ai`; chip mono abu alamat pendek `0x12ab…9f3c`; tombol pink **[View on explorer ↗]** → `{EXPLORER}/address/{CONTRACT_ADDRESS}`. Semua `target="_blank" rel="noopener noreferrer"`.
- Voxels di kedua sudut bawah.
- Baris bawah: "© GitAura 2026" (kiri), "Not affiliated with GitHub" (kanan, muted).
- Mobile: chip & tombol stack full-width.

## 7. Motion & aksesibilitas
- Transisi 150–250ms ease-out; kartu aura masuk dengan scale 0.98→1 + fade.
- `prefers-reduced-motion`: matikan marquee, typing, ticker (tampilkan teks final).
- Kontras: teks pink hanya untuk eyebrow/label besar. **Tombol/CTA pink selalu teks putih semibold** (keputusan 2026-10-17, gaya Relume) — rasio putih di `#E83AD6` ≈ 3,5:1 (di bawah AA 4,5:1 untuk teks normal); kompensasi: label ≥ 14px semibold, tombol tinggi ≥ 36px, focus ring jelas.
- Semua tombol punya `aria-label` bila ikon saja; focus ring 2px pink offset 2px.
- Gambar avatar `alt="@username avatar"`.

## 8. Larangan
- Jangan menyalin aset, ilustrasi, atau logo Relume — hanya gaya.
- Jangan pakai lebih dari satu aksen warna selain voxel.
- Jangan ubah logo GitHub (warna, proporsi).
