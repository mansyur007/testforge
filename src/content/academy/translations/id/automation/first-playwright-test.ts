import type { LessonTranslation } from "../../../types";

export const firstPlaywrightTestId: LessonTranslation = {
  slug: "first-playwright-test",
  title: "Pengujian Playwright pertama Anda",
  summary:
    "Pasang, rekam, jalankan, dan pahami setiap baris dari yang baru saja Anda tulis.",
  body: `
## Dua puluh menit menuju suite yang berjalan

Pelajaran ini berakhir dengan pengujian browser yang berjalan di mesin Anda dan
sebuah trace yang bisa Anda telusuri bingkai demi bingkai. Tidak ada yang sekali
pakai di sini — empat perintah yang sama inilah yang dipakai proyek sungguhan di
hari ke-400.

Playwright adalah pustaka otomasi browser milik Microsoft: satu API yang
mengemudikan Chromium, Firefox, dan WebKit, dengan dua fitur yang paling penting
bagi pemula tertanam di dalam alih-alih ditempelkan — **auto-waiting** dan
**trace**. Berdua keduanya menyingkirkan dua hal yang membuat suite pertama
menyiksa: sleep dan debugging buta.

## Pasang

Di sebuah repositori — milik Anda, atau folder baru — jalankan:

~~~bash
npm init playwright@latest
~~~

Ia mengajukan empat pertanyaan. Jawaban yang masuk akal untuk percobaan pertama:
**TypeScript**, pengujian di \`tests/\`, **ya** untuk workflow GitHub Actions
(pelajaran CI akan memakainya), **ya** untuk mengunduh browser-nya. Playwright
membawa build browser-nya sendiri — itulah yang ~300 MB — sehingga semua orang di
tim dan di CI menjalankan biner yang identik. Itu saja sudah membunuh satu genre
"jalan kok di komputer saya".

Yang Anda dapatkan:

~~~
tests/example.spec.ts          contoh pengujian
tests-examples/                demo lebih panjang yang bisa Anda hapus
playwright.config.ts           satu berkas yang layak dibaca hari ini
.github/workflows/playwright.yml
~~~

## Jalankan

~~~bash
npx playwright test              # headless, semua browser, yang dijalankan CI
npx playwright test --ui         # mode UI — pakai ini selagi menulis
npx playwright test --headed     # tonton browser sungguhan mengerjakannya
npx playwright test tests/example.spec.ts:5    # satu pengujian, per baris
~~~

**Tinggallah di \`--ui\` selagi Anda menulis.** Ia memberi Anda mode pantau,
snapshot DOM di setiap langkah, pemilih locator, dan log jaringan, semuanya dalam
satu jendela. Pelaksanaan headless untuk CI dan untuk saat Anda sudah memercayai
pengujiannya.

## Rekam draf pertama

~~~bash
npx playwright codegen https://example.com
~~~

Dua jendela terbuka: browser tempat Anda mengeklik-klik, dan panel yang menuliskan
kode untuk klik Anda. Itu cara tercepat mulai bergerak, dan ia sungguh-sungguh
bagus dalam memilih locator yang aksesibel.

**Perlakukan hasilnya sebagai draf pertama, jangan pernah sebagai pengujiannya.**
Codegen merekam jalur yang kebetulan Anda tempuh, dalam urutan yang kebetulan
Anda tempuh, tanpa asersi yang layak disebut asersi dan tanpa gagasan apa pun
tentang klik mana yang menjadi intinya. Skrip rekaman adalah transkrip.
Pengujian adalah transkrip plus **sebuah klaim tentang apa yang seharusnya
benar**, dan hanya Anda yang tahu apa klaim itu.

Alur kerja yang bekerja: rekam untuk mendapat locator dan bentuknya, lalu hapus
separuhnya dan tulis asersinya dengan tangan.

## Setiap baris dari pengujian sungguhan

~~~ts
import { test, expect } from "@playwright/test";

test("a valid login lands on the dashboard", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByLabel("Password").fill("correct-horse");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
~~~

Baris demi baris, karena setiap satunya adalah sebuah keputusan:

- **\`test("...", ...)\`** — namanya bukan hiasan. Ia yang muncul di laporan, di
  CI, dan (karya penutup track ini) di JUnit XML yang dicocokkan TestForge dengan
  case Anda. Tulislah sebagai kalimat tentang perilaku: *"a valid login lands on
  the dashboard"*, bukan *"login test 2"*.
- **\`async ({ page })\`** — \`page\` adalah sebuah **fixture**: Playwright membuat
  konteks browser yang segar untuk pengujian ini dan memusnahkannya setelahnya.
  Cookie baru, penyimpanan baru, tanpa rembesan dari pengujian sebelumnya. Itulah
  sebabnya pengujian Playwright bisa berjalan paralel dengan aman, dan itulah
  sebabnya Anda nyaris tidak pernah menulis kode pembersihan untuk browser-nya.
- **\`await page.goto("/login")\`** — relatif, karena \`baseURL\` tinggal di
  config-nya. Menanamkan \`https://staging.example.com\` ke dalam 200 pengujian
  adalah cara sebuah suite jadi tidak bisa dijalankan di tempat lain.
- **\`getByLabel("Email")\`** — ditemukan dengan cara pembaca layar menemukannya,
  lewat labelnya. Ia selamat dari penggantian nama kelas, penulisan ulang gaya,
  dan penukaran komponen. Pelajaran berikutnya seluruhnya tentang pilihan ini.
- **\`.fill(...)\`** — satu panggilan yang memfokuskan, mengosongkan, dan
  mengetik. \`.type()\` ada untuk saat Anda butuh peristiwa per ketukan tombol;
  \`fill\` adalah bawaannya.
- **\`getByRole("button", { name: "Sign in" })\`** — peran plus nama yang bisa
  diakses. Cocok dengan \`<button>\`, \`<input type=submit>\`, dan
  \`<a role="button">\` sama saja, dan ia gagal ketika tombolnya berhenti bisa
  dijangkau sebagai tombol — dan itu bug sungguhan yang layak digagalkan.
- **\`await expect(...)\`** — sebuah **web-first assertion**. Ia mencoba ulang
  sampai lulus atau kehabisan waktu, dan itulah yang membuat pengujiannya selamat
  menghadapi dashboard yang butuh 800 md untuk ter-render tanpa satu pun sleep.
- **\`await\` pada semuanya.** Setiap satunya mengembalikan sebuah Promise.
  \`await\` yang hilang adalah bug klasik minggu pertama: pengujiannya lulus
  seketika, tanpa mengasersikan apa pun, dan error-nya muncul di pengujian *lain*
  belakangan.

## Baris config yang benar-benar akan Anda sentuh

~~~ts
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html"], ["junit", { outputFile: "results.xml" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],
});
~~~

- **\`baseURL\`** — setel sekarang, pakai jalur relatif di mana-mana.
- **\`trace: "on-first-retry"\`** — satu baris paling berharga di berkas itu.
  Lihat di bawah.
- **\`forbidOnly\`** — CI gagal kalau ada yang meng-commit \`test.only\`. Tanpa
  itu, satu \`.only\` yang tersasar diam-diam menyusutkan suite Anda menjadi satu
  pengujian yang lulus.
- **\`retries: 2\` hanya di CI** — bawaan yang pragmatis dengan bahaya nyata
  terlekat: retry menyembunyikan kelabilan alih-alih memperbaikinya. Pertahankan,
  tapi tetaplah melihat pengujian mana yang hanya lulus di percobaan kedua.
  Pelajaran tentang pengujian labil membahas persis itu.
- **\`reporter\`** — entri \`junit\`-lah yang diunggah karya penutupnya ke
  TestForge. Tambahkan sekarang; ia berbiaya satu baris.
- **\`projects\`** — browser-nya. Mulai dengan Chromium saja kalau pelaksanaannya
  terasa lambat, dan tambahkan yang lain ketika suite-nya sepadan dengan
  menit-menitnya.

## Ketika ia gagal: trace viewer

~~~bash
npx playwright show-report      # laporan HTML-nya
npx playwright show-trace trace.zip
~~~

Sebuah trace adalah rekaman pelaksanaannya: filmstrip, DOM di setiap langkah,
panggilan jaringan, console, dan baris sumber untuk setiap aksi. Anda bisa
menyorot langkah mana pun dan melihat halamannya persis seperti keadaannya —
termasuk sorotan locator yang menunjukkan apa yang *dikira* Playwright sedang ia
klik.

Ini mengubah cara Anda men-debug. Pertanyaannya berhenti menjadi "kenapa ia gagal
di CI padahal lulus di sini?" dan menjadi "inilah bingkai tempat elemennya belum
ada". Tester yang membaca trace memperbaiki bug otomasi dalam hitungan menit;
yang menambahkan \`waitForTimeout\` sampai hijau sedang menulis kelabilan esok
hari.

## Masalah pelaksanaan pertama, dan artinya

| Gejala | Penyebab |
|---|---|
| \`Timeout 30000ms exceeded waiting for locator\` | Elemennya tidak pernah cocok. Buka trace-nya dan lihat bingkainya — biasanya locator yang keliru, kadang halaman yang memang rusak |
| \`strict mode violation: resolved to 3 elements\` | Locator Anda ambigu. Ini bukan bug untuk dibungkam — persempit (pelajaran berikutnya) |
| \`net::ERR_CONNECTION_REFUSED\` | Aplikasinya tidak berjalan. Pakai \`webServer\` di config supaya \`npx playwright test\` yang menyalakannya |
| Pengujian lulus mencurigakan cepat, tanpa mengasersikan apa pun | \`await\` yang hilang |
| Lulus sendirian, gagal di dalam suite | State yang dibagi antarpengujian — biasanya akun atau catatan tetap yang diubah kedua pengujian |

## Latihannya

Arahkan sebuah pengujian ke **proyek sandbox TestForge Anda**. Masuk, mendarat di
proyeknya, dan asersikan sesuatu yang benar tentangnya:

1. \`npm init playwright@latest\` di folder baru, dan setel \`baseURL\` ke host
   TestForge Anda.
2. Tulis **satu** pengujian: masuk, navigasi ke proyek sandbox Anda, dan
   asersikan nama proyeknya terlihat sebagai sebuah heading.
3. Jalankan di \`--ui\`, lalu headless.
4. Rusakkan dengan sengaja — ubah heading yang diharapkan menjadi sesuatu yang
   keliru — jalankan lagi lalu **baca trace-nya**. Temukan bingkai yang
   menunjukkan apa yang sebenarnya dikatakan halamannya.

Langkah terakhir itulah inti latihannya. Pengujian pertama yang lulus itu
perasaan yang menyenangkan; bisa menjelaskan yang merah itulah keahliannya.

Jauhkan kredensial dari berkasnya — \`process.env.TF_EMAIL\` dan sebuah \`.env\`
yang ada di \`.gitignore\`. Meng-commit login yang bekerja ke sebuah repositori
adalah kekeliruan paling umum di proyek otomasi pertama, dan itu kekeliruan yang
disadari seorang pemberi kerja.

## Di mana TestForge berperan

Sekarang Anda punya pengujian yang menghasilkan sebuah hasil di setiap
pelaksanaan. Hasil itu lebih berharga bila terlekat pada case yang dijalankannya
daripada sekadar duduk di terminal, dan untuk itulah baris reporter \`junit\` di
atas ada: ia menulis \`results.xml\`, dan karya penutupnya mengunggahnya ke
\`/api/v1/junit\` sehingga proyek sandbox Anda memperoleh sebuah run dengan
kelulusan, durasi, dan riwayat.

Namai pengujiannya sesuai case-nya sekarang — \`"TC-SHOP-12 a valid login lands
on the dashboard"\`, dengan \`SHOP\` adalah slug proyek Anda — dan pencocokannya
sudah dikerjakan untuk Anda ketika Anda sampai ke sana.

**Selanjutnya:** pilihan yang terus ditunda pelajaran ini — locator yang selamat
dari sebuah refactor, dan kenapa rantai CSS yang ditawarkan editor Anda rusak
setiap sprint.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Skrip codegen yang baru direkam berjalan hijau setiap kali. Apa hal terpenting yang harus dilakukan padanya sebelum di-commit?",
      choices: [
        {
          id: "a",
          text: "Ganti locator-nya dengan selektor CSS yang disalin dari devtools",
        },
        {
          id: "b",
          text: "Tambahkan asersi tentang apa yang seharusnya benar — rekamannya hanya mereproduksi klik",
        },
        {
          id: "c",
          text: "Sisipkan jeda di antara langkahnya supaya ia tidak mendahului halamannya",
        },
        {
          id: "d",
          text: "Pecah supaya tiap klik yang direkam menjadi pengujiannya sendiri",
        },
      ],
      explanation:
        "Rekaman adalah transkrip sebuah jalur, dan pengujian adalah transkrip plus klaim tentang apa yang seharusnya benar — tanpa asersi ia hanya bisa gagal ketika browser sama sekali tidak sanggup menuntaskan sebuah langkah, jadi ia lulus dengan riang terhadap dashboard yang me-render data yang keliru. Locator milik codegen biasanya justru fiturnya yang terbaik dan merupakan hal terakhir yang layak diturunkan menjadi CSS. Jeda tidak diperlukan karena web-first assertion dan aksinya sudah mencoba ulang, dan satu klik per pengujian akan membuang urutan yang justru membuat alurnya bermakna.",
    },
    {
      id: "q2",
      stem: "Sebuah pengujian lulus dalam sekitar 200 md, jauh sebelum halaman yang disasarnya mungkin selesai dimuat, dan sebuah pengujian lain yang tak berhubungan mulai gagal kadang-kadang. Apa penyebab yang mungkin?",
      choices: [
        {
          id: "a",
          text: "Browser meng-cache halamannya dari pelaksanaan sebelumnya",
        },
        {
          id: "b",
          text: "Worker paralel berbagi satu konteks browser",
        },
        {
          id: "c",
          text: "await yang hilang — pengujiannya selesai sebelum aksinya berjalan, dan penolakannya muncul di tempat lain",
        },
        {
          id: "d",
          text: "Timeout asersinya disetel terlalu rendah di config",
        },
      ],
      explanation:
        "Setiap aksi Playwright mengembalikan Promise, jadi satu yang tidak di-await membuat fungsi pengujiannya langsung kembali: ia melapor hijau tanpa mengasersikan apa pun, dan pekerjaan yang ia mulai selesai — atau menolak — setelah pengujiannya berakhir, dan itulah sebabnya error-nya mendarat di apa pun yang berjalan berikutnya. Kelulusan yang mencurigakan cepat dan kegagalan yang tak berhubungan itu adalah bug yang sama dilihat dua kali. Konteks tidak dibagi: tiap pengujian mendapat miliknya sendiri, dan itulah yang membuat paralelisme aman. Dan timeout yang rendah menghasilkan kegagalan, bukan kelulusan yang cepat.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang layak berada di playwright.config.ts alih-alih di berkas pengujian masing-masing?",
      choices: [
        {
          id: "a",
          text: "Base URL tempat suite-nya dijalankan",
        },
        {
          id: "b",
          text: "Perekaman trace saat retry",
        },
        {
          id: "c",
          text: "Teks heading yang diharapkan di dashboard",
        },
        {
          id: "d",
          text: "Kumpulan browser tempat setiap pengujian berjalan",
        },
      ],
      explanation:
        "Base URL, kebijakan trace, dan project browser semuanya urusan environment: ketiganya menggambarkan bagaimana dan di mana suite-nya berjalan, jadi memusatkannya memungkinkan pengujian yang sama berjalan di lokal, di staging, dan di CI tanpa suntingan. Heading yang diharapkan adalah jenis fakta yang berlawanan — ia adalah perilaku yang sedang diuji, khas satu pengujian, dan memindahkannya ke config akan menyembunyikan asersinya dari orang yang membaca pengujiannya. Pembagian yang berguna untuk diingat: config menjawab di mana dan bagaimana, pengujian menjawab apa yang seharusnya benar.",
    },
  ],
};
