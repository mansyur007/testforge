import type { LessonTranslation } from "../../../types";

export const ciGithubActionsId: LessonTranslation = {
  slug: "ci-github-actions",
  title: "Menjalankan di CI dengan GitHub Actions",
  summary:
    "Workflow, matriks, artifact, dan menjaga pipeline-nya di bawah sepuluh menit.",
  body: `
## Suite yang tidak dijalankan siapa pun adalah suite yang tidak dipercaya siapa pun

Pengujian di laptop Anda melindungi Anda. Pengujian di setiap pull request
melindungi timnya. Jarak antara keduanya adalah beda antara otomasi sebagai
kebiasaan pribadi dan otomasi sebagai jaring pengaman — dan jaraknya satu berkas.

Dua hal harus benar sebelum berkas itu layak ditulis, dan keduanya dibangun
pelajaran sebelumnya: suite-nya harus lulus dengan andal ketika dijalankan di
environment yang berbeda (locator, penungguan), dan setiap pengujian harus
memiliki datanya sendiri supaya worker paralel tidak bertabrakan.

## Workflow terkecil yang bekerja

~~~yaml
# .github/workflows/e2e.yml
name: E2E

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    timeout-minutes: 20
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - run: npx playwright install --with-deps chromium

      - run: npx playwright test
        env:
          TF_BASE_URL: \${{ secrets.TF_BASE_URL }}
          TF_EMAIL: \${{ secrets.TF_EMAIL }}
          TF_PASSWORD: \${{ secrets.TF_PASSWORD }}
~~~

Baris demi baris, bagian yang tidak kentara:

- **\`timeout-minutes\`** pada job-nya. Tanpa itu, pengujian yang menggantung
  membakar enam jam penuh yang diizinkan GitHub sebelum ada yang menyadarinya.
- **\`npm ci\`, bukan \`npm install\`** — ia memasang persis isi lockfile-nya,
  sehingga CI tidak mungkin melenceng ke pohon dependensi yang berbeda dari mesin
  Anda.
- **\`--with-deps\`** memasang pustaka sistem yang dibutuhkan browser-nya. Inilah
  langkah yang dilewati orang lalu menghabiskan satu sore mengurusi \`libnss3\`
  yang hilang.
- **\`chromium\`** saja untuk awalnya. Memasang tiga browser berbiaya sekitar satu
  menit di setiap pelaksanaan; tambahkan ketika Anda punya alasan.
- **Rahasia di \`env\`, jangan pernah di berkasnya.** Repositori bukan penyimpanan
  rahasia, dan kata sandi yang ter-commit berarti rotasi dan laporan insiden.

## Artifact adalah yang membuat pelaksanaan CI yang merah bisa di-debug

Pelaksanaan yang gagal yang keluarannya hanya "expected visible, got hidden"
membuat Anda menebak-nebak. Unggah laporan dan trace-nya:

~~~yaml
      - uses: actions/upload-artifact@v4
        if: \${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
~~~

**\`if: !cancelled()\`** alih-alih \`if: failure()\` — trace dari pelaksanaan yang
lulus adalah yang Anda inginkan pada hari sesuatu tampak mencurigakan padahal
hijau, dan itu satu-satunya cara membandingkan pelaksanaan yang baik dengan yang
buruk. Ia melewati pelaksanaan yang memang dibatalkan, yang tidak punya apa pun
yang layak disimpan.

Setel retensinya dengan sengaja. Bawaannya 90 hari, artifact diperhitungkan dalam
tagihan penyimpanan, dan tidak ada yang membuka trace berumur tiga minggu.

Dengan \`trace: "on-first-retry"\` dari config di pelajaran Playwright pertama
Anda, artifact-nya memuat trace persis untuk pengujian yang membutuhkannya. Unduh
ia, jalankan \`npx playwright show-trace\`, dan Anda sedang menelusuri kegagalan
CI itu bingkai demi bingkai di mesin Anda sendiri. Lingkaran itu — merah di CI,
trace di meja Anda dalam dua menit — adalah seluruh alasan pelajaran ini datang
sebelum pelajaran tentang pengujian labil.

## Dari mana aplikasi yang diuji berasal

Tiga bentuk, dan memilih yang keliru adalah alasan paling umum percobaan CI
pertama gagal:

**1. Aplikasinya ada di repositori yang sama** — biarkan Playwright yang
menyalakannya:

~~~ts
// playwright.config.ts
webServer: {
  command: "npm run build && npm run start",
  url: "http://localhost:3000",
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
},
~~~

**2. Sebuah environment yang sudah ter-deploy** — arahkan \`baseURL\` ke staging
lalu jalankan setelah deploy. Paling sederhana dikonfigurasi, dan ia
memperkenalkan bahaya yang nyata: pengujian Anda kini berbagi environment dengan
milik semua orang, dan itu persis masalah state bersama yang dijelaskan pelajaran
data uji, satu tingkat di atasnya. Data yang unik per pelaksanaan justru lebih
penting di sini, bukan kurang.

**3. Layanan yang dibutuhkan aplikasinya** — basis data, cache — sebagai service
container:

~~~yaml
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: postgres }
        options: >-
          --health-cmd pg_isready --health-interval 10s --health-retries 5
~~~

Opsi kesehatannya bukan hiasan. Tanpa itu, job-nya memulai pengujian Anda sebelum
Postgres menerima koneksi, dan Anda mendapat kegagalan yang tampak seperti
pengujian labil padahal bukan.

## Menjaganya di bawah sepuluh menit

Pipeline yang ditunggu orang akan dibaca; yang makan empat puluh menit akan
dilangkahi saat merge. Kira-kira berurutan menurut hasil-gunanya:

| Tuas | Efek khasnya |
|---|---|
| \`fullyParallel: true\` dan \`workers: 4\` di CI | Kemenangan tunggal terbesar |
| Sharding lintas job (di bawah) | Nyaris linear dengan jumlah runner |
| Cache biner browser-nya | 30–60 detik per pelaksanaan |
| Satu browser di PR, matriks penuh tiap malam | Memotong waktu browser dua pertiga |
| Persiapan lewat API alih-alih lewat UI | Detik per pengujian, berbunga |
| \`storageState\` alih-alih masuk per pengujian | Detik per pengujian |

Sharding memecah suite-nya ke beberapa job paralel:

~~~yaml
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - run: npx playwright test --shard=\${{ matrix.shard }}/4
~~~

**\`fail-fast: false\`** itu penting: bawaannya membatalkan shard yang lain begitu
satu gagal, jadi Anda mengetahui satu kegagalan alih-alih semuanya dan butuh satu
pelaksanaan penuh lagi untuk menemukan sisanya.

Sharding menghasilkan satu laporan per shard. Reporter \`blob\` milik Playwright
plus \`npx playwright merge-reports\` merakitnya kembali menjadi satu, dan itu juga
penting untuk pelajaran berikutnya — **karya penutupnya menginginkan satu berkas
JUnit, bukan empat**.

## Matriks browser, dan kapan membayarnya

~~~yaml
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
~~~

Melipattigakan setiap pelaksanaan di setiap pull request biasanya pertukaran yang
keliru. Pola yang bertahan: **chromium di pull request, matriks penuh tiap malam
atau sebelum rilis.** Cacat lintas browser itu nyata tapi jarang, dan ia jarang
mendesak dalam sepuluh menit yang sedang ditunggu seseorang untuk merge.

Ini bentuk otomasi dari argumen yang dibuat pelajaran kompatibilitas T2 tentang
memilih matriks perangkat dari penggunaan yang nyata alih-alih dari daftar segala
yang ada.

## Aturan yang menjaga CI tetap jujur

- **Pipeline merah menghalangi merge.** Suite yang bisa diabaikan akan diabaikan,
  dan sejak hari itu ia dokumentasi alih-alih gerbang.
- **\`forbidOnly: !!process.env.CI\`.** Satu \`test.only\` yang ter-commit kalau
  tidak akan menyusutkan seluruh suite Anda menjadi satu pengujian hijau, tanpa
  suara.
- **Retry adalah plester dengan tagihan.** \`retries: 2\` di CI adalah bawaan yang
  masuk akal dan ia menyembunyikan kelabilan alih-alih memperbaikinya.
  Pertahankan setelannya dan tetaplah membaca pengujian mana yang hanya lulus di
  percobaan kedua — daftar itulah pokok pelajaran berikutnya.
- **Jangan pernah menonaktifkan pengujian yang gagal demi hijau.** Karantina
  secara eksplisit, dengan pemilik dan tanggal. Beda karantina dan penghapusan
  adalah masih ada yang bertanggung jawab.
- **Jangan arahkan CI ke produksi.** Batas-batas dari pelajaran data uji berlaku
  dengan tenaga lebih besar di sini, karena CI berjalan tanpa ditunggui dan
  sering.

## Latihannya

Taruh sebuah workflow di sebuah repositori dan buat ia berjalan terhadap **proyek
sandbox TestForge Anda**:

1. Buat \`.github/workflows/e2e.yml\` dari workflow di atas.
2. Tambahkan \`TF_BASE_URL\`, \`TF_EMAIL\`, dan \`TF_PASSWORD\` sebagai repository
   secret — Settings → Secrets and variables → Actions. Pastikan tidak ada yang
   sensitif di berkas yang Anda commit.
3. Buka sebuah pull request dan tonton ia berjalan.
4. **Buat satu pengujian gagal dengan sengaja**, dorong, dan unduh artifact-nya.
   Buka trace-nya dengan \`npx playwright show-trace\` lalu temukan bingkai tempat
   ia melenceng.
5. Perbaiki dan tonton check-nya berubah hijau.

Langkah keempat lagi-lagi intinya. Workflow yang hanya pernah Anda lihat lulus
belum mengajari Anda apa pun; keahliannya adalah mengubah pelaksanaan CI yang
merah menjadi sebuah diagnosis tanpa akses ke mesin tempat ia gagal.

## Di mana TestForge berperan

Saat ini hasil Anda tinggal di sebuah artifact GitHub yang kedaluwarsa dalam
tujuh hari, terlekat pada satu pull request, terlihat oleh siapa pun yang
terpikir untuk melihat. Itu cukup untuk debugging dan tidak berguna untuk
pertanyaan yang benar-benar diajukan sebuah tim — apakah case ini memburuk,
pengujian mana yang paling sering gagal, seperti apa bulan lalu.

Menambahkan satu baris reporter dan satu langkah unggah mengirim hasil yang sama
ke tempat ia menumpuk terhadap case yang dijalankannya. Itulah karya penutupnya,
dan ia berikutnya.

**Selanjutnya:** karya penutup — hasilkan JUnit XML, unggah ke TestForge lewat
\`/api/v1/junit\`, dan baca kembali run yang baru saja Anda buat.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Kenapa mengunggah artifact laporan Playwright dengan `if: !cancelled()` alih-alih `if: failure()`?",
      choices: [
        {
          id: "a",
          text: "failure() bukan ekspresi GitHub Actions yang valid",
        },
        {
          id: "b",
          text: "Trace dari pelaksanaan yang lulus adalah yang memungkinkan Anda membandingkan pelaksanaan baik dengan yang buruk ketika sesuatu hijau tapi mencurigakan",
        },
        {
          id: "c",
          text: "Artifact yang diunggah saat gagal otomatis dihapus setelah job-nya berakhir",
        },
        {
          id: "d",
          text: "failure() hanya terpicu ketika seluruh workflow gagal, tidak pernah satu job saja",
        },
      ],
      explanation:
        "Menyimpan artifact dari pelaksanaan yang hijau berbiaya penyimpanan dan membelikan Anda garis dasarnya: ketika sebuah pengujian mulai berperilaku aneh tanpa gagal, satu-satunya cara melihat apa yang berubah adalah membandingkan trace-nya dengan trace dari saat semuanya baik. !cancelled() juga tetap melewati pelaksanaan yang memang dibatalkan, yang tidak punya apa pun yang layak disimpan. failure() valid dan memang bekerja di tingkat langkah — ia hanya membuang perbandingannya, dan justru itulah yang Anda inginkan pada hari suite yang hijau berhenti bisa dipercaya. Retensi layak disetel dengan sengaja di kedua kasus, karena bawaannya menyimpan semuanya selama 90 hari dengan beban tagihan penyimpanan Anda.",
    },
    {
      id: "q2",
      stem: "Sebuah workflow ber-shard memakai perilaku fail-fast bawaan. Shard 2 gagal. Apa biayanya secara praktis?",
      choices: [
        {
          id: "a",
          text: "Shard sisanya dibatalkan, jadi Anda melihat satu kegagalan dan butuh satu pelaksanaan penuh lagi untuk menemukan sisanya",
        },
        {
          id: "b",
          text: "Shard yang gagal dicoba ulang otomatis sampai lulus atau job-nya kehabisan waktu",
        },
        {
          id: "c",
          text: "Pengujian shard 2 dibagikan ulang ke shard yang lain",
        },
        {
          id: "d",
          text: "Tidak ada — fail-fast hanya memengaruhi build matriks lintas browser, bukan shard",
        },
      ],
      explanation:
        "fail-fast membatalkan job matriks bersaudaranya begitu satu gagal, dan itu masuk akal untuk sebuah build yang error pertamanya menjelaskan segalanya, tapi mubazir untuk suite pengujian yang tiap shard-nya memegang informasi yang mandiri. Anda membetulkan satu kegagalan yang Anda lihat, mendorong, lalu menemukan tiga lagi di shard 4 — dua siklus pipeline penuh alih-alih satu. Menyetel fail-fast: false adalah perbaikannya. Ia berlaku untuk dimensi matriks apa pun, termasuk shard, dan sama sekali tidak berhubungan dengan retry atau pembagian ulang pengujian.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang layak berada di workflow CI untuk sebuah suite browser?",
      choices: [
        {
          id: "a",
          text: "npm ci alih-alih npm install",
        },
        {
          id: "b",
          text: "npx playwright install --with-deps",
        },
        {
          id: "c",
          text: "Kredensial yang di-commit ke berkas workflow-nya supaya pelaksanaannya bisa direproduksi",
        },
        {
          id: "d",
          text: "timeout-minutes pada job-nya",
        },
      ],
      explanation:
        "npm ci memasang persis isi lockfile-nya, sehingga CI tidak mungkin diam-diam melenceng ke pohon dependensi yang berbeda dari yang Anda uji. --with-deps memasang pustaka sistem yang dibutuhkan browser-nya, dan melewatkannya menghasilkan kelas kegagalan libnss3-yang-hilang yang tampak seperti pengujian rusak padahal bukan. Timeout job mencegah pelaksanaan yang menggantung membakar enam jam penuh yang diizinkan GitHub. Kredensial tempatnya di repository secret dan dirujuk lewat env — repositori bukan penyimpanan rahasia, dan meng-commit login yang bekerja mengubah perubahan rutin menjadi rotasi dan laporan insiden, dan itu batas yang sama dengan yang digariskan pelajaran data uji.",
    },
  ],
};
