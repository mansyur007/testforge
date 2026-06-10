# Audit PRD TestForge v1.0

Hasil audit terhadap `TestForge_PRD_v1.0.docx` (Juni 2025). Secara umum PRD ini
**matang dan di atas rata-rata**: ada analisis kompetitor, persona, user stories
dengan acceptance criteria, NFR terukur, data model, dan strategi open source.
Namun ditemukan sejumlah **gap fungsional, inkonsistensi internal, dan risiko
scope** berikut.

## 1. Fitur yang HILANG (dibutuhkan tapi tidak ada di PRD)

| # | Gap | Dampak | Status di MVP ini |
|---|-----|--------|-------------------|
| 1 | **Forgot password / reset password** — tidak disebut sama sekali padahal auth email+password adalah P0 | Kritis: user terkunci permanen di self-hosted tanpa admin DB | Belum (perlu SMTP) — masuk backlog v0.2 |
| 2 | **Komentar / diskusi di test case** — §4.5.1 menyebut "komentar terbaru" di activity feed, tapi fitur komentar tidak dispesifikasikan di mana pun | Kolaborasi (tujuan utama produk) timpang | Sebagian: comment per hasil eksekusi sudah ada |
| 3 | **Rerun failed tests only** — fitur standar TestRail/Qase untuk membuat run baru dari case yang gagal | Workflow regression sangat umum | ✅ Diimplementasikan |
| 4 | **Shared/reusable steps** — langkah umum (mis. login) harus di-copy ke ratusan case | Maintenance test case mahal | Belum — backlog |
| 5 | **Review/approval workflow** — status `Draft` ada, tapi tidak ada definisi siapa/bagaimana Draft → Active | Quality gate test case tidak jelas | Belum — backlog |
| 6 | **Recycle bin / restore** — version history ada, tapi tidak ada spesifikasi recovery case terhapus | Kehilangan data tak disengaja | ✅ Soft delete (`deletedAt`) sudah disiapkan |
| 7 | **Onboarding / sample data** — tidak ada spesifikasi first-run experience | Adopsi open source sangat bergantung first 5 minutes | ✅ Seed proyek demo |
| 8 | **Test run comparison** — bandingkan dua run (sebelum vs sesudah fix) | Analisis regresi | Belum — backlog |
| 9 | **Estimasi durasi per case** — timer aktual ada (§4.3.3), tapi tanpa field estimate tidak bisa planning kapasitas run | QA Lead tidak bisa estimasi deadline run | Belum — backlog |
| 10 | **Backup/restore & data export menyeluruh** — penting untuk self-hosted, tidak disebut | Risiko kehilangan data user | Sebagian: export CSV per entitas |
| 11 | **Email service (SMTP)** — US-005 mensyaratkan notifikasi email, tapi SMTP tidak ada di tech stack §5.1 maupun deployment §5.4 | Acceptance criteria US-005 tidak bisa dipenuhi | Belum — backlog |
| 12 | **Kebijakan privasi telemetry** — §11 mengandalkan "opt-in telemetry" tapi fiturnya tidak dispesifikasikan | Kepercayaan komunitas open source | Belum — backlog |

## 2. Inkonsistensi internal PRD

| # | Temuan | Lokasi |
|---|--------|--------|
| 1 | **Entitas `milestones` hilang dari ERD** padahal dipakai di §4.3.1 ("set milestone untuk test run") dan §9 (`test_runs.milestone_id`) | §9 vs §4.3.1 — ✅ diperbaiki di schema |
| 2 | **Tabel `api_keys` tidak ada di ERD** padahal §5.3 mensyaratkan API key untuk CI/CD dan §5.5 mensyaratkan hashing-nya | §9 vs §5.3/§5.5 — ✅ diperbaiki |
| 3 | **Tabel `audit_logs` tidak ada di ERD** padahal §5.5 dan §8 mensyaratkan audit log dengan retensi 90 hari | §9 vs §5.5 — ✅ diperbaiki |
| 4 | **Version history (§4.2.2) tidak punya tabel** `test_case_versions` di ERD | §9 vs §4.2.2 — backlog |
| 5 | **Requirement traceability matrix (§4.5.3)** butuh entitas `requirements`, tidak ada di ERD | §9 vs §4.5.3 — backlog (v0.3 sesuai roadmap) |
| 6 | **Custom fields**: §4.2.1 menyebut "configurable per proyek" tapi tidak ada tabel definisi custom field (hanya `custom_fields_json` di test_cases) | §9 — backlog v0.2 |
| 7 | **Status `In Progress` §4.3.2** trigger-nya "otomatis saat mulai" tapi tidak didefinisikan kapan "mulai" terjadi (buka halaman? klik tombol start?) | §4.3.2 — di MVP ini: manual |
| 8 | **MVP §7.1 menyebut "Export PDF" P1** tapi tech stack tidak menyertakan library PDF generation | §7.1 vs §5.1 — MVP ini pakai CSV dulu |

## 3. Risiko scope & rekomendasi

1. **Scope MVP 3 bulan terlalu ambisius** — REST API *full CRUD* + JUnit upload +
   CSV import/export + RBAC + Docker dalam 3 bulan realistis hanya untuk tim ≥3
   engineer full-time. Rekomendasi: pangkas REST API publik menjadi endpoint
   yang dibutuhkan CI saja (seperti MVP ini).
2. **GraphQL (§5.2) sebaiknya dihapus dari spec awal** — dual API (REST+GraphQL)
   menggandakan maintenance; tidak ada user story yang membutuhkannya.
