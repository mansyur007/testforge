import type { LessonTranslation } from "../../../types";

export const performanceTestingId: LessonTranslation = {
  slug: "performance-testing",
  title: "Pengujian performa dengan k6",
  summary:
    "Load, stress, dan soak — dan apa yang sebenarnya diberitahukan sebuah p95.",
  body: `
## Rata-rata adalah musuhnya

"Rata-rata waktu response: 200md." Semua orang mengangguk, rilisnya berangkat,
dan support menghabiskan seminggu menangani keluhan.

Inilah sebabnya. Sepuluh request: sembilan pada 100md, satu pada 1,2 detik.
Rata-ratanya 210md dan tampak baik-baik saja. Tapi **satu pengguna dari sepuluh
menunggu lebih dari satu detik**, dan kalau request itu tombol checkout, itu 10%
pendapatan Anda yang sedang tidak senang.

Rata-rata menyembunyikan ekornya, dan di ekor itulah pengguna tinggal. Persentil
adalah perbaikannya:

| Metrik | Terbaca sebagai |
|---|---|
| p50 (median) | Separuh pengguna mengalaminya lebih baik dari ini |
| p95 | 1 dari 20 mengalaminya lebih buruk |
| p99 | 1 dari 100 mengalaminya lebih buruk — pengeluh Anda yang paling nyaring |

**Laporkan p95 dan p99, dan jangan pernah melaporkan rata-rata sendirian.** Pada
skala besar, p99 bukan kasus tepi: halaman yang membuat 50 request akan menyentuh
p99-nya sendiri di hampir setiap pemuatan, dan pengguna yang mendarat di sana
tidak proporsional adalah mereka yang punya data paling banyak, dan itu biasanya
berarti pelanggan terbaik Anda.

## Empat jenis pengujian, empat pertanyaan berbeda

Keempatnya dipakai bergantian padahal tidak sama:

| Jenis | Pertanyaan | Bentuk |
|---|---|---|
| **Load** | Apakah ia bertahan pada trafik yang diperkirakan? | Naikkan ke puncak normal, tahan |
| **Stress** | Di mana ia patah, dan bagaimana? | Naikkan melewati puncak sampai gagal |
| **Soak** | Apakah ia merosot selama berjam-jam? | Beban sedang, beberapa jam |
| **Spike** | Apakah ia selamat dari lonjakan mendadak? | Lompat ke 10× seketika, lalu turun lagi |

**Soak adalah yang dilewati orang dan yang menemukan kebocoran memori**,
habisnya connection pool, dan disk yang penuh oleh log. Semua itu tidak pernah
muncul dalam pelaksanaan dua puluh menit — semuanya muncul pukul 3 pagi di hari
keempat, dan itu juga saat tidak ada yang mengawasi.

Stress testing punya tujuan kedua yang layak disebut: **bagaimana sebuah sistem
gagal sama pentingnya dengan kapan.** Kemerosotan yang anggun — mengantrekan,
membuang beban, pesan kesalahan yang jelas — adalah hasil yang sangat berbeda
dari data yang rusak atau reaksi berantai yang menyeret basis datanya ikut jatuh.

## k6: sebuah load test adalah sebuah skrip

~~~js
// load-test.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "2m", target: 100 },   // naik
    { duration: "5m", target: 100 },   // tahan
    { duration: "2m", target: 0 },     // turun
  ],
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1500"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const res = http.get(\`\${__ENV.BASE_URL}/api/v1/projects\`, {
    headers: { Authorization: \`Bearer \${__ENV.API_KEY}\` },
  });

  check(res, {
    "status is 200": (r) => r.status === 200,
    "body is not empty": (r) => r.body.length > 0,
  });

  sleep(1);
}
~~~

~~~bash
k6 run --env BASE_URL=https://staging.example.com --env API_KEY=$KEY load-test.js
~~~

Tiga hal di berkas itu mengerjakan pekerjaan sesungguhnya:

**\`stages\`** — ramp-nya. Jangan pernah mulai pada beban penuh: Anda ingin
melihat *di mana* kemerosotannya dimulai, dan start dingin pada 100 pengguna
mengukur connection pool Anda sedang memanas alih-alih mengukur aplikasinya.

**\`thresholds\`** — kriteria lulus/gagalnya, dan alasan ini disebut *pengujian*
alih-alih pengukuran. Tanpa itu k6 mencetak angka lalu keluar dengan kode 0, dan
"pengujian performa" yang tidak bisa gagal adalah non-pengujian yang sama dengan
pengujian UI tanpa asersi. Dengan itu, k6 keluar dengan kode bukan-nol dan CI
memerah.

**\`sleep(1)\`** — waktu berpikir. Pengguna sungguhan berjeda antaraksi. Tanpa
itu, Anda sedang menyimulasikan serangan denial-of-service, dan angka yang Anda
dapat menggambarkan skenario yang tidak akan pernah terjadi.

**\`check()\` bukan asersi.** Check yang gagal dicatat dan skripnya lanjut — ia
tidak menggagalkan pelaksanaannya. Hanya threshold yang begitu. Ini menjegal
semua orang sekali.

## Angka tanpa kondisinya hanyalah pendapat

Pelajaran non-fungsional T2 menjadikan ini bentuk setiap temuan, dan di sini
itulah seluruh disiplinnya. Bukan "API-nya lambat" melainkan:

> \`GET /api/v1/projects\` pada 100 pengguna bersamaan, staging, 8 vCPU / 16GB,
> ditanami 500 proyek: p95 1,8 detik terhadap target 500md, laju kesalahan 0,3%.
> p95 adalah 240md pada 20 pengguna. Kemerosotan mulai sekitar 60 pengguna.

Semua di kalimat itu menanggung beban. **Environment yang sama, volume data yang
sama, versi yang sama, atau perbandingannya tidak bermakna** — dan kekeliruan
kedua paling umum dalam pengujian performa adalah menjalankannya terhadap basis
data berisi 50 baris sementara produksinya punya 5 juta. Yang pertama adalah
tidak punya target sama sekali.

**Dari mana targetnya berasal adalah sebuah percakapan, bukan tebakan.** "p95 di
bawah 500md pada 200 pengguna bersamaan" seharusnya berasal dari data trafik
sungguhan dan sebuah keputusan produk. Mengarangnya sendiri menghasilkan
pengujian yang mengukur khayalan Anda.

## Membaca hasilnya

Ringkasan k6, dan apa yang sebenarnya diberitahukan setiap barisnya:

~~~
http_req_duration.....: avg=210ms min=98ms med=180ms p(90)=420ms p(95)=1.2s
http_req_failed.......: 0.30% ✓ 29 ✗ 9571
iterations............: 9600  32/s
vus...................: 100
~~~

Tiga pertanyaan, berurutan:

1. **Apakah kegagalannya muncul sebelum kelambatannya, atau sesudah?** Error
   lebih dulu biasanya berarti batas keras — connection pool, rate limiter, file
   descriptor. Kelambatan lebih dulu berarti kejenuhan sesuatu yang kontinu —
   CPU, basis data, disk.
2. **Di mana p95-nya meninggalkan rombongan?** Melebarnya jarak antara p50 dan
   p95 itulah sinyalnya. p50 yang datar dengan p95 yang mendaki adalah antrean.
3. **Apakah ia pulih?** Waktu response yang kembali ke garis dasar setelah ramp
   turun itu sehat. Yang tetap tinggi berarti ada yang tidak dilepaskan —
   kebocoran yang akan ditemukan sebuah soak test.

**Load test yang cuma memberi tahu angkanya baru mengerjakan separuh
pekerjaannya.** Separuh lainnya ada di sisi server: CPU, memori, slow query log
basis data, jumlah koneksi. Tanpa itu Anda tahu *bahwa* ia melambat dan bukan
*kenapa*, dan perbaikannya ada di seberang pertanyaan itu.

## Di mana tester tersandung

- **Menguji hal yang keliru.** Endpoint login jarang menjadi lehernya. Uji
  perjalanan yang penting secara komersial dan endpoint yang menyentuh paling
  banyak data.
- **Kumpulan data yang mungil.** Query yang seketika pada 500 baris dan
  bencana pada 5 juta adalah cacat performa produksi yang paling umum, dan basis
  data staging yang kosong dijamin melewatkannya.
- **Mengabaikan cache.** Pelaksanaan kedua cepat karena sebuah cache, bukan
  karena Anda memperbaiki sesuatu. Ubah-ubah parameternya, atau ukur dingin dan
  hangat secara terpisah lalu sebutkan yang mana yang Anda laporkan.
- **Sekali jalan.** Jalankan tiga kali. Kalau angkanya berselisih jauh, keragaman
  itu *justru* temuan Anda.
- **Load-testing produksi.** Jangan, tanpa kesepakatan tertulis, jendela waktu
  yang terjadwal, dan seseorang yang mengawasi. Ini aturan main yang sama dengan
  yang ditetapkan T2 untuk pencolekan keamanan, dan di sini justru lebih mudah
  menimbulkan kerusakan nyata tanpa sengaja.

## Di mana tempatnya dalam pipeline

Setiap pull request itu terlalu sering; sebelum rilis itu terlambat untuk
memperbaiki apa pun dengan murah. Pola yang bekerja:

- **Load test smoke yang pendek saat merge ke main** — satu menit, 10 pengguna,
  satu threshold. Menangkap regresi berorde besar seketika.
- **Load test penuh tiap malam atau tiap minggu**, di environment yang stabil.
- **Soak sebelum rilis besar**, atau setelah perubahan apa pun pada caching,
  pooling, atau penanganan sesi.

Threshold membuat ketiganya bisa masuk CI: k6 keluar dengan kode bukan-nol ketika
satu threshold dilanggar, dan hanya itu yang dibutuhkan sebuah pipeline.

## Di mana TestForge berperan

k6 bisa menghasilkan JUnit XML, artinya sebuah load test bisa menjadi sebuah run
terhadap case dengan cara yang sama seperti suite Playwright Anda — satu case per
skenario, dengan threshold sebagai kriteria kelulusannya.

Itu lebih berguna daripada kedengarannya. Hasil performa di dalam riwayat bersama
mengubah "belakangan terasa lebih lambat" menjadi garis yang bisa Anda tunjuk:
skenario yang sama, environment yang sama, p95 mendaki dari 240md ke 900md di
sepanjang enam minggu build. Karya penutup track otomasi adalah mekanismenya; ini
satu hal lagi yang layak dikirim lewatnya.

**Selanjutnya:** pengujian keamanan untuk QA — OWASP Top 10 lewat mata seorang
tester, dan pemeriksaan yang bisa Anda jalankan tanpa menjadi penetration tester.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Sebuah laporan berbunyi \"rata-rata waktu response 200md, aman di dalam target 500md kami\". Kenapa itu berpotensi menyembunyikan masalah serius?",
      choices: [
        {
          id: "a",
          text: "Rata-rata selalu dihitung secara keliru oleh alat load testing",
        },
        {
          id: "b",
          text: "Rata-rata menyembunyikan ekornya — segelintir request yang sangat lambat nyaris tidak menggesernya, padahal itu pengguna sungguhan yang sedang mengalami hal buruk",
        },
        {
          id: "c",
          text: "200md diukur di sisi server, jadi angka sebenarnya selalu lebih tinggi",
        },
        {
          id: "d",
          text: "Tidak ada yang disembunyikan, asalkan ukuran sampelnya cukup besar",
        },
      ],
      explanation:
        "Sembilan request pada 100md dan satu pada 1,2 detik rata-ratanya 210md, dan itu terlihat nyaman sementara satu pengguna dari sepuluh menunggu lebih dari satu detik — dan kalau request itu checkout, itu sepersepuluh pendapatan Anda yang sedang tidak senang. Sampel yang lebih besar justru memperburuknya, karena ekornya memanjang sementara rata-ratanya tetap datar. Persentil yang menyingkapnya: p95 dan p99 langsung menyatakan seberapa buruk bagi yang sial, dan pada skala besar p99 bukan kasus tepi, karena halaman yang membuat 50 request menyentuh p99-nya sendiri hampir di setiap pemuatan. Laporkan p95 dan p99, dan jangan pernah rata-rata sendirian.",
    },
    {
      id: "q2",
      stem: "Sebuah skrip k6 punya beberapa panggilan check() yang gagal selama pelaksanaannya, tapi pelaksanaannya keluar dengan kode 0 dan CI tetap hijau. Kenapa?",
      choices: [
        {
          id: "a",
          text: "Check hanya menggagalkan pelaksanaan ketika lebih dari 50% di antaranya gagal",
        },
        {
          id: "b",
          text: "check() mencatat hasil lalu lanjut; hanya threshold yang menentukan kode keluarnya",
        },
        {
          id: "c",
          text: "Check otomatis dinonaktifkan ketika stages dikonfigurasi",
        },
        {
          id: "d",
          text: "Pelaksanaannya harus dipanggil dengan --strict supaya check-nya diperhitungkan",
        },
      ],
      explanation:
        "Inilah perbedaan yang menjegal semua orang sekali: check adalah pengamatan yang dicatat di ringkasannya, sementara threshold adalah kriteria kelulusan yang menetapkan kode keluarnya. Skrip dengan check dan tanpa threshold mencetak angka lalu keluar dengan kode 0 seburuk apa pun performanya — dan itu non-pengujian yang sama dengan pengujian UI tanpa asersi, dan persis itulah sebabnya pengujian performa tanpa threshold tidak bisa disambungkan ke sebuah pipeline. Menambahkan http_req_duration: [\"p(95)<500\"] adalah yang mengubah pengukurannya menjadi pengujian yang bisa memerah.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang akan membuat sebuah hasil performa tidak bisa dipercaya atau tidak bisa ditindaklanjuti?",
      choices: [
        {
          id: "a",
          text: "Menjalankannya terhadap basis data staging berisi 500 baris sementara produksinya punya 5 juta",
        },
        {
          id: "b",
          text: "Melaporkan \"p95 1,8 detik\" tanpa menyebutkan environment, volume data, dan konkurensinya",
        },
        {
          id: "c",
          text: "Menaikkan beban lewat stages alih-alih memulai pada beban penuh",
        },
        {
          id: "d",
          text: "Memakai ulang parameter yang identik di setiap iterasi sehingga response-nya dilayani dari cache",
        },
      ],
      explanation:
        "Jurang kumpulan datanya adalah cacat performa produksi yang paling umum yang ada — query yang seketika pada 500 baris dan bencana pada 5 juta lolos dari setiap pengujian yang Anda jalankan. Angka tanpa kondisinya tidak bisa dibandingkan dengan apa pun, dan itu pelajaran non-fungsional T2 diterapkan di sini: environment yang sama, volume data yang sama, versi yang sama, atau perbandingannya tidak bermakna. Dan parameter yang identik mengukur cache Anda alih-alih aplikasinya, jadi ubah-ubahlah atau laporkan dingin dan hangat secara terpisah sambil menyebut yang mana. Menaikkan beban lewat stages adalah praktik yang benar, bukan cacat: ia menunjukkan di mana kemerosotannya mulai, dan mulai dingin pada beban penuh justru mengukur connection pool Anda sedang memanas.",
    },
  ],
};
