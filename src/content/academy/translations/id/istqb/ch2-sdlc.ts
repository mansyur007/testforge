import type { LessonTranslation } from "../../../types";

export const ch2SdlcId: LessonTranslation = {
  slug: "ch2-sdlc",
  title: "Bab 2 — Pengujian sepanjang SDLC",
  summary:
    "Model pengembangan, test level, test type, dan maintenance testing.",
  body: `
## Berapa harga bab ini

Bab 2 menyumbang **6 dari 40 pertanyaan** di paket latihan kami, tersebar di 10
tujuan pembelajaran — dan seperti di bab 1, **setiap satunya K1 atau K2.** Tidak
ada di sini yang meminta Anda menerapkan sebuah teknik.

| Bagian | Tujuan | Yang diinginkannya |
|---|---|---|
| 2.1 Pengujian dalam konteks sebuah SDLC | 6 | Lifecycle, praktik baik, test-first, DevOps, shift left, retrospektif |
| 2.2 Test level dan test type | 3 | Lima level-nya, empat type-nya, confirmation versus regression |
| 2.3 Maintenance testing | 1 | Tiga pemicunya, dan apa yang menentukan cakupannya |

Perhatikan bentuknya: **§2.1 adalah 6 dari 10 tujuannya**, tapi §2.2 adalah
tempat sebagian besar orang kehilangan nilai, karena level-versus-type adalah
pasangan yang paling andal tertukar di seluruh silabusnya. Baca §2.1 untuk
pengenalan dan §2.2 untuk ketepatan.

## 2.1 Pengujian dalam konteks sebuah lifecycle

**Bagaimana lifecycle mengubah pengujian.** Model yang dipakai memengaruhi
*waktu* aktivitas pengujiannya, *tingkat kerincian* dokumentasi pengujiannya,
*teknik* yang dipilih, dan *seberapa jauh otomasinya*. Model sekuensial
(waterfall, model V) menaruh tiap level setelah tahap pengembangan yang
bersesuaian; model iteratif dan inkremental (Scrum, Kanban, spiral)
menjalankannya terus-menerus, dalam potongan yang lebih kecil, dan jauh lebih
mengandalkan otomasi regresi karena tanah yang sama dilewati ulang setiap
iterasi.

Pelajaran [SDLC dan STLC](/id/academy/fundamentals/sdlc-and-stlc) di Track 1
membahas model-modelnya sendiri. Yang diinginkan ujiannya adalah *konsekuensinya*
bagi pengujian.

**Praktik baik yang berlaku di setiap lifecycle** — daftar K1 yang layak
dikenali:

- setiap aktivitas pengembangan punya aktivitas pengujian yang bersesuaian
- tiap test level punya tujuan yang **khas bagi level itu**, sehingga hal yang
  sama tidak diuji tiga kali
- test analysis dan design untuk sebuah level dimulai **selama** aktivitas
  pengembangan yang bersesuaian, bukan setelahnya
- tester meninjau work product **segera setelah drafnya ada**

**Pendekatan test-first.** Ketiganya menulis pengujian sebelum kodenya; ujiannya
membedakan ketiganya lewat *siapa* dan *dalam bahasa apa*:

| | Ditulis dari | Dinyatakan sebagai | Kebanyakan di |
|---|---|---|---|
| **TDD** | Maksud developer atas kodenya | Unit test, lalu kode, lalu refactor | Tingkat komponen |
| **ATDD** | Acceptance criteria, disepakati dengan bisnisnya | Acceptance test | Tingkat fitur |
| **BDD** | Perilaku yang diinginkan, dalam bahasa bisnis | Skenario Given / When / Then | Tingkat fitur |

**DevOps.** Continuous integration dan delivery, build dan pengujian otomatis,
tanggung jawab bersama atas kualitas, dan umpan balik yang cepat. Manfaat dan
biayanya sama-sama bisa diujikan: umpan balik lebih cepat dan keyakinan lebih
tinggi pada pipeline-nya, berhadapan dengan usaha persiapan yang nyata,
infrastruktur tambahan, dan fakta bahwa **otomasi tidak menggantikan pengujian
eksploratori dan pengujian manual lainnya** — sebuah delivery pipeline hanya bisa
menjalankan pemeriksaan yang sudah dipikirkan seseorang.

**Shift left** berarti menguji lebih awal: meninjau kebutuhan, menulis pengujian
sebelum kodenya, analisis statis, dan menarik pengujian non-fungsional ke depan
alih-alih meninggalkannya sampai seminggu sebelum rilis. Peringatan jujur yang
dibuat silabusnya dan dilupakan para kandidat: **shift left bisa berbiaya lebih
besar di muka**, dan ia butuh dukungan manajemen alih-alih semangat seorang
tester.

**Retrospektif** adalah mekanisme perbaikan proses milik silabusnya. Diadakan di
akhir sebuah iterasi, milestone, atau proyek, manfaatnya adalah efektivitas dan
efisiensi pengujian yang meningkat, kualitas testware yang lebih baik, kualitas
test basis yang lebih baik, dan pembelajaran tim. Kalau sebuah pertanyaan
menanyakan di mana perbaikan proses pengujian tinggal di dalam lifecycle Agile,
inilah jawaban yang diinginkannya.

## 2.2 Test level dan test type

**Lima level-nya**, dibedakan oleh objek uji, tujuan, test basis, jenis cacat
yang ditemukannya, dan siapa yang bertanggung jawab:

| Level | Objek | Biasanya menemukan |
|---|---|---|
| **Component** (unit) | Satu komponen tunggal secara terpisah | Kesalahan logika di komponen itu |
| **Component integration** | Antarmuka antarkomponen | Data yang salah diteruskan, ketidakcocokan antarmuka |
| **System** | Perilaku sistem secara keseluruhan | Kebutuhan yang tidak terpenuhi, cacat alur ujung ke ujung |
| **System integration** | Antarmuka dengan sistem dan layanan lain | Cacat antarmuka dan interoperabilitas |
| **Acceptance** | Kelayakan untuk tujuannya, kesiapan di-deploy | Apakah ia melakukan apa yang benar-benar dibutuhkan pengguna |

**Acceptance testing punya beberapa bentuk**, dan semuanya layak dikenali
namanya: user acceptance testing, operational acceptance testing (backup,
restore, keamanan, pemulihan bencana), acceptance kontraktual dan regulasi, serta
**alpha dan beta testing** — alpha di lokasi organisasi pengembangnya, beta di
lokasi pelanggannya.

**Empat test type-nya:**

| Type | Menanyakan |
|---|---|
| **Fungsional** | *Apa* yang dilakukannya? |
| **Non-fungsional** | *Seberapa baik* ia melakukannya? |
| **Black-box** | Perilaku yang diturunkan dari sebuah spesifikasi, tanpa memandang isi dalamnya |
| **White-box** | Diturunkan dari struktur internalnya |

**Jebakannya, dan ini yang terbesar di bab ini: setiap type bisa diterapkan di
setiap level.** Pengujian performa di tingkat komponen itu normal. Teknik
black-box di tingkat komponen itu normal. Pertanyaan yang menawarkan "pengujian
non-fungsional dilakukan hanya di tingkat sistem" sedang menawarkan pernyataan
yang keliru kepada Anda.

Jebakan kedua adalah level versus type secara umum:

> Sebuah **level** adalah kelompok aktivitas pengujian yang ditata di sekitar
> sebuah **objek uji** — ia menjawab *kapan* dan *pada apa*. Sebuah **type**
> mengelompokkan aktivitas di sekitar sebuah **karakteristik kualitas atau
> pendekatan** — ia menjawab *apa yang sedang dievaluasi*.

Pelajaran [test level](/id/academy/fundamentals/test-levels) dan
[test type](/id/academy/fundamentals/test-types) di Track 1 mengajarkan keduanya;
ujiannya menguji apakah Anda tidak pernah mencampur kedua katanya.

**Confirmation versus regression** — keduanya pengujian *terkait perubahan*:

- **Confirmation testing** mengeksekusi ulang apa yang gagal, untuk memeriksa
  bahwa perbaikannya bekerja.
- **Regression testing** memeriksa bahwa perubahannya tidak merusak sesuatu yang
  tadinya bekerja, di tempat lain.

Suite regresi bertambah besar, sering dijalankan, dan jarang berubah — dan persis
itulah profil yang menjadikannya kandidat terkuat untuk otomasi.

## 2.3 Maintenance testing

Satu tujuan pembelajaran, dan andal menghasilkan satu pertanyaan. **Tiga
pemicu:**

| Pemicu | Contoh |
|---|---|
| **Modifikasi** | Peningkatan, perubahan korektif, peningkatan environment, patch, hot fix |
| **Migrasi** | Pindah ke platform lain; konversi data, plus pengujian operasional environment barunya |
| **Pemensiunan** | Pengarsipan data, dan menguji prosedur **restore dan pengambilan**-nya |

Pemensiunan adalah yang dilupakan orang, dan ia yang muncul di sebuah pertanyaan:
menonaktifkan sebuah sistem tetap butuh pengujian, karena data yang diarsipkan
harus bisa dibaca sesudahnya.

**Cakupannya bergantung pada** risiko perubahannya, ukuran sistem yang sudah ada,
dan ukuran perubahannya. **Impact analysis** adalah yang mengidentifikasi area
yang terdampak dan karenanya seberapa banyak pengujian regresi yang layak
diterima perubahannya — dan silabusnya jelas bahwa impact analysis bisa sulit
ketika spesifikasinya sudah usang atau tidak ada.

## Perbedaan yang menentukan nilai

| Pasangan yang tertukar | Garis pemisahnya |
|---|---|
| Test level / test type | Objek dan waktunya / apa yang sedang dievaluasi |
| "Type itu milik level" | Type apa pun bisa diterapkan di level mana pun |
| Confirmation / regression | Apakah perbaikannya bekerja / apakah perbaikannya merusak hal lain |
| Component integration / system integration | Antarkomponen kita / antarsistem |
| Alpha / beta | Di lokasi pengembangnya / di lokasi pelanggannya |
| TDD / ATDD / BDD | Tingkat unit dan digerakkan developer / dari acceptance criteria / dalam skenario yang terbaca bisnis |
| Shift left sebagai gratis / shift left sebagai investasi | Ia berbiaya usaha di muka dan butuh dukungan |
| Pemicu maintenance | Modifikasi, migrasi, **dan pemensiunan** |

## Latih dengan drill

Delapan pertanyaan, tanpa batas waktu, setiap jawabannya dijelaskan. Simulator
ujiannya berbahasa Inggris; jalurnya
\`/academy/istqb/practice-exam/chapter/2\`.

Kalau Anda melewatkan satu, periksa apakah kekeliruannya berupa sebuah fakta atau
sebuah *kata* — di bab ini nyaris selalu katanya.

**Selanjutnya:** Bab 3 — pengujian statis, dan cacat yang bisa Anda temukan
sebelum apa pun berjalan.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Pernyataan mana tentang test level dan test type yang benar?",
      choices: [
        {
          id: "a",
          text: "Pengujian non-fungsional dilakukan hanya di tingkat sistem dan acceptance",
        },
        {
          id: "b",
          text: "Test type apa pun bisa diterapkan di test level mana pun — pengujian fungsional, non-fungsional, black-box, dan white-box semuanya bisa dijalankan di tingkat komponen maupun tingkat sistem",
        },
        {
          id: "c",
          text: "Pengujian white-box adalah sebuah test level, dan pengujian komponen adalah sebuah test type",
        },
        {
          id: "d",
          text: "Tiap test level terkait dengan tepat satu test type",
        },
      ],
      explanation:
        "Level dan type adalah dimensi yang saling bebas: sebuah level adalah kelompok aktivitas yang ditata di sekitar sebuah objek uji, dan sebuah type mengelompokkan aktivitas menurut apa yang sedang dievaluasi. Menguji performa satu komponen dan menjalankan pengujian white-box di tingkat sistem sama-sama sepenuhnya normal, dan itulah sebabnya 'non-fungsional berarti tingkat sistem' adalah pengecoh yang menjegal orang. Pilihan c dan d membalik atau melebur kedua katanya, dan ujiannya mengandalkan kandidat yang memakai keduanya secara longgar.",
    },
    {
      id: "q2",
      stem: "Sebuah cacat sudah diperbaiki. Timnya menjalankan ulang pengujian yang semula gagal, lalu menjalankan suite yang lebih luas yang mencakup fitur di sekitarnya. Apa kedua aktivitas itu?",
      choices: [
        {
          id: "a",
          text: "Confirmation testing, lalu regression testing",
        },
        {
          id: "b",
          text: "Regression testing, lalu confirmation testing",
        },
        {
          id: "c",
          text: "Maintenance testing, lalu system testing",
        },
        {
          id: "d",
          text: "Retesting, lalu acceptance testing",
        },
      ],
      explanation:
        "Confirmation testing mengeksekusi ulang pengujian yang menyingkap cacatnya, untuk menetapkan bahwa perbaikannya bekerja. Regression testing lalu memeriksa bahwa perubahannya tidak merusak sesuatu di tempat lain yang sebelumnya bekerja. Keduanya pengujian terkait perubahan dan urutan di pertanyaannya adalah urutan yang lazim. Suite regresi adalah kandidat otomasi klasik justru karena ia besar, sering diulang, dan berubah dengan lambat.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang merupakan pemicu maintenance testing?",
      choices: [
        {
          id: "a",
          text: "Sebuah patch sistem operasi yang diterapkan ke environment produksi",
        },
        {
          id: "b",
          text: "Memigrasikan aplikasinya ke platform baru, termasuk mengonversi datanya",
        },
        {
          id: "c",
          text: "Memensiunkan sistemnya, di mana data yang diarsipkan harus tetap bisa diambil",
        },
        {
          id: "d",
          text: "Menulis acceptance criteria untuk fitur yang belum dibangun",
        },
      ],
      explanation:
        "Ketiga pemicunya adalah modifikasi (peningkatan, perubahan korektif, peningkatan environment, dan patch), migrasi (pindah platform, konversi data, plus pengujian operasional environment barunya), dan pemensiunan (pengarsipan, dan menguji bahwa restore serta pengambilannya masih bekerja). Pemensiunan adalah yang dilupakan para kandidat, dan ia favorit karena menonaktifkan sesuatu secara intuitif terdengar seperti akhir pengujian alih-alih sebagai alasan untuk mengujinya. Menulis acceptance criteria untuk pekerjaan yang belum dibangun adalah aktivitas test-first di sisi pengembangan, bukan maintenance.",
    },
  ],
};
