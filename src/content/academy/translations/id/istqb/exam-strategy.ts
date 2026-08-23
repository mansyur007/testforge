import type { LessonTranslation } from "../../../types";

export const examStrategyId: LessonTranslation = {
  slug: "exam-strategy",
  title: "Strategi ujian",
  summary:
    "Pengaturan waktu, tingkat K, cara kerja gaya pertanyaannya, dan apa yang dilakukan dengan sepuluh menit terakhir.",
  body: `
## Apa yang sedang Anda jalani

Ujian Foundation Level adalah **40 pertanyaan dalam 60 menit**, dan nilai
kelulusannya **65% — 26 dari 40**. Kalau Anda tidak menjalaninya dalam bahasa ibu
Anda, Anda berhak atas **15 menit tambahan**, yang ditawarkan sebagai sebuah
kotak centang saat Anda memulai paket latihan kami.

**Paket latihan kami dibangun mengikuti struktur ujian yang diterbitkan**, dan
Anda bisa merencanakan berdasarkan bentuknya. Jumlah pertanyaan, durasi,
kelonggaran waktu tambahan, nilai kelulusan, dan pembagian per babnya semuanya
cocok dengan struktur yang diterbitkan ISTQB untuk CTFL v4.0:

| Bab | Topik | Pertanyaan | K1 | K2 | K3 |
|---:|---|---:|---:|---:|---:|
| 1 | Dasar-dasar Pengujian | 8 | 2 | 6 | 0 |
| 2 | Pengujian Sepanjang SDLC | 6 | 2 | 4 | 0 |
| 3 | Pengujian Statis | 4 | 2 | 2 | 0 |
| 4 | Test Analysis dan Design | 11 | 0 | 6 | 5 |
| 5 | Mengelola Aktivitas Pengujian | 9 | 1 | 5 | 3 |
| 6 | Alat Pengujian | 2 | 1 | 1 | 0 |
| | **Total** | **40** | **8** | **24** | **8** |

Baca tabel itu sekali sebelum Anda mengulang belajar, karena ia memberi harga
pada usaha Anda. Satu kejujuran tentangnya: **penarikan kami cocok dengan jumlah
pertanyaannya, bukan dengan kolom tingkat K-nya** — kami menarik jumlah
pertanyaan yang tepat per bab, dan kami belum menjamin bahwa tepat lima dari
sebelas pertanyaan bab 4 itu K3. Pakai kolom K-nya untuk merencanakan pengulangan
belajar Anda, dan jumlah per babnya untuk memperkirakan paket kami.

## Aritmetika waktunya, dan kenapa laju seragam itu keliru

Enam puluh menit dibagi empat puluh pertanyaan berarti **90 detik masing-masing**.
Tidak ada yang seharusnya benar-benar berlaju begitu, karena pertanyaannya tidak
sama besarnya:

| Jenis pertanyaan | Waktu realistis | Kenapa |
|---|---|---|
| **K1 mengingat** | 20–30 detik | Anda tahu atau tidak; memelototinya tidak membantu |
| **K2 menjelaskan atau membandingkan** | 60–90 detik | Baca stem-nya dengan cermat, eliminasi, putuskan |
| **K3 menerapkan** | 2–3 menit | Anda harus benar-benar mengerjakan sesuatu |

Jadi rencananya: **tabung waktu di pertanyaan mengingat lalu belanjakan di
pertanyaan K3.** Putaran pertama yang menjawab segala yang Anda ketahui dengan
cepat semestinya menyisakan lima belas sampai dua puluh menit untuk segelintir
yang butuh kerja sungguhan.

**Di mana pertanyaan yang lambat tinggal** bisa diketahui di depan, dan tabel di
atas memberi harganya dengan tepat. Setiap tujuan pembelajaran K3 di silabusnya
duduk di **bab 4** (empat teknik black-box dan ATDD) dan **bab 5** (estimasi,
pemrioritasan, defect report) — dan struktur yang diterbitkan sepakat: kedelapan
pertanyaan K3-nya ada di kedua bab itu, lima dan tiga, dan setiap bab lainnya
bebas K3. Kedua bab itu juga 20 dari 40 pertanyaannya, jadi **separuh kertasnya
adalah dua bab yang memuat seluruh perhitungannya**, dan separuh lainnya hampir
seluruhnya pengenalan.

Gabungkan kedua fakta itu dan aritmetikanya menutup: delapan pertanyaan K3 pada
dua sampai tiga menit kira-kira dua puluh menit, dan itu menyisakan empat puluh
untuk tiga puluh dua sisanya. **Itulah seluruh rencana lajunya** — ketiga puluh
dua sisanya rata-rata 75 detik, dan dua puluh empat pertanyaan K2-nya yang
sebenarnya memakannya, karena delapan pertanyaan K1 berbiaya sekitar empat menit
untuk keseluruhannya.

## Gaya pertanyaannya, dan bagaimana masing-masing patah

**Satu jawaban terbaik.** Empat pilihan, satu benar. Eliminasi dua dengan cepat,
lalu putuskan di antara yang bertahan. Kalau kedua yang bertahan sama-sama tampak
benar, stem-nya memuat sebuah pembatas yang Anda baca sekilas.

**Respons ganda** — "pilih dua" atau "pilih semua yang berlaku". **Di paket
latihan kami, ini dinilai sebagai himpunan yang persis: setiap pilihan yang benar
dan tidak satu pun yang keliru, tanpa nilai sebagian.** Memilih satu dari dua
jawaban yang benar bernilai sama dengan tidak memilih apa pun. Jadi kalau stem-nya
berkata *pilih dua*, pilihlah tepat dua.

**Pertanyaan skenario.** Satu paragraf situasi, lalu sebuah pertanyaan. **Baca
kalimat terakhirnya lebih dulu**, baru skenarionya — Anda akan membacanya sambil
mencari sesuatu alih-alih berusaha mengingat semuanya.

**Pertanyaan negatif** — "yang mana yang BUKAN", "yang mana yang paling kecil
kemungkinannya". Ini menjegal orang yang membaca cepat lalu menjawab versi
positifnya. Ketika Anda melihat stem yang negatif, tandai di kepala Anda dan
periksa jawaban Anda terhadap stem-nya sekali lagi sebelum beranjak.

**Pertanyaan "terbaik" atau "paling".** Lebih dari satu pilihan bisa
dipertahankan; Anda sedang diminta mengurutkan. Ini biasanya pertanyaan K2 tentang
sebuah perbedaan — jawaban "terbaik"-nya biasanya yang menyebutkan mekanismenya
yang sebenarnya alih-alih pernyataan yang benar tapi umum.

## Kata-kata yang menentukan jawaban

Di dalam pilihannya, kata mutlak biasanya keliru:

> **selalu · tidak pernah · hanya · semua · harus · menjamin · menghapus ·
> membuktikan**

Pengujian adalah disiplin yang dibangun di atas "tergantung" dan "menurunkan
peluang", jadi pilihan yang menjanjikan kepastian biasanya pengecohnya.
Bandingkan:

- *"Cakupan branch 100% **menjamin** cakupan statement 100%"* — benar, dan salah
  satu dari sangat sedikit jaminan di silabusnya.
- *"Pengujian yang lulus **membuktikan** perangkat lunaknya tidak punya cacat"* —
  keliru, dan itu prinsip 1 yang ditulis ulang sebagai jebakan.

Kebalikannya juga layak diketahui: **pilihan yang berhati-hati lebih sering
bertahan.** "Biasanya", "umumnya", "bisa", "mungkin" menggambarkan cara silabusnya
benar-benar berbicara.

## Di dalam ruangan

**Putaran pertama — jawab apa yang Anda ketahui.** Jangan menandai sesuatu karena
ia terasa sulit; tandai yang sudah Anda persempit ke dua pilihan dan butuh satu
menit lagi. Pertanyaan bertanda yang sama sekali belum Anda jawab adalah
pertanyaan yang mungkin kehabisan waktu untuk Anda datangi kembali, jadi **selalu
tinggalkan sebuah jawaban**, bahkan sebuah tebakan.

**Tidak ada pengurangan nilai di paket latihan kami** — jawaban yang keliru dan
jawaban yang kosong sama-sama bernilai nol. Menebak jelas lebih baik daripada
meninggalkan sesuatu kosong. Dengan empat pilihan dan dua sudah dieliminasi,
sebuah tebakan adalah lemparan koin, dan lemparan koin bernilai setengah angka
secara rata-rata.

**Putaran kedua — yang bertanda**, dengan urutan yang ditunjukkan navigatornya.

**Sepuluh menit terakhir**, dan dengan urutan ini:

1. **Setiap pertanyaan yang belum terjawab mendapat sebuah jawaban.** Ini tidak
   opsional dan ia datang lebih dulu, karena hanya bagian inilah dari sepuluh
   menit terakhir yang masih bisa memberi Anda nilai dari ketiadaan.
2. **Baca ulang pertanyaan berstem negatif** yang Anda ingat sudah Anda tandai.
   Di situlah nilai yang hilang karena kecerobohan dipulihkan.
3. **Biarkan semua selebihnya.** Menebak ulang secara borongan lebih banyak
   menghilangkan nilai daripada menambah; ubah sebuah jawaban hanya ketika Anda
   bisa menyatakan *kenapa* yang pertama keliru — sebuah aturan yang salah Anda
   ingat, sebuah pembatas yang Anda lewatkan — bukan karena ia terasa mengganjal.

Perhatikan dua peringatan yang diberikan runner-nya pada sepuluh menit dan pada
dua menit. Kertasnya terkirim otomatis di angka nol, jadi apa pun yang belum
terjawab pada saat itu tetap tak terjawab.

## Bersiap, di minggu sebelumnya

1. **Latih bab demi bab.** Kerjakan tiap kuis bab sampai Anda konsisten di 6 dari
   8 atau lebih baik. Bab 4 dan 5 adalah yang layak Anda investasikan berlebih —
   keduanya bersama-sama adalah separuh kertasnya.
2. **Setelah itu jalani satu paket penuh berbatas waktu**, dalam kondisi
   sungguhan: satu kali duduk, tanpa catatan, dengan jam berjalan.
3. **Baca rincian per bab di halaman hasilnya**, yang ada persis untuk ini. Nilai
   60% keseluruhan yang menyembunyikan 2 dari 11 di bab 4 adalah masalah yang
   berbeda dari 60% yang tersebar merata, dan ia memberi tahu Anda persis apa yang
   harus diulang.
4. **Baca ulang penjelasan setiap pertanyaan yang Anda lewatkan**, termasuk yang
   kebetulan Anda tebak dengan benar — tebakan yang beruntung adalah tujuan
   pembelajaran yang belum dipelajari yang memakai jawaban benar sebagai
   pakaiannya.
5. **Jalani paket kedua.** Benih yang berbeda menarik kumpulan yang berbeda, jadi
   nilainya berarti sesuatu.

Simulator ujiannya berbahasa Inggris; jalur paket latihan lengkapnya
\`/academy/istqb/practice-exam\`.

## Malam sebelumnya, dan pagi harinya

Jangan hal baru. Baca ulang catatan Anda sendiri tentang perbedaan-perbedaannya —
tabel di akhir tiap pelajaran bab dibangun persis untuk putaran ini — lalu tidur.
Pertanyaan K3 yang dijawab otak yang lelah adalah kekeliruan termahal yang
tersedia, karena justru itulah pertanyaan yang punya satu jawaban benar tanpa
kerancuan.

Bawa identitas berfoto kalau Anda menjalani ujian yang diawasi, dan periksa
persyaratan platformnya sehari sebelumnya alih-alih sejam sebelumnya.

## Anda telah menyelesaikan track ini

Lima track: apa yang dikerjakan QA, pengujian manual yang profesional, otomasi,
materi senior, dan yang ini. Apa pun yang akhirnya tertulis di sertifikatnya,
bagian yang berguna tidak pernah sertifikatnya — melainkan belajar menyatakan
dengan tepat apa yang Anda uji, apa yang tidak, dan kenapa.

Semoga berhasil. Lalu pergilah dan uji sesuatu yang nyata.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Dengan sepuluh menit tersisa Anda punya tiga pertanyaan yang belum terjawab dan empat pertanyaan bertanda yang sudah Anda jawab tapi Anda ragukan. Apa yang Anda kerjakan lebih dulu?",
      choices: [
        {
          id: "a",
          text: "Jawab ketiga pertanyaan yang belum terjawab, menebak kalau perlu, sebelum menengok apa pun",
        },
        {
          id: "b",
          text: "Tengok keempat pertanyaan bertanda itu, karena perubahan yang dipertimbangkan lebih bernilai daripada tebakan",
        },
        {
          id: "c",
          text: "Baca ulang seluruh kertasnya dari awal untuk memeriksa stem yang salah dibaca",
        },
        {
          id: "d",
          text: "Biarkan yang belum terjawab tetap kosong, karena jawaban yang keliru tampak lebih buruk daripada tanpa jawaban",
        },
      ],
      explanation:
        "Kosong bernilai nol dan jawaban yang keliru juga — tidak ada pengurangan nilai di paket latihan ini — jadi pertanyaan yang belum terjawab adalah satu-satunya tempat menebak mengubah ketiadaan menjadi harapan setengah angka begitu Anda mengeliminasi dua pilihan. Menengok jawaban bertanda datang kedua karena semuanya sudah punya nilai tersimpan. Membaca ulang seluruh kertasnya dalam sepuluh menit tidak tercapai dan justru mengundang penebakan ulang borongan yang lebih banyak menghilangkan daripada menambah. Pilihan d menyatakan aturan penilaian yang tidak ada di sini.",
    },
    {
      id: "q2",
      stem: "Kenapa laju seragam 90 detik per pertanyaan adalah rencana yang buruk?",
      choices: [
        {
          id: "a",
          text: "Karena pertanyaannya berbeda-beda ongkosnya — K1 mengingat memakan setengah menit sementara K3 menerapkan memakan dua sampai tiga, jadi waktunya sebaiknya ditabung di yang cepat dan dibelanjakan di yang lambat",
        },
        {
          id: "b",
          text: "Karena ujiannya sebenarnya tidak berbatas waktu dalam praktiknya",
        },
        {
          id: "c",
          text: "Karena pertanyaannya harus dijawab dengan urutan yang disajikan",
        },
        {
          id: "d",
          text: "Karena pertanyaan tersulit selalu muncul di akhir kertasnya",
        },
      ],
      explanation:
        "Sembilan puluh detik hanyalah rata-ratanya. Pertanyaan mengingat dijawab dalam dua puluh detik atau tidak sama sekali — memelototinya lebih lama tidak menghasilkan faktanya — sementara pertanyaan K3 menuntut penurunan nilai, penghitungan aturan, atau perhitungan sebuah estimasi, dan terburu-buru mengerjakannya adalah cara nilai yang sebenarnya bisa diraih justru hilang. Setiap tujuan pembelajaran K3 di silabusnya duduk di bab 4 dan 5, jadi Anda bisa memperkirakan kira-kira di mana pertanyaan yang lambat akan berada. Kertasnya sungguh berbatas waktu dan terkirim otomatis, pertanyaannya bisa dijawab dengan urutan apa pun memakai navigatornya, dan tingkat kesulitannya tidak diurutkan.",
    },
    {
      id: "q3",
      stem: "Sebuah pilihan di dalam pertanyaan pilihan ganda berbunyi: \"Analisis statis menghapus kebutuhan akan pengujian dinamis.\" Apa yang seharusnya ditandakan ini?",
      choices: [
        {
          id: "a",
          text: "Ia kemungkinan pengecoh — kata mutlak seperti 'menghapus', 'selalu', dan 'membuktikan' jarang bertahan di disiplin yang dibangun di atas penurunan peluang",
        },
        {
          id: "b",
          text: "Ia kemungkinan benar, karena pengujian statis menemukan cacat lebih awal dan lebih murah",
        },
        {
          id: "c",
          text: "Ia tidak bisa dinilai tanpa mengetahui konteks proyeknya yang spesifik",
        },
        {
          id: "d",
          text: "Ia benar hanya untuk sistem kritis-keselamatan",
        },
      ],
      explanation:
        "Klaim mutlak adalah pertanda yang paling andal di kertasnya: pengujian menurunkan risiko, meningkatkan keyakinan, dan menemukan sebagian dari apa yang ada, jadi pilihan yang menjanjikan penghapusan, jaminan, atau pembuktian hampir selalu keliru. Yang ini juga keliru secara substansi — pengujian statis dan dinamis menemukan kelas cacat yang berbeda, dan itu poin utama bab 3, jadi tidak ada yang menghapus kebutuhan akan yang lain. Kekecualian langkanya adalah jaminan yang sungguhan di silabusnya, misalnya cakupan branch 100% yang menyiratkan cakupan statement 100%, dan Anda mengenalinya satu per satu.",
    },
  ],
};
