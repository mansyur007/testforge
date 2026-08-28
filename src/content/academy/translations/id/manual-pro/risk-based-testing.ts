import type { LessonTranslation } from "../../../types";

export const riskBasedTestingId: LessonTranslation = {
  slug: "risk-based-testing",
  title: "Risk-based testing",
  summary:
    "Dampak × kemungkinan, dan cara mempertahankan apa yang Anda pilih untuk tidak diuji.",
  body: `
## Anda selalu memprioritaskan — pertanyaannya cuma apakah Anda menyadarinya

Pengujian menyeluruh itu mustahil. Itu prinsip kedua, dan semua orang mengangguk
mendengarnya. Lalu mereka membuka suite pengujiannya dan menjalankannya dari atas
ke bawah, yang artinya memprioritaskan berdasarkan **urutan abjad dari siapa pun
yang menulis case-nya lebih dulu**.

Risk-based testing bukan upacara yang Anda tambahkan di atas pengujian. Ia
pengakuan bahwa Anda memang selalu mengurutkan, ditambah satu aturan untuk
mengurutkan dengan sengaja.

Aturannya satu baris:

> **Risiko = dampak × kemungkinan.** Belanjakan jam-jam Anda di tempat hasil kali
> keduanya paling tinggi, dan sanggupi menjelaskan kenapa.

## Dampak dan kemungkinan adalah pertanyaan berbeda, ditanyakan ke orang berbeda

Kekeliruan paling umum adalah meleburnya jadi satu perasaan bernama "penting".
Keduanya terpisah, dan biasanya Anda mendapatkannya dari orang yang terpisah
pula.

| | Pertanyaan | Siapa yang benar-benar tahu |
|---|---|---|
| **Dampak** | Kalau ini rusak di produksi, berapa ongkosnya? | Product owner, support, kadang keuangan |
| **Kemungkinan** | Seberapa mungkin ini rusak saat ini juga? | Developer, dan Anda |

Dampak adalah fakta bisnis. Pembayaran yang diam-diam mengambil uang dan tidak
menghasilkan pesanan itu bencana, sebaik apa pun kodenya ditulis. Anda tidak
berhak menurunkannya hanya karena kodenya kelihatan rapi.

Kemungkinan adalah fakta *teknis*, dan itulah paruh yang paling bisa dinilai
tester, karena ia berasal dari hal-hal yang bisa Anda amati:

- **Seberapa baru?** Kode yang ditulis sprint ini lebih mungkin salah daripada
  kode yang selamat setahun dipakai pengguna.
- **Seberapa rumit?** Tiga kondisi yang saling berinteraksi selalu mengalahkan
  satu flag.
- **Siapa yang menyentuhnya?** Ini bukan tudingan kepada siapa pun — komponen
  dengan lima penulis kuartal ini sudah dikenai lima model pikiran berbeda.
- **Bagaimana riwayatnya?** Cacat menggerombol. Area yang menghasilkan enam bug
  di rilis lalu adalah area yang akan menghasilkan bug ketujuh.
- **Seberapa banyak berubah?** Refactor yang "seharusnya tidak mengubah
  perilaku" mengubah perilaku.

Perhatikan bahwa dua yang terakhir itu gratis: keduanya sudah ada di pelacak
cacat dan log git Anda. Kebanyakan tim mengurutkan risiko dari ingatan sambil
duduk di atas datanya.

## Memberi skor tanpa mengubahnya jadi astrologi

Anda tidak butuh spreadsheet dengan kriteria berbobot sampai tiga angka di
belakang koma. Skor yang bisa Anda hasilkan dalam sepuluh menit dan Anda
pertahankan dalam rapat mengalahkan model yang tidak dipercaya siapa pun.

Pakai **Tinggi / Sedang / Rendah** di masing-masing sumbu, dan baca pasangannya
sebagai kisi:

| | Dampak: Rendah | Dampak: Sedang | Dampak: Tinggi |
|---|---|---|---|
| **Kemungkinan: Tinggi** | Sedang | Tinggi | **Uji lebih dulu** |
| **Kemungkinan: Sedang** | Rendah | Sedang | Tinggi |
| **Kemungkinan: Rendah** | Lewati dan katakan begitu | Rendah | Sedang — tapi pastikan ia jalan sama sekali |

Dua sifat kisi ini lebih penting daripada angka-angka di dalamnya:

1. **Dampak tinggi + kemungkinan rendah bukan berarti "lewati".** Pembayaran
   jarang rusak dan menghancurkan ketika rusak. Ia layak smoke check, bukan
   pengujian penuh — kotaknya berbunyi "pastikan ia jalan sama sekali", dan itu
   jawaban yang sungguhan.
2. **Dampak rendah + kemungkinan rendah adalah keputusan, bukan kelalaian.**
   Menulis "lewati" di sudut itulah yang membuat baris *Tidak dicakup* di rencana
   Anda jujur.

Tiga tingkat itu disengaja. Dengan lima, orang berdebat dua puluh menit soal
apakah sesuatu itu 3 atau 4 dan urutannya tidak berubah. Pengurutan itu untuk
memutuskan urutan, dan urutan hanya butuh resolusi secukupnya untuk disortir.

## Percakapannya adalah output-nya

Inilah bagian yang tidak dituliskan siapa pun: **analisis risiko lebih berharga
sebagai rapat setengah jam daripada sebagai dokumen.** Kumpulkan satu developer,
product owner, dan Anda sendiri di satu ruangan dengan daftar fiturnya lalu
ajukan dua pertanyaan per item.

Yang terjadi adalah kalian bertiga berselisih, terang-terangan, sebelum
pengujian apa pun dimulai. Developer berkata "jalur importnya aman kok, yang
akan saya khawatirkan itu logika retry-nya". Product owner berkata "tidak ada
yang pakai bulk import, tapi kalau email konfirmasinya keliru, support
tenggelam". Keduanya mengubah ke mana minggu Anda pergi, dan tidak satu pun ada
di dokumen kebutuhan.

Lakukan sekali dan Anda akan menyadari sesuatu: skor kemungkinan Anda sendiri
sekitar 70% tepat dan skor dampaknya sekitar 40% tepat. Tester secara sistematis
melebih-lebihkan dampak dari hal-hal yang merepotkan untuk diuji.

## Apa yang dilakukan ketika waktu habis

Waktu akan habis. Rencananya adalah apa yang Anda lakukan setelah itu, dan hanya
ada tiga langkah yang jujur:

1. **Potong dari bawah daftar terurut, bukan dari tengah-tengah segalanya.**
   Menguji setengah-setengah sepuluh area lebih buruk daripada menguji penuh enam
   area dan menyebutkan empat yang Anda jatuhkan. Cakupan separuh menghasilkan
   keyakinan tanpa bukti.
2. **Turunkan kedalamannya, bukan keberadaannya.** Untuk area berdampak tinggi
   yang tidak bisa Anda cakup dengan benar, jalankan satu case smoke alih-alih
   tidak sama sekali. Mengetahui checkout tidak *sepenuhnya* rusak sudah sebagian
   besar nilainya, dengan 10% dari jam kerjanya.
3. **Sampaikan apa yang Anda jatuhkan, kepada seseorang, sebelum rilis.** Bukan
   di dokumen yang tidak akan mereka buka — di percakapan rilis, dalam satu
   kalimat: "kami sama sekali tidak menguji bulk import siklus ini; terakhir kali
   ia rusak, butuh dua hari sampai ada yang sadar."

Yang ketiga itulah seluruh pekerjaannya. Tester yang kehabisan waktu lalu
melaporkan dashboard hijau telah menghasilkan pernyataan yang keliru. Tester yang
kehabisan waktu lalu menyebutkan risiko mana yang belum diperiksa telah
menghasilkan *informasi*, dan itulah yang dibayar tim.

## Satu contoh dikerjakan

Rilis ShopMini berisi empat perubahan. Tersedia dua puluh jam pengujian;
estimasi naif untuk cakupan penuh adalah tiga puluh lima.

~~~
Perubahan                       Dampak  Kemungkinan  Alasan kemungkinan     Urutan
------------------------------------------------------------------------------------
Guest checkout (SM-214)         H       H            kode baru, komponen    1
                                                     keranjang bersama,
                                                     3 kondisi
Validasi kode diskon            H       M            regex berubah, 4 bug   2
                                                     di area ini tahun lalu
Peringkat pencarian produk      M       H            ditulis ulang sprint   3
                                                     ini
Pembaruan link footer         L       L            perubahan teks, tanpa  lewati
                                                     logika

Alokasi: 10j untuk guest checkout, 6j untuk kode diskon, 4j untuk pencarian
         (happy path + dua aturan peringkat yang disebut PO), 0j untuk footer.

Tidak dicakup, dinyatakan di kanal rilis: teks footer; guest checkout di
iOS Safari < 15; jalur bulk import, tidak berubah siklus ini tapi bersebelahan
dengan komponen keranjang yang berubah.
~~~

Baris terakhir itulah yang layak Anda tiru. **"Tidak berubah, tapi bersebelahan
dengan sesuatu yang berubah"** adalah kategori risiko yang orang lewatkan, karena
latihan pengurutannya bertanya tentang apa yang sedang dikirim sementara
regresinya tinggal di sebelah.

## Di mana TestForge berperan

Priority pada sebuah case bukan hiasan — di situlah pengurutan ini mendarat
supaya ia hidup lebih lama dari rapatnya. Ketika Anda menandai case menurut area
risiko yang dicakupnya, laporan run berhenti berkata "82% lulus" dan mulai
berkata "setiap case berisiko tinggi lulus; empat yang gagal berada di Medium, di
area yang sudah kita tandai" — dan itu kalimat yang bisa ditindaklanjuti seorang
product owner.

**Selanjutnya:** teknik untuk area yang menurut pengurutan Anda berisiko tapi
kebutuhannya terlalu tipis untuk diskrip — pengujian eksploratori bercharter.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Integrasi payment gateway sangat kokoh — tidak berubah selama setahun, tidak ada cacat terhadapnya, ditulis developer paling teliti di tim. Product bilang tagihan yang keliru adalah hal terburuk yang bisa menimpa perusahaan. Apa kata risk-based testing?",
      choices: [
        {
          id: "a",
          text: "Lewati — kemungkinan rendah berarti risiko rendah, dan jam kerjanya milik kode yang berubah",
        },
        {
          id: "b",
          text: "Jalankan smoke check yang membuktikan ia masih bekerja, lalu belanjakan kedalamannya di tempat lain",
        },
        {
          id: "c",
          text: "Beri pengujian regresi penuh — dampak tinggi selalu mengalahkan kemungkinan",
        },
        {
          id: "d",
          text: "Naikkan skor kemungkinannya, karena dampak setinggi itu tidak boleh diserahkan pada satu pemeriksaan saja",
        },
      ],
      explanation:
        "Dampak tinggi dengan kemungkinan rendah adalah kotak yang orang salahkan dari dua arah sekaligus. Melewatinya sama sekali berarti area yang berpotensi bencana tidak punya bukti apa pun di rilis ini; pengujian regresi penuh menghabiskan seminggu untuk membuktikan ulang kode yang tidak disentuh apa pun. Jawaban yang sepadan adalah memastikan ia bekerja sama sekali — sebagian besar nilainya dengan sepersekian jam kerjanya. Menggelembungkan skor kemungkinan demi memaksa alokasi lebih besar sama kelirunya dengan menebak: ia merusak pengurutan yang menjadi dasar penyortiran segalanya.",
    },
    {
      id: "q2",
      stem: "Waktu Anda tinggal separuh dari yang diestimasi. Tanggapan mana yang memberi tim hasil paling berguna?",
      choices: [
        {
          id: "a",
          text: "Jalankan setiap case rencana tapi berhenti di langkah pertama masing-masing, supaya tidak ada yang benar-benar tak teruji",
        },
        {
          id: "b",
          text: "Uji bagian atas daftar terurut dengan benar, dan beri tahu rapat rilis area mana yang tidak mendapat cakupan",
        },
        {
          id: "c",
          text: "Jalankan case yang paling cepat dieksekusi, untuk memaksimalkan jumlah yang dilaporkan lulus",
        },
        {
          id: "d",
          text: "Laporkan kekurangan waktunya sebagai penghalang dan tolak menguji sampai jadwalnya dibetulkan",
        },
      ],
      explanation:
        "Menyebar diri secara tipis menghasilkan dashboard penuh warna hijau tanpa satu area pun benar-benar diperiksa — keyakinan tanpa bukti, dan itu lebih buruk daripada celah yang diakui. Mengoptimalkan jumlah case yang lulus adalah kegagalan yang sama dengan seragam metrik. Menolak menguji mengembalikan keputusannya kepada orang-orang yang informasinya lebih sedikit daripada Anda sekarang. Kedalaman di puncak daftar plus daftar bernama tentang apa yang tak tercakup adalah satu-satunya versi di mana setiap risiko entah diperiksa entah diterima secara eksplisit.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang benar-benar input bagi paruh kemungkinan pada skornya?",
      choices: [
        {
          id: "a",
          text: "Area ini menghasilkan enam cacat pada rilis terakhir",
        },
        {
          id: "b",
          text: "Komponennya ditulis ulang sprint ini",
        },
        {
          id: "c",
          text: "Kehilangan data ini akan melanggar kontrak pelanggan",
        },
        {
          id: "d",
          text: "Logikanya bercabang pada tiga kondisi yang saling berinteraksi",
        },
      ],
      explanation:
        "Riwayat cacat, kebaruan perubahan, dan kerumitan semuanya bukti tentang seberapa mungkin kodenya keliru, dan dua yang pertama sudah tersedia di pelacak cacat dan log git. Pelanggaran kontrak menggambarkan berapa ongkosnya ketika hal itu gagal, dan itu dampak — sumbu yang satunya, dan yang dimiliki bisnis, bukan Anda. Menjaga keduanya terpisah adalah inti kisi ini: meleburnya menjadi satu perasaan bernama \"penting\" justru yang ingin dicegah teknik ini.",
    },
  ],
};
