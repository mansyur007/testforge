import type { LessonTranslation } from "../../../types";

export const crossBrowserMobileId: LessonTranslation = {
  slug: "cross-browser-mobile",
  title: "Pengujian lintas browser dan mobile",
  summary:
    "Menyusun matriks perangkat dari analitik alih-alih dari takhayul.",
  body: `
## Tidak ada yang menguji "semua browser"

Hitung kombinasinya dengan jujur. Lima browser, dua versi masing-masing, empat
sistem operasi, tiga lebar viewport: itu 120 konfigurasi, dan waktu Anda cuma
sampai Kamis. Tidak ada versi pekerjaan ini yang mencakup semuanya.

Jadi pengujian kompatibilitas bukan masalah cakupan, ia masalah **pemilihan**.
Seluruh keahliannya ada pada memilih sepuluh konfigurasi yang menampung pengguna
Anda, menyatakan terbuka mana yang tidak Anda cakup, lalu membuat seseorang
menyetujuinya — langkah yang sama dengan pelajaran risiko, diterapkan pada
environment alih-alih pada fitur.

Cara memilih yang keliru justru yang paling umum: uji browser yang kebetulan
sedang terbuka di tim Anda. Begitulah sebuah bug menjangkau 12% pelanggan Anda
dan tak seorang pun melihatnya selama sebulan.

## Susun matriksnya dari angka Anda sendiri

Bukan dari pangsa pasar global. Pengguna Anda bukan pengguna dunia — portal
pemerintah, aplikasi belanja Brasil, dan alat HR internal hampir tidak punya
kesamaan apa pun soal browser, dan grafik yang diterbitkan tidak menggambarkan
satu pun dari ketiganya.

Di mana angka yang sesungguhnya tinggal:

- **Analitik produk** — GA4, Plausible, Matomo: browser, versi, OS, perangkat,
  viewport, per sesi. Ini sumber utamanya.
- **Log server** — header \`User-Agent\` pada request sungguhan, berguna ketika
  analitiknya diblokir ad blocker (yang justru condong *mengurangi* hitungan
  pengguna desktop yang peduli privasi).
- **Tiket support dan ulasan** — tempat ekornya mengumumkan diri.
- **Pendapatan, bukan cuma sesi.** Urutkan tabel yang sama menurut pesanan. Kalau
  18% sesi adalah Safari di iPhone tapi 31% checkout berasal dari sana, Safari
  bukan browser lapis kedua, apa pun kata hitungan sesinya.

Lalu potong menjadi beberapa lapis, karena "ada di matriks" bukan satu hal:

| Lapis | Artinya | Kapan |
|---|---|---|
| **1** | Pengujian fungsional penuh | Setiap rilis |
| **2** | Smoke: render, input, submit, bayar | Setiap rilis |
| **3** | Sebisanya; perbaiki keluhan yang nyata | Saat dilaporkan |
| **Luar** | Eksplisit tidak didukung, dengan pesan | Terdokumentasi, disepakati |

Cakup kira-kira **95% sesi berbobot** di lapis 1 dan 2, dan tuliskan 5% sisanya.
Matriks tanpa baris "Luar" bukanlah keputusan, ia harapan — dan ekornya adalah
tempat separuh minggu Anda akan habis kalau tidak.

> **Turunkan ulang tiap kuartal.** Pangsa browser bergerak, pelanggan Anda
> berubah, dan matriks perangkat dari dua tahun lalu adalah takhayul di dalam
> spreadsheet. Baris versinya terutama: "versi mayor saat ini dan sebelumnya"
> menua dengan sendirinya tiap enam minggu.

## Engine, bukan merek

Inilah fakta yang mengecilkan matriksnya, dan kebanyakan tester mempelajarinya
terlambat:

| Engine | Browser |
|---|---|
| **Blink** (Chromium) | Chrome, Edge, Opera, Brave, Samsung Internet |
| **Gecko** | Firefox |
| **WebKit** | Safari — **dan setiap browser di iPhone** |

Render, dukungan CSS, dan perilaku JavaScript berasal dari engine-nya. Jadi
Chrome dan Edge nyaris tidak berselisih dalam hal apa pun yang penting bagi Anda,
dan menguji keduanya sebagai lapis 1 adalah satu kolom yang Anda bayar dua kali.

Konsekuensi yang sering disalahpahami orang: **Chrome di iPhone bukanlah
Chrome.** Ia engine Safari yang memakai antarmuka Chrome, jadi bug yang Anda
"reproduksi di Chrome pada iOS" adalah bug WebKit, dan halaman yang bekerja di
Chrome desktop tidak memberi tahu Anda apa pun tentangnya. (Digital Markets Act
Uni Eropa memaksa Apple mengizinkan engine lain di iOS; dalam praktik,
perlakukan WebKit sebagai apa yang dijalankan pengguna iOS Anda, kecuali Anda
sudah mengukurnya lain.)

Yang memberi Anda tiga kolom engine untuk dicakup alih-alih delapan merek — dan
menjadikan **Safari di iPhone sungguhan tidak opsional** kalau Anda punya
pengguna iOS sama sekali, karena itulah satu-satunya engine yang tidak dijangkau
sebanyak apa pun pengujian desktop.

## Apa yang sebenarnya rusak secara berbeda

Bukan logika bisnis Anda. Itu berjalan di server, dan ia tidak peduli apa yang
menggambar halamannya. Yang berbeda adalah segala hal di tepinya:

| Area | Gejala yang akan Anda lihat |
|---|---|
| **Kontrol form** | Input tanggal, waktu, dan \`file\` digambar browser dan OS — picker yang bekerja di mana-mana menolak input keyboard di satu tempat |
| **Teks dan font** | Font cadangan yang berbeda 8% lebih lebar, sehingga labelnya membungkus dan mendorong tombol keluar dari kartu bertinggi tetap |
| **Tata letak** | Header lengket, \`overflow\` pada wadah yang bisa digulir, dan apa pun bertinggi tetap adalah tersangka lazimnya |
| **Satuan viewport** | \`100vh\` lebih tinggi daripada area yang terlihat di mobile, karena bilah URL menyembunyikan diri lalu muncul lagi — klasiknya "tombol submit di bawah lipatan yang tidak bisa dicapai siapa pun" |
| **Penyimpanan** | Safari mengusir \`localStorage\` dan IndexedDB yang ditulis skrip setelah sekitar seminggu tanpa interaksi; "draf saya terlupakan" adalah cacat nyata di satu engine saja |
| **Autoplay, clipboard, unduhan** | Dibatasi izin secara berbeda per browser; tombol "salin link" yang diam-diam tidak melakukan apa pun di salah satunya |
| **Cetak / PDF** | Semua orang melupakannya, dan faktur itu dicetak |

Dua kebiasaan yang lahir dari daftar ini: ketika bug tata letak muncul persis di
satu browser, cari **dimensi tetap** di dekatnya; ketika sebuah *fitur* gagal
persis di satu browser, cari **aturan izin atau penyimpanan**.

## Mobile bukan desktop yang disempitkan

Mengecilkan jendela desktop Anda ke 375px menemukan bug tata letak. Ia tidak
menemukan satu pun hal berikut, dan hal-hal inilah yang menghilangkan pesanan:

- **Tidak ada hover.** Menu yang terbuka saat hover tidak terjangkau ibu jari.
  Sama halnya untuk tooltip yang membawa informasi yang tidak ada di tempat lain.
- **Keyboard menutupi hal yang Anda butuhkan.** Kolomnya baik-baik saja;
  *tombol submit*-nya yang berada di balik keyboard layar, dan halamannya tidak
  mau menggulir ke sana.
- **Rotasi di tengah alur.** Putar ponselnya di langkah 3 dari 4. Form
  terisi separuh yang ter-mount ulang kehilangan state-nya, dan ini sepenuhnya
  tak terlihat di emulator perangkat.
- **Interupsi.** Sebuah panggilan, sebuah notifikasi, atau berpindah aplikasi
  lalu kembali empat menit kemudian — di tengah pembayaran. Apakah aplikasinya
  melanjutkan, mengulang dari awal, atau menagih dua kali?
- **Gestur yang dimiliki OS.** Tarik-untuk-muat-ulang pada form yang sudah
  dikirim, dan gestur usap-kembali sebagai *peristiwa navigasi yang tidak Anda
  rancang*.
- **Area aman.** Poni, sudut membulat, dan indikator home memakan bagian atas dan
  bawah tata letak yang penuh sampai tepi.
- **Penskalaan teks sistem.** Pengguna dengan ukuran font 200% adalah pengguna
  yang didukung. Kebanyakan komponen bertinggi tetap langsung gagal.
- **Jaringan sungguhan.** Bukan "lambat": *berubah-ubah*, dengan 40 detik hening
  lalu semuanya datang sekaligus. Cekik ke profil lambat dan perhatikan apa yang
  dilakukan submit yang diketuk dua kali.

Masing-masing itu adalah gagasan pengujian yang bisa Anda jalankan hari ini, di
satu ponsel pinjaman.

## Emulator, simulator, perangkat sungguhan

Ketiganya menjawab pertanyaan yang berbeda, dan mengetahui mana yang mana
menghemat banyak waktu terbuang:

| Alat | Engine asli? | Menemukan | Melewatkan |
|---|---|---|---|
| **Device mode di dev tools** | Tidak — engine desktop Anda | Tata letak, breakpoint, target sentuh | Setiap bug engine, setiap perilaku OS |
| **iOS Simulator / emulator Android** | Ya | Bug engine dan render | Performa, keyboard sungguhan, interupsi, sensor |
| **Perangkat sungguhan** | Ya | Gestur, keyboard, memori, jaringan, panas | Tidak ada yang Anda pedulikan |
| **Device cloud** | Ya | Ekornya, sesuai permintaan | Terasa lambat; canggung untuk kerja eksploratori |

Aturan yang mengikutinya: **satu perangkat sungguhan per keluarga engine
mengalahkan sepuluh emulator.** Satu Android kelas menengah yang murah dan iPhone
apa pun akan menemukan lebih banyak daripada kisi penuh Chrome tersimulasi. Sewa
ekornya dari device cloud ketika laporan lapis 3 masuk, alih-alih memilikinya.

## Jangan mengalikan suite dengan matriksnya

Godaan setelah menyusun matriks sepuluh baris adalah menjalankan suite regresi
sepuluh kali. Itu sepuluh kali lipat pekerjaan demi tambahan informasi beberapa
persen, dan itulah sebabnya pengujian lintas browser bereputasi sebagai tempat
waktu pergi untuk mati.

Logika sisi server identik di setiap browser. Jadi run lapis 2 adalah
**smoke tipis atas hal-hal yang benar-benar diputuskan browser**:

1. Halamannya ter-render — tidak ada yang tumpang tindih, terpotong, atau keluar
   layar
2. Setiap input bisa diisi, termasuk date picker dan kolom berkas
3. Form-nya terkirim dan keadaan berhasilnya muncul
4. Pembayaran atau redirect pihak ketiga apa pun tuntas dan kembali
5. Satu cetakan atau unduhan, kalau produknya punya

Lima pemeriksaan, sepuluh menit per konfigurasi. Itu terjangkau setiap rilis, dan
itu jauh lebih penting daripada menyeluruh sekali per kuartal.

## Cacat kompatibilitas menyebutkan konfigurasinya

"Tata letak rusak di mobile" bukan laporan. Kontrasnya *itulah* temuannya, jadi
tuliskan kedua sisinya:

~~~
Ringkasan: Tombol submit checkout tak terjangkau — Safari / iOS, potret
Bekerja di: Chrome 149 / Windows 11 / 1440x900
Gagal di:   Safari / iOS 26.5 / iPhone 13 / 390x844 potret, ukuran teks 100%
Langkah:    Keranjang -> Checkout -> isi alamat -> ketuk Nomor kartu
Sebenarnya: Keyboard menutupi Bayar; halaman tidak mau menggulir lagi
            (tangkapan layar)
Catatan:    Memutar ke lanskap memunculkan tombolnya. Tidak terulang di device
            mode dev tools pada viewport yang sama.
~~~

Browser **dan versi lengkapnya**, OS dan versinya, model perangkat, viewport,
orientasi, dan skala teks. Baris terakhir itulah yang menghemat satu hari: ia
memberi tahu developer sejak awal bahwa emulatornya akan membohongi mereka.

## Di mana TestForge berperan

Satu case, banyak run. Tulis smoke kompatibilitasnya sekali lalu eksekusi per
konfigurasi, dan namai run-nya sesuai environment-nya — *"smoke 2.4 — Safari /
iPhone 13"* — sehingga riwayat per environment jadi sesuatu yang bisa Anda baca.
Case yang lulus di Chrome dan gagal di Safari adalah dua hasil pada satu case,
bukan dua case.

Tandai case-case itu \`compat\` dan mereka menjadi pemilihan lapis 2: sebuah
filter tersimpan, bukan keputusan yang Anda ambil ulang di bawah tekanan setiap
rilis.

**Selanjutnya:** pengguna yang tidak terlihat oleh matriks Anda — hanya keyboard,
pembaca layar, penglihatan lemah — dan pemeriksaan sepuluh menit yang menemukan
sebagian besar hal yang mengecewakan mereka.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Seorang pengguna melaporkan tata letak yang rusak di Chrome pada iPhone mereka. Anda tidak bisa mereproduksinya di Chrome pada laptop Anda, pada lebar viewport yang sama. Apa penjelasan yang paling mungkin?",
      choices: [
        {
          id: "a",
          text: "Versi Chrome mereka lebih lama daripada milik Anda, jadi tidak punya CSS yang dipakai halamannya",
        },
        {
          id: "b",
          text: "Chrome di iOS me-render dengan WebKit, jadi itu engine Safari — Chrome desktop tidak pernah menjalankannya",
        },
        {
          id: "c",
          text: "Chrome mobile menerapkan stylesheet yang berbeda pada halaman yang sama",
        },
        {
          id: "d",
          text: "Laporannya tidak bisa dipercaya; viewport yang sama membuat kedua kasus itu setara",
        },
      ],
      explanation:
        "Setiap browser di iOS harus me-render dengan WebKit, jadi antarmuka Chrome di sebuah iPhone menjalankan engine Safari di bawahnya. Menyamakan lebar viewport hanya menyamakan ruang tata letaknya, bukan engine yang menafsirkan CSS-nya — dan itulah sebabnya kelas bug ini selamat dari setiap pemeriksaan desktop. Selisih versi dan stylesheet mobile terpisah sama-sama layak diperiksa secara umum, tapi tidak satu pun menjelaskan kegagalan yang mengikuti platformnya alih-alih mereknya, dan menepis laporannya meninggalkan cacat sungguhan di depan setiap pengguna iOS yang Anda punya.",
    },
    {
      id: "q2",
      stem: "Anda sedang menyusun matriks perangkat untuk situs belanja konsumen. Dari dasar apa baris lapis 1 seharusnya berasal?",
      choices: [
        {
          id: "a",
          text: "Pangsa pasar browser global yang diterbitkan, supaya matriksnya bisa dipertahankan",
        },
        {
          id: "b",
          text: "Analitik Anda sendiri, dibobot menurut sesi dan menurut pesanan yang tuntas, dipotong berlapis sampai sekitar 95% dengan sisanya dituliskan",
        },
        {
          id: "c",
          text: "Versi terbaru dari setiap browser besar, karena pengguna memperbarui otomatis",
        },
        {
          id: "d",
          text: "Konfigurasi apa pun yang sudah terpasang di tim",
        },
      ],
      explanation:
        "Matriksnya adalah keputusan pemilihan, jadi ia harus dibangun dari populasi yang dilindunginya: trafik Anda sendiri, dibobot menurut pendapatan sekaligus sesi, karena browser dengan pangsa kunjungan kecil bisa berpangsa besar di checkout. Pangsa global menggambarkan populasi yang bukan milik Anda. Terbaru-saja melewatkan pengguna yang tidak bisa memperbarui — sering justru di perangkat tempat tata letaknya rusak. Dan menguji apa yang sudah terpasang di tim adalah kebiasaan bawaan yang ingin digantikan pelajaran ini. Perhatikan bahwa 95% itu baru separuh jawabannya: menyebutkan sisanya yang tidak didukung adalah yang mengubah cakupan menjadi keputusan yang disepakati.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang hanya bisa ditemukan di perangkat sungguhan — bukan di device mode dev tools, dan tidak andal di simulator?",
      choices: [
        {
          id: "a",
          text: "Keyboard layar menutupi tombol submit sehingga tak terjangkau",
        },
        {
          id: "b",
          text: "Form terisi separuh kehilangan state-nya ketika ponselnya diputar di tengah alur",
        },
        {
          id: "c",
          text: "Sebuah kartu memotong teksnya pada lebar viewport 375px",
        },
        {
          id: "d",
          text: "Alur pembayaran menagih dua kali ketika sebuah panggilan menginterupsinya dan penggunanya kembali",
        },
      ],
      explanation:
        "Keyboard, rotasi, dan interupsi semuanya berasal dari sistem operasi dan perangkat kerasnya yang sungguhan: device mode mengemulasi sebuah viewport dan peristiwa sentuh, dan simulator menjalankan engine yang tepat di mesin yang keliru tanpa keyboard sungguhan atau panggilan yang menginterupsinya. Pemotongan pada lebar tertentu adalah kekecualiannya — itu murni tata letak, dan justru itulah yang dikuasai device mode dan tempat ia layak dipakai. Pembagian itulah yang berguna: emulasikan untuk menemukan tata letak, pinjam ponsel untuk menemukan perilaku.",
    },
  ],
};
