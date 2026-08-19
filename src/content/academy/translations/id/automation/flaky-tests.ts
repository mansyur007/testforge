import type { LessonTranslation } from "../../../types";

export const flakyTestsId: LessonTranslation = {
  slug: "flaky-tests",
  title: "Pengujian labil: diagnosis dan karantina",
  summary:
    "Menemukan penyebabnya, dan membungkam dengan jujur alih-alih mencoba ulang selamanya.",
  body: `
## Pengujian termahal adalah yang tidak dipercaya siapa pun

Pengujian labil lulus dan gagal terhadap kode yang sama. Ia lebih buruk daripada
pengujian yang tidak ada, dan alasannya bukan pelaksanaan ulang yang terbuang:

**Suite dengan pengujian labil melatih orang mengabaikan warna merah.** Begitu
"jalankan ulang saja" jadi refleks, regresi sungguhan berikutnya ikut dijalankan
ulang, lalu terkirim. Biayanya bukan menit-menit itu — biayanya adalah jaring
pengaman Anda berhenti dibaca sebagai sinyal.

Itulah sebabnya pelajaran ini tentang diagnosis alih-alih pembungkaman. Retry
membuat gejalanya lenyap dan membiarkan biayanya tetap di tempat.

## Retry menyembunyikannya; datanya memberi tahu Anda di mana

Setiap pelajaran yang menganjurkan \`retries: 2\` juga bilang ia menyembunyikan
kelabilan alih-alih memperbaikinya. Inilah imbalannya kalau tetap dipertahankan:
Playwright melaporkan pengujian yang gagal lalu lulus sebagai **flaky**, berbeda
dari lulus dan gagal.

~~~
  38 passed
   2 flaky
   1 failed
~~~

Angka itu adalah antrean pekerjaannya. **Run yang dilaporkan sebagai "hijau
dengan 2 flaky" bukan run yang hijau**, dan memperlakukannya begitu adalah cara
sebuah suite membusuk cukup lambat sehingga tidak ada yang menyadari itu terjadi
tahun mana.

Kalau pelaksanaan Anda mendarat di TestForge, sinyal yang sama ada di riwayat
case-nya dan ia lebih baik, karena ia bertahan: case yang sama, build yang sama,
lulus di satu run dan gagal di run berikutnya. Satu pelaksanaan ulang itu
anekdot; tiga puluh run itu sebuah laju.

## Urutkan berdasarkan laju, bukan berdasarkan kejengkelan

Perbaiki pengujian yang gagal 40% dari waktunya sebelum yang menjengkelkan Anda
pagi ini. Cara cepat mendapatkan angkanya:

~~~bash
npx playwright test tests/checkout.spec.ts --repeat-each=20
~~~

Dua puluh pelaksanaan satu berkas memberi tahu Anda jauh lebih banyak daripada
dua puluh tebakan. Tambahkan \`--workers=4\` untuk mereproduksi kegagalan yang
hanya muncul saat paralel, dan \`--repeat-each\` plus \`--headed\` ketika Anda
menduga soal waktu.

Dua laju yang layak diketahui secara terpisah: **seberapa sering ia gagal
sendirian**, dan **seberapa sering ia gagal dalam pelaksanaan suite penuh.**
Pengujian yang 100% andal sendirian dan 60% di dalam suite punya masalah state
bersama, bukan masalah waktu, dan satu perbandingan itu mempersempit pencariannya
lebih dari sebanyak apa pun membaca pengujiannya.

## Lima penyebab, dalam urutan yang sebaiknya Anda curigai

**1. Waktu — penungguan yang bukan penungguan.** \`waitForTimeout\`, atau asersi
atas sesuatu yang belum ter-render. Sejauh ini yang paling umum.

~~~ts
await page.getByRole("button", { name: "Save" }).click();
await page.waitForTimeout(1000);
expect(await page.getByRole("row").count()).toBe(4);   // mengambil sampel sekali

// →
await page.getByRole("button", { name: "Save" }).click();
await expect(page.getByRole("row")).toHaveCount(4);    // menjajaki berulang
~~~

**2. State bersama.** Lulus sendirian, gagal di dalam suite. Pelajaran data uji
adalah seluruh perbaikannya: data unik per pengujian, pembersihan di dalam
fixture, asersi yang dibatasi pada catatan Anda sendiri.

**3. Kebergantungan urutan.** Pengujian B hanya lulus kalau pengujian A berjalan
lebih dulu. Buktikan:

~~~bash
npx playwright test --workers=1 --grep "adds a case"
~~~

Kalau sebuah pengujian lulus dalam pelaksanaan penuh dan gagal sendirian, ia
tidak mandiri — ia meminjam persiapan dari tetangganya.

**4. Locator yang ambigu atau peka urutan.** \`.first()\` pada daftar yang
urutannya tidak dijamin bertindak pada elemen yang berbeda tergantung apa yang
dikembalikan server. Pelajaran locator menyebut ini lebih buruk daripada gagal,
karena ia juga *lulus* secara keliru.

**5. Aplikasinya memang labil.** Sebuah race condition, query lambat di dekat
sebuah timeout, kirim ganda. **Ini sebuah cacat, dan ini hasil yang seharusnya
Anda harapkan** — bug sungguhan yang direproduksi cukup andal sampai
tersadari.

Jangan menjangkau penyebab 5 lebih dulu, dan jangan menolak menjangkaunya sama
sekali. Banyak tiket "pengujian labil" ternyata race condition produksi yang
menyamar.

## Trace adalah jalan masuk tercepat

Pelajaran CI sudah menaruh trace di artifact Anda. Untuk pengujian labil,
trace-nya menjawab satu pertanyaan yang menentukan — *seperti apa rupa halamannya
pada saat ia gagal?*

- Elemennya belum ada → waktu (penyebab 1)
- Elemennya ada tapi menampilkan data pengujian lain → state bersama (penyebab 2)
- Elemennya ada, benar, dan klik-nya mendarat di tempat lain → sebuah banner
  cookie atau overlay mencegatnya
- Tab network menunjukkan 500 di satu percobaan dan 200 di berikutnya → penyebab
  5, dan Anda baru saja menemukan cacat yang nyata

\`--trace on\` selagi mereproduksi secara lokal memberi Anda rekaman yang sama
tanpa menunggu CI.

## Karantina dengan jujur

Kadang Anda tidak bisa memperbaikinya hari ini. Pilihannya bukan "biarkan merah"
atau "hapus" — keduanya tidak jujur ke arah yang berbeda.

~~~ts
test.fixme("TC-SHOP-42 checkout applies the discount", async ({ page }) => {
  // Labil sejak 2026-08-10 — gagal ~30% di CI, diduga sebuah race di
  // panggilan penetapan harga. Pemilik: @ade. Tinjau sebelum 2026-08-24.
  // Tiket: QA-812.
});
~~~

Empat hal yang menjadikannya karantina alih-alih penguburan:

- **Seorang pemilik.** Sebuah nama, bukan sebuah tim.
- **Sebuah tanggal.** Sesuatu yang kedaluwarsa akan dilihat; sesuatu yang
  terbuka tanpa batas tidak.
- **Sebuah tiket.** Supaya ia ada di suatu tempat selain komentar kode.
- **Keterlihatan.** Hitungan pengujian yang dikarantina, dilaporkan bersama
  run-nya. Satu itu beres-beres; lima belas itu suite yang sedang bermasalah, dan
  angkanyalah satu-satunya yang membuat itu kentara.

\`test.fixme\` di atas \`test.skip\` ketika maksudnya "ini rusak dan seharusnya
diperbaiki", karena keduanya terbaca berbeda oleh siapa pun yang menemukannya
berikutnya. Pakai \`test.fail\` ketika sebuah pengujian *seharusnya* gagal sampai
cacat yang diketahui ditutup — ia memerah ketika bug-nya diperbaiki, dan itu
alarm yang sungguh berguna.

**Yang bukan karantina:** menghapus pengujiannya, mengomentarinya, membungkusnya
dengan \`try/catch\`, atau menambahkan retry ketiga. Semua itu menyingkirkan
sinyalnya dan pertanggungjawabannya sekaligus.

## Pencegahan, yang lebih murah daripada semua ini

Sebagian besar pelajaran ini adalah tagihan atas keputusan yang diambil lebih
awal, dan layak disebutkan keputusan yang mana:

| Praktik | Kelabilan yang dicegahnya |
|---|---|
| Web-first assertion, jangan pernah \`waitForTimeout\` | Penyebab 1, nyaris sepenuhnya |
| Data unik per pengujian, pembersihan di fixture | Penyebab 2 dan 3 |
| Locator berbasis role, tanpa \`.first()\` pada daftar yang ambigu | Penyebab 4 |
| \`fullyParallel: true\` sejak hari pertama | Menyingkap 2 dan 3 selagi suite-nya masih kecil |
| \`forbidOnly\` di CI | Bukan kelabilan, tapi kelas kebohongan senyap yang sama |

Yang keempat adalah yang dilewati orang lalu disesali. Menjalankan paralel sejak
awal membuat pelanggaran kemandirian gagal *seketika*, selagi suite-nya masih
sepuluh pengujian dan perbaikannya kecil. Menyalakan paralelisme pada 400
pengujian berarti menemukan setiap satunya dalam minggu yang sama.

## Apa yang disampaikan kepada orang

Kelabilan adalah sebuah angka, dan melaporkannya sebagai angka mengubah
percakapannya:

> Suite: 312 pengujian. Pass rate 98,1% selama 30 pelaksanaan terakhir. Empat
> pengujian menyumbang 80% kegagalannya; dua dikarantina dengan pemiliknya, dua
> sedang diperbaiki sprint ini. Tidak ada pengujian yang dikarantina yang mencakup
> jalur penghalang rilis.

Itu pelajaran pelaporan T2 diterapkan pada suite Anda sendiri — pengamatan
dipisahkan dari penilaian, dan sebuah angka dengan kondisinya terlekat.
"Pengujiannya agak labil" tidak menjadwalkan apa pun. Paragraf di atas mendapat
alokasi waktu, karena ia menyatakan apa yang rusak, seberapa banyak, dan apa yang
terjadi berikutnya.

## Di mana TestForge berperan

Pelajaran inilah alasan karya penutupnya ada. Suite lokal memberi tahu Anda
sebuah pengujian gagal hari ini; riwayat run yang menumpuk memberi tahu Anda ia
sudah gagal 11 kali dari 30 pelaksanaan dan selalu pada dua case yang sama — dan
itulah beda antara firasat dan sebuah item pekerjaan.

Ia juga memungkinkan Anda menjawab pertanyaan yang menentukan bagaimana run merah
ditangani: **apakah ini regresi atau peristiwa perawatan?** Empat puluh case
merah sekaligus setelah perubahan login itu suite-nya; satu case merah pada build
yang menyentuh fiturnya itu sebuah cacat. Pelajaran locator meminta Anda mencatat
perbedaan itu dengan jujur, dan di sinilah pencatatan yang jujur membayar Anda
kembali.

**Selanjutnya:** pelajaran terakhir — merancang framework yang bisa diambil alih
orang lain tanpa bertanya kepada Anda, dan itulah yang mengubah semua ini menjadi
sesuatu yang dimiliki sebuah tim alih-alih sesuatu yang Anda rawat.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Sebuah pengujian lulus dengan andal ketika dijalankan sendirian tapi gagal sekitar 40% dari waktunya dalam pelaksanaan suite paralel penuh. Penyebab mana yang sebaiknya Anda curigai lebih dulu?",
      choices: [
        {
          id: "a",
          text: "Masalah waktu — asersinya berjalan sebelum elemennya ter-render",
        },
        {
          id: "b",
          text: "State bersama atau kebergantungan urutan — pengujiannya tidak mandiri dari tetangganya",
        },
        {
          id: "c",
          text: "Race condition di aplikasinya yang hanya muncul di bawah beban",
        },
        {
          id: "d",
          text: "Locator ambigu yang teruraikan ke elemen yang keliru",
        },
      ],
      explanation:
        "Perbandingan sendirian-versus-suite adalah pengukuran paling informatif di sini, dan ia menunjuk langsung ke kemandirian: kalau pengujiannya andal ketika terpisah, yang berubah adalah kehadiran pengujian lain yang menyentuh data yang sama. Masalah waktu dan locator yang ambigu umumnya gagal pada laju tertentu di kedua mode, karena keduanya tidak bergantung pada apa lagi yang sedang berjalan. Race sungguhan di aplikasinya layak dijangkau pada akhirnya — banyak tiket pengujian labil ternyata cacat produksi yang menyamar — tapi ia hipotesis yang mahal dan yang murah belum disingkirkan. Perbaikannya adalah perbaikan dari pelajaran data uji: data unik, pembersihan di fixture, asersi yang dibatasi pada catatan Anda sendiri.",
    },
    {
      id: "q2",
      stem: "Apa yang membuat test.fixme dengan sebuah komentar menjadi karantina alih-alih penguburan?",
      choices: [
        {
          id: "a",
          text: "fixme tetap menjalankan pengujiannya tapi mengabaikan hasilnya, jadi cakupannya terjaga",
        },
        {
          id: "b",
          text: "Seorang pemilik, tanggal tinjauan, sebuah tiket, dan hitungan yang terlihat dan dilaporkan bersama run-nya",
        },
        {
          id: "c",
          text: "Playwright otomatis mengaktifkan kembali pengujian fixme setelah tujuh hari",
        },
        {
          id: "d",
          text: "Tidak ada — segala bentuk menonaktifkan pengujian itu setara",
        },
      ],
      explanation:
        "Keempat hal itulah yang menjaga seseorang tetap bertanggung jawab: pemilik bernama alih-alih sebuah tim, sebuah tanggal supaya ia kedaluwarsa alih-alih melayang, sebuah tiket supaya ia ada di luar komentar kode, dan hitungan yang dilaporkan bersama run-nya supaya satu pengujian yang dikarantina terbaca sebagai beres-beres sementara lima belas terbaca sebagai suite yang bermasalah. Tanpa itu, fixme adalah penghapusan dengan langkah tambahan. Pengujiannya tidak berjalan dan tidak ada yang diaktifkan kembali secara otomatis — dan justru itulah sebabnya kedaluwarsanya harus bersifat sosial alih-alih teknis. Dan pilihan terakhir adalah keyakinan yang dibantah pelajaran ini: menghapus, mengomentari, atau menambahkan retry ketiga sama-sama menyingkirkan sinyal dan pertanggungjawabannya sekaligus.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang merupakan tanggapan sehat terhadap suite yang labil?",
      choices: [
        {
          id: "a",
          text: "Urutkan pengujian berdasarkan laju kegagalan dan perbaiki yang terburuk lebih dulu, alih-alih yang kebetulan gagal pagi ini",
        },
        {
          id: "b",
          text: "Jalankan dengan fullyParallel sejak hari pertama, supaya pelanggaran kemandirian tersingkap selagi suite-nya masih kecil",
        },
        {
          id: "c",
          text: "Naikkan retry dari 2 ke 5 supaya pipeline-nya berhenti memerah",
        },
        {
          id: "d",
          text: "Laporkan pass rate selama 30 pelaksanaan terakhir beserta daftar karantina dan pemiliknya",
        },
      ],
      explanation:
        "Mengurutkan berdasarkan laju menaruh usaha di tempat kegagalannya benar-benar berada — pengujian yang gagal 40% dari waktunya berbiaya jauh lebih besar daripada yang menjengkelkan Anda hari ini. Menyalakan paralelisme sejak awal adalah pencegahan termurah yang ada, karena pelanggaran state bersama yang ditemukan pada sepuluh pengujian adalah perbaikan kecil sementara pelanggaran yang sama yang ditemukan pada 400 berarti seminggu penuh mengurusinya. Dan melaporkan kelabilan sebagai angka dengan kondisinya terlekat adalah yang membuatnya terjadwal, dan itu pelajaran pelaporan T2 diterapkan pada suite Anda sendiri. Menambah retry adalah langkah yang justru dibantah pelajaran ini: ia menyembunyikan gejalanya, mempertahankan biayanya, dan melatih tim membaca merah sebagai kebisingan — dan pada titik itu regresi sungguhan berikutnya ikut dijalankan ulang lalu terkirim.",
    },
  ],
};
