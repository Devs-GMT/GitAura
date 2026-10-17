# Spesifikasi API (Next.js Route Handlers)

Semua di `web/app/api/**/route.ts`, runtime `nodejs`. Error JSON: `{ "error": { "code": "SNAKE_CASE", "message": "..." } }`.

## Umum
- **Origin check** (POST): `Origin` harus ada di `ALLOWED_ORIGINS` (dipisah koma) → selain itu `403 FORBIDDEN_ORIGIN`.
- **Rate limit:** `/api/aura` dan `/api/auth/attest` → 20 req / IP / jam. IP dari `x-forwarded-for` (ambil pertama). Lewat batas → `429 RATE_LIMITED` + header `Retry-After`.
- **Body max:** 4 KB → `413 BODY_TOO_LARGE`.
- File yang memakai secret: `import "server-only"`.

## Cookies
| Nama | Isi | Atribut | Umur |
|---|---|---|---|
| `ga_state` | string acak 32 byte (base64url) | httpOnly, secure(prod), sameSite=lax, path=/api/auth | 10 menit |
| `ga_session` | JWT HS256 `{ sub: login(lowercase), avatar: url }` | httpOnly, secure(prod), sameSite=lax, path=/ | 2 jam |
| `ga_return` (opsional) | path kembali setelah login | sama dengan ga_state | 10 menit |

---

### `GET /api/auth/github/login`
- Buat `state`, set `ga_state`.
- Redirect 302 → `https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&redirect_uri={SITE_URL}/api/auth/github/callback&state={state}&allow_signup=true` (tanpa `scope`).

### `GET /api/auth/github/callback?code&state`
1. `error` param ada (user batal) atau `state` ≠ cookie → hapus `ga_state`, redirect `/?login=failed`.
2. `POST https://github.com/login/oauth/access_token` (Accept: application/json) dengan client_id, client_secret, code, redirect_uri.
3. `GET https://api.github.com/user` (Authorization: Bearer token, User-Agent: GitAura).
4. Token dibuang (variabel lokal saja; jangan log).
5. Set `ga_session`, hapus `ga_state`, redirect `/?login=ok`.
6. Gagal di langkah mana pun → redirect `/?login=failed`.

### `GET /api/auth/me`
- 200 `{ "login": "octocat", "avatar": "https://..." }`
- 401 `NOT_SIGNED_IN`

### `POST /api/auth/logout`
- Hapus `ga_session`. 204.

### `POST /api/auth/attest`
Request: `{ "wallet": "0x..." }` (zod: `isAddress`, di-`getAddress` jadi checksum)
Response 200:
```json
{ "username": "octocat", "wallet": "0xAbC...", "expiry": "1760700000", "signature": "0x...", "chainId": 677, "contract": "0x..." }
```
- `expiry` = `now + 600` detik, dikirim sebagai string (bigint-safe).
- Errors: 401 `NOT_SIGNED_IN`, 400 `INVALID_WALLET`, 403, 429, 500 `SIGNER_NOT_CONFIGURED`.

### `POST /api/aura`
Request (zod):
```json
{
  "login": "octocat",
  "name": "The Octocat",
  "publicRepos": 8,
  "followers": 1200,
  "accountAgeYears": 15,
  "totalStars": 3400,
  "topLanguages": [{ "name": "Ruby", "share": 0.5 }, { "name": "JavaScript", "share": 0.3 }],
  "mostStarred": { "name": "Spoon-Knife", "stars": 12000 },
  "recentActivity": "active"   // "active" | "quiet" | "dormant" (dari pushed_at terbaru)
}
```
- Batas: `topLanguages` maks 3, string ≤ 60 char. **Jangan** kirim bio/deskripsi repo (risiko prompt injection).

Response 200:
```json
{ "title": "The Midnight TypeScript Wizard", "vibe": "Ships at 2am, documents at 2pm.", "traits": ["Type-safe", "Night owl", "Open-source heart"], "source": "ai" }
```
Fallback (AI error / timeout 8 s / output invalid / key kosong):
```json
{ "title": "The Ruby Builder", "vibe": "...", "traits": [...], "source": "fallback" }
```
- Validasi output AI: title 1–80, vibe 1–160, tepat 3 traits masing-masing 1–24 char.

### AI prompt (di `lib/ai.ts`)
- System: "You write playful, kind developer personality cards from GitHub stats. Never insult, never mention numbers being low, never reference real-world identity traits. Reply with ONLY minified JSON: {\"title\":string<=80,\"vibe\":string<=160,\"traits\":[3 strings<=24]}. Title format like 'The {Adjective} {Language} {Archetype}'."
- User: JSON stats.
- **Provider: Google Gemini API** (free tier). `POST https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent`, header `x-goog-api-key: {GEMINI_API_KEY}`. Body: `systemInstruction`, `contents` (stats JSON), `generationConfig: { responseMimeType: "application/json", responseSchema, temperature ~0.9, maxOutputTokens ~400 }`.
- Model default `gemini-3.5-flash-lite` (stable, tercepat & termurah, gratis di free tier); alternatif `gemini-3.8-flash` (lebih kreatif, kuota free lebih ketat). Ganti via env `GEMINI_MODEL` tanpa ubah kode.
- Free tier: konten request **boleh dipakai Google untuk meningkatkan produk** → hanya ringkasan stats publik yang dikirim (tidak ada bio/data pribadi). Kuota free per model dicek di AI Studio; 429 dari Gemini → fallback.
- Parse aman (`JSON.parse` dalam try, ambil blok `{...}` pertama), lalu validasi zod.

### Reuse (ChefBOT / PocketLM)
Pisahkan `lib/ai.ts` menjadi `callJson<T>(system, user, schema, timeoutMs)` generik supaya route lain (`/api/recipes`, `/api/study`, `/api/ask`) cukup memasok prompt + zod schema.
