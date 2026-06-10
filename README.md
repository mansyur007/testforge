# ⚒️ TestForge

Open source test case management platform — alternatif gratis dari TestRail,
Qase.io, dan Zephyr. Dibangun berdasarkan **PRD TestForge v1.0** (lihat
[AUDIT-PRD.md](AUDIT-PRD.md) untuk hasil audit dokumen tersebut).

## Fitur MVP (v0.1)

- **Multi-project workspace** — buat, arsip, namespace test per proyek
- **Test case management** — semua field standar PRD §4.2.1, steps dinamis,
  clone, bulk edit, tags, soft delete, ID otomatis `TC-[SLUG]-[NUM]`
- **Hierarki suite → section → case** (PRD §4.1.2)
- **Test run & eksekusi** — pilih case via filter, status 7 warna (§4.3.2),
  keyboard shortcut `P/F/B/S/R` + `J/K` (US-002), timer otomatis, partial run,
  **rerun failed only**, milestone
- **Automation integration** — upload JUnit XML framework-agnostic
  (Cypress/Playwright/Jest/Pytest/dll) via `POST /api/v1/junit`, auto-matching
  ke test case via anotasi `TC-WEB-001` di nama test atau exact title (US-010)
- **REST API v1** — Bearer API key (di-hash), cursor pagination, filtering
- **Import/Export CSV** — dengan preview & validasi sebelum import (US-004)
- **Reports** — pass rate trend, flaky test detection, bug correlation,
  automation coverage (§4.5)
- **Auth & RBAC dasar** — register/login JWT, brute force lockout (§8),
  audit log (§5.5)

## Menjalankan

### Docker (one-command, PRD §5.4)

```bash
docker compose up
```

### Development lokal

```bash
npm install
npx prisma db push   # buat database SQLite
npm run seed         # data demo + akun admin
npm run dev
```

Login demo: `admin@testforge.local` / `admin12345`

> Database default SQLite agar langsung jalan. Untuk production sesuai PRD
> (§5.1, PostgreSQL): ganti `provider` di `prisma/schema.prisma` menjadi
> `postgresql` dan set `DATABASE_URL`.

## Upload hasil CI/CD

```bash
# Buat API key di Settings → API Keys, lalu:
curl -X POST "http://localhost:3000/api/v1/junit?project=web&name=CI%20Run&source=cypress" \
  -H "Authorization: Bearer <API_KEY>" \
  -H "Content-Type: application/xml" \
  --data-binary @results/junit.xml
```

## Struktur

- `src/app/(app)/` — halaman aplikasi (dashboard, proyek, run, reports, settings)
- `src/app/actions/` — server actions (mutasi data)
- `src/app/api/` — REST API v1, import/export CSV, upload JUnit
- `prisma/schema.prisma` — data model (termasuk perbaikan gap ERD dari audit)

Lisensi: MIT
