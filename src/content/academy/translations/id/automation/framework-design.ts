import type { LessonTranslation } from "../../../types";

export const frameworkDesignId: LessonTranslation = {
  slug: "framework-design",
  title: "Merancang framework yang bisa Anda serahkan",
  summary:
    "Config, pelaporan, konvensi, dan README yang membuatnya bisa bertahan hidup.",
  body: `
## Pengujian yang menentukan tidak ada di dalam suite

Inilah dia: **orang baru meng-clone repositorinya hari Senin dan membuka pull
request yang benar pada hari Rabu, tanpa bertanya apa pun kepada Anda.**

Setiap keputusan di pelajaran ini mengabdi pada itu. Suite yang hanya bisa
dijalankan satu orang bukanlah aset — ia kebergantungan pada orang itu, dan ia
diam-diam berhenti dirawat pada minggu orang itu pindah tim.

Kepingannya sudah Anda punya. Pelajaran ini tentang menatanya supaya orang lain
bisa memungutnya.

## Tata letak, dan aturan di baliknya

~~~
e2e/
├── README.md
├── playwright.config.ts
├── .env.example
├── fixtures/
│   └── index.ts            # data uji, auth, persiapan per worker
├── pages/
│   ├── login.page.ts
│   └── project.page.ts
├── helpers/
│   └── api.ts              # pembungkus tipis di atas /api/v1
└── tests/
    ├── auth/
    ├── projects/
    └── cases/
~~~

**Kelompokkan pengujian menurut fitur, bukan menurut jenis pengujian.**
\`tests/checkout/\` mengalahkan \`tests/smoke/\` dan \`tests/regression/\`, karena
orang yang mengubah checkout perlu menemukan setiap pengujian tentang checkout —
dan karena "jenis" sebuah pengujian berubah tergantung siapa yang bertanya,
sementara fitur yang dicakupnya tidak.

Tag menangani sisanya tanpa pohon direktori kedua:

~~~ts
test("@smoke TC-SHOP-12 a valid login lands on the dashboard", async ({ page }) => {
~~~

~~~bash
npx playwright test --grep @smoke
~~~

## Config: pilihan-pilihannya, dibuat sekali, terlihat

~~~ts
// playwright.config.ts
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },

  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["junit", { outputFile: "results/junit.xml" }],
  ],

  use: {
    baseURL: process.env.TF_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    { name: "setup", testMatch: /global\\.setup\\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "results/auth.json" },
      dependencies: ["setup"],
    },
  ],
});
~~~

Tidak ada yang baru di sini — setiap baris sudah datang di pelajaran sebelumnya.
Yang baru adalah semuanya **berada di satu berkas dengan alasannya terlihat di
nilainya**: \`retries\` berbeda antara CI dan lokal karena pertukarannya berbeda;
\`trace: "on-first-retry"\` karena itulah saat Anda membutuhkannya dan ia mahal
kalau selain itu. Config yang penuh angka tanpa penjelasan adalah hal pertama
yang tidak dipercaya orang baru.

Project \`setup\` masuk sekali lalu menulis \`storageState\`, sehingga setiap
pengujian dimulai dalam keadaan terautentikasi — jawaban yang diberikan pelajaran
page object untuk enam puluh proses masuk yang lambat.

## Konfigurasi datang dari environment

~~~bash
# .env.example — di-commit. .env yang sungguhan di-gitignore.
TF_BASE_URL=http://localhost:3000
TF_PROJECT=your-project-slug
TF_EMAIL=qa@example.com
TF_PASSWORD=
TF_API_KEY=
~~~

**Commit \`.env.example\`, jangan pernah \`.env\`.** Berkas contohnya adalah
dokumentasi yang tidak bisa basi diam-diam: kalau variabel baru dibutuhkan dan
tidak ditambahkan di sana, pelaksanaan pertama orang berikutnya gagal karena
variabel yang hilang alih-alih karena sesuatu yang misterius.

Gagallah dengan berisik dan sejak awal ketika sebuah variabel hilang:

~~~ts
// global.setup.ts
for (const key of ["TF_BASE_URL", "TF_EMAIL", "TF_PASSWORD"]) {
  if (!process.env[key]) throw new Error(\`Missing required env var: \${key}\`);
}
~~~

Dua puluh pengujian yang kehabisan waktu karena \`baseURL\` tidak terdefinisi
adalah diagnosis dua puluh menit. Satu baris yang menyebut variabel yang hilang
adalah diagnosis sepuluh detik.

## Konvensi yang layak dituliskan

Empat, dan inilah yang paling cepat luruh tanpa aturan tertulis:

- **Nama pengujian membawa id case-nya** — \`TC-<SLUG>-<n>\`, supaya hasilnya cocok
  di TestForge. Tegakkan dengan aturan lint kalau suite-nya besar.
- **Page object memaparkan aksi dan locator; pengujian memiliki asersinya.**
- **Setiap pengujian membuat datanya sendiri dan membersihkannya di sebuah
  fixture.**
- **Tanpa \`waitForTimeout\`.** Larang saat tinjauan; aturan ESLint lebih baik.

Kalau dituliskan, keempatnya selamat dari sebuah serah terima. Sebagai cerita
lisan, keempatnya bertahan sampai anggota baru yang kedua.

## README adalah bagian dari keluarannya

Berkas paling bernilai di repositori, dan yang paling sering tidak ada. Enam
bagian:

~~~markdown
# Pengujian E2E

## Persiapan
git clone … && npm ci && npx playwright install --with-deps
cp .env.example .env   # lalu isi — minta kredensial ke #qa

## Menjalankan
npm run e2e                  # semuanya
npm run e2e -- --grep @smoke # smoke saja
npm run e2e -- --ui          # interaktif, terbaik untuk menulis pengujian

## Ketika ada yang gagal
npx playwright show-report
npx playwright show-trace results/…/trace.zip

## Struktur
tests/ per fitur · pages/ page object · fixtures/ data + auth

## Konvensi
Nama pengujian membawa TC-<SLUG>-<n>. Tanpa waitForTimeout. Pengujian memiliki
asersinya.

## Bertanya ke siapa
#qa-automation · pemilik: @ade
~~~

**"Ketika ada yang gagal" adalah bagian yang dilewati orang dan paling mereka
butuhkan.** Anggota baru yang pelaksanaan pertamanya merah entah akan belajar
membaca sebuah trace dalam dua menit entah menyimpulkan suite-nya rusak. Yang
mana yang terjadi ditentukan oleh ada tidaknya bagian itu.

## Apa lagi yang diserahkan selain kode

Sebuah framework bukan cuma sebuah repositori:

- **CI yang menjalankannya**, di pull request, dengan merah menghalangi merge.
- **Hasil yang pergi ke tempat yang tahan lama** — unggahan karya penutupnya,
  supaya riwayatnya hidup lebih lama daripada artifact tujuh hari.
- **Seorang pemilik bernama**, dan sebaiknya dua orang yang keduanya sudah pernah
  menjalankannya secara lokal. Suite yang persis satu orang saja pernah
  menjalankannya belum diserahterimakan.
- **Daftar karantina dengan tanggalnya**, supaya orang berikutnya mewarisi
  utangnya secara eksplisit alih-alih menemukannya.

## Tahu kapan berhenti membangun

Mode kegagalan yang diperingatkan pelajaran page object berlaku untuk seluruh
framework-nya, dan pada skala ini ia lebih mahal:

- **Reporter kustom** padahal yang HTML sudah cukup.
- **API pembungkus di atas Playwright** supaya pengujiannya memanggil
  \`click(el)\` alih-alih \`el.click()\` — kini tidak ada yang bisa membaca
  dokumentasi resminya lalu menerapkannya.
- **Lapisan abstraksi konfigurasi** untuk satu environment.
- **Pembangkit data buatan sendiri** padahal faker sudah ada.

Pemeriksaannya: **apakah ini membantu orang lain menulis pengujian lebih cepat,
atau ia cuma menyenangkan saya?** Abstraksi memperoleh tempatnya dengan dipakai
tiga kali, bukan dengan diantisipasi. Framework terbaik sebagian besarnya
Playwright, ditata dengan jernih, dengan README yang baik.

## Satu kata terakhir tentang untuk apa ini

Dua belas pelajaran lalu argumennya adalah otomasi layak hanya di tempat ia balik
modal, dan bahwa "otomasi menggantikan QA manual" itu keliru. Segala yang sejak
itu mengabdi pada suite yang dipercaya sebuah tim: locator yang selamat dari
refactor, asersi yang bisa gagal, pengujian yang memiliki datanya sendiri, hasil
yang menumpuk, kelabilan yang diperlakukan sebagai angka alih-alih sebagai
suasana hati.

Yang Anda punya di ujungnya bukan tumpukan skrip. Ia sebuah lingkaran umpan balik
— seseorang mengubah aplikasinya, dan dalam sepuluh menit timnya tahu apa yang
rusak, dalam istilah yang terikat pada case yang sudah mereka tulis.

## Di mana TestForge berperan

Proyek sandbox Anda adalah contoh hidup dari seluruh lingkarannya: case, sebuah
suite, run dengan riwayat, dan hasil yang tiba dari CI lewat \`/api/v1/junit\`.
Itulah hal yang bisa ditunjukkan kepada orang yang bertanya apa yang bisa Anda
kerjakan.

Dua langkah berikutnya yang layak diambil:

- **Kerjakan sungguhan.** Arahkan sebuah workflow ke aplikasi yang benar-benar
  Anda pakai, sekecil apa pun, lalu biarkan riwayat dua minggu menumpuk.
- **Tuliskan.** Sebuah repositori, sebuah README, dan sebuah proyek dengan run
  yang sungguhan adalah karya portofolio yang bisa dibuka seorang hiring manager
  — dan di situlah track Beyond Functional melanjutkan.

**Anda telah menyelesaikan Otomasi QA.** Track [Beyond
Functional](/id/academy/beyond) melangkah lebih jauh — performa, keamanan,
contract testing, observabilitas, dan membangun portofolio yang selama ini
diam-diam dirakit track ini.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Kenapa mengelompokkan pengujian menurut fitur (tests/checkout/) alih-alih menurut jenis (tests/smoke/, tests/regression/)?",
      choices: [
        {
          id: "a",
          text: "Playwright tidak bisa menjalankan sebuah direktori secara selektif, jadi direktori berdasarkan jenis tidak berpengaruh",
        },
        {
          id: "b",
          text: "Orang yang mengubah checkout perlu menemukan setiap pengujian tentang checkout, dan jenis sebuah pengujian berubah tergantung siapa yang bertanya sementara fiturnya tidak",
        },
        {
          id: "c",
          text: "Direktori berdasarkan fitur berjalan lebih cepat karena Playwright memparalelkan per folder",
        },
        {
          id: "d",
          text: "Direktori berdasarkan jenis merusak struktur keluaran reporter JUnit",
        },
      ],
      explanation:
        "Pertanyaan penatanya adalah apa yang perlu ditemukan seseorang. Developer yang menyentuh checkout menginginkan setiap pengujian checkout di satu tempat; kalau terpisah antara folder smoke dan regression, yang mereka lewatkan itulah yang rusak belakangan. Dan klasifikasinya sendiri tidak stabil — pengujian yang sama adalah smoke bagi satu tim dan regression bagi tim lain, dan ia diklasifikasikan ulang tanpa perilakunya berubah, sementara fitur yang dicakupnya adalah fakta yang tahan lama. Tag plus --grep @smoke memenuhi kebutuhan pelaksanaan selektif tanpa pohon direktori kedua, jadi tidak ada yang hilang. Playwright menjalankan subset apa pun yang Anda tunjuk dan memparalelkan per berkas, bukan per folder.",
    },
    {
      id: "q2",
      stem: "Kenapa meng-commit .env.example sementara meng-gitignore .env?",
      choices: [
        {
          id: "a",
          text: "Playwright menolak mulai kalau .env.example tidak ada",
        },
        {
          id: "b",
          text: "Ia mendokumentasikan variabel yang dibutuhkan dengan cara yang gagal secara kasatmata ketika ia basi, tanpa menaruh rahasia di repositori",
        },
        {
          id: "c",
          text: "Berkas contohnya dimuat otomatis ketika .env tidak ada, jadi pengujiannya tetap berjalan",
        },
        {
          id: "d",
          text: "Ia memungkinkan CI membaca kredensialnya tanpa mengonfigurasi secret",
        },
      ],
      explanation:
        "Berkas contohnya adalah dokumentasi yang tidak bisa membusuk diam-diam: kalau variabel baru dibutuhkan dan tidak ada yang menambahkannya di sana, pelaksanaan pertama orang berikutnya gagal sambil menyebutkan variabel yang hilang alih-alih mati di tempat yang membingungkan dua puluh pengujian kemudian. Ia membawa kuncinya dan bukan nilainya, jadi tidak ada rahasia yang masuk ke repositori — dan itu batas yang sama yang digariskan pelajaran data uji dan pelajaran CI. Tidak ada yang memuatnya otomatis sebagai cadangan dan tidak ada yang mewajibkannya ada; seluruh nilainya bersifat sosial, dan justru karena itulah memasangkannya dengan pemeriksaan awal yang eksplisit yang melempar error pada variabel yang hilang sepadan dengan empat barisnya.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang menandakan sebuah framework terlalu banyak dibangun?",
      choices: [
        {
          id: "a",
          text: "API pembungkus supaya pengujiannya memanggil click(el) alih-alih el.click()",
        },
        {
          id: "b",
          text: "Reporter kustom yang dibangun karena reporter HTML-nya dianggap 'terlalu generik'",
        },
        {
          id: "c",
          text: "Sebuah fixture yang membuat dan menghapus proyek, dipakai dua belas pengujian",
        },
        {
          id: "d",
          text: "Lapisan abstraksi konfigurasi untuk satu environment saja",
        },
      ],
      explanation:
        "Pembungkusnya yang paling mahal di antara ketiganya, karena ia memutus suite-nya dari dokumentasi Playwright sendiri — anggota baru tidak lagi bisa membaca dokumen resminya lalu menerapkannya, dan persis itulah serah terima yang menjadi pokok pelajaran ini. Reporter kustom dan lapisan config untuk satu environment sama-sama usaha yang dibelanjakan untuk sesuatu yang tidak diminta siapa pun, bersaing dengan menulis pengujian. Fixture-nya adalah contoh tandingannya dan polanya bekerja sebagaimana dimaksudkan: ia dipakai dua belas kali, ia menyingkirkan duplikasi yang nyata, dan ia membuat pembersihannya terjamin. Pemeriksaannya adalah apakah sebuah abstraksi membantu orang lain menulis pengujian lebih cepat — diperoleh dengan dipakai tiga kali, bukan dengan diantisipasi.",
    },
  ],
};
