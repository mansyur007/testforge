# TestForge — Audit Aplikasi & User Flows

> Disusun 2026-06-14. Snapshot kondisi `main` setelah migrasi ke **OAuth-only auth**.
> Untuk di-review santai — bukan untuk dieksekusi. Bagian ⚠️ = hal yang sebaiknya Anda putuskan/lihat.

---

## 1. Ringkasan

TestForge = platform **Test Case Management** open-source (alternatif TestRail/Zephyr).
- **Stack:** Next.js 14 (App Router) · React 18 · Prisma + SQLite (portable ke Postgres) · Tailwind · JWT session (jose) · TypeScript.
- **Deploy:** Docker Compose di VPS `103.169.207.239`, di-front Caddy stack Tokopudidi, domain `testforge.emha.space`. Auto-deploy via GitHub Actions saat push ke `main`.
- **Bahasa UI:** dwibahasa (EN/ID) via `src/lib/i18n.ts` + cookie `tf_lang`.
- **Build status:** `tsc` ✅ · `next build` ✅ · OAuth route live & terverifikasi (307 → provider).

---

## 2. Autentikasi & Kontrol Akses

### Login/Signup — OAuth saja (Google + GitHub)
- Satu route menangani initiate + callback: `src/app/api/auth/oauth/[provider]/route.ts`.
- Alur: tombol → redirect ke provider (set cookie `state` CSRF, httpOnly) → callback validasi `state` → tukar `code`→token → ambil profil/email → buat user (`emailVerifiedAt` langsung terisi) → buat session → redirect `/onboarding` (user baru) atau `/dashboard`.
- GitHub: fallback ambil email primary terverifikasi bila profil menyembunyikan email.
- Session: JWT di cookie `tf_session`, httpOnly, 1 hari (default) / 30 hari. Disetel `rememberMe=true` untuk OAuth.

### Role / RBAC
- **Role global user:** `ADMIN | MEMBER | VIEWER`. **User pertama di DB jadi ADMIN otomatis** (`userCount === 0`).
- **Role per-proyek (`ProjectMember`):** `OWNER | ADMIN | MEMBER | VIEWER`. Pembuat proyek jadi `OWNER`.
- **Penegakan:** `VIEWER` ditolak menulis (buat proyek/case/run). Guard `requireSession()` di `(app)/layout.tsx` melindungi seluruh area aplikasi (tidak ada `middleware.ts`; proteksi per-layout/page).

### API untuk CI/CD
- API Key (Bearer) — disimpan sebagai hash SHA-256, hanya prefix 8-char ditampilkan.
- `POST /api/v1/junit` — auth **wajib** API key.
- `GET/POST /api/v1/projects/[slug]/cases` — terima **session ATAU** API key.

⚠️ **Hal untuk Anda review (auth):**
1. **Tidak ada password fallback.** Jika 4 env OAuth salah/expired → tidak ada yang bisa login. Tidak ada "break-glass" admin.
2. **First-login-jadi-admin.** Di prod DB kosong, siapa pun yang login duluan = ADMIN. Pastikan Anda yang pertama (sudah diingatkan).
3. **Admin seed lama** (`admin@testforge.local` + password) kini tidak bisa login — jadi data demo yatim.

---

## 3. Inventaris Fitur

| Area | Route | Fungsi | Tulis ditolak utk VIEWER |
|---|---|---|---|
| **Landing** | `/` | Marketing: features, comparison, demo, integrations, testimonials, FAQ. Dwibahasa. | — |
| **Auth** | `/login`, `/signup`, `/register`→`/signup` | OAuth Google/GitHub. | — |
| **Onboarding** | `/onboarding` | Wizard 3 langkah: buat proyek pertama (template blank/web/mobile/api) → undang tim → minat integrasi. | — |
| **Dashboard** | `/dashboard` | Ringkasan lintas proyek. | — |
| **Proyek** | `/projects`, `/projects/[slug]` | List + buat proyek; tab suite/case, milestone. | ✅ |
| **Test Case** | `.../cases/new`, `.../cases/[id]`, `.../[id]/edit` | CRUD case: judul, langkah (JSON action/expected), preconditions, priority, type, status, automationStatus, tags, assignee, linked issues. Clone, soft-delete, **bulk edit**. | ✅ |
| **Suite/Section** | dalam `/projects/[slug]` | Hierarki rekursif (suite → section via `parentId`). | ✅ |
| **Test Run** | `.../runs`, `.../runs/new`, `.../runs/[id]` | Buat run (pilih case), eksekusi hasil (PASSED/FAILED/BLOCKED/SKIPPED/dll + komentar, waktu, defect URL), selesaikan run, **rerun failed**. | ✅ |
| **Reports** | `.../reports` | Statistik hasil run per proyek. | — |
| **Import** | `.../import`, `POST /api/import/cases` | Import test case dari **CSV** (papaparse). Template tersedia. | ✅ |
| **Export** | `/api/export/cases`, `/api/export/run` | Export case & hasil run. | — |
| **API Keys** | `/settings/api-keys` | Buat/hapus API key utk CI/CD. | — |
| **Audit Log** | `/settings/audit-log` | Riwayat aksi (login, CRUD, dll). | — |
| **CI/CD API** | `/api/v1/junit`, `/api/v1/projects/[slug]/cases` | Ingest hasil JUnit XML; baca/tulis case via API. | via API key |
| **Docs** | `/docs/self-hosting` | Panduan self-host (env, Docker, VPS). | — |
| **Legal** | `/terms`, `/privacy` | Halaman statik. | — |

