import type { LessonTranslation } from "../../../types";

export const reportingToStakeholdersId: LessonTranslation = {
  slug: "reporting-to-stakeholders",
  title: "Melapor kepada stakeholder",
  summary:
    "Mengubah hasil menjadi sebuah keputusan, dalam lima kalimat.",
  body: `
## Laporan pengujian ada supaya seseorang bisa memutuskan

Bukan untuk menggambarkan apa yang Anda kerjakan. Tidak ada orang di luar tim
yang menginginkan narasi tentang minggu Anda; mereka ingin tahu apakah harus
dikirim Kamis, apa yang diperbaiki lebih dulu, dan ke mana dua orang berikutnya
sebaiknya diarahkan.

Jadi ujian yang penting bagi laporan apa pun yang Anda tulis itu sederhana:
**setelah membaca ini, bisakah pembacanya mengambil keputusan yang memang akan
mereka ambil — dengan lebih cepat dan lebih baik?** Kalau laporan Anda butuh
rapat lanjutan supaya berguna, yang Anda tulis itu catatan, bukan laporan.

## Fakta yang sama, tiga panjang

| Pembaca | Menginginkan | Panjang |
|---|---|---|
| **Product owner / manajer** | Bisakah kita kirim? Apa risikonya kalau iya? | Lima kalimat |
| **Dev lead** | Di mana cacatnya menggerombol, apa yang terhambat, apa yang butuh keputusan | Daftar pendek, dengan link |
| **Eksekutif / pelanggan** | Satu baris dan arah pergerakannya | Satu baris |

Fakta di bawahnya identik. Yang berubah adalah seberapa banyak mesinnya Anda
perlihatkan — dan kekeliruan yang paling umum sejauh ini adalah mengirim versi
milik dev lead kepada semua orang.

## Lima kalimatnya

Inilah rekomendasi rilisnya, dan ia bekerja untuk rilis dua mingguan maupun untuk
hotfix pukul enam sore:

1. **Apa yang diuji, dan apa yang tidak.** Cakupan dan pengecualiannya dalam satu
   tarikan napas; pengecualiannya adalah paruh yang dilewati orang dan paruh yang
   melindungi semua orang.
2. **Keadaannya sekarang.** Judulnya: penghalang yang terbuka, alur kritis yang
   terverifikasi, apa yang masih bergerak.
3. **Risiko kalau dikirim sekarang**, dalam mata uang pembacanya — pengguna,
   pesanan, uang, reputasi. Bukan hitungan cacat.
4. **Rekomendasinya, beserta syaratnya.** *"Kirim kalau cacat checkout-nya sudah
   diperbaiki; empat sisanya bisa masuk 2.4.1."*
5. **Apa yang akan mengubah jawabannya.** Dua hari lagi, environment staging yang
   bekerja, sebuah keputusan dari seseorang.

Kalimat kelima itulah yang mengubah laporan menjadi tuas. Tanpanya Anda
menyerahkan sebuah masalah; dengannya Anda menyerahkan sekumpulan pilihan.

~~~
Rilis 2.4 — rekomendasi

Diuji: checkout, pembayaran, pengaturan akun, riwayat pesanan, di Chrome,
Firefox, dan Safari/iOS. Tidak diuji: modul pelaporan yang baru (tidak ada
data uji di staging), tata letak tablet Android.

Dua penghalang terbuka: pembayaran kartu gagal di Safari/iOS (TF-1841), dan
kode diskon dengan spasi di akhir mengembalikan 500 (TF-1848). Selebihnya di
jalur kritis lulus.

Mengirim hari ini berarti kira-kira sepertiga pesanan tidak bisa membayar,
karena Safari/iOS adalah 31% dari checkout yang tuntas.

Rekomendasi: tahan untuk TF-1841. TF-1848 cuma satu baris pemangkasan dan bisa
menyusul di 2.4.1 dengan catatan untuk support.

Kalau data uji pelaporan mendarat di staging sebelum Rabu, saya bisa mencakup
modul pelaporan sebelum akhir pekan dan menghapus ketidaktahuan itu.
~~~

Lima kalimat, satu keputusan, tanpa rapat.

## Jangan pernah bilang "ini sudah siap"

Anda tidak mungkin tahu itu, dan itulah satu kalimat yang cepat atau lambat akan
dikutip balik ke Anda.

Yang bisa Anda katakan — dengan tepat, dan dengan wajah tenang di ruangan mana
pun — adalah: **apa yang Anda cakup, apa yang Anda temukan, dan apa yang tetap
tidak diketahui.** Pengujian menunjukkan adanya cacat, bukan ketiadaannya, dan di
sini itu bukan poin filosofis melainkan alasan laporan Anda adalah pernyataan
tentang *bukti dan risiko yang tersisa*, bukan sebuah jaminan.

Ketika ada yang mendesak — *"tapi ini aman kan?"* — jawaban yang jujur justru
jawaban yang baik, bukan pengelakan:

> *"Saya tidak bisa bilang ini pasti bekerja. Yang bisa saya sampaikan: checkout,
> pembayaran, dan pengaturan lulus di tiga konfigurasi utama kita, dua penghalang
> masih terbuka, dan modul pelaporan belum teruji karena staging tidak punya
> datanya. Kalau kita kirim malam ini, risikonya X. Kalau saya diberi waktu
> sampai Kamis, saya bisa menutup ketidaktahuan itu."*

Jawaban itu memberi mereka sebuah keputusan. *"Ya, aman kok"* memberi mereka
seseorang untuk disalahkan, dan itu kesepakatan yang jauh lebih buruk bagi kalian
berdua.

## Pisahkan pengamatan dari penilaian

Dua jenis kalimat yang berbeda, dan mencampurnya adalah yang membuat laporan
diperdebatkan:

- **Pengamatan:** *"Pembayaran gagal di Safari/iOS, terulang di tiga perangkat,
  dengan jejak jaringan terlampir."* Tidak ada yang bisa membantah ini.
- **Penilaian:** *"Saya tidak akan mengirim ini."* Siapa pun yang lebih senior
  dari Anda berhak tidak setuju, dan kadang mereka benar — mereka bisa melihat
  konteks komersial yang tidak Anda lihat.

Tulis keduanya, dilabeli dengan jelas, dengan urutan itu. Lalu kalau penilaiannya
dianulir, pengamatannya tetap berdiri, dan keputusan menerima risikonya menjadi
milik orang yang mengambilnya. Itu bukan sikap defensif — itu cara perbedaan
pendapat profesional semestinya bekerja, dan itulah sebabnya peringatan Anda
berikutnya tetap ditanggapi serius.

## Laporan mingguan, dalam lima judul dan tidak lebih

1. **Keputusan yang dibutuhkan** — paling depan, karena hanya bagian inilah yang
   menuntut pembacanya melakukan sesuatu
2. **Apa yang berubah** sejak laporan terakhir
3. **Risiko dan penghalang**, masing-masing dengan pemiliknya
4. **Angka** — paling banyak tiga, dari pelajaran sebelumnya
5. **Berikutnya**

Apa pun yang tidak muat di salah satu dari kelimanya bukanlah status, ia detail,
dan detail masuk ke dalam sebuah link.

## Mengeskalasi tanpa membakar apa pun

Eskalasikan **keputusannya**, bukan orangnya. Penghalang yang tidak dimiliki
siapa pun setelah dua hari, risiko yang diterima diam-diam, dependensi yang
berhenti menjawab: itu semua bahan eskalasi, dan paling enak dibaca dengan
tenggat dan sebuah nilai bawaan.

> *"TF-1841 belum punya pemilik sejak Senin. Kalau sampai Kamis siang tidak ada
> yang mengambilnya, kita kirim 2.4 tanpa pembayaran Safari dan memberi tahu
> support untuk bersiap menerima telepon — saya angkat sekarang supaya itu jadi
> pilihan, bukan kecelakaan."*

Nilai bawaannya-lah yang membuat orang menjawab. Dan perhatikan pembingkaiannya:
Anda tidak sedang minta diselamatkan, Anda sedang memberi tahu apa yang akan
terjadi kalau kesunyiannya berlanjut.

**Kabar buruk berjalan lebih awal dan dalam ukuran kecil.** Peringatan di Selasa
adalah sebuah rencana; informasi yang sama di hari rilis adalah krisis dengan
nama Anda terlekat. Tidak pernah ada yang menyesal mengangkat sebuah risiko
terlalu awal.

## Tuliskan setelahnya

Apa pun yang Anda katakan di ruangan itu, kirim satu paragraf sesudahnya:
keputusannya, siapa yang mengambilnya, atas dasar apa. Sebagian karena ingatan
bersama jauh lebih buruk daripada yang dipercaya siapa pun dan ini mencegah
perdebatan yang sama terjadi dua kali dalam sebulan — dan sebagian karena ketika
sebuah risiko diterima, catatan bahwa ia diterima secara sadar adalah yang
menjaga percakapannya tetap tentang software-nya alih-alih tentang siapa berkata
apa.

## Di mana TestForge berperan

Run adalah buktinya; laporan adalah kalimat yang Anda tulis di atasnya. Tautkan
run dan cacatnya alih-alih menempelkan angka, sehingga siapa pun yang
menginginkan detailnya bisa mendapat semuanya dan tak seorang pun harus
membacanya untuk mendapat keputusannya.

Dan link dashboard bukanlah laporan. Mengirimnya berarti meminta pembacanya
mengerjakan tugas Anda — melihat angka lalu mengira-ngira artinya. Nilai Anda ada
pada kalimatnya.

## Di mana track ini berakhir

Sekarang Anda bisa merencanakan pekerjaan di bawah tenggat dan menyatakan apa
yang Anda potong, menjalankan sesi eksploratori bercharter dan menghasilkan bukti
darinya, membaca jejak jaringan, mengemudikan sebuah API langsung, memverifikasi
apa yang benar-benar tersimpan, mencakup browser yang sungguh dipakai pengguna
Anda, menemukan kegagalan aksesibilitas dan non-fungsional yang tidak ditulis
kebutuhannya oleh siapa pun, dan mengubah semuanya menjadi rekomendasi yang bisa
ditindaklanjuti seseorang.

Itulah rentang kerja seorang QA manual tingkat menengah yang solid — dan
langit-langit dari apa yang bisa dikerjakan satu orang dengan tangan. Berikutnya
adalah membuat mesin mengerjakan separuh yang berulang supaya Anda bisa
menghabiskan waktu di bagian yang butuh manusia: track **QA Automation**, di
[roadmap](/id/academy).
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Product owner bertanya, satu jam sebelum panggilan rilis: \"Apakah ini siap dikirim?\" Apa jawaban terkuatnya?",
      choices: [
        {
          id: "a",
          text: "\"Ya — semua yang kami uji lulus.\"",
        },
        {
          id: "b",
          text: "Apa yang Anda cakup, apa yang Anda temukan, apa yang tetap tidak diketahui, dan apa risikonya kalau dikirim malam ini — dengan keputusannya tetap di tangan mereka",
        },
        {
          id: "c",
          text: "\"Saya tidak bisa bilang — pengujian menunjukkan adanya cacat, bukan ketiadaannya.\"",
        },
        {
          id: "d",
          text: "\"Tidak, masih ada dua cacat yang terbuka.\"",
        },
      ],
      explanation:
        "Laporan ada supaya seseorang bisa memutuskan, jadi jawaban terkuat menyerahkan cakupan, temuan, ketidaktahuan, dan konsekuensinya, lalu meninggalkan keputusannya di tempat semestinya. Menyatakan ini siap mengklaim pengetahuan yang tidak Anda punya dan akan dikutip balik ke Anda. Prinsip di pilihan ketiga benar dan penyampaiannya tidak berguna — ia menolak membantu keputusannya, dan itu terbaca sebagai pengelakan sebenar apa pun isinya. Dan penolakan mentah menukar penilaian mereka dengan penilaian Anda tanpa memberi mereka fakta untuk ditimbang: dua cacat terbuka bisa jadi remeh, dan orang yang memegang konteks komersial berhak atas pertukaran itu.",
    },
    {
      id: "q2",
      stem: "Versi kalimat risiko mana yang layak berada di laporan untuk seorang product owner?",
      choices: [
        {
          id: "a",
          text: "\"17 cacat terbuka, 2 di antaranya critical, dan regresi ada di 94%.\"",
        },
        {
          id: "b",
          text: "\"Pembayaran kartu gagal di Safari/iOS, yang merupakan 31% checkout yang tuntas — mengirim hari ini berarti kira-kira sepertiga pesanan tidak bisa membayar.\"",
        },
        {
          id: "c",
          text: "\"Ada risiko signifikan di area pembayaran yang sebaiknya dipertimbangkan sebelum rilis.\"",
        },
        {
          id: "d",
          text: "\"Cacat pembayaran Safari/iOS (TF-1841) adalah null reference di handler tokenisasi kartu.\"",
        },
      ],
      explanation:
        "Risiko harus tiba dalam mata uang pembacanya — pesanan, pengguna, uang — karena itulah satuan tempat keputusannya diambil. Hitungan cacat adalah pembukuan internal Anda dan tidak berarti apa pun tanpa mengetahui cacat yang mana, dan \"risiko signifikan\" sama sekali tidak memindahkan informasi sambil terdengar seolah-olah begitu. Akar penyebabnya nyata dan berguna, tapi itu versi milik dev lead atas fakta yang sama: seorang product owner tidak bisa berbuat apa pun dengan sebuah null reference, dan konsekuensinya sama sekali tidak ada di sana.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang membuat laporan status lebih mungkin menghasilkan tindakan?",
      choices: [
        {
          id: "a",
          text: "Membuka dengan keputusan yang Anda butuhkan, alih-alih dengan apa yang Anda kerjakan",
        },
        {
          id: "b",
          text: "Menyatakan apa yang tidak diuji, berdampingan dengan apa yang diuji",
        },
        {
          id: "c",
          text: "Melampirkan daftar lengkap test case yang dieksekusi supaya pembacanya bisa melihat cakupannya",
        },
        {
          id: "d",
          text: "Memberi penghalang yang tak bertuan sebuah tenggat dan nilai bawaan yang dinyatakan kalau tak ada yang menjawab",
        },
      ],
      explanation:
        "Keputusan di depan adalah yang membuat tugas pembacanya terlihat di baris pertama; menyebutkan pengecualiannya adalah yang mencegah sebuah ketidaktahuan terbaca sebagai kelulusan; dan nilai bawaan beserta tenggat mengubah kesunyian menjadi pilihan yang harus diambil seseorang, dan itulah mekanisme yang sungguh-sungguh menggerakkan penghalang yang tak bertuan. Daftar case lengkap adalah yang sebaiknya ditinggalkan — ia detail, tempatnya di balik sebuah link, dan mengubur empat kalimat konsekuensi di dalam 300 baris adalah cara paling andal untuk membuat semuanya tidak dibaca.",
    },
  ],
};
