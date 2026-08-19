import type { LessonTranslation } from "../../../types";

export const httpAndDevtoolsId: LessonTranslation = {
  slug: "http-and-devtools",
  title: "HTTP dan dev tools browser untuk tester",
  summary:
    "Kode status, header, tab network, dan membaca request yang gagal seperti seorang developer.",
  body: `
## Halaman itu desas-desus; tab network adalah buktinya

Semua yang Anda uji sejauh ini, Anda uji dengan menatap layar. Layar adalah
*hasil render* dari apa yang dikatakan server, disaring melalui setumpuk
JavaScript yang bisa menghilangkan, mengacak urutan, meng-cache, atau mengarang
sesuatu di sepanjang jalan.

Jadi laporan bug yang berbunyi "pesanannya tidak tersimpan" adalah laporan
tentang layar. Pertanyaan pertama developer akan berupa versi dari *"apakah
request-nya keluar?"*, dan ada tiga bug yang sama sekali berbeda bersembunyi di
balik satu kalimat itu:

- request-nya tidak pernah terkirim — bug front-end, di tombolnya
- request-nya terkirim dan server menolaknya — periksa status dan isi
  response-nya
- request-nya berhasil dan layarnya tidak diperbarui — bug front-end, di
  render-nya

Buka tab network dan Anda tahu mana dari ketiganya yang Anda hadapi, dalam
sekitar delapan detik. Perbedaan tunggal itulah sebagian besar isi pelajaran ini:
ia memindahkan Anda dari *melaporkan gejala* ke *melaporkan lokasi*, dan itu
peningkatan kredibilitas tercepat yang tersedia bagi tester manual.

## Kode status, dengan kerincian yang benar-benar Anda butuhkan

Kode datang dalam keluarga, dan keluarganya-lah yang penting:

| Keluarga | Artinya | Masalah siapa |
|---|---|---|
| **2xx** | Berhasil | — |
| **3xx** | Lihat di tempat lain | Biasanya aman; waspadai putaran tak berujung |
| **4xx** | **Anda** mengirim sesuatu yang keliru | Klien, atau aturannya |
| **5xx** | **Server** yang rusak | Selalu sebuah cacat |

Satu aturan yang layak dihafal: **5xx selalu bug.** Bukan "server-nya lagi
sibuk", bukan "Anda mengirim data buruk" — kalau input buruk bisa membuat server
mengembalikan 500, bug-nya adalah bahwa ia tidak mengembalikan 400. Ajukan setiap
kali.

Kode yang benar-benar akan Anda temui:

| Kode | Arti | Catatan tester |
|---|---|---|
| 200 | OK | Periksa *isi*-nya; 200 bisa membawa \`{"error": "..."}\` |
| 201 | Created | Yang seharusnya dikembalikan POST yang berhasil |
| 204 | No content | Normal untuk DELETE |
| 301 / 302 | Moved / found | 301 permanen dan di-cache — mahal kalau keliru |
| 400 | Bad request | Input Anda melanggar sebuah aturan |
| 401 | **Belum terautentikasi** | Server tidak tahu Anda siapa |
| 403 | **Terlarang** | Ia tahu persis Anda siapa; Anda tidak diizinkan |
| 404 | Tidak ditemukan | Atau: ditemukan, tapi sengaja disembunyikan dari Anda |
| 409 | Conflict | Duplikat, atau ada yang menyuntingnya lebih dulu |
| 422 | Unprocessable | Bentuknya benar, tapi maknanya tidak valid |
| 429 | Too many requests | Kena rate limit — *apakah* memang ada batasnya? Uji |
| 500 | Server error | Sebuah cacat. Selalu |
| 502 / 503 / 504 | Gateway / tak tersedia / timeout | Infrastruktur, tetap layak dilaporkan |

**401 versus 403 adalah pasangan yang menjebak orang**, dan itu layak dicermati
karena perbedaannya adalah kelas cacat keamanan yang sungguhan. 401 berkata *saya
tidak tahu Anda siapa*; 403 berkata *saya tahu persis Anda siapa dan jawabannya
tidak*. Kalau pengujian hak akses mengembalikan 401 padahal Anda jelas-jelas
sudah masuk, ada yang menjatuhkan sesi Anda. Kalau ia mengembalikan 404 di tempat
Anda mengharapkan 403, itu mungkin disengaja — menyembunyikan keberadaan sebuah
sumber daya dari orang yang tidak boleh melihatnya adalah desain yang sah — tapi
itu seharusnya sebuah keputusan, jadi tanyakan.

## Apa yang dilihat di tab network

Buka dev tools (F12), pilih **Network**, centang **Preserve log** — tanpa itu,
sebuah redirect setelah submit akan menghapus request yang sedang berusaha Anda
baca, dan itu cara paling umum orang kehilangan bukti yang mereka cari. Lalu
lakukan aksinya.

Empat hal, dengan urutan ini:

1. **Metode dan URL.** Apakah request-nya terjadi sama sekali, dan apakah ia
   pergi ke tempat yang Anda kira? POST ke URL yang keliru dan tidak ada request
   sama sekali tampak identik di layar.
2. **Status.** Saring ke \`Fetch/XHR\` untuk melihat panggilan aplikasinya sendiri
   tanpa gambar dan font.
3. **Payload / isi request.** *Apa yang sebenarnya dikirim browser?* Di sinilah
   Anda menemukan bahwa kolom yang Anda ketik tidak ada di request-nya, atau ada
   dua kali, atau mengirim string kosong di tempat Anda mengharapkan null.
4. **Response.** Kebenaran mentahnya, sebelum render apa pun. Pesan validasi yang
   tidak pernah muncul di layar biasanya sudah duduk di sini.

Dua tab lagi yang sepadan dengan waktunya:

- **Timing** — request yang makan 4 detik adalah temuan bahkan ketika ia
  berhasil.
- **Headers** — tempat perilaku cache dan keamanan tinggal, di bawah ini.

## Header yang layak diperhatikan tester

Anda tidak perlu tahu semuanya. Anda perlu yang ini:

- **\`Content-Type\`** — \`application/json\` vs \`text/html\`. API JSON yang
  mengembalikan HTML saat error adalah alasan sebuah aplikasi kadang menampilkan
  stack trace mentah.
- **\`Cache-Control\`** — header di balik "harganya masih yang lama". Kalau
  halaman berisi data pribadi bisa di-cache, itu cacat yang layak dieskalasi.
- **\`Set-Cookie\`** — periksa \`HttpOnly\`, \`Secure\`, dan \`SameSite\` pada cookie
  sesi. Cookie sesi tanpa \`HttpOnly\` bisa dibaca skrip mana pun di halaman itu.
  Ini pemeriksaan sepuluh detik dan ia temuan yang sungguhan.
- **\`Location\`** — ke mana sebuah 3xx mengirim Anda.
- **\`Retry-After\`** — apa kata sebuah 429 atau 503 tentang kapan harus kembali.

## Membaca sebuah kegagalan dengan benar

Separuh dari yang dikerjakan developer dengan laporan bug adalah merekonstruksi
apa yang Anda lihat. Mengerjakan sendiri bagian itu mengubah nasib laporan Anda.

Satu contoh dikerjakan di ShopMini. Anda menerapkan kode diskon \`SAVE10\` di
checkout dan layar menampilkan *"Something went wrong"* yang generik. Isi tab
network:

~~~
POST /api/checkout/discount            500  1.2s
  Request:  {"code":"SAVE10 ","orderId":"ord_8831"}
  Response: {"error":"Internal server error","traceId":"a41f-9c02"}
~~~

Tiga temuan, bukan satu, dan ketiganya cacat yang berbeda:

1. **500 itu sendiri.** Spasi di akhir adalah input pengguna; input pengguna
   tidak boleh sampai ke exception yang tidak tertangani. Response yang benar
   adalah 400 dengan sebuah pesan.
2. **Klien mengirim \`"SAVE10 "\` beserta spasinya.** Kolomnya tidak memangkas
   sebelum submit, padahal aturannya hanya huruf dan angka. Itu cacat front-end
   yang terpisah dan ia adalah *pemicunya*.
3. **Pengguna melihat "Something went wrong".** Sekalipun server yang bersalah,
   UI-nya tidak punya pesan khusus untuk jalur ini. Support akan menerima tiket
   yang tidak bisa ditindaklanjuti siapa pun.

Dan sekarang laporannya membawa **traceId**, yang membuat developer bisa
menemukan stack trace sisi server dalam hitungan detik alih-alih mencoba
mereproduksi satu sore Anda. Salin trace dan correlation id ke setiap laporan —
itu gratis dan ia mengubah kecepatan sesuatu diperbaiki.

> **Copy as cURL.** Klik kanan request mana pun di tab network → *Copy* → *Copy
> as cURL*. Tempelkan itu ke laporan bug Anda dan developer memegang request Anda
> yang persis — header, cookie, isi — bisa direproduksi tanpa Anda. Ini fitur dev
> tools paling bernilai bagi seorang tester dan nyaris tidak ada yang memakainya.

## Console, sekilas

Beralih ke **Console** dan cari yang merah. Uncaught error di sana sering
menjelaskan layar yang sekadar tidak melakukan apa-apa: request-nya berhasil,
kode render-nya melempar error, dan UI-nya membeku di tengah pembaruan. Itu
persis bug ketiga di daftar pembuka pelajaran ini, dan console adalah tempat ia
mengumumkan dirinya.

Saring dulu kebisingan dari ekstensi dan skrip pihak ketiga sebelum Anda
melaporkan apa pun — error dari ekstensi browser di console Anda bukan cacat
produknya.

## Tiga pemeriksaan yang bisa Anda jalankan pada apa saja, hari ini

1. **Kirim sebuah formulir dan awasi request-nya.** Apakah payload-nya memuat apa
   yang Anda ketik? Spasi, huruf besar-kecil, dan kosong-vs-null semuanya
   terlihat di sini dan tak terlihat di layar.
2. **Langgar sebuah aturan lalu baca response-nya.** Kirim sesuatu yang tidak
   valid. 400 dengan pesan yang jelas itu bagus; 500 adalah cacat; 200 dengan
   error di dalam isinya adalah bau desain yang layak diangkat.
3. **Lihat cookie sesi sekali per produk.** \`HttpOnly\`, \`Secure\`, \`SameSite\`.
   Sepuluh detik, dan ini jenis temuan yang membuat orang mulai mengundang Anda
   ke tinjauan desain.

## Di mana TestForge berperan

Sebuah case yang hasil harapannya "sebuah pesan kesalahan ditampilkan" bisa lulus
padahal server-nya mengembalikan 500 — layarnya memang menampilkan pesan
kesalahan, kan. Tuliskan fakta yang bisa diamati saja: *"API mengembalikan 400
dengan pesan yang menyebut kolomnya; formulir menampilkan pesan itu secara
inline."* Lalu tempelkan **Copy as cURL** dari request yang gagal ke dalam
cacatnya, beserta status, isi response, dan trace id apa pun.

Cacat itu bisa direproduksi orang yang tidak berada di sana, dan hanya sifat itu
yang benar-benar penting.

**Selanjutnya:** memotong browser dari lingkarannya sama sekali dan menguji API
secara langsung — tempat semua ini berhenti jadi sesuatu yang Anda amati dan
menjadi sesuatu yang Anda kemudikan.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Seorang pengguna melaporkan bahwa menyimpan profil tidak melakukan apa-apa — tanpa pesan kesalahan, tanpa perubahan. Anda berhasil mereproduksinya. Pengamatan tunggal mana yang memecah ini menjadi sesedikit mungkin penyebab berbeda?",
      choices: [
        {
          id: "a",
          text: "Apakah console browser menampilkan error merah",
        },
        {
          id: "b",
          text: "Apakah ada request yang terkirim sama sekali, dan kalau ya status apa yang dikembalikannya",
        },
        {
          id: "c",
          text: "Apakah hal yang sama terjadi di browser lain",
        },
        {
          id: "d",
          text: "Apakah sesi penggunanya masih berlaku",
        },
      ],
      explanation:
        "\"Tidak terjadi apa-apa\" menyembunyikan tiga bug berbeda — request-nya tidak pernah terkirim, server menolaknya, atau ia berhasil dan layarnya gagal diperbarui — dan tab network memisahkan ketiganya dalam sekali lihat. Console berguna tapi hanya menangkap kasus ketiga, dan hanya ketika kegagalannya berupa error yang dilempar. Browser lain dan keadaan sesi sama-sama layak diperiksa nanti; tidak satu pun mempersempit lokasi kesalahannya seperti yang dilakukan request-nya sendiri.",
    },
    {
      id: "q2",
      stem: "Mengirim kode diskon dengan spasi di akhir mengembalikan 500. Developer bilang kodenya toh memang tidak valid, jadi errornya wajar. Apa posisi yang benar?",
      choices: [
        {
          id: "a",
          text: "Setuju — input tidak valid yang menghasilkan response error berarti bekerja sesuai maksud",
        },
        {
          id: "b",
          text: "500 atas input pengguna tetap sebuah cacat; kode yang tidak valid seharusnya mengembalikan 400 dengan pesan",
        },
        {
          id: "c",
          text: "Laporkan hanya kalau pengguna sungguhan masuk akal mengetik spasi di akhir",
        },
        {
          id: "d",
          text: "Laporkan sebagai cacat front-end, karena kolomnya seharusnya memangkas inputnya",
        },
      ],
      explanation:
        "Penolakannya sudah benar; cara penolakan itu disampaikan tidak. 5xx berarti server menabrak sesuatu yang tidak ia tangani, dan input pengguna yang sampai ke exception tak tertangani adalah cacat tersendiri — perbaikannya adalah 400 yang menyebutkan masalahnya. Apakah pengguna sungguhan akan mengetiknya bukan ujiannya: inputnya tiba lewat endpoint publik, jadi apa pun bisa mengirimkannya. Kolom yang tidak memangkas juga cacat sungguhan, tapi ia pemicunya, bukan alasan server-nya tumbang.",
    },
    {
      id: "q3",
      stem: "Pengamatan mana dari tab network yang merupakan temuan layak dilaporkan bahkan ketika fiturnya tampak bekerja di layar?",
      choices: [
        {
          id: "a",
          text: "Request yang berhasil tapi konsisten memakan 4 detik",
        },
        {
          id: "b",
          text: "Cookie sesi disetel tanpa HttpOnly",
        },
        {
          id: "c",
          text: "Response tiba sebagai application/json",
        },
        {
          id: "d",
          text: "Response 200 yang isinya memuat objek error",
        },
      ],
      explanation:
        "Waktu response adalah bagian dari perilakunya, bukan urusan terpisah, dan empat detik adalah temuan terlepas dari benar tidaknya hasilnya. Cookie sesi tanpa HttpOnly bisa dibaca skrip mana pun di halaman itu — pemeriksaan sepuluh detik dengan bobot keamanan yang nyata. 200 yang membawa error di dalam isinya berarti setiap klien harus mengurai keberhasilan dua kali, dan pemantauan akan melaporkan endpoint itu sehat padahal ia gagal. Content type JSON pada API JSON semata-mata perilaku yang benar.",
    },
  ],
};
