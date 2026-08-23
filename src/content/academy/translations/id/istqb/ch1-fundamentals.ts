import type { LessonTranslation } from "../../../types";

// The chapter-quiz and practice-exam routes are English-only (`/academy/istqb/
// practice-exam/**`), and A-08 built no `/id` equivalent of the exam simulator.
// These lessons originally rendered the pointer as an unclickable code span,
// because rule (3) of `academy-i18n-check` forbids linking `/academy/...` from
// an Indonesian file and a `/id` link would 404. DECISION-1 of the 2026-08-23
// audit settled it the other way: the readers being told to go and drill were
// the only ones who could not click through, so the check now carries an
// explicit exception (10) for this one destination — conditional on the
// sentence still saying the simulator is in English. Same treatment in every
// chapter lesson of this track; do not link any other English route from here.
export const ch1FundamentalsId: LessonTranslation = {
  slug: "ch1-fundamentals",
  title: "Bab 1 — Dasar-dasar pengujian",
  summary:
    "Apa itu pengujian, kenapa ia dibutuhkan, tujuh prinsipnya, proses pengujiannya, dan pola pikir seorang tester.",
  body: `
## Cara membaca track ini

Ini bukan kursus pengujian yang pertama — Track 1 yang itu. Ini **persiapan
ujian**: materi yang sama ditata dengan cara pertanyaan di kertas ujiannya, dengan
perbedaan-perbedaan yang menentukan nilai ditarik ke depan.

Bab 1 menyumbang **8 dari 40 pertanyaan** di paket latihan kami, dan itu
menjadikannya bab terberat ketiga, sekaligus yang paling murah untuk dipanen
nilainya. Setiap tujuan pembelajaran di sini adalah **K1 (mengingat) atau K2
(menjelaskan, membandingkan, menggolongkan)** — **tidak ada K3 di bab ini**, jadi
tidak ada pertanyaan yang bisa menuntut Anda menerapkan sebuah teknik atau
menghitung apa pun. Kalau Anda mendapati diri sedang menghitung, Anda salah baca
pertanyaannya.

Bab ini punya 14 tujuan pembelajaran di lima bagian:

| Bagian | Tujuan | Yang diinginkannya |
|---|---|---|
| 1.1 Apa itu pengujian | 2 | Tujuan pengujian; pengujian versus debugging |
| 1.2 Kenapa ia perlu | 3 | Sumbangan pada keberhasilan; pengujian versus QA; error → defect → failure |
| 1.3 Prinsip pengujian | 1 | Ketujuhnya, dan apa yang diizinkan masing-masing |
| 1.4 Aktivitas, testware, peran | 5 | Aktivitasnya, konteks, testware, ketertelusuran, peran |
| 1.5 Keahlian dan praktik | 3 | Keahlian tester; pendekatan seluruh tim; independensi |

Bagian 1.4 adalah lebih dari sepertiga babnya. Bobotkan pengulangan belajar Anda
sesuai itu.

## 1.1 Apa itu pengujian

**Pengujian lebih dari sekadar menjalankan pengujian.** Ia mencakup merencanakan,
menganalisis, merancang, melaporkan, dan mengevaluasi — dan ia mencakup kerja
**statis** (meninjau sebuah dokumen) sebagaimana kerja **dinamis** (mengeksekusi
perangkat lunak). Pertanyaan yang mendefinisikan pengujian sebagai "mengeksekusi
perangkat lunak untuk menemukan cacat" sedang menawarkan pengecoh kepada Anda.

**Tujuan khas pengujian** — daftar yang layak bisa Anda kenali:

- mengevaluasi work product: kebutuhan, desain, kode, user story
- menyebabkan kegagalan dan menemukan cacat
- memastikan cakupan yang dibutuhkan atas sebuah objek uji
- menurunkan tingkat risiko kualitas yang tidak memadai
- **verifikasi** bahwa kebutuhan yang ditetapkan sudah terpenuhi
- **validasi** bahwa objeknya bekerja sebagaimana harapan pengguna dan layak
  untuk tujuannya
- membangun keyakinan, dan menyediakan informasi untuk pengambilan keputusan
- memenuhi kebutuhan atau standar kontraktual, hukum, atau regulasi

Verifikasi dan validasi adalah favorit tetap ujian: **verifikasi menanyakan
apakah ia dibangun dengan benar, validasi menanyakan apakah yang dibangun adalah
hal yang benar.** Sebuah produk bisa memenuhi setiap kebutuhan dan tetap gagal
validasi.

**Pengujian versus debugging.** Aktivitas berbeda dengan pemilik berbeda:

| | Pengujian | Debugging |
|---|---|---|
| Menemukan | Sebuah failure | Penyebab failure-nya |
| Lalu | Melaporkannya | Mereproduksi, mendiagnosis, memperbaiki |
| Setelah perbaikannya | **Confirmation testing** memeriksanya | — |

Dua nuansa yang disukai kertas ujiannya. Pengujian statis bisa menemukan sebuah
**cacat secara langsung**, tanpa failure apa pun terlibat, jadi tidak ada yang
perlu direproduksi — yang tersisa cuma perbaikannya. Dan dalam suasana seluruh
tim, seorang tester bisa saja ikut membantu debugging; itu tidak menjadikan
debugging sebagai aktivitas pengujian.

## 1.2 Kenapa pengujian dibutuhkan

**Bagaimana ia menyumbang pada keberhasilan.** Pengujian menurunkan risiko
kegagalan saat operasi, adalah cara yang hemat biaya untuk menemukan cacat,
membantu memenuhi kewajiban kontraktual atau regulasi, dan — bagian yang
dilupakan orang — **mencegah** cacat ketika tester dilibatkan sejak awal, karena
meninjau sebuah kebutuhan menyingkirkan cacat sebelum ada kode yang membawanya.

**Pengujian bukan quality assurance.** Perbedaan ini diujikan lebih sering
daripada yang disiratkan ukurannya:

| | Fokus | Sifat |
|---|---|---|
| **Quality assurance** | **Prosesnya** — apakah proses yang baik sedang diikuti? | Preventif |
| **Quality control** | **Produknya** — apakah yang kita bangun memenuhi standarnya? | Korektif |
| **Pengujian** | Salah satu bentuk utama quality control | Korektif |

Memperbaiki sebuah cacat memperbaiki produknya; mengubah cara kebutuhan ditinjau
sehingga kelas cacat itu berhenti berdatangan adalah QA.

**Error, defect, failure, root cause.** Rantai sebab-akibatnya, dan dua
kekecualian yang memikul sebagian besar nilainya:

1. Seseorang membuat **error** (sebuah kekeliruan).
2. Error itu menghasilkan **defect** di sebuah work product (sebuah kesalahan di
   kode, di dokumen, di desain).
3. Kalau kode yang cacat itu dieksekusi pada kondisi yang tepat, terjadilah
   **failure** — perilaku keliru yang bisa diamati.
4. **Root cause** adalah asal-usul error-nya: alasan kekeliruan itu dibuat, dan
   hal yang seharusnya dituju sebuah perbaikan proses.

- **Tidak setiap defect menyebabkan failure.** Kode yang tidak pernah dieksekusi,
  atau yang hanya dieksekusi pada kondisi yang tidak pernah muncul, menyembunyikan
  cacatnya tanpa batas waktu.
- **Tidak setiap failure disebabkan defect.** Kondisi lingkungan — radiasi,
  gangguan elektromagnetik, polusi — bisa mengubah eksekusi tanpa ada yang membuat
  kekeliruan.

Kalau sebuah pertanyaan menanyakan apa yang *menyebabkan* sebuah failure lalu
menawarkan baik "sebuah defect di kodenya" maupun "sebuah error yang dibuat
developer", bacalah dengan cermat: error-nya menyebabkan defect-nya, defect-nya
menyebabkan failure-nya.

## 1.3 Tujuh prinsipnya

Satu tujuan pembelajaran, tapi ia andal menghasilkan satu sampai dua pertanyaan.
Pelajaran [tujuh prinsip](/id/academy/fundamentals/seven-principles) di Track 1
mengajarkannya; di sini yang disajikan adalah *untuk apa* masing-masing, karena
kertas ujiannya menguji konsekuensinya alih-alih namanya:

1. **Pengujian menunjukkan adanya cacat, bukan ketiadaannya.** Pengujian yang
   lulus tidak pernah membuktikan kebenaran. Pengujian menurunkan peluang adanya
   cacat yang belum ditemukan; ia tidak bisa membawanya ke nol.
2. **Pengujian menyeluruh itu mustahil.** Kecuali untuk kasus yang benar-benar
   sepele, Anda tidak bisa menguji setiap input dan kombinasinya — dan *karena
   itulah* teknik, pemrioritasan, dan risiko ada. Prinsip inilah yang
   mengizinkan sisa silabusnya.
3. **Pengujian dini menghemat waktu dan uang.** Pengujian statis dan dinamis yang
   dimulai lebih awal menemukan cacat selagi ia masih murah; inilah argumen
   shift-left.
4. **Cacat menggerombol bersama.** Sejumlah kecil modul biasanya memuat sebagian
   besar cacatnya, dan itulah yang membuat masuk akal memusatkan usaha di tempat
   cacat sudah ditemukan.
5. **Pengujian menjadi aus.** Mengulang pengujian yang sama berhenti menemukan
   cacat baru — prinsip yang dulu dikenal sebagai paradoks pestisida.
   Tanggapannya adalah merevisi dan menambah pengujian, bukan meninggalkan
   pengujian regresi.
6. **Pengujian bergantung konteks.** Tidak ada pendekatan yang benar secara
   universal; sistem kritis-keselamatan dan alat pelaporan internal tidak diuji
   dengan cara yang sama.
7. **Kekeliruan berpikir tentang ketiadaan cacat.** Menemukan dan memperbaiki
   banyak cacat tidak menjamin keberhasilan — sistem yang memenuhi setiap
   kebutuhan tetap bisa tidak bisa dipakai, atau justru sistem yang keliru. Ini
   prinsip 1 dan validasi saling bertemu.

Prinsip 4 dan 5 adalah pasangan yang paling sering tertukar. Penggerombolan
tentang **di mana** cacatnya berada; keausan tentang **pengulangan** yang
kehilangan hasilnya.

## 1.4 Aktivitas pengujian, testware, dan peran

Bagian terberat: lima tujuan pembelajaran, dan sepertiga pertanyaan babnya.

**Aktivitasnya.** Ada tujuh, dan semuanya **bukan urutan yang kaku** — semuanya
saling tumpang tindih, berulang, dan dalam lifecycle iteratif sebagian besar
berjalan paralel:

| Aktivitas | Menghasilkan | Tugasnya dalam satu baris |
|---|---|---|
| **Test planning** | Test plan | Tujuan, pendekatan, sumber daya, jadwal |
| **Test monitoring and control** | Laporan kemajuan | Bandingkan aktual dengan rencana; tindaklanjuti selisihnya |
| **Test analysis** | Test condition | **Apa** yang diuji — analisis test basis-nya |
| **Test design** | Test case, coverage item | **Bagaimana** mengujinya |
| **Test implementation** | Test procedure, data, suite, environment | Semua yang dibutuhkan supaya bisa dijalankan |
| **Test execution** | Log, defect report | Jalankan, bandingkan aktual dengan harapan, laporkan |
| **Test completion** | Laporan penutup, testware yang diarsipkan | Menutup, menyerahkan, mencatat pelajaran |

**Analysis versus design adalah jebakan di bagian ini.** Analysis
mengidentifikasi apa yang seharusnya diuji; design mengubah kondisi itu menjadi
test case yang konkret. Kalau sebuah pertanyaan menggambarkan pemutusan *bahwa*
aturan diskonnya perlu diuji, itu analysis; menurunkan nilai batasnya adalah
design.

**Konteks membentuk prosesnya.** Aktivitas mana yang Anda lakukan, bagaimana, dan
sedalam apa bergantung pada para stakeholder dan harapan mereka,
keahlian timnya, domain bisnisnya, faktor teknis, kendala proyek (anggaran,
waktu), organisasinya, dan lifecycle yang dipakai. Ini prinsip 6 sebagai
pernyataan proses.

**Testware adalah keluaran dari aktivitas-aktivitasnya**, dan mencocokkan setiap
artefak dengan aktivitasnya langsung bisa diujikan — tabel di atas adalah tujuan
pembelajaran itu. Perhatikan kerancuan yang mudah: **test case berasal dari
design, test procedure dan test data berasal dari implementation.**

**Ketertelusuran** antara test basis, test condition, test case, dan hasilnya
adalah yang memungkinkan Anda mengevaluasi cakupan, menilai dampak sebuah
perubahan, mengaudit prosesnya, melaporkan status dalam istilah yang dipahami
stakeholder, dan memperagakan bahwa tujuannya tercapai. Kalau sebuah
kebutuhan berubah, ketertelusuran memberi tahu Anda pengujian mana yang kini
diragukan — dan itu manfaatnya yang paling sering diujikan.

**Peran, bukan gelar pekerjaan.** Ada dua peran: **test management** (planning,
monitoring, control, completion reporting) dan **testing** (analysis, design,
implementation, execution). Satu orang bisa memegang keduanya, dan dalam suasana
seluruh tim keduanya bisa tersebar ke orang-orang yang gelar pekerjaannya tidak
memuat kata "tester".

## 1.5 Keahlian dan praktik yang baik

**Keahlian umum seorang tester** yang layak dikenali: pengetahuan pengujian,
ketuntasan, keingintahuan dan ketelitian, komunikasi yang baik (dengan developer
dan dengan stakeholder), berpikir analitis dan kritis, pengetahuan
domain, dan pengetahuan teknis. Komunikasi ada di daftar itu dengan sengaja —
cacat yang tidak ditindaklanjuti siapa pun berarti tidak ditemukan secara
berguna.

**Pendekatan seluruh tim.** Siapa pun yang punya pengetahuan yang diperlukan bisa
melakukan tugas apa pun, dan **semua orang bertanggung jawab atas kualitas.**
Manfaatnya: komunikasi dan kolaborasi yang lebih baik, pola pikir kualitas di
seluruh tim, dan tester yang menyumbang pada diskusi kebutuhan tempat mereka
mencegah cacat alih-alih menemukannya. Batasannya jujur — ia tidak cocok untuk
setiap konteks, dan itu prinsip 6 lagi.

**Independensi pengujian**, dan ia bermata dua:

| Manfaat | Kerugian |
|---|---|
| Tester independen mengenali jenis kegagalan yang berbeda | Terisolasi dari tim pengembangan |
| Mereka bisa menantang asumsi yang tidak bisa dilihat penulisnya | Developer bisa kehilangan rasa tanggung jawab atas kualitas |
| Bias berkurang — penulis yang menguji karyanya sendiri adalah kasus terlemah | Pengujian independen bisa dilihat sebagai leher botol, dan disalahkan atas keterlambatan |

Pertanyaan yang meminta sebuah *kerugian* dari independensi sedang meminta salah
satu isi kolom kanan. "Biayanya lebih besar" adalah pengecoh yang terdengar masuk
akal tapi bukan poin silabusnya.

## Perbedaan yang menentukan nilai

Semua di atas, dimampatkan ke apa yang sebenarnya sering salah:

| Pasangan yang tertukar | Garis pemisahnya |
|---|---|
| Pengujian / debugging | Menemukan failure / menemukan dan memperbaiki penyebabnya |
| QA / pengujian | Proses, preventif / produk, korektif |
| Error / defect / failure | Kekeliruan manusia / kesalahan di work product / perilaku keliru yang teramati |
| Verifikasi / validasi | Dibangun dengan benar / membangun hal yang benar |
| Test analysis / test design | Apa yang diuji / bagaimana mengujinya |
| Test case / test procedure | Keluaran design / keluaran implementation |
| Penggerombolan cacat / keausan pengujian | Di mana cacatnya / pengulangan yang kehilangan hasil |
| Peran / gelar pekerjaan | Ada dua peran; satu orang bisa memegang keduanya |

## Latih dengan drill

Membaca sebuah bab bukan pengulangan belajar. Kerjakan kuis bab 1 — delapan
pertanyaan, tanpa batas waktu, setiap jawabannya dijelaskan:

**[Kuis bab 1 →](/academy/istqb/practice-exam/chapter/1)** — simulator ujiannya
berbahasa Inggris.

Nilai di bawah 6 dari 8 dan langkah yang berguna bukanlah membaca ulang halaman
ini, melainkan membaca penjelasan pada yang Anda lewatkan lalu kembali besok.
Setiap penjelasan menyebutkan perbedaan yang sedang diuji, dan
perbedaan-perbedaan itulah babnya.

**Selanjutnya:** Bab 2 — pengujian sepanjang lifecycle pengembangan perangkat
lunak.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Seorang tester melaporkan bahwa total di layar faktur keliru. Seorang developer mereproduksinya, melacaknya ke sebuah pernyataan pembulatan, lalu membetulkannya. Pernyataan mana yang akurat?",
      choices: [
        {
          id: "a",
          text: "Tester melakukan pengujian dan developer melakukan debugging; confirmation testing lalu memeriksa perbaikannya",
        },
        {
          id: "b",
          text: "Kedua aktivitasnya adalah pengujian, karena keduanya ditujukan pada penyingkiran cacat",
        },
        {
          id: "c",
          text: "Developer melakukan debugging, dan tidak diperlukan pengujian lebih lanjut begitu perbaikannya diterapkan",
        },
        {
          id: "d",
          text: "Tester melakukan debugging, karena mengidentifikasi total yang keliru adalah diagnosis",
        },
      ],
      explanation:
        "Pengujian menyebabkan dan mengamati failure-nya; debugging mereproduksinya, mendiagnosis penyebabnya, dan memperbaikinya. Keduanya aktivitas yang berbeda bahkan ketika orang yang sama kebetulan melakukan keduanya, dan itu lazim di tim yang bekerja sebagai satu tim. Perbaikannya lalu dipastikan dengan mengeksekusi ulang pengujian yang gagal — confirmation testing — dan biasanya diikuti pengujian regresi, jadi pekerjaannya belum selesai ketika kodenya berubah. Menyadari bahwa sebuah total keliru adalah pengamatan, bukan diagnosis, jadi ia bukan debugging.",
    },
    {
      id: "q2",
      stem: "Mana yang benar tentang hubungan antara defect dan failure?",
      choices: [
        {
          id: "a",
          text: "Setiap defect pada akhirnya akan menghasilkan failure kalau sistemnya berjalan cukup lama",
        },
        {
          id: "b",
          text: "Sebuah defect tidak harus pernah menyebabkan failure, dan sebuah failure bisa terjadi tanpa defect apa pun hadir",
        },
        {
          id: "c",
          text: "Sebuah failure selalu menandakan adanya defect di kode yang sedang diuji",
        },
        {
          id: "d",
          text: "Root cause sebuah failure adalah defect yang menghasilkannya",
        },
      ],
      explanation:
        "Defect di kode yang tidak pernah dieksekusi, atau yang hanya dieksekusi pada kondisi yang tidak pernah muncul, bisa jadi tidak pernah menghasilkan failure sama sekali. Ke arah sebaliknya, kondisi lingkungan — radiasi, gangguan elektromagnetik, polusi — bisa mengubah eksekusi dan menyebabkan failure tanpa defect apa pun terlibat. Root cause juga bukan defect-nya: ia asal-usul error manusia yang memasukkan defect itu, dan itulah yang harus dituju sebuah perbaikan proses.",
    },
    {
      id: "q3",
      stem: "Sebuah tim memutuskan bahwa aturan diskon yang baru perlu diuji, lalu belakangan menurunkan nilai spesifik yang akan dipakai di tiap batas jenjangnya. Aktivitas apa saja itu?",
      choices: [
        {
          id: "a",
          text: "Test planning, lalu test implementation",
        },
        {
          id: "b",
          text: "Test analysis, lalu test design",
        },
        {
          id: "c",
          text: "Test design, lalu test implementation",
        },
        {
          id: "d",
          text: "Test monitoring and control, lalu test execution",
        },
      ],
      explanation:
        "Test analysis menjawab apa yang diuji — ia memeriksa test basis-nya dan mengidentifikasi test condition, dan 'aturan diskonnya' adalah salah satunya. Test design menjawab bagaimana mengujinya, mengubah kondisi menjadi test case yang konkret beserta coverage item-nya, dan di situlah nilai batasnya diturunkan. Implementation datang setelahnya: merakit test procedure, data, suite, dan environment yang dibutuhkan untuk benar-benar menjalankan apa yang dihasilkan design. Menjaga analysis dan design tetap terpisah adalah perbedaan yang paling sering diujikan di bagian ini.",
    },
    {
      id: "q4",
      stem: "Mana di antara ini yang merupakan kerugian sungguhan dari pengujian independen sebagaimana disajikan silabusnya?",
      choices: [
        {
          id: "a",
          text: "Terisolasinya tim pengujian dari tim pengembangan",
        },
        {
          id: "b",
          text: "Developer bisa kehilangan rasa tanggung jawab mereka sendiri atas kualitas",
        },
        {
          id: "c",
          text: "Tester independen bisa dilihat sebagai leher botol dan disalahkan atas keterlambatan",
        },
        {
          id: "d",
          text: "Tester independen kurang mampu mengenali jenis kegagalan yang berbeda dibandingkan penulis kodenya",
        },
      ],
      explanation:
        "Tiga yang pertama adalah kerugiannya: jarak dari tim pengembangan, menyebarnya kepemilikan sehingga kualitas menjadi urusan departemen lain, dan posisi politis sebagai gerbang terakhir sebelum rilis. Yang keempat membalik sebuah manfaat — independensi ada justru karena tester independen mengenali jenis kegagalan yang berbeda dan bisa menantang asumsi yang tidak mampu dilihat penulisnya pada karyanya sendiri. Biaya adalah pengecoh yang lazim di sini dan juga bukan poin silabusnya.",
    },
  ],
};
