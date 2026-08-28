import type { LessonTranslation } from "../../../types";

export const nonFunctionalBasicsId: LessonTranslation = {
  slug: "non-functional-basics",
  title: "Pengujian non-fungsional yang bisa Anda kerjakan hari ini",
  summary:
    "Pemeriksaan awal yang murah untuk performa, keamanan, dan keandalan.",
  body: `
## "Apakah ia jalan" hanyalah satu pertanyaan dari sekian banyak

Semua sampai di sini menanyakan apakah software-nya melakukan hal yang benar.
Pengujian non-fungsional menanyakan **seberapa baik** ia melakukannya: cukup
cepat, cukup aman, di bawah beban yang cukup, pulih dari cukup banyak kegagalan,
bisa dipakai cukup banyak orang. Kosakata bakunya tinggal di ISO 25010 —
performance efficiency, security, reliability, usability, compatibility,
maintainability, portability — dan dua pelajaran sebelumnya sudah membahas dua di
antaranya.

Dua hal yang salah di seluruh area ini dalam praktik:

1. **Tidak ada yang menulis kebutuhannya.** Jadi tidak ada pembandingnya, jadi ia
   dilewati, jadi pengukuran pertama atas kecepatan halaman Anda adalah keluhan
   seorang pelanggan.
2. **"Non-fungsional berarti alat spesialis, jadi bukan tugas saya."** Pembangkit
   beban dan scanner memang spesialisasi, dan Anda akan bertemu keduanya di
   track senior. Tapi cacat non-fungsional yang *memalukan* — halaman delapan
   detik, URL yang menunjukkan pesanan pelanggan lain, tagihan ganda di koneksi
   labil — semuanya bisa ditemukan dengan dev tools, satu profil browser kedua,
   dan setengah jam.

Pelajaran ini adalah setengah jam itu.

## Performa: jawab dulu pertanyaan satu pengguna

Ada tiga pertanyaan terpisah yang sama-sama disebut "performa", dan mencampurnya
adalah sebab tim melewatkan ketiganya:

| Pertanyaan | Butuh | Siapa |
|---|---|---|
| Apakah ia cepat untuk **satu** pengguna? | Dev tools | **Anda, hari ini** |
| Apakah ia tetap cepat dengan **banyak data**? | Data uji | **Anda, hari ini** |
| Apakah ia tetap cepat di bawah **banyak pengguna**? | k6, JMeter | Load test — track senior |

Yang ketiga adalah yang dimaksud orang, dan dua yang pertama justru tempat
sebagian besar temuannya berada.

**Run satu pengguna.** Buka tab network (semua kebiasaan dari pelajaran
dev tools berlaku) dan muat halamannya dari dingin:

- **Total waktu, total terkirim, jumlah request.** Angka yang bisa Anda
  bandingkan antar-rilis, begitu Anda menuliskan kondisinya.
- **Request paling lambat.** Satu panggilan API 3 detik adalah temuan tersendiri,
  terlepas dari apa kata total halamannya.
- **Bentuk waterfall-nya.** Request yang menurun seperti anak tangga diagonal
  berarti *berurutan* — masing-masing menunggu yang sebelumnya. Itu cacat desain
  dan ia terlihat tanpa perlu tahu apa pun tentang kodenya.
- **Response terbesar.** Gambar hero 4MB di checkout mobile adalah bug dengan
  banderol harga.
- **Jumlah request dibanding jumlah baris.** 20 baris dan 23 request itu wajar;
  20 baris dan 220 request adalah pola N+1, dan ia akan jadi bencana di 200
  baris.
- **Cekik.** Pencekikan jaringan lambat dan CPU 4× di dev tools mengubah "terasa
  baik-baik saja di laptop saya" menjadi apa yang dialami ponsel kelas menengah.

**Run volume data**, yang hampir tidak dijalankan siapa pun: semuanya
cepat dengan dua belas baris di data contoh. Buat akun dengan 10.000 pesanan,
proyek dengan 5.000 case, nama pelanggan 300 karakter, attachment 40MB, laporan
lintas tiga tahun. Kotak pencarian, pengurutan, ekspor, dan layar apa pun yang
punya angka total adalah tempat hal ini menggigit — dan mode kegagalannya
biasanya bukan kelambatan melainkan timeout pada suatu ambang yang tidak
diketahui siapa pun ada.

> **Angka tanpa kondisi dan target hanyalah pendapat.** *"Halamannya lambat"*
> mengundang angkat bahu. *"Pencarian makan 6,2 detik pada 10rb case, cache
> dingin, dicekik ke 4G, median dari tiga kali jalan — targetnya di bawah 2
> detik"* adalah sebuah cacat. Kalau tidak ada targetnya, **usulkan satu di
> tiketnya**: anggaran yang diusulkan dan harus dibantah turun oleh orang lain
> adalah cara kebutuhan non-fungsional benar-benar tertulis di kebanyakan tim.

## Keamanan: bagian yang sebaiknya dimiliki tester manual

Anda bukan penetration tester, dan ini bukan pelajaran itu. Tapi **broken access
control** sudah bertahun-tahun duduk di puncak atau dekat puncak OWASP Top Ten,
ia kelas kelemahan yang paling buruk ditangani scanner otomatis, dan
menemukannya butuh persis apa yang sudah Anda punya: dua akun dan kemampuan
membaca sebuah URL.

**1. Otorisasi lewat URL — pemeriksaan berhasil-guna tertinggi di daftar ini.**
Masuk sebagai pengguna A, buka sesuatu milik A, salin URL-nya atau catat id-nya.
Keluar, masuk sebagai pengguna B di profil browser terpisah, tempel. Anda
seharusnya mendapat 403 atau 404. Kalau Anda mendapat data A, itu cacat serius,
dan itulah rupa item menu tersembunyi bila dilihat dari luar. Jalankan
pemeriksaan yang sama terhadap API dengan token B — UI yang menyembunyikan
tombolnya sementara endpoint-nya menjawab siapa saja adalah bug yang sama, satu
lapis lebih dalam.

**2. Paksa telusur.** Ketik \`/admin\` sebagai pengguna biasa. Tidak me-render
sebuah link bukanlah kontrol akses. Coba juga metode lainnya: sumber daya yang
tidak bisa Anda \`GET\` tapi bisa Anda \`DELETE\` adalah ketidaksimetrisan yang
nyata dan lazim.

**3. Siklus hidup sesi.** Setelah logout, apakah sesi lamanya benar-benar mati —
kirim ulang request yang tertangkap dengan cookie lama dan lihat. Apakah
mengganti kata sandi mengakhiri sesi-sesi lain? Apakah ada timeout menganggur
sama sekali?

**4. Reset kata sandi.** Pakai link yang dikirim ke email dua kali. Pakai
setelah satu jam. Mintakan satu untuk akun lain lalu periksa Anda berakhir di
sesi siapa.

**5. Validasi hanya di sisi klien.** Form-nya membatasi kuantitas di 10; kirim
10.000 ke API-nya. Form-nya menonaktifkan tombol submit; endpoint-nya bisa
jadi tidak peduli. Kasus terburuk di keluarga ini: total atau harga yang dikirim
*dari* klien lalu dipercaya.

**6. Informasi yang bocor.** Stack trace di dalam response 500, endpoint debug
atau metrik yang menjawab secara anonim, id berurutan yang memungkinkan
pencacahan pelanggan, dan alur login atau reset yang membedakan *"email tidak
ada"* dari *"kata sandi salah"* lalu menyerahkan daftar pengguna kepada penyerang.

**7. Transport dan cookie.** HTTPS di mana-mana termasuk redirect, \`HttpOnly\`,
\`Secure\`, dan \`SameSite\` pada cookie sesi, serta tidak ada token atau data
pribadi di query string — yang berakhir di log server, riwayat browser, dan
header \`Referer\`.

> **Aturan main, dan ini tidak bisa ditawar.** Uji hanya sistem yang Anda punya
> **izin tertulis** untuk diuji, hanya di environment yang disebut izin itu, dan
> jangan pernah terhadap pihak ketiga di dalam alurnya — penyedia pembayaran,
> penyedia identitas, sebuah CDN — yang tidak menyetujui apa pun. Tanpa payload
> yang merusak dan tanpa data pelanggan sungguhan. Dan ketika Anda menemukan
> sesuatu yang nyata: **berhenti, dokumentasikan, dan laporkan lewat kanal
> keamanan organisasi Anda** — bukan di obrolan grup, bukan di tiket publik, dan
> jangan terus menggali untuk melihat seberapa jauh ia bisa dibawa. Memastikan
> sebuah pintu tidak terkunci itulah temuannya. Melangkah masuk adalah keputusan
> orang lain untuk mengizinkan.

## Keandalan: serang asumsi-asumsi happy path

Setiap alur yang Anda uji sejauh ini mengandaikan jaringannya bekerja,
penggunanya mengeklik sekali, dan tidak ada yang menginterupsi. Singkirkan
asumsi-asumsi itu satu per satu — ini sumber termurah untuk cacat ber-severity
tinggi di seluruh pelajaran ini:

- **Matikan jaringannya di tengah pengiriman.** Dev tools → offline, lalu kirim.
  Apakah UI-nya mengatakan sesuatu yang benar, dan — paruh yang penting —
  *apakah penulisannya tetap mendarat?* Pergi dan tanyakan ke basis datanya.
- **Kirim ganda.** Klik ganda tombolnya, atau ketuk dua kali di koneksi lambat.
  Dua pesanan adalah klasiknya, dan Anda sudah tahu query yang menemukannya.
- **Muat ulang dan back.** Muat ulang di tengah wizard, pakai tombol back setelah
  pengiriman berhasil, kirim ulang form-nya. Catatan ganda dan dialog
  "konfirmasi pengiriman ulang" sama-sama tinggal di sini.
- **Kedaluwarsakan sesinya** dengan form-nya terbuka, lalu kirim. Kehilangan
  satu jam ketikan karena sebuah redirect adalah cacat, bukan fitur keamanan.
- **Buat ia timeout.** Buat server-nya lambat (cekik) lalu lihat apakah klien-nya
  mencoba ulang — dan apakah mencoba ulang itu *aman*. Retry pada pembayaran yang
  tidak idempoten adalah tagihan ganda.
- **Dua tab, satu catatan.** Sunting hal yang sama di keduanya lalu simpan
  berurutan. Last-write-wins yang senyap adalah cacat pembaruan yang hilang, dan
  ia tak terlihat oleh siapa pun yang menguji di satu jendela.
- **Input yang aneh.** 500 karakter, emoji, teks kanan-ke-kiri, angka nol di
  depan, negatif, nol, berkas 40MB. Bukan untuk pamer — inilah yang ditempelkan
  pengguna sungguhan.

## Mengubah salah satu dari ini menjadi sesuatu yang diperbaiki

Disiplin yang sama untuk ketiga areanya: **pengukurannya, kondisinya, targetnya,
dampaknya.** Satu baris konsekuensi dalam satuan uang atau pengguna mengalahkan
satu paragraf mekanisme. *"Pencarian di atas 6 detik untuk akun mana pun yang
melewati sekitar 8rb case; itu 40 pelanggan teratas kita"* adalah kalimat yang
bisa ditindaklanjuti seorang product owner.

Untuk temuan keamanan, tambahkan severity dan pakai kanalnya. Untuk performa,
lampirkan tangkapan layar waterfall-nya. Untuk keandalan, sebutkan persis asumsi
mana yang Anda singkirkan — *"dikirim dengan jaringan dinonaktifkan"* — karena
itulah langkah yang gagal direproduksi orang.

## Di mana TestForge berperan

Buatlah sebuah **suite NFR** yang dijalankan sekali per rilis terhadap alur
kritis Anda: tujuh pemeriksaan keamanan, pengaturan waktu satu pengguna,
run volume, dan daftar keandalan di atas. Semuanya berubah lambat dan
mudah dilupakan, dan persis untuk itulah suite tersimpan ada.

Taruh *angkanya* di hasil run alih-alih sekadar lulus atau gagal — 6,2 detik,
4MB, 220 request — dan riwayat run-nya menjadi tren performa yang tidak perlu
Anda bangun perkakasnya. Tandai \`perf\`, \`sec\`, dan \`robustness\` supaya
masing-masing bisa dipilih sendiri.

Dan perhatikan apa yang dilakukan sebuah target terhadap sebuah cacat: laporan
yang membawa pengukuran dan anggaran punya acceptance criterion-nya sendiri,
sehingga ia bisa **diverifikasi selesai** alih-alih diperdebatkan dua kali.

**Selanjutnya:** semua ini menghasilkan angka. Pelajaran berikutnya tentang angka
mana yang berarti — teater pass-rate, escape rate, dan apa yang layak berada di
dashboard yang akan dibaca orang di luar tim.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Anda punya dua akun uji, sebuah browser, dan tiga puluh menit. Pemeriksaan mana yang secara historis paling berpeluang menemukan cacat keamanan yang serius?",
      choices: [
        {
          id: "a",
          text: "Mencoba string SQL injection di setiap kolom teks di situsnya",
        },
        {
          id: "b",
          text: "Membuka URL resource pengguna A — dan request API yang sama — selagi terautentikasi sebagai pengguna B",
        },
        {
          id: "c",
          text: "Memastikan halaman login disajikan lewat HTTPS dengan sertifikat yang valid",
        },
        {
          id: "d",
          text: "Mengirim string yang sangat panjang untuk melihat apakah server mengembalikan 500",
        },
      ],
      explanation:
        "Broken access control sudah bertahun-tahun duduk di puncak atau dekat puncak OWASP Top Ten, ia kelas yang paling buruk ditangani scanner otomatis, dan mengujinya tidak butuh apa pun selain dua akun dan sebuah URL yang disalin — termasuk terhadap API-nya, karena tombol tersembunyi dan endpoint yang terlindungi adalah dua hal berbeda. String injeksi dan input berukuran berlebih layak dicoba dan memang menemukan bug, tapi framework modern memparameterkan query secara bawaan, jadi hasil per jamnya jauh lebih rendah. Pemeriksaan HTTPS adalah tengokan sepuluh detik yang layak dikerjakan dan hampir selalu sudah benar. Perhatikan batasnya di keempatnya: ini pengujian yang diizinkan pada sistem yang Anda punya izin untuk diuji, dan temuan yang nyata pergi ke kanal keamanan alih-alih ke pengorekan lebih lanjut.",
    },
    {
      id: "q2",
      stem: "Anda melaporkan bahwa sebuah layar pencarian \"lambat\". Balasannya, developer merasa itu baik-baik saja. Apa yang hilang dari laporan Anda?",
      choices: [
        {
          id: "a",
          text: "Jejak profiler yang menunjukkan fungsi mana yang bertanggung jawab",
        },
        {
          id: "b",
          text: "Pengukurannya beserta kondisinya — volume data, jaringan, cache, median dari beberapa kali jalan — dan target yang tidak terpenuhi",
        },
        {
          id: "c",
          text: "Konfirmasi bahwa ia juga lambat bagi pengguna lain, sehingga bisa direproduksi",
        },
        {
          id: "d",
          text: "Load test yang menunjukkan perilakunya di bawah pengguna bersamaan",
        },
      ],
      explanation:
        "\"Lambat\" adalah penilaian, dan laptop developer dengan dua belas baris data contoh memang sungguh cepat, jadi Anda berdua melapor dengan jujur tentang situasi yang berbeda. Sebuah angka plus kondisi yang menghasilkannya membuat keduanya bisa dibandingkan, dan sebuah target — diminta, atau diusulkan di tiketnya kalau belum ada — adalah yang membuat pelampauannya menjadi cacat alih-alih kesan. Jejak profiler adalah tugas developer begitu mereka menerima temuannya. Pengguna lain akan membantu, tapi kondisinyalah yang memungkinkan siapa pun mereproduksinya dengan sengaja. Dan load testing menjawab pertanyaan yang sama sekali lain: yang ini gagal untuk satu pengguna saja.",
    },
    {
      id: "q3",
      stem: "Pemeriksaan keandalan mana yang bisa dijalankan tester manual hari ini, dengan dev tools dan tanpa perkakas spesialis?",
      choices: [
        {
          id: "a",
          text: "Mengirim form dengan jaringan disetel offline, lalu memeriksa apakah penulisannya tetap mendarat",
        },
        {
          id: "b",
          text: "Mengeklik ganda tombol submit di koneksi yang dicekik untuk mencari catatan ganda",
        },
        {
          id: "c",
          text: "Menyunting catatan yang sama di dua tab lalu menyimpan berurutan untuk melihat apakah satu pembaruan hilang diam-diam",
        },
        {
          id: "d",
          text: "Menetapkan waktu response pada 500 pengguna bersamaan untuk menemukan di mana throughput-nya runtuh",
        },
      ],
      explanation:
        "Tiga yang pertama adalah kerja dev-tools-dan-kesabaran: mode offline, koneksi yang dicekik, dan tab kedua, masing-masing menyingkirkan satu asumsi yang menjadi fondasi happy path — dan masing-masing menemukan kelas cacat ber-severity tinggi, karena kasus offline memberi tahu Anda apakah UI dan data tersimpannya sepakat, dan kasus dua tab adalah pembaruan hilang yang tak terlihat oleh siapa pun yang menguji di satu jendela. Konkurensi 500 pengguna adalah kekecualiannya: ia butuh pembangkit beban dan environment sasaran yang sanggup menyerapnya, dan itu load test dengan perencanaannya sendiri, dan tempatnya di track senior alih-alih di run ini.",
    },
  ],
};
