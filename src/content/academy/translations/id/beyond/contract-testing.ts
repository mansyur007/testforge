import type { LessonTranslation } from "../../../types";

export const contractTestingId: LessonTranslation = {
  slug: "contract-testing",
  title: "Contract testing",
  summary:
    "Menangkap kerusakan integrasi tanpa environment end-to-end yang lengkap.",
  body: `
## Celah yang diisinya

Pelajaran otomasi API mengakui satu batas: pengujian API membuktikan penyedianya
menjawab dengan benar, tapi ia **tidak bisa memberi tahu Anda bahwa klien yang
sungguhan mengirim request yang dibangun pengujian Anda**. Pengujian Anda menulis
payload-nya dengan tangan. Aplikasinya memakai kode klien-nya sendiri. Keduanya
saling menjauh diam-diam, dan tidak ada apa pun di kedua suite yang menyadarinya.

Jawaban yang lazim adalah environment terintegrasi tempat setiap layanan berjalan
sekaligus dan pengujian end-to-end menjalankan keseluruhannya. Itu bekerja, dan
ia berbiaya: environment-nya selalu setengah rusak, ada yang mengurusnya penuh
waktu, sebuah kegagalan butuh satu sore untuk dilokalisasi, dan Anda tidak bisa
menjalankannya di sebuah pull request karena Anda butuh sebelas layanan pada
versi yang tepat.

Contract testing mengembalikan sebagian besar keyakinan itu tanpa environment-nya.
Pertukarannya nyata dan layak dinyatakan sejak awal: **ia memverifikasi
antarmukanya, bukan fiturnya.**

## Apa sebenarnya sebuah kontrak

Bukan dokumentasi API-nya. Belum tentu berkas OpenAPI-nya. Sebuah kontrak adalah
**harapan satu konsumen terhadap satu penyedia**:

- request yang benar-benar dikirim konsumen ini — path, metode, header, bentuk
  body
- bagian response yang benar-benar dibaca konsumen ini

Paruh kedua itulah yang salah dipahami orang. Kalau layanan checkout membaca
\`id\` dan \`total\` dari response pesanan lalu mengabaikan empat belas kolom
lainnya, kontraknya mencakup \`id\` dan \`total\`. Penyedianya bebas mengubah,
menambah, atau menghapus semua selebihnya tanpa merusak konsumen ini — dan
kontrak yang mengklaim sebaliknya mengubah setiap perubahan penyedia menjadi
alarm palsu.

## Consumer-driven, dalam dua paruh yang tidak pernah bertemu

Mekanisme yang membuat ini bekerja tanpa environment bersama: **kedua sisinya
diuji pada waktu yang berbeda, di pipeline yang berbeda.**

~~~
CI konsumen                            CI penyedia
-----------                            -----------
jalankan pengujian konsumen
  terhadap penyedia tiruan
        │
        ▼
  menghasilkan berkas pact  ──▶  broker  ──▶  penyedia memutar ulang setiap
  (kontrak yang terekam)                       interaksi yang terekam
                                               terhadap penyedia sungguhan
                                                      │
                                                      ▼
                                               lulus/gagal diterbitkan kembali
~~~

Pengujian konsumen sendirilah yang membangkitkan kontraknya sebagai hasil
sampingan dari berjalan terhadap sebuah tiruan. Penyedianya lalu memutar ulang
interaksi terekam itu terhadap dirinya sendiri. Tidak satu pun pelaksanaannya
membutuhkan sisi yang lain menyala.

**Sebuah pengujian konsumen dengan Pact, garis besarnya:**

~~~js
// sisi konsumen — orders-client.pact.test.js
await provider.addInteraction({
  state: "an order 42 exists",
  uponReceiving: "a request for order 42",
  withRequest: {
    method: "GET",
    path: "/api/v1/orders/42",
    headers: { Authorization: like("Bearer token") },
  },
  willRespondWith: {
    status: 200,
    body: {
      id: like(42),
      total: like(19.99),
      currency: term({ generate: "USD", matcher: "^[A-Z]{3}$" }),
    },
  },
});

// asersi yang menentukan: klien SUNGGUHAN, bukan fetch tulisan tangan
const order = await ordersClient.fetchOrder(42);
expect(order.total).toBe(19.99);
~~~

Dua baris terakhir itulah seluruh intinya. Kalau Anda memanggil \`fetch()\`
langsung di dalam pengujiannya, yang Anda uji adalah pengujian Anda sendiri.
Kemudikan modul klien sungguhan yang dikirim aplikasinya, dan kontraknya merekam
apa yang benar-benar dikirim aplikasinya.

## Matcher, dan kekeliruan yang dibuat semua orang lebih dulu

\`like(42)\` berkata *di sini ada sebuah angka*, bukan *angka 42*. \`term()\`
berkata *sebuah string yang cocok dengan pola ini*.

Tulis \`total: 19.99\` sebagai literal dan Anda sudah memberi tahu penyedianya
bahwa data ujinya harus memuat pesanan yang totalnya persis 19,99 selamanya.
Kontrak itu gagal pertama kali ada yang menanam ulang basis datanya, dan setelah
dua atau tiga kejadian begitu timnya mematikan job verifikasinya. **Asersikan
bentuk dan tipe; asersikan nilai hanya ketika nilainya sendiri adalah
kesepakatannya** — sebuah kode mata uang, sebuah enum, sebuah string status yang
menjadi percabangan konsumennya.

## Provider state adalah paruh yang lain

\`state: "an order 42 exists"\` adalah kait bernama yang diimplementasikan
penyedianya: sebelum memutar ulang interaksi itu, tempatkan dirimu pada keadaan
ini. Ia sambungan yang memungkinkan penyedianya mengendalikan datanya sendiri,
dan itulah yang mencegah kontraknya terkopel pada sebuah fixture.

Jaga state-nya sedikit dan kasar — "sebuah pesanan ada", "tidak ada pesanan",
"penggunanya tidak berwenang". Basis kode dengan enam puluh provider state sudah
memindahkan masalah data ujinya, bukan menyelesaikannya.

## Contract test tidak menggantikan apa pun

| Pertanyaan | Dijawab oleh |
|---|---|
| Apakah penyedianya mengirim balik bentuk yang diharapkan klien saya? | Contract test |
| Apakah penyedianya menghitung totalnya dengan benar? | Unit/API test milik penyedianya sendiri |
| Apakah alur checkout-nya bekerja untuk seorang manusia? | Sejumlah kecil pengujian E2E |

Contract test yang mengasersikan aturan bisnis adalah pengujian penyedia yang
salah tempat: ia berjalan di pipeline yang keliru, ia lebih lambat di-debug, dan
ia rusak untuk tim yang keliru. Aturannya adalah argumen piramida dari
\`what-to-automate\` diterapkan pada integrasi — **setiap pengujian di lapisan
yang bisa menjawabnya.**

## Pilihan yang lebih murah, dan kapan ia sudah cukup

Consumer-driven contract butuh sebuah broker, dua pipeline yang disambungkan, dan
disiplin pembuatan versi. Itu biaya persiapan yang nyata, dan ia paling banyak
membeli ketika **beberapa konsumen yang tidak Anda kendalikan bergantung pada
satu penyedia.**

Kalau hanya ada satu konsumen dan satu penyedia dan tim yang sama memiliki
keduanya, **pemeriksaan skema biasanya sudah cukup**: pelihara sebuah spesifikasi
OpenAPI, validasi response yang sungguhan terhadapnya di CI penyedianya, dan
bangkitkan klien konsumennya dari sana. Anda kehilangan ketepatan "konsumen mana
yang rusak" dan mempertahankan sebagian besar perlindungan terhadap perubahan
bentuk yang tak sengaja, dengan sepersekian mesinnya.

Jujurlah tentang situasi mana yang sedang Anda hadapi. Broker yang dipasang untuk
sistem dua layanan adalah beban perawatan yang berdandan sebagai kecermatan.

## Men-deploy berdasarkan hasilnya

Imbalannya adalah pertanyaan yang bisa dijawab CI sebelum sebuah rilis: *apakah
kontrak setiap konsumen sudah diverifikasi terhadap versi yang hendak saya
kirim?* Pact menyebutnya \`can-i-deploy\`, dan ia mengubah broker-nya menjadi
gerbang deployment alih-alih laporan yang tidak dibaca siapa pun.

~~~bash
pact-broker can-i-deploy \\
  --pacticipant orders-api --version "$GIT_SHA" \\
  --to-environment production
~~~

Tanpa gerbang semacam itu, hasil kontraknya bersifat anjuran, dan hasil yang
bersifat anjuran akan meluruh.

## Di mana TestForge berperan

Langkah verifikasi Pact menghasilkan JUnit XML seperti runner mana pun, jadi job
penyedianya mengunggahnya lewat \`/api/v1/junit\` persis seperti yang dilakukan
karya penutup T3 — endpoint yang sama, aturan pencocokan yang sama, satu case per
interaksi.

Ditandai \`contract\`, case-case itu menjawab pertanyaan yang hanya bisa dijawab
riwayat run: **apakah kerusakan integrasinya tertangkap sebelum deploy atau
setelahnya?** Sebulan pelaksanaan verifikasi yang memerah di branch penyedianya
dan hijau di main adalah bukti bahwa gerbangnya bekerja. Satu pelaksanaan yang
lulus nyaris tidak membuktikan apa pun di sini.

**Selanjutnya:** observabilitas dan pengujian di produksi — apa yang dilakukan
terhadap kegagalan yang hanya ada di tempat pengguna sungguhan berada.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Dalam consumer-driven contract test, kenapa pengujiannya harus memanggil modul klien sungguhan milik aplikasinya alih-alih membangun request HTTP-nya dengan tangan?",
      choices: [
        {
          id: "a",
          text: "Request tulisan tangan lebih lambat dieksekusi di penyedia tiruannya",
        },
        {
          id: "b",
          text: "Kontraknya dimaksudkan merekam apa yang benar-benar dikirim aplikasinya, dan request tulisan tangan hanya merekam apa yang dibayangkan penulis pengujiannya",
        },
        {
          id: "c",
          text: "Pact tidak bisa merekam sebuah interaksi kecuali ia datang dari klien yang dibangkitkan",
        },
        {
          id: "d",
          text: "Karena penyedianya butuh kode sumber klien-nya untuk memverifikasi kontraknya",
        },
      ],
      explanation:
        "Inilah celah spesifik yang menjadi alasan contract testing ada — pelajaran otomasi API menyebutkannya: pengujian API membuktikan penyedianya merespons dengan benar, tapi request di pengujian itu ditulis dengan tangan, jadi ia tidak bisa membuktikan klien yang dikirim mengirim hal yang sama. Mengemudikan modul klien sungguhan lewat penyedia tiruannya membuat pact yang terekam menjadi gambaran perilaku produksi alih-alih gambaran pengujiannya. Lewati itu dengan fetch mentah dan kontraknya akan dengan senang hati tetap hijau sementara klien-nya mengirim header yang sudah berhenti diterima penyedianya. Pact akan merekam request apa pun yang sampai ke tiruannya, dibangkitkan atau tidak, dan penyedianya memverifikasi terhadap berkas pact-nya saja — ia tidak pernah melihat kode konsumennya.",
    },
    {
      id: "q2",
      stem: "Kontrak sebuah konsumen mengasersikan `total: 19.99` sebagai nilai literal. Apa konsekuensi yang paling mungkin?",
      choices: [
        {
          id: "a",
          text: "Verifikasi penyedianya rusak setiap kali data ujinya berubah, dan timnya akhirnya berhenti memercayai job itu",
        },
        {
          id: "b",
          text: "Konsumennya akan gagal mengurai total bernilai lain saat runtime",
        },
        {
          id: "c",
          text: "Berkas kontraknya tumbuh terlalu besar untuk diterbitkan ke broker",
        },
        {
          id: "d",
          text: "Penyedianya dipaksa mengembalikan float alih-alih string, dan itu perilaku yang benar",
        },
      ],
      explanation:
        "Nilai literal di dalam sebuah kontrak adalah instruksi kepada penyedianya bahwa datanya harus memuat angka persis itu selamanya, jadi penanaman ulang berikutnya mengubah penyedia yang sehat menjadi merah. Dua atau tiga kejadian begitu dan job verifikasinya ditandai tidak menghalangi, dan itu menghabiskan seluruh perlindungannya. Matcher ada untuk ini: `like(19.99)` mengasersikan bahwa di sini ada sebuah angka, dan nilai diasersikan hanya ketika nilainya sendiri adalah kesepakatannya — sebuah kode mata uang, sebuah enum, sebuah status yang menjadi percabangan konsumennya. Tidak ada apa pun tentang literal itu yang mengubah penguraian saat runtime, ukuran berkas, atau tipe di kabel yang dipilih penyedianya.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang layak berada di dalam contract test alih-alih di tempat lain?",
      choices: [
        {
          id: "a",
          text: "Bahwa response pesanan memuat kolom `id` bertipe angka, yang dibaca konsumennya",
        },
        {
          id: "b",
          text: "Bahwa kolom `currency` selalu berupa kode tiga huruf kapital yang menjadi percabangan konsumennya",
        },
        {
          id: "c",
          text: "Bahwa total pesanan sama dengan jumlah baris itemnya dikurangi diskon",
        },
        {
          id: "d",
          text: "Bahwa seorang pelanggan bisa menuntaskan checkout dengan kartu tersimpan",
        },
      ],
      explanation:
        "Sebuah kontrak mencakup bentuk apa yang dikirim satu konsumen dan bagian response yang benar-benar ia baca — keberadaan dan tipe sebuah kolom, dan format sebuah nilai ketika konsumennya bergantung pada format itu. Aturan penjumlahan totalnya adalah logika bisnis penyedianya: tempatnya di unit atau API test milik penyedianya sendiri, tempat sebuah kegagalan menyebut tim yang tepat dan bisa di-debug dalam hitungan detik. Perjalanan checkout-nya adalah pertanyaan menghadap pengguna yang tidak bisa dijawab pemeriksaan di tingkat antarmuka mana pun, dan untuk itulah sejumlah kecil pengujian end-to-end yang tersisa ada. Menaruh salah satunya ke dalam contract test adalah kekeliruan piramida yang diulang di lapisan integrasi: pengujiannya berjalan di pipeline yang keliru dan rusak untuk orang yang keliru.",
    },
  ],
};
