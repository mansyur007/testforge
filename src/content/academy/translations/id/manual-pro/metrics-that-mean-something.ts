import type { LessonTranslation } from "../../../types";

export const metricsThatMeanSomethingId: LessonTranslation = {
  slug: "metrics-that-mean-something",
  title: "Metrik yang berarti sesuatu",
  summary:
    "Teater pass-rate, escape rate, dan apa yang layak ditaruh di sebuah dashboard.",
  body: `
## Angka yang paling sering dilaporkan dalam pengujian adalah yang paling sedikit informasinya

**Pass rate.** 847 dari 862 lulus — 98,3%, hijau, terpampang di slide.

Inilah yang tidak bisa diberitahukan angka itu: apakah software-nya bagus. Ia
mengukur **pengujian yang kebetulan Anda tulis**, jadi suite yang cuma menyusuri
happy path melaporkan 98% untuk produk yang tumbang begitu ada yang melakukan
sesuatu yang tak biasa. Angka yang sama, kenyataan yang berlawanan.

Ia juga bisa dimanipulasi tanpa menyentuh produknya, lewat tiga langkah yang bisa
dikerjakan siapa pun sebelum Jumat:

- **Tambahkan pengujian yang lulus.** Tiga puluh pemeriksaan baru atas hal-hal
  yang sudah bekerja menaikkan persentasenya dan tidak mengubah apa pun.
- **Hapus yang labil.** Justru itulah pengujian yang menyentuh kode paling sulit.
- **Pecah satu pengujian yang gagal jadi dua.** Satu kegagalan menjadi satu
  kegagalan dan satu kelulusan.

Semua yang terlibat tahu ini, dan itulah sebabnya angkanya dilaporkan dan tidak
pernah ditindaklanjuti. Itulah definisi teater: ritual yang menghasilkan perasaan
terkendali dan nol keputusan.

> **Hukum Goodhart, yang akan Anda saksikan sendiri.** *Ketika sebuah ukuran
> menjadi target, ia berhenti menjadi ukuran yang baik.* Hitung bug per tester
> dan Anda mendapat banjir bug remeh serta perdebatan tentang setiap severity.
> Targetkan cakupan kode dan Anda mendapat pengujian tanpa asersi. Targetkan
> jumlah case yang dieksekusi dan case-nya jadi mengecil. Metriknya selalu
> membaik. Tidak ada yang lain yang membaik.

## Tiga pertanyaan yang harus dilalui sebuah metrik

Sebelum sebuah angka mendekati dashboard:

1. **Pertanyaan siapa yang dijawabnya?** Kalau Anda tidak bisa menyebut orang dan
   pertanyaannya, ia hiasan.
2. **Bisakah ia digeser tanpa mengerjakan pekerjaan yang sesungguhnya?** Kalau
   ya, ia akan digeser — cepat atau lambat, oleh seseorang yang tertekan, tanpa
   niat buruk apa pun.
3. **Keputusan apa yang berubah ketika ia bergerak?** *"Kalau ini berlipat dua,
   kita akan ___."* Kalimat yang tidak punya penutup berarti angkanya dilihat dan
   tidak ada yang mengikutinya.

Sebagian besar isi dashboard QA gagal di ketiganya.

## Metrik yang layak dimiliki

Masing-masing berangkat dari pertanyaan yang benar-benar diajukan orang:

| Pertanyaannya | Metriknya | Kenapa ia bertahan |
|---|---|---|
| Apakah kita mengirimkan cacat ke pelanggan? | **Escape rate** — cacat yang ditemukan di produksi ÷ seluruh cacat yang ditemukan untuk rilis itu | Satu-satunya yang diukur terhadap kenyataan, bukan terhadap suite Anda sendiri |
| Apakah kita menemukannya cukup awal? | **Di mana cacat ditemukan** — kebutuhan, build, pengujian, produksi | Ongkos sebuah cacat naik di setiap tahap yang berhasil ia lewati |
| Bisakah saya memercayai build yang merah? | **Flake rate** — pengujian yang lulus dan gagal pada commit yang sama | Di atas satu-dua persen, orang menjalankan ulang alih-alih menyelidiki, dan suite-nya berhenti menjadi oracle |
| Seberapa cepat kita tahu? | **Waktu umpan balik** — dari commit sampai hasil pengujian | Menggerakkan lebih banyak perilaku daripada angka kualitas mana pun di daftar ini |
| Apakah kita sedang menumpuk risiko? | **Terbuka vs tertutup per minggu**, dan **umur** cacat terbuka tertua | Kedatangan versus penutupan memberi tahu arahnya; satu hitungan tunggal tidak memberi tahu apa pun |
| Apakah perbaikannya sungguhan? | **Reopen rate** | Mengukur perbaikannya *sekaligus* verifikasi Anda |
| Apakah kita mencakup risiko yang kita sebutkan? | **Risiko tinggi dengan pengujian yang dieksekusi ÷ risiko tinggi** | Daftar risiko dari pelajaran perencanaan, dipakai sebagai penyebut |
| Ke mana saya harus melihat berikutnya? | **Cacat per area** | Mengirim waktu eksploratori ke tempat cacatnya sudah menggerombol |

**Escape rate adalah yang layak diperjuangkan.** Ia satu-satunya metrik di sini
yang membandingkan pekerjaan Anda dengan apa yang benar-benar ditemui pelanggan,
ia tidak bisa diperbaiki dengan menulis lebih banyak pengujian, dan
memperbaikinya sungguh-sungguh menuntut ditemukannya lebih banyak cacat nyata
sebelum rilis. Ia juga *tentang prosesnya, bukan tentang orangnya* — sebuah
escape adalah pertanyaan tentang cara tim bekerja, dan begitu ia menjadi
pentungan, ia menjadi teater seperti yang lain.

## Daftar teaternya

Angka-angka yang tampak seperti pengukuran padahal bukan:

- **Jumlah test case yang ditulis.** Sebuah inventaris, bukan pencapaian. Suite
  berisi 4.000 case biasanya lebih buruk daripada yang berisi 400 — lebih lambat,
  lebih banyak duplikasi, lebih kurang terawat. Melaporkannya sebagai
  pertumbuhan justru menghadiahi hal yang keliru.
- **Persentase yang terotomasi.** Mengotomasi pengujian yang mudah, stabil, dan
  bernilai rendah menggesernya paling cepat.
- **Test case yang dieksekusi sprint ini.** Menghadiahi case yang kecil-kecil.
- **Bug yang ditemukan per tester.** Metrik paling merusak di bidang ini. Ia
  membuat mengajukan laporan gaduh jadi masuk akal, membuat melaporkan cacat jadi
  terasa seperti tuduhan, dan diam-diam mengakhiri hubungan dengan developer yang
  selama ini membuat Anda efektif.

## Aturan penghitungan lebih penting daripada metriknya

Setiap angka di sini mati di definisinya, jadi tuliskan definisinya sekali:

- Apa yang terhitung **cacat**? Apakah yang ditolak tetap dihitung? Duplikat?
- Apa yang terhitung **lolos** (escaped)? Ditemukan pelanggan, atau ditemukan di
  produksi oleh siapa pun, termasuk Anda?
- Apa itu sebuah **rilis** — sebuah deploy, sebuah versi bertag, sebuah sprint?
- Kapan sebuah cacat **tertutup** — diperbaiki, diverifikasi, atau terkirim?

Lalu biarkan definisinya. Tren apa pun yang melintasi perubahan definisi yang
senyap adalah fiksi, dan godaan untuk menyesuaikan definisinya ketika angkanya
terlihat buruk adalah persis saat semuanya berhenti menjadi pengukuran.

Dua kebiasaan lagi: **tren di atas potret** — satu angka itu kebisingan, enam
titik itu cerita — dan **jangan pernah persentase tanpa penyebutnya.** Tim yang
menemukan tujuh cacat per sprint sebaiknya sama sekali tidak melaporkan
persentase; 2 dari 7 dan 3 dari 7 adalah 29% dan 43%, dan selisihnya satu cacat.

## Aturan satu layar

Dashboard bukan arsip. Lima atau enam angka, masing-masing dengan target dan
arah, masing-masing dianotasi di tempat sesuatu terjadi — sebuah rilis, perubahan
tim, environment baru — karena lonjakan tanpa anotasi akan dijelaskan oleh siapa
pun yang berbicara duluan.

Lalu terapkan uji kalimat pada setiap ubin: *"kalau ini berlipat dua, kita akan
___"*. Hapus apa pun yang tidak punya penutup.

## Di mana TestForge berperan

Riwayat run Anda sudah menyimpan sebagian besar hal ini. Lulus/gagal per run
sepanjang waktu adalah tempat flake rate tinggal — case yang sama, build yang
sama, dua hasil berbeda — dan jarak antara sebuah run mulai dan selesai adalah
waktu umpan balik Anda.

Untuk escape rate, tandai cacat yang ditemukan di produksi supaya bisa dihitung
terhadap sebuah rilis alih-alih dikira-kira. Untuk defect density, kelompokkan
per suite atau area; suite yang menghasilkan cacat terbanyak per case adalah
tempat sesi eksploratori berikutnya sebaiknya pergi.

Dan tahanlah keinginan menaruh jumlah case di dashboard. Itu angka yang tumbuh
sendiri dan tidak berarti apa pun, dan itulah yang menjadikannya paling menggoda
di seluruh produk.

Itulah latihannya di bawah: bangun tampilan satu layar untuk proyek sandbox Anda.
Pilih paling banyak lima angka, tulis pertanyaan yang dijawab masing-masing dan
keputusan yang akan digerakkannya, dan sanggupi mempertahankan penghapusan semua
selebihnya.

**Selanjutnya:** mengubah semua ini menjadi lima kalimat yang benar-benar
dibutuhkan seorang stakeholder — dan apa yang dikatakan ketika ada yang bertanya
apakah ini sudah siap dikirim.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Suite Anda melaporkan pass rate 98,3% untuk rilis ketiga berturut-turut, dan manajemen merasa puas. Kenapa angka itu bukti kualitas yang lemah?",
      choices: [
        {
          id: "a",
          text: "98,3% terlalu rendah — suite yang siap rilis seharusnya di 100%",
        },
        {
          id: "b",
          text: "Ia mengukur pengujian yang ditulis, bukan software-nya, dan ia bisa dinaikkan dengan menambah pengujian mudah atau menghapus yang labil",
        },
        {
          id: "c",
          text: "Pass rate hanya berarti untuk pengujian otomatis, bukan eksekusi manual",
        },
        {
          id: "d",
          text: "Ia sebuah potret, jadi seharusnya dilaporkan sebagai tren saja",
        },
      ],
      explanation:
        "Penyebutnya adalah suite Anda sendiri, jadi angkanya menggambarkan cakupan yang Anda pilih alih-alih keadaan produknya — suite yang cuma menyusuri happy path melaporkan pass rate tinggi untuk software yang rapuh. Lebih buruk lagi, tiga langkah yang tidak menyentuh kode produk sama-sama menaikkannya: tambah pengujian yang lulus, hapus yang labil, pecah pengujian yang gagal. Menuntut 100% membuat insentifnya lebih buruk, bukan lebih baik, karena jalan termurah ke sana adalah membuang pengujian yang terus gagal. Ia berperilaku identik untuk eksekusi manual. Dan memetakan angka yang menyesatkan sepanjang waktu memberi Anda tren yang menyesatkan, dan itulah sebabnya perbaikannya berupa metrik yang berbeda, bukan grafik yang berbeda.",
    },
    {
      id: "q2",
      stem: "Metrik mana yang paling sulit diperbaiki tanpa benar-benar memperbaiki cara tim menemukan cacat?",
      choices: [
        {
          id: "a",
          text: "Persentase test case yang terotomasi",
        },
        {
          id: "b",
          text: "Escape rate — cacat yang ditemukan di produksi sebagai bagian dari seluruh cacat yang ditemukan untuk rilis itu",
        },
        {
          id: "c",
          text: "Jumlah test case di suite regresi",
        },
        {
          id: "d",
          text: "Test case yang dieksekusi per sprint",
        },
      ],
      explanation:
        "Escape rate diukur terhadap apa yang benar-benar ditemui pelanggan, jadi penyebutnya tidak berada dalam kendali Anda seperti halnya sebuah suite — Anda tidak bisa memperbaikinya dengan menulis lebih banyak pengujian, hanya dengan menemukan cacat sungguhan lebih awal. Tiga yang lain bergerak semata-mata dengan usaha: mengotomasi pengujian stabil yang paling mudah menaikkan persentase otomasi paling cepat, jumlah suite tumbuh dengan menulis apa saja, dan case-yang-dieksekusi menghadiahi pengecilan case. Perlu dipasangkan dengan peringatan di pelajaran ini: escape rate adalah pertanyaan tentang prosesnya, dan ia berhenti berguna begitu ia diarahkan ke seseorang.",
    },
    {
      id: "q3",
      stem: "Anda punya satu layar untuk dashboard QA. Mana di antara ini yang layak mendapat tempat di sana?",
      choices: [
        {
          id: "a",
          text: "Escape rate per rilis, dengan aturan penghitungan untuk \"lolos\" yang dituliskan",
        },
        {
          id: "b",
          text: "Flake rate — pengujian yang lulus sekaligus gagal pada commit yang sama",
        },
        {
          id: "c",
          text: "Total test case yang ditulis, ditampilkan sebagai pertumbuhan sepanjang waktu",
        },
        {
          id: "d",
          text: "Median waktu dari commit sampai hasil pengujian",
        },
      ],
      explanation:
        "Escape rate menjawab apakah pelanggan sedang menemui cacat Anda, flake rate menjawab apakah build yang merah bisa dipercaya, dan waktu umpan balik menjawab seberapa cepat siapa pun mengetahuinya — masing-masing punya orang yang menanyakannya dan keputusan yang mengikuti ketika ia bergerak. Jumlah case gagal di ketiga ujinya: ia tumbuh sendiri, menghadiahi duplikasi, dan tidak ada yang berubah ketika ia berlipat dua kecuali slide-nya. Definisi yang dilekatkan pada escape rate juga bukan detail sepele — metrik yang aturan penghitungannya bisa bergeser adalah tren yang bisa diproduksi sesuai pesanan.",
    },
  ],
};