---

## 4. User Flows (end-to-end)

**A. Onboarding pengguna baru**
`/login` → klik Continue with Google/GitHub → consent provider → callback → user dibuat (verified) → session → `/onboarding` → buat proyek pertama (pilih template → suite otomatis dibuat) → undang tim (opsional) → pilih minat integrasi → `completeOnboarding` set `onboardedAt` → `/dashboard`.

**B. Bikin & jalankan test**
`/projects` → buat proyek (jadi OWNER) → buat suite/section → tambah test case (langkah, priority, assignee…) → `/runs/new` pilih case → buat run → eksekusi: tandai tiap hasil + komentar/defect → selesaikan run → lihat `/reports`. Bisa **rerun failed** untuk run lanjutan.

**C. Integrasi CI/CD**
`/settings/api-keys` buat key → di pipeline kirim `POST /api/v1/junit` (header `Authorization: Bearer <key>`) dengan JUnit XML → hasil masuk sebagai run otomatis (`source=JUNIT`).

**D. Import massal**
`/projects/[slug]/import` → unduh template CSV → upload → preview → commit ke proyek.

**E. Logout** — tombol "Keluar" di sidebar → `clearSession` → `/login`.

---

## 5. Model Data (13 entitas)

`User` · `Organization` · `Project` · `ProjectMember` · `Milestone` · `TestSuite` (rekursif) · `TestCase` · `TestRun` · `TestRunResult` · `ApiKey` · `Invitation` · `VerificationToken` · `AuditLog`.

Catatan penting:
- `TestCase.seq` + `Project.caseCounter` → ID terbaca `TC-[SLUG]-[seq]`.
- `TestCase.deletedAt` → soft delete (query selalu filter `deletedAt: null`).
- `User.organizationId` **nullable** → app berjalan tanpa org.
- Cascade delete dipasang rapi (hapus proyek → suite/case/run/result ikut terhapus).

---

## 6. ⚠️ Temuan & Gap untuk Review

**Sisa dari migrasi OAuth (kebersihan, bukan bug):**
1. **`VerificationToken`** masih ada di schema tapi tak terpakai lagi (flow verifikasi/reset dihapus). Bisa di-drop saat migrasi DB berikutnya.
2. **`User.passwordHash`** masih `NOT NULL`; OAuth mengisinya dengan random bytes. Aman, tapi kolom jadi misleading. Pertimbangkan jadikan nullable.
3. **i18n** masih menyimpan banyak string mati (form email/password, verifyEmail, forgotPassword). Tidak berbahaya, sekadar berdebu.

**Flow yang belum tuntas (sudah ada sebelum sesi ini):**
4. **Undangan tim = jalan buntu.** `onboardingInvite` membuat record `Invitation` tapi **tidak ada email terkirim** (tak ada SMTP) **dan tidak ada halaman accept-invite**. Orang yang diundang tak punya cara masuk selain login OAuth sendiri (lalu jadi user tanpa org). → Fitur "undang tim" praktis kosmetik saat ini.
5. **Org tidak pernah dibuat untuk user OAuth.** Onboarding membuat *project*, bukan *organization*. Jadi `organizationId` selalu null untuk user OAuth. Tidak crash (org opsional), tapi fitur berbasis org (undangan) tak berfungsi.
6. **Soft-delete tanpa recycle bin.** Case di-`deletedAt` tapi tidak ada UI restore/trash. Terhapus = hilang dari UI selamanya.

**Operasional / keamanan:**
7. **Tidak ada break-glass login** (lihat §2). Risiko lockout jika OAuth bermasalah.
8. **Client secret OAuth ada di riwayat chat** sesi ini → pertimbangkan rotate.
9. **Rate-limit lockout** dulu ada untuk login password; kini tak relevan (OAuth). Tidak ada rate-limit khusus di route OAuth selain proteksi `state`.
10. **`AUTH_SECRET`** punya default dev (`testforge-dev-secret`) di `lib/auth.ts` — pastikan env prod benar-benar override (di VPS sudah di-set ✅).

**Yang sudah baik:**
- ✅ CSRF `state` pada OAuth, cookie httpOnly/secure.
- ✅ API key disimpan sebagai hash, bukan plaintext.
- ✅ Guard `requireSession` konsisten di seluruh area `(app)`.
- ✅ Cascade delete & unique constraint rapi.
- ✅ Audit log untuk aksi penting.
- ✅ Soft-delete difilter konsisten di semua query/endpoint.

---

## 7. Saran Prioritas (kalau mau lanjut)

| Prioritas | Item | Alasan |
|---|---|---|
| 🔴 Tinggi | Putuskan strategi **org + undangan tim** (§6.4–6.5) atau sembunyikan langkah undang di onboarding | Saat ini fitur menyesatkan |
| 🟡 Sedang | **Break-glass / minimal 1 admin terjamin** | Hindari lockout total |
| 🟡 Sedang | Migrasi DB: drop `VerificationToken`, `passwordHash` nullable | Kebersihan pasca-OAuth |
| 🟢 Rendah | Recycle bin untuk case | Cegah kehilangan data |
| 🟢 Rendah | Bersihkan i18n string mati | Perawatan |

---
*Akhir audit. Selamat menurunkan kortisol — semuanya sudah ter-commit & ter-deploy, tidak ada yang menggantung.* 🌿