3. **10 framework automation di §4.4.1 tidak realistis untuk launch** — JUnit XML
   framework-agnostic (seperti MVP ini) sudah meng-cover Cypress, Playwright,
   Jest, Pytest, Mocha, Selenium sekaligus. Plugin native cukup 2 (Cypress,
   Playwright) di v0.2 sesuai roadmap.
4. **WebSocket realtime (§5.1) belum perlu di MVP** — polling/refresh cukup;
   tambahkan saat ada bukti kebutuhan kolaborasi simultan.
5. **Tidak ada definisi konflik editing** — dua user mengedit test case yang sama
   akan saling timpa. Perlu strategi (optimistic locking / last-write-wins yang
   disadari) sebelum fitur kolaborasi realtime.

## 4. Audit Tambahan: Section 11 (Homepage) & 12 (Register/Sign Up)

Audit untuk revisi PRD yang menambahkan spesifikasi homepage dan auth
(`TestForge_PRD_v1.0 (1).docx`). Kedua section ditulis detail dan actionable
(copywriting siap pakai, FR ber-priority). Temuan:

### 4.1 Inkonsistensi & gap baru

| # | Temuan | Dampak |
|---|--------|--------|
| 1 | **ERD §9 tidak di-update**: §12.2 butuh entitas `organizations` (slug unik per workspace), §12.3/12.5 butuh `verification_tokens`, §12.4 butuh `invitations` — tidak satu pun ada di ERD | ✅ Ketiganya ditambahkan ke schema |
| 2 | **SMTP tetap tidak ada di tech stack §5.1** — kini jadi blocker keras: AU-001 mewajibkan verifikasi email sebelum login, §12.5 mendetailkan email verifikasi, §12.4 butuh email undangan | Diimplementasikan dengan dev-mode fallback (link tampil di UI/log saat `SMTP_URL` kosong) |
| 3 | **AU-010 (JWT 15 menit + refresh token rotation)** bertabrakan dengan §12.6.1 "Remember me = 30 hari" tanpa menjelaskan durasi session non-remember; rotation butuh tabel refresh_tokens yang juga tak ada di ERD | MVP: JWT cookie 1 hari / 30 hari (remember me); rotation masuk backlog |
| 4 | **CAPTCHA (§12.6.2)** menyebut hCaptcha/reCAPTCHA — layanan eksternal yang tidak ada di tech stack, dan reCAPTCHA v3 tidak punya "tampilan setelah 5 gagal" (itu perilaku v2) | Backlog; lockout 5x/5 menit sudah jalan |
| 5 | **Testimoni (§11.2 #8)** mensyaratkan quote early users — produk belum launch, belum ada user | Diisi placeholder berlabel "Early Adopter/Beta Tester"; ganti dengan testimoni asli sebelum launch |
| 6 | **Social proof (§11.2 #2)** menampilkan jumlah user/install — data ini belum ada; menampilkan angka palsu merusak kredibilitas | Diganti metrik faktual (Docker setup, jumlah framework) |
| 7 | **HP-005 GitHub stars** butuh repo publik yang belum ada | Implementasi fetch + cache 1 jam dengan fallback "—" jika repo tidak ditemukan |
| 8 | **Login lockout**: §12.6.2 mensyaratkan per-IP **dan** per-email; §8 lama hanya per-akun | Per-email diimplementasikan; per-IP butuh trust proxy header, backlog deployment |
| 9 | **§12.1 GitLab OAuth (P1), SAML (P2), Magic Link (P2)** | Sesuai prioritas roadmap: belum di MVP; arsitektur OAuth route sudah generik untuk menambah provider |
| 10 | **Onboarding Step 3 (§12.4)** menyebut "klik untuk connect" Jira/Slack — integrasi ini baru ada di roadmap v0.2, jadi tidak mungkin "connect" saat MVP | Diimplementasikan sebagai pencatatan minat (interest), bukan koneksi sungguhan |

### 4.2 Status functional requirements

**Homepage (HP)**: HP-001 (statis+SSR, ringan) ✅ · HP-002 ✅ · HP-003 ✅
(/docs/self-hosting) · HP-004 ✅ · HP-005 ✅ (fallback) · HP-006 sebagian
(section demo + live demo link; video tour belum) · HP-007 ✅ (dark mode via
prefers-color-scheme) · HP-008 ✅ (meta, OG, sitemap, robots) · HP-009 backlog
(analytics) · HP-010 ✅ (server component, berfungsi tanpa JS).

**Auth (AU)**: AU-001 ✅ · AU-002/003 ✅ (route OAuth siap; aktif saat env
client ID/secret diisi) · AU-004 ✅ · AU-005 ✅ · AU-006 ✅ · AU-007 ✅ ·
AU-008 ✅ · AU-009 ✅ (per email) · AU-010 sebagian (lihat 4.1 #3) · AU-011
backlog (butuh refresh token store) · AU-012 sebagian (label + keyboard nav
bawaan; audit ARIA menyeluruh belum).

## 5. Yang sudah diimplementasikan di MVP ini

Semua item **P0** §7.1: proyek (buat/arsip), CRUD test case lengkap semua field
standar, hierarki suite+section, test run manual dengan eksekusi + keyboard
shortcut (US-002), auth + RBAC dasar, REST API + API key. Plus item **P1**:
import CSV dengan preview/validasi (US-004), export CSV, upload JUnit XML
framework-agnostic dengan auto-matching (US-010), laporan run + flaky test +
bug correlation + automation coverage, dan perbaikan gap audit #3, #6, #7
serta inkonsistensi #1–#3.
