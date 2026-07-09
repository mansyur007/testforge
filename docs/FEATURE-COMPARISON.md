# TestForge vs Kompetitor — Perbandingan Fitur & Roadmap TODO

> Dibuat: 2026-07-08. Perbandingan berbasis fitur publik kompetitor (dokumentasi/marketing
> masing-masing vendor, kondisi ± awal 2026 — harga dan detail bisa berubah) dan kondisi
> aktual kode TestForge di branch saat dokumen ini ditulis.
>
> Bagian akhir dokumen ini ([§7 Gap Analysis → TODO](#7-gap-analysis--todo-feature)) adalah
> daftar fitur yang **belum ada** di TestForge, diprioritaskan sebagai roadmap.

## Daftar isi

1. [Posisi tiap produk](#1-posisi-tiap-produk)
2. [Tabel perbandingan ringkas](#2-tabel-perbandingan-ringkas)
3. [Perbandingan detail per area fitur](#3-perbandingan-detail-per-area-fitur)
4. [Profil detail per produk](#4-profil-detail-per-produk)
5. [Tool lain yang layak dipantau](#5-tool-lain-yang-layak-dipantau)
6. [Kekuatan TestForge saat ini](#6-kekuatan-testforge-saat-ini)
7. [Gap Analysis → TODO Feature](#7-gap-analysis--todo-feature)

---

## 1. Posisi tiap produk

| Produk | Kategori | Model | Catatan posisi |
|---|---|---|---|
| **TestForge** | Test case management (TCM) | Open source, self-hosted (Docker) + hosted `testforge.emha.space` | Alternatif gratis TestRail/Qase; Next.js + Prisma; SQLite dev / PostgreSQL prod |
| **TestRail** (Gurock/Idera) | TCM | Komersial SaaS + server (Enterprise) | Market leader de-facto; paling matang untuk tim manual QA besar |
| **Qase** | TCM modern + TestOps | Komersial SaaS, ada free tier | Pesaing modern TestRail; kuat di automation reporting & AI |
| **TestLink** | TCM | Open source (GPL, PHP) | Generasi lama; kuat di requirement traceability, UI & pengembangan sudah stagnan |
| **Test IO** (EPAM) | **Bukan TCM** — crowdtesting service | Komersial, bayar per siklus test | Menyewakan kerumunan tester manusia + real device; pelengkap TCM, bukan pengganti |
| Zephyr Scale, Xray | TCM di dalam Jira | Komersial (Atlassian Marketplace) | Pilihan default tim yang hidup di Jira |
| Testmo, Testiny, PractiTest, qTest, Allure TestOps, Kiwi TCMS, Azure Test Plans | TCM | Campuran | Dibahas ringkas di §5 |

Penting: **Test IO tidak apple-to-apple** dengan TestForge. Test IO menjual *orang* (exploratory
crowdtesting, ratusan device nyata, hasil berupa bug report), bukan *software* untuk mengelola
test case. Fitur Test IO yang relevan untuk ditiru TestForge hanya konsep *exploratory/session-based
testing* dan *bug report kaya attachment* — keduanya masuk daftar TODO di §7.

---

## 2. Tabel perbandingan ringkas

Legenda: ✅ ada · 🟡 sebagian/terbatas · ❌ tidak ada · ➖ tidak relevan untuk kategori produk itu.

| Fitur | TestForge | TestRail | Qase | TestLink | Test IO |
|---|:-:|:-:|:-:|:-:|:-:|
| **Organisasi & struktur** |
| Multi-project | ✅ | ✅ | ✅ | ✅ | ➖ |
| Suite → section hirarki (nested) | ✅ | ✅ | ✅ | ✅ | ➖ |
| Organization/workspace multi-tenant | ✅ | ✅ | ✅ | ❌ | ➖ |
| **Desain test case** |
| Step terstruktur (action + expected) | ✅ | ✅ | ✅ | ✅ | ➖ |
| Auto ID (`TC-SLUG-001`) | ✅ | ✅ | ✅ | ✅ | ➖ |
| Priority / type / tags / assignee | ✅ | ✅ | ✅ | 🟡 (keywords) | ➖ |
| Clone & bulk edit | ✅ | ✅ | ✅ | 🟡 | ➖ |
| Soft delete / recycle bin | ✅ | ✅ | ✅ | ❌ | ➖ |
| **Attachment / gambar di case & hasil** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Custom fields** | ❌ | ✅ (sangat kuat) | ✅ | ✅ | ➖ |
| **Shared steps (langkah reusable)** | ❌ | ✅ | ✅ | ❌ | ➖ |
| **Versioning / riwayat perubahan case** | ❌ | ✅ | ✅ | ✅ | ➖ |
| **Parameterisasi / dataset** | ❌ | ✅ | ✅ | ❌ | ➖ |
| **Template case (teks/BDD/exploratory)** | ❌ | ✅ | 🟡 | ❌ | ➖ |
| Rich text / markdown + inline image | ✅ (GFM) | ✅ | ✅ | 🟡 | ➖ |
| Review/approval workflow untuk case | ❌ | 🟡 | ✅ | ❌ | ➖ |
| **Perencanaan & eksekusi** |
| Test run + pilih case via filter | ✅ | ✅ | ✅ | ✅ | ➖ |
| Status hasil 7 warna + keyboard shortcut | ✅ | ✅ | ✅ | 🟡 | ➖ |
| Timer otomatis per hasil | ✅ | 🟡 (elapsed manual) | ✅ | ❌ | ➖ |
| Rerun failed only | ✅ | ✅ | ✅ | ❌ | ➖ |
| Milestone | ✅ (basic) | ✅ (+sub-milestone) | ✅ | 🟡 (build) | ➖ |
| **Test plan (kumpulan run + konfigurasi)** | ❌ | ✅ | ✅ | ✅ | ➖ |
| **Configurations (matriks browser×OS)** | ❌ | ✅ | ✅ | ✅ (platforms) | ➖ |
| **Environments per run** | ❌ | 🟡 | ✅ | ❌ | ➖ |
| **Custom result status** | ❌ (hardcoded) | ✅ | ✅ | ✅ | ➖ |
| Estimasi waktu & forecast | ❌ | ✅ | 🟡 | ❌ | ➖ |
| Exploratory / session-based testing | ❌ | 🟡 (template) | 🟡 | ❌ | ✅ (inti produk) |
| **Requirement & traceability** |
| Requirement management + coverage matrix | ❌ | 🟡 (via referensi) | 🟡 (via Jira) | ✅ (paling kuat) | ➖ |
| Link case ↔ issue tracker dua arah | 🟡 (URL string) | ✅ | ✅ | ✅ | ✅ |
| Defect entity bawaan | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Otomasi** |
| Upload JUnit XML via API | ✅ | 🟡 (via API custom) | ✅ | 🟡 (XML-RPC) | ➖ |
| Auto-match hasil ↔ case (anotasi ID) | ✅ | 🟡 | ✅ | 🟡 | ➖ |
| Format lain (TRX/NUnit/Allure/Cucumber JSON) | ❌ | 🟡 | ✅ | ❌ | ➖ |
| Reporter/SDK per framework (npm/pip) | ❌ | 🟡 (pihak ketiga) | ✅ (10+ resmi) | ❌ | ➖ |
| CLI uploader | ❌ | ❌ | ✅ | ❌ | ➖ |
| Flaky detection | ✅ | ❌ | ✅ | ❌ | ➖ |
| Mute/quarantine test flaky | ❌ | ❌ | ✅ | ❌ | ➖ |
| **Reporting** |
| Pass rate trend | ✅ | ✅ | ✅ | 🟡 | ➖ |
| Automation coverage | ✅ | 🟡 | ✅ | ❌ | ➖ |
| Perbandingan antar-run | ❌ | ✅ | ✅ | ❌ | ➖ |
| Dashboard custom (widget) | ❌ | ✅ | ✅ | ❌ | ➖ |
| Report lintas project | ❌ | ✅ (Enterprise) | ✅ | ❌ | ➖ |
| Scheduled/email report | ❌ | ✅ | 🟡 | ❌ | ✅ |
| Export report PDF/print | ❌ | ✅ | ✅ | ✅ | ✅ |
| Share link publik (read-only) | ❌ | 🟡 | ✅ | ❌ | ➖ |
| **Integrasi** |
| REST API + OpenAPI | ✅ | ✅ (tanpa OpenAPI resmi) | ✅ | 🟡 (XML-RPC) | ✅ |
| Webhooks (HMAC-signed) | ✅ | 🟡 | ✅ | ❌ | ✅ |
| Integrasi Jira native | ❌ | ✅ (plugin dua arah) | ✅ | ✅ | ✅ |
| GitHub/GitLab issues | ❌ | ✅ | ✅ | 🟡 | ➖ |
| Slack/Teams notification | ❌ | ✅ | ✅ | ❌ | ✅ |
| Import dari tool lain (TestRail/Qase/XML) | 🟡 (CSV saja) | ✅ | ✅ (TestRail, CSV) | ✅ (XML) | ➖ |
| Export CSV | ✅ | ✅ (+XLSX/XML) | ✅ (+JSON) | ✅ (XML) | ➖ |
| **Kolaborasi** |
| Komentar & @mention di case/run | ❌ | 🟡 | ✅ | ❌ | ✅ |
| Activity feed / riwayat per entity | 🟡 (audit log global) | ✅ | ✅ | 🟡 | ➖ |
| Saved filter / view tersimpan | ❌ | ✅ | ✅ | ❌ | ➖ |
| Pencarian global full-text | ✅ (⌘K) | ✅ | ✅ | 🟡 | ➖ |
| **Keamanan & admin** |
| RBAC (org + project role) | ✅ (2 lapis) | ✅ | ✅ (+custom role) | ✅ | ➖ |
| Custom role | ❌ | ✅ | ✅ | ✅ | ➖ |
| Email verification + reset password | ✅ | ✅ | ✅ | 🟡 | ➖ |
| OAuth login (Google/GitHub) | ✅ | 🟡 | ✅ | ❌ | ➖ |
| SSO SAML/OIDC | ❌ | ✅ (Enterprise) | ✅ | ❌ | ✅ |
| 2FA/TOTP | ❌ | ✅ | ✅ | ❌ | ✅ |
| SCIM provisioning | ❌ | 🟡 | ✅ | ❌ | ➖ |
| Audit log + export | ✅ | ✅ (Enterprise) | ✅ | ❌ | ➖ |
| API key scoped (READ/WRITE) + hash | ✅ | 🟡 | ✅ | ❌ | ➖ |
| Rate limit & brute-force lockout | ✅ | ✅ | ✅ | ❌ | ➖ |
| **Deployment & harga** |
| Self-hosted | ✅ (Docker 1 perintah) | ✅ (Enterprise Server, mahal) | ❌ | ✅ | ➖ |
| Open source | ✅ | ❌ | ❌ | ✅ | ➖ |
| Free tier | ✅ (semuanya gratis) | ❌ (trial saja) | ✅ (≤3 user) | ✅ | ❌ |
| Harga indikatif (cloud, per user/bulan) | Gratis | ±$37–74 | ±$20–40 | Gratis | per-siklus test |
| i18n UI (EN/ID) | ✅ | 🟡 | 🟡 | ✅ (banyak bahasa) | ➖ |

---

## 3. Perbandingan detail per area fitur

### 3.1 Desain & organisasi test case

- **TestRail** paling fleksibel: *case templates* (Text, Steps, Exploratory Session, BDD),
  **custom fields** per template dengan 10+ tipe field (dropdown, multi-select, steps, URL,
  user, date…), **shared steps** yang dipakai lintas case dan ter-update serentak, riwayat
  perubahan per case lengkap dengan diff, dan **datasets/parameterization** (satu case dijalankan
  N kali dengan variabel berbeda). Mode repository bisa *single suite* atau *multi-suite +
  baselines* (snapshot suite untuk rilis paralel).
- **Qase** menyusul dekat: shared steps, custom fields, parameters per case, attachment
  drag-and-drop, *muted tests*, dan **review workflow** (case berstatus draft/in-review/actual)
  yang lebih formal dari TestRail.
- **TestLink** unik pada **keywords** (mirip tags) dan versioning case bawaan (tiap edit
  menaikkan versi, test plan mengunci versi tertentu — konsep bagus yang belum ada di
  TestForge/Qase modern).
- **TestForge** sudah punya fondasi bagus (steps JSON action/expected, priority/type/status/
  automation status, tags, clone, bulk edit, inline edit priority & automation di tabel, soft
  delete + purge terjadwal) tetapi **belum punya**: attachment, custom fields, shared steps,
  versioning, parameterisasi, template, rich text. Ini cluster gap terbesar №1.

### 3.2 Perencanaan & eksekusi

- **TestRail**: *test plans* membungkus banyak run + **configurations** (matriks, mis.
  Chrome/Firefox × Win/macOS menghasilkan run per kombinasi), milestone bertingkat, estimasi
  per case dan **forecast** sisa waktu eksekusi, "todos" (antrian kerja personal per tester).
- **Qase**: test plans, environments (staging/prod), configurations, default assignee,
  wizard rerun, dan *fast run* (eksekusi cepat tanpa membuat run formal).
- **TestLink**: test plan + **builds** (setara run) + **platforms** (setara configurations).
- **Test IO**: eksekusi dilakukan crowd; fitur menariknya *test cycle* dengan scope, device
  matrix nyata, dan hasil bug report berfoto/video.
- **TestForge**: run tunggal sudah kuat (7 status, shortcut `P/F/B/S/R` + `J/K`, timer
  otomatis, partial run, rerun failed only, select-all, assignee per result, defect URL,
  milestone). **Belum punya**: test plan, configurations, environments, custom status,
  estimasi/forecast, exploratory session. Ini cluster gap №2.

### 3.3 Otomasi & CI/CD

- **Qase** paling kuat: reporter resmi untuk Playwright, Cypress, pytest, JUnit, TestNG,
  Jest, WebdriverIO, Robot Framework, dll (publish hasil real-time per test, bukan sekali
  upload), CLI `qase-cli`, API v2 untuk bulk result, dan analitik automation (flaky, slowest,
  muted).
- **TestRail** mengandalkan API `add_result_for_case` + integrasi pihak ketiga (railflow,
  trcli). `trcli` resmi bisa parse JUnit XML.
- **TestForge** sudah benar arahnya: `POST /api/v1/junit` framework-agnostic dengan
  auto-match anotasi `TC-WEB-001`/judul persis, kolom `origin` (CI vs lokal), flaky detection
  di reports, webhook HMAC. **Belum punya**: format selain JUnit (TRX, NUnit3, Allure,
  Cucumber JSON, Mocha JSON), reporter npm/pip resmi, CLI, real-time result streaming, dan
  mute/quarantine flaky. Cluster gap №3.

### 3.4 Reporting & analitik

- **TestRail**: report engine terpisah (activity, coverage, comparison antar run/milestone,
  property distribution), bisa dijadwalkan & diemail, cross-project (Enterprise).
- **Qase**: dashboard custom berbasis widget (query builder), report run yang bisa di-share
  sebagai link publik read-only, export PDF.
- **TestForge**: pass rate trend per run, flaky, bug correlation, automation coverage —
  bagus untuk MVP tapi statis (tidak bisa disusun/difilter), tidak ada perbandingan antar
  run, tidak ada share link, tidak ada PDF/scheduled report. Cluster gap №4.

### 3.5 Integrasi & ekosistem

- **TestRail**: integrasi defect plugin (Jira, Azure DevOps, GitHub, GitLab, Bugzilla,
  Redmine, YouTrack…) — push defect dari hasil gagal, lihat status defect di TestRail, dan
  di sisi Jira ada plugin untuk melihat hasil test dari issue.
- **Qase**: Jira app dua arah, GitHub/GitLab, Slack, webhooks.
- **TestLink**: linking bug tracker klasik (Mantis, Bugzilla, Jira via connector).
- **TestForge**: `linkedIssues` hanya string URL dipisah koma; `defectUrl` di hasil run juga
  string. Tidak ada create-issue-from-failure, tidak ada status sync, tidak ada notifikasi
  Slack/Teams/Discord. Webhook per-project (HMAC) adalah pondasi bagus untuk membangun ini.
  Cluster gap №5.

### 3.6 Kolaborasi & UX

- Qase/TestRail punya komentar per case/hasil, @mention, saved views, pencarian global,
  activity stream per entity. TestForge baru punya audit log global (admin-facing), belum
  ada kolaborasi user-facing. Cluster gap №6.

### 3.7 Enterprise & keamanan

- TestForge sudah lumayan (JWT + verifikasi email, OAuth, lockout, rate limit, API key
  hashed + scope, audit log + export, RBAC dua lapis org/project). Gap tersisa untuk adopsi
  tim serius: **SSO SAML/OIDC, 2FA, SCIM, custom role, session management** (lihat §7 P2).

---

## 4. Profil detail per produk

### 4.1 TestRail

- **Kekuatan**: kematangan (sejak 2004), custom fields & template paling dalam, test plans +
  configurations, baselines, forecast, report engine paling lengkap, defect plugin ekosistem
  terluas, UI scripts (kustomisasi UI via JS), dokumentasi & komunitas besar.
- **Kelemahan**: mahal (cloud ±$37/user/bln Professional, ±$74 Enterprise; server hanya
  Enterprise), UI terasa tua, API tanpa OpenAPI resmi & rate limit ketat di cloud, tidak ada
  free tier, automasi first-class baru lewat `trcli` (terasa tempelan), tidak open source.
- **Pelajaran untuk TestForge**: shared steps, configurations, forecast, defect plugin
  architecture, saved views ("filters") — fitur yang membuat tim manual QA besar bertahan.

### 4.2 Qase

- **Kekuatan**: UX modern & cepat, free tier, reporter automation resmi terbanyak, review
  workflow case, defect entity bawaan, dashboard widget, share link publik, API v1+v2 rapi,
  SSO/SCIM di paket bisnis, fitur AI (generate case dari deskripsi/dokumen, AIDEN).
- **Kelemahan**: tidak ada self-hosted (deal-breaker untuk data-sensitive), fitur enterprise
  terkunci di tier atas, konfigurasi/environments belum sedalam TestRail plans.
- **Pelajaran untuk TestForge**: TestForge secara posisi paling dekat "Qase yang open
  source". Prioritas meniru: attachment, reporter per framework, share link report, review
  workflow, defects.

### 4.3 TestLink

- **Kekuatan**: gratis & GPL, **requirement management + traceability matrix** terbaik di
  kelasnya (import requirement, link ke case, laporan coverage requirement), versioning case
  + test plan mengunci versi, platforms, banyak bahasa.
- **Kelemahan**: PHP monolitik tua, UI frame 2000-an, rilis stabil terakhir sudah bertahun-
  tahun (1.9.x), XML-RPC API kuno, tanpa automasi modern, instalasi merepotkan.
- **Pelajaran untuk TestForge**: TestLink membuktikan segmen open-source-self-hosted itu
  nyata dan sedang *kosong* ditinggal pemain modern — persis target TestForge. Fitur yang
  layak diambil: requirement traceability & case versioning.

### 4.4 Test IO

- **Kekuatan**: ratusan ribu tester manusia, real device matrix (bukan emulator), bug report
  kaya (screenshot, video, langkah reproduksi), test cycle on-demand, integrasi bug tracker.
- **Kelemahan**: bukan TCM — tidak mengelola repositori test case internal tim; mahal;
  kualitas crowd bervariasi.
- **Pelajaran untuk TestForge**: dukung *exploratory session* dan *bug report kaya media*
  supaya hasil kerja manual tester (internal maupun crowd) bisa ditampung di TestForge.

---

## 5. Tool lain yang layak dipantau

| Tool | Ringkas | Fitur pembeda yang relevan untuk TestForge |
|---|---|---|
| **Zephyr Scale** (SmartBear) | TCM native di Jira | Traceability issue↔case otomatis, BDD, versioning |
| **Xray** | TCM native di Jira, kuat di automasi | Requirement coverage, Cucumber first-class, test environments |
| **Testmo** | TCM modern unified | Satu tempat untuk manual + automation + **exploratory session**; CLI submit hasil automation yang sangat bagus |
| **PractiTest** | TCM enterprise | Requirement modul penuh, dashboard kuat, exploratory |
| **qTest** (Tricentis) | TCM enterprise | Insights lintas project, integrasi Tricentis tosca |
| **Allure TestOps** | Automation-first TCM | Test case as code, launches real-time, analitik automation terdalam |
| **Kiwi TCMS** | Open source (Python/Django) — kompetitor OSS terdekat | Test plan + versioning, API, telemetry report; UI lebih tua dari TestForge |
| **Testiny** | TCM ringan modern, murah | UX cepat, free tier self-hosted kecil |
| **Azure Test Plans** | Bagian Azure DevOps | Configurations, exploratory dengan rekaman layar |
| **TestLodge, Tuskr, QA Touch, TestCollab** | TCM ringan | Fitur dasar, pembeda utama harga |

---

## 6. Kekuatan TestForge saat ini

Yang sudah **lebih baik atau setara** dibanding kompetitor (jangan dirusak saat mengejar gap):

1. **Open source + self-hosted satu perintah** (`docker compose up`) — tidak dimiliki
   TestRail (server mahal) maupun Qase (tidak ada sama sekali). Ini pembeda utama.
2. **Eksekusi run cepat**: 7 status, keyboard shortcut `P/F/B/S/R` + navigasi `J/K`, timer
   otomatis, rerun failed only — setara/lebih ergonomis dari TestRail.
3. **JUnit ingest framework-agnostic + auto-match anotasi** — lebih sederhana dipakai
   daripada API TestRail.
4. **Flaky detection bawaan gratis** — di Qase ini fitur tier berbayar.
5. **API v1 dengan OpenAPI spec** (`/api/v1/openapi`) — TestRail saja tidak punya OpenAPI resmi.
6. **Keamanan dasar rapi**: API key hashed + scope, HMAC webhook, lockout, audit log + export.
7. **i18n EN/ID** — hampir tidak ada kompetitor yang punya Bahasa Indonesia.
8. **CSV import dengan preview & validasi** + export per-step expected.

---

## 7. Gap Analysis → TODO Feature

> Prioritas: **P1** = gap yang paling sering jadi alasan tim menolak TCM (dibanding
> Qase/TestRail); **P2** = pembeda kompetitif penting; **P3** = nice-to-have / segmen khusus.
> Checklist ini adalah backlog fitur — tandai ✅ saat rilis.

### P1 — Fondasi yang dianggap wajib oleh pengguna TestRail/Qase

- [x] **Attachment & inline image** — upload file/screenshot di test case, step, dan hasil
      run (drag-drop + paste dari clipboard); storage lokal (volume Docker) dengan
      abstraksi supaya bisa S3-compatible. *Gap paling sering ditanya; semua kompetitor punya.*
      *(Selesai 2026-07-08 — upload/dedupe/limit/purge live; inline image di deskripsi
      menunggu F-02 markdown.)*
- [ ] **Custom fields** — definisi field per project (tipe: text, dropdown, multi-select,
      checkbox, URL, user, date) untuk test case dan hasil run; tampil di form, tabel,
      filter, CSV import/export, dan API.
- [ ] **Shared steps** — langkah reusable lintas case (mis. "login sebagai admin");
      edit sekali, ter-update di semua case pemakai; terhitung benar di export & run view.
- [ ] **Riwayat & versioning test case** — simpan revisi tiap perubahan (siapa, kapan, diff
      per field/step), tampilkan di tab History, bisa restore versi; hasil run menyimpan
      snapshot versi case saat dieksekusi (seperti TestLink).
- [ ] **Test plan + configurations** — entity Test Plan berisi banyak run; configurations
      (mis. Browser: Chrome/Firefox × OS: Win/macOS) menghasilkan run per kombinasi;
      progres agregat per plan. *Fitur pembeda utama TestRail.*
- [x] **Rich text (markdown)** untuk description/preconditions/steps + render aman
      (sanitized) dan inline image dari attachment. *(Selesai 2026-07-08 — GFM +
      rehype-sanitize, editor Write/Preview, paste screenshot → attach + embed.)*
- [ ] **Integrasi Jira** (lalu GitHub/GitLab Issues) — bukan sekadar URL string:
      buat issue dari hasil FAILED dengan template otomatis (repro dari steps), link dua
      arah, tampilkan status issue live di case/run, konfigurasi per project.
- [ ] **Notifikasi Slack/Discord/Teams + email** — run selesai, hasil gagal, case
      di-assign; dibangun di atas sistem webhook yang sudah ada.
- [x] *(Selesai 2026-07-09)* **Pencarian global** — satu kotak cari (⌘K) lintas case/run/suite/milestone dengan
      full-text di title/description/steps.
- [ ] **Saved filters / views** — simpan kombinasi filter tabel case & run (per user dan
      shared per project), jadikan default view.

### P2 — Pembeda kompetitif (setara paket bisnis Qase/TestRail)

- [ ] **Format hasil automasi tambahan** — parser TRX (MSTest), NUnit3, xUnit v2, Allure,
      Cucumber JSON, Mocha JSON di endpoint `/api/v1/results` generik (JUnit tetap jalan).
- [ ] **Reporter resmi per framework** — paket npm `@testforge/playwright`,
      `@testforge/cypress`, pip `testforge-pytest` yang stream hasil real-time (bukan hanya
      upload XML di akhir), + **CLI `testforge-cli`** untuk CI.
- [ ] **Parameterisasi / dataset** — variabel `{{param}}` di steps + tabel dataset per case;
      run mengeksekusi satu baris dataset sebagai satu hasil.
- [ ] **Custom result status & custom role** — admin bisa menambah/mengubah status hasil
      (warna, makna pass/fail) dan membuat role dengan permission granular.
- [ ] **Review workflow case** — status alur `DRAFT → IN_REVIEW → APPROVED` dengan reviewer,
      komentar review, dan filter "perlu review" (seperti Qase).
- [ ] **Komentar & @mention** — komentar di case dan hasil run, mention memicu
      notifikasi/email; activity feed per entity (bukan hanya audit log global).
- [ ] **Dashboard & report builder** — widget yang bisa disusun (pass rate, coverage,
      defect, velocity) per project; **perbandingan antar run/milestone**; export **PDF**;
      **scheduled email report**; **share link publik read-only** untuk run report.
- [ ] **Requirement management & traceability** — entity Requirement (atau import dari
      Jira epic/story), link N:M ke case, matrix coverage requirement→case→hasil terakhir
      (mengisi kekosongan yang ditinggal TestLink).
- [ ] **Environments** — daftar environment per project (staging/prod/…), dipilih saat
      membuat run, jadi dimensi filter di reports.
- [ ] **SSO SAML/OIDC + 2FA (TOTP)** — wajib untuk adopsi perusahaan; OIDC dulu (lebih
      mudah, mencakup Google Workspace/Azure AD/Keycloak), SAML menyusul; SCIM paling akhir.
- [ ] **Mute/quarantine test** — tandai case automation sebagai muted; hasilnya tercatat
      tapi tidak menggagalkan pass rate; laporan test yang lama di-mute.
- [ ] **Import dari TestRail/Qase/TestLink** — importer XML TestRail, export JSON Qase, dan
      XML TestLink (bukan cuma CSV) untuk menurunkan biaya pindah — funnel adopsi utama.
- [ ] **Estimasi & forecast** — field estimasi per case, agregat per run/plan, forecast sisa
      waktu berdasar kecepatan aktual tester (data timer sudah ada).
- [ ] **Bulk move/copy antar suite & antar project** + reorder drag-and-drop case dalam suite.

### P3 — Nice-to-have / segmen khusus

- [ ] **Exploratory / session-based testing** — entity Session (charter, timebox, catatan
      bertimestamp, attachment) yang menghasilkan bug/case baru (pelajaran Test IO/Testmo).
- [ ] **Defect entity bawaan** — daftar defect internal untuk tim tanpa issue tracker
      (seperti Qase), tetap bisa dilink ke tracker eksternal.
- [ ] **BDD/Gherkin** — template case Gherkin, import/export `.feature`, sinkron dengan
      hasil Cucumber JSON.
- [ ] **Baselines** — snapshot suite untuk mendukung beberapa versi rilis paralel
      (konsep TestRail).
- [ ] **AI assist** — generate draft test case dari deskripsi fitur/PRD, saran step, dedup
      case mirip (jawaban terhadap Qase AIDEN); opsional dan bisa dimatikan di self-hosted.
- [ ] **Export XLSX & JSON** (selain CSV), template import dengan mapping kolom tersimpan.
- [ ] **Todos / antrian kerja personal** — halaman "assigned to me" lintas project
      (hasil run + case yang di-assign) seperti TestRail Todos.
- [ ] **Case dependencies** — tandai case yang bergantung case lain; run mengurutkan dan
      auto-BLOCK dependen saat prasyarat gagal.
- [ ] **Public API v2** — cakupan penuh (milestones, members, webhooks, custom fields,
      attachments), token per-project, rate limit per key.
- [ ] **LDAP/Active Directory** untuk self-hosted enterprise (paritas fitur TestLink/Kiwi).
- [ ] **Print-friendly view** test case & run untuk audit/compliance.
- [ ] **PWA/mobile execution view** — eksekusi run nyaman dari ponsel/tablet saat testing
      device fisik.

### Catatan implementasi

- Urutan yang disarankan di dalam P1: **attachment → rich text → custom fields → Jira →
  test plan/configurations** (attachment & rich text adalah prasyarat UX untuk sisanya).
- Webhook HMAC yang sudah ada adalah pondasi untuk notifikasi Slack/Teams (P1) dan
  integrasi tracker (P1) — bangun sebagai konsumer webhook internal, bukan sistem baru.
- Skema saat ini menyimpan `tags`, `linkedIssues`, `events` sebagai string dipisah koma;
  saat mengerjakan custom fields/integrasi, pertimbangkan normalisasi ke tabel relasi
  sekalian (migrasi Prisma), terutama sebelum pindah PostgreSQL production.
