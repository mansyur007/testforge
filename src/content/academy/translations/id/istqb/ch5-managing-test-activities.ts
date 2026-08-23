import type { LessonTranslation } from "../../../types";

export const ch5ManagingTestActivitiesId: LessonTranslation = {
  slug: "ch5-managing-test-activities",
  title: "Bab 5 — Mengelola aktivitas pengujian",
  summary:
    "Perencanaan, risiko, pemantauan dan kendali, configuration management, dan defect management.",
  body: `
## Bab dengan tujuan pembelajaran terbanyak

Bab 5 menyumbang **9 dari 40 pertanyaan** di paket latihan kami — kedua setelah
bab 4 — dan ia melakukannya lewat **16 tujuan pembelajaran**, lebih banyak
daripada bab mana pun di silabusnya. Rasio itulah yang perlu dijadikan dasar
perencanaan: **lebih banyak tanah per nilai daripada di mana pun**, jadi
pengenalan lebih penting daripada kedalaman di sini.

| Bagian | Tujuan | Tingkat K | Yang diinginkannya |
|---|---|---|---|
| 5.1 Test planning | 7 | K1, K2, **2× K3** | Rencana, kriteria, estimasi, pemrioritasan, piramida, kuadran |
| 5.2 Manajemen risiko | 4 | K1, K2 | Tingkat risiko, risiko proyek vs produk, bagaimana risiko membentuk pengujian |
| 5.3 Pemantauan, kendali, penutupan | 3 | K1, K2 | Metrik, kedua laporannya, mengomunikasikan status |
| 5.4 Configuration management | 1 | K2 | Bagaimana ia menopang pengujian |
| 5.5 Defect management | 1 | **K3** | Menulis sebuah defect report |

**Tiga tujuan pembelajaran K3**, dan semuanya tersebar alih-alih menggerombol:
estimasi dan pemrioritasan di §5.1, defect report di §5.5. Ketiganya adalah
tempat sebuah pertanyaan bisa menyerahkan materi kepada Anda lalu menuntut sebuah
jawaban.

## 5.1 Test planning

### Tujuan dan isi sebuah test plan

Sebuah test plan menyatakan tujuan dan cakupan pengujiannya, pendekatannya,
sumber daya dan jadwalnya, risikonya, entry dan exit criteria-nya, serta testware
apa yang akan dihasilkan. Tujuannya yang sesungguhnya adalah yang dilupakan
kandidat ketika mereka membayangkan sebuah dokumen: **ia mengomunikasikan dan
menyelaraskan.** Menulisnya memaksa munculnya pertanyaan yang kalau tidak begitu
akan muncul terlambat — apa yang tidak kita uji, apa yang harus siap sebelum kita
mulai, apa arti "selesai".

Pelajaran [test planning](/id/academy/manual-pro/test-planning) di T2 memuat
versi praktisnya; ujiannya menginginkan isinya dan tujuannya.

### Entry versus exit criteria

Pasangan yang nyaris selalu diujikan:

| | Entry criteria (definition of ready) | Exit criteria (definition of done) |
|---|---|---|
| Menjawab | Bisakah pengujian **dimulai**? | Bisakah pengujian **dihentikan**? |
| Khasnya | Kebutuhan yang bisa diuji, environment pengujian siap, testware tersedia, kualitas awal cukup baik | Cakupan rencana tercapai, tidak ada cacat critical yang belum tuntas, perkiraan cacat tersisa cukup rendah, tingkat non-fungsional bisa diterima |

**Kehabisan waktu atau uang bukan exit criterion.** Itu *alasan* yang lazim untuk
berhenti, dan silabusnya tegas bahwa keduanya bukan hal yang sama — pertanyaan
yang menawarkan "jadwalnya habis" sebagai exit criterion yang sah sedang
menawarkan pengecoh.

### Mengestimasi usaha pengujian (K3)

Tiga pendekatan yang layak disebut namanya — ekstrapolasi berbasis metrik dari
proyek lampau, estimasi berbasis pakar oleh orang yang mengerjakannya, dan
**estimasi tiga titik**, yang benar-benar bisa disuruh dihitung oleh ujiannya.

Tiga titik mengambil sebuah nilai optimistis **a**, nilai paling mungkin **m**,
dan nilai pesimistis **b**:

> **E = (a + 4m + b) ÷ 6** dan simpangan bakunya **SD = (b − a) ÷ 6**

**Contoh dikerjakan.** a = 8 hari, m = 12 hari, b = 28 hari.

- E = (8 + 48 + 28) ÷ 6 = **84 ÷ 6 = 14 hari**
- SD = (28 − 8) ÷ 6 = **3,33**, jadi estimasinya biasanya dinyatakan 14 ± 3,33

Perhatikan apa yang dilakukan pembobotannya: nilai paling mungkin dihitung empat
kali, jadi pencilan pesimistis menggeser jawabannya jauh lebih sedikit daripada
yang akan dilakukan rata-rata. Kalau sebuah pertanyaan memberi Anda tiga angka
lalu meminta sebuah estimasi, inilah rumus yang diinginkannya — dan
aritmetikanya adalah seluruh pertanyaannya.

### Memprioritaskan test case (K3)

Tiga dasar, dan sebuah kendala yang mengalahkan semuanya:

| Dasar | Dijalankan lebih dulu |
|---|---|
| **Berbasis risiko** | Case yang mencakup area berisiko tertinggi |
| **Berbasis cakupan** | Case yang paling cepat menambah paling banyak cakupan |
| **Berbasis kebutuhan** | Case untuk kebutuhan yang diperingkatkan tertinggi stakeholder |

**Kendalanya adalah kebergantungan.** Kalau case B baru masuk akal setelah case A
berjalan — ia membutuhkan catatan yang dibuat A — maka A berjalan lebih dulu apa
pun kata prioritasnya. Pertanyaan yang mendaftar prioritas *dan* sebuah
kebergantungan sedang menguji apakah Anda menyadari yang kedua.

### Piramida pengujian dan kuadran pengujian

Dua model, dan mencampuradukkannya adalah jebakan yang andal karena keduanya
diagram tentang menata pengujian.

**Piramida** tentang **granularitas dan biaya**: banyak pengujian tingkat rendah
yang cepat dan murah di dasarnya, makin sedikit seiring naik, sedikit pengujian
end-to-end yang lambat di puncaknya. Ia menjawab *berapa banyak di tiap level*.

**Kuadran** tentang **tujuan dan audiens**, di sepanjang dua sumbu — menghadap
teknologi versus menghadap bisnis, dan mendukung tim versus mengkritik produk:

| | Mendukung tim | Mengkritik produk |
|---|---|---|
| **Menghadap bisnis** | Pengujian fungsional, contoh, story test, prototipe | Eksploratori, usability, user acceptance testing |
| **Menghadap teknologi** | Pengujian komponen dan integrasi | Pengujian performa, keamanan, keandalan |

**Piramida: berapa banyak, di level mana. Kuadran: untuk apa, dan ditujukan
kepada siapa.** Track otomasi T3 memperdebatkan piramidanya panjang lebar; di
sini Anda hanya perlu mengenali keduanya.

## 5.2 Manajemen risiko

**Tingkat risiko tersusun dari dua hal: kemungkinan bahayanya terjadi dan
dampaknya kalau ia terjadi.** Bukan salah satunya, dan pertanyaan yang
menggambarkan hanya keparahan akibatnya sedang menggambarkan separuhnya.

**Risiko proyek versus risiko produk** — perbedaan yang menjadi fondasi bagian
ini:

| | Memengaruhi | Contoh |
|---|---|---|
| **Risiko proyek** | Kemampuan proyeknya untuk mengirimkan | Pemasok terlambat, pergantian staf, environment tidak stabil, jadwal tidak realistis, jurang keahlian |
| **Risiko produk** | Kualitas produknya sendiri | Fungsionalitas hilang atau keliru, perilaku tidak andal, usability buruk, kelemahan keamanan |

Ancar-ancar yang berguna untuk ujiannya: **kalau bahayanya akan muncul di
perangkat lunak yang dikirim, itu risiko produk; kalau ia akan muncul di
rencananya, itu risiko proyek.**

**Bagaimana analisis risiko produk membentuk pengujian.** Ia menentukan *luas dan
ketuntasan* pengujiannya, *teknik mana* yang dipakai, *level dan type mana* yang
diterapkan, bagaimana case *diprioritaskan*, dan apakah sesuatu selain pengujian
akan menurunkan risikonya lebih murah — sebuah review, pelatihan yang lebih baik,
sebuah prototipe.

**Menanggapi risiko**, begitu dianalisis: mitigasi (biasanya dengan mengujinya),
alihkan, terima dengan sengaja, atau siapkan rencana kontingensi. Risiko
**dipantau sepanjang jalan**, bukan dinilai sekali di awal — informasi baru
mengubah baik kemungkinan maupun dampaknya, dan pengujian berbasis risiko yang
tidak pernah menengok kembali daftarnya berjalan di atas peringkat yang basi.
Pelajaran [risk-based testing](/id/academy/manual-pro/risk-based-testing) di T2
adalah versi kerjanya.

## 5.3 Pemantauan, kendali, dan penutupan

**Metrik** yang layak dikenali per kategori: kemajuan proyek, kemajuan pengujian
(case yang diimplementasikan, dieksekusi, lulus, gagal, terhalang), kualitas
produk (waktu response, ketersediaan, defect density, mean time between
failures), metrik cacat (yang ditemukan dan diperbaiki, persentase deteksi),
metrik risiko (risiko tersisa), cakupan, dan biaya.

Pelajaran [metrik](/id/academy/manual-pro/metrics-that-mean-something) di T2
membangun argumen tentang mana di antaranya yang menyesatkan; ujiannya
menginginkan kategorinya.

**Kedua laporannya, dan bedanya adalah *kapan*:**

| | Test progress report | Test completion report |
|---|---|---|
| Ditulis | **Selama** sebuah aktivitas pengujian, secara berkala | **Di akhir** sebuah level, iterasi, proyek, atau milestone |
| Memuat | Status, penyimpangan dari rencana, risiko baru, penghambat, apa yang direncanakan berikutnya | Ringkasan, evaluasi **terhadap exit criteria**, penyimpangan, metrik, risiko tersisa, testware yang bisa dipakai ulang |

**Mengomunikasikan status** adalah tujuan pembelajarannya sendiri, dan intinya
adalah medium dan tingkat kerincian mengikuti **audiensnya**: sebuah dashboard
untuk sebuah tim, ringkasan tertulis untuk stakeholder yang tidak akan
membaca daftar cacat, pembaruan lisan di stand-up. Pelajaran [pelaporan kepada
stakeholder](/id/academy/manual-pro/reporting-to-stakeholders) di T2 adalah
bentuk panjangnya.

## 5.4 Configuration management

Satu tujuan pembelajaran, satu pertanyaan yang andal. Configuration management
memastikan setiap item uji dan setiap keping testware **diidentifikasi secara
unik, dikendalikan versinya, dan dikaitkan dengan versi objek uji tempat ia
berada.**

Alasannya, dinyatakan sebagaimana disukai ujiannya: **tanpa itu, sebuah hasil
pengujian tidak bisa direproduksi**, karena Anda tidak bisa menyatakan dengan
pasti versi perangkat lunak mana yang diuji dengan versi pengujian yang mana. Itu
juga sebabnya defect report menyebut versinya dan environment-nya.

## 5.5 Defect management (K3)

Tujuan pembelajaran K3 ketiga babnya: diberi sebuah skenario, hasilkan sebuah
defect report.

**Apa yang harus dibawa sebuah laporan:** sebuah pengenal unik; judul dan
ringkasan pendek; tanggal, penulis, dan perannya; objek uji dan **environment
pengujiannya**; **langkah reproduksinya**; **hasil yang diharapkan dan hasil
sebenarnya**; **severity** dan **priority**; statusnya; rujukan ke test case atau
kebutuhannya; dan, bila berguna, kesimpulan atau rekomendasi.

**Severity bukan priority**, dan ini pasangan yang paling sering diujikan di
bagian ini:

> **Severity** adalah seberapa buruk akibatnya. **Priority** adalah seberapa
> cepat ia sebaiknya diperbaiki. Salah ketik kosmetik di halaman depan bisa
> ber-severity rendah dan ber-priority tinggi karena semua orang melihatnya;
> sebuah crash di fitur yang dipakai tiga pelanggan setahun sekali bisa
> ber-severity tinggi dan ber-priority rendah.

Tiga poin lagi yang muncul:

- **Cacat bisa dilaporkan dari pengujian statis juga** — sebuah review menemukan
  cacat di sebuah kebutuhan, dan ia dilaporkan dengan cara yang sama. Tidak ada
  yang harus dieksekusi.
- **Tujuan sebuah defect report** adalah memberi developer apa yang mereka
  butuhkan untuk memperbaikinya, menyediakan sarana melacak kualitas produk, dan
  memasok gagasan untuk **perbaikan proses** — yang ketiga adalah yang dilupakan
  para kandidat.
- **Tidak setiap failure adalah sebuah cacat.** Sebagian disebabkan environment
  pengujiannya, data ujinya, atau pengujian yang keliru — dan itulah sebabnya
  laporannya menyebut environment-nya dan hasil yang diharapkannya.

Pelajaran [laporan bug](/id/academy/fundamentals/bug-reports) dan [siklus hidup
cacat](/id/academy/fundamentals/defect-lifecycle) di T1 membahas keterampilannya;
di sini ia tujuan pembelajaran K3, jadi berlatihlah menghasilkan satu alih-alih
mengenali satu.

## Perbedaan yang menentukan nilai

| Pasangan yang tertukar | Garis pemisahnya |
|---|---|
| Entry / exit criteria | Bisakah pengujian dimulai / bisakah pengujian dihentikan |
| Kehabisan waktu / exit criteria | Sebuah alasan untuk berhenti, **bukan** exit criterion yang sah |
| Severity / priority | Seberapa buruk ia / seberapa cepat ia diperbaiki |
| Risiko proyek / risiko produk | Kemampuan proyeknya mengirimkan / kualitas produknya |
| Risiko = dampak / risiko = kemungkinan **dan** dampak | Kedua faktornya, selalu |
| Piramida / kuadran | Berapa banyak di level mana / tujuan apa dan audiens siapa |
| Progress report / completion report | Ditulis selama / ditulis di akhir, terhadap exit criteria |
| Estimasi tiga titik | **(a + 4m + b) ÷ 6**, dengan nilai paling mungkin dibobot empat kali |
| Urutan prioritas / kebergantungan | Kebergantungan menang terlepas dari prioritasnya |
| Configuration management | Keterulangan — versi mana yang diuji dengan pengujian yang mana |

## Latih dengan drill

Delapan pertanyaan, tanpa batas waktu, setiap jawabannya dijelaskan. Simulator
ujiannya berbahasa Inggris; jalurnya
\`/academy/istqb/practice-exam/chapter/5\`.

Karena bab ini luas alih-alih dalam, pertanyaan yang terlewat di sini biasanya
berarti sebuah topik yang sama sekali belum Anda baca alih-alih yang salah Anda
pahami — jadi periksa *bagian mana* asal kesalahan Anda lalu kembalilah ke sana.

**Selanjutnya:** Bab 6 — alat pengujian, bab terkecil di silabusnya, lalu
strategi ujian.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Sebuah tim mengestimasi sebuah tugas pengujian sebagai 6 hari optimistis, 10 hari paling mungkin, dan 20 hari pesimistis. Memakai estimasi tiga titik, berapa estimasinya?",
      choices: [
        {
          id: "a",
          text: "11 hari",
        },
        {
          id: "b",
          text: "12 hari",
        },
        {
          id: "c",
          text: "10 hari",
        },
        {
          id: "d",
          text: "18 hari",
        },
      ],
      explanation:
        "E = (a + 4m + b) ÷ 6 = (6 + 40 + 20) ÷ 6 = 66 ÷ 6 = 11 hari. Nilai paling mungkin dibobot empat kali, dan itulah inti rumusnya: pencilan pesimistis menarik jawabannya jauh lebih sedikit daripada yang akan dilakukan rata-rata polos ketiganya (rata-rata itu 12, dan itu pilihan b serta pengecoh bagi siapa pun yang lupa pembobotannya). Simpangan bakunya, kalau ditanyakan, adalah (b − a) ÷ 6 = 2,33, jadi estimasinya akan dinyatakan 11 ± 2,33.",
    },
    {
      id: "q2",
      stem: "Mana di antara ini yang merupakan exit criterion yang sah untuk sebuah test level?",
      choices: [
        {
          id: "a",
          text: "Waktu yang dialokasikan di jadwalnya sudah habis terpakai",
        },
        {
          id: "b",
          text: "Cakupan yang direncanakan sudah tercapai dan tidak ada cacat critical yang belum tuntas",
        },
        {
          id: "c",
          text: "Environment pengujiannya sudah disediakan untuk timnya",
        },
        {
          id: "d",
          text: "Kebutuhannya sudah di-review dan ditemukan bisa diuji",
        },
      ],
      explanation:
        "Exit criteria menggambarkan kondisi ketika pengujiannya bisa dinyatakan tuntas — cakupan tercapai, tidak ada cacat critical yang belum tuntas, perkiraan cacat tersisa cukup rendah, tingkat non-fungsional bisa diterima. Kehabisan jadwal adalah alasan lazim untuk berhenti dan secara eksplisit bukan exit criterion; memperlakukannya sebagai exit criterion adalah cara sebuah tim berakhir menyatakan selesai atas sesuatu yang sekadar sudah lewat waktunya. Pilihan c dan d adalah entry criteria: keduanya menggambarkan apa yang harus benar sebelum pengujiannya bisa dimulai secara bermakna.",
    },
    {
      id: "q3",
      stem: "Salah eja nama perusahaan di halaman depan dilaporkan. Ia tidak mungkin membuat apa pun crash, tapi setiap pengunjung melihatnya dan pemasaran ingin ia hilang hari ini. Bagaimana ia sebaiknya digolongkan?",
      choices: [
        {
          id: "a",
          text: "Severity rendah, priority tinggi",
        },
        {
          id: "b",
          text: "Severity tinggi, priority tinggi",
        },
        {
          id: "c",
          text: "Severity rendah, priority rendah",
        },
        {
          id: "d",
          text: "Severity tinggi, priority rendah",
        },
      ],
      explanation:
        "Severity menggambarkan seberapa buruk akibatnya bagi sistemnya — tidak ada yang gagal, jadi ia rendah. Priority menggambarkan seberapa cepat ia sebaiknya diperbaiki, dan keterlihatan oleh setiap pengunjung plus tuntutan bisnis menjadikannya tinggi. Pasangannya sengaja saling bebas, dan itulah sebabnya kasus sebaliknya juga ada: sebuah crash di fitur yang dipakai segelintir pelanggan setahun sekali bisa ber-severity tinggi dan ber-priority rendah. Meleburkan keduanya menjadi satu penilaian adalah kekeliruan paling umum di bagian ini.",
    },
    {
      id: "q4",
      stem: "Mana di antara ini yang merupakan risiko produk alih-alih risiko proyek?",
      choices: [
        {
          id: "a",
          text: "Perhitungan pembayarannya bisa membulatkan secara keliru untuk mata uang tertentu",
        },
        {
          id: "b",
          text: "Sistemnya bisa jadi tidak sanggup menangani jumlah pengguna bersamaan yang diperkirakan",
        },
        {
          id: "c",
          text: "Pemasok pihak ketiganya bisa mengirimkan komponennya terlambat",
        },
        {
          id: "d",
          text: "Dua dari tiga tester-nya bisa keluar sebelum rilisnya",
        },
      ],
      explanation:
        "Risiko produk adalah calon cacat di perangkat lunak yang dikirim — perhitungan yang keliru dan performa yang tidak memadai sama-sama muncul di produknya sendiri, dan keduanya ditangani dengan mengujinya. Pemasok yang terlambat dan pergantian staf adalah risiko proyek: keduanya mengancam kemampuan proyeknya untuk mengirimkan sama sekali, dan keduanya dikelola proyeknya alih-alih dimitigasi sebuah test case. Ancar-ancar yang berguna adalah di mana bahayanya akan muncul — di perangkat lunaknya, atau di rencananya.",
    },
  ],
};
