import type { LessonTranslation } from "../../../types";

export const ch3StaticTestingId: LessonTranslation = {
  slug: "ch3-static-testing",
  title: "Bab 3 — Pengujian statis",
  summary:
    "Review, proses review-nya, dan apa yang ditangkap analisis statis yang tidak bisa ditangkap eksekusi.",
  body: `
## Berapa harga bab ini

Bab 3 menyumbang **4 dari 40 pertanyaan** di paket latihan kami — bab terkecil
kedua — tersebar di 8 tujuan pembelajaran, semuanya K1 atau K2.

| Bagian | Tujuan | Yang diinginkannya |
|---|---|---|
| 3.1 Dasar-dasar pengujian statis | 3 | Apa yang bisa diperiksa, nilainya, statis versus dinamis |
| 3.2 Umpan balik dan proses review | 5 | Umpan balik dini, aktivitasnya, perannya, jenisnya, faktor keberhasilannya |

Bab kecil, kerapatan tinggi: lima tujuan pembelajaran di §3.2 sebagian besar
berupa **daftar yang Anda ketahui atau tidak**, dan itu menjadikannya bab
termurah per jam pengulangan belajar di seluruh silabusnya. Dua hal yang andal
menggerus nilai adalah *siapa memimpin jenis review yang mana* dan *apa yang
ditemukan pengujian statis yang tidak bisa ditemukan pengujian dinamis*.

## 3.1 Dasar-dasar pengujian statis

**Pengujian statis tidak mengeksekusi perangkat lunaknya.** Ia punya dua bentuk:
**review** atas work product oleh manusia, dan **analisis statis** oleh alat,
yang memeriksa kode dan artefak lain tanpa menjalankannya.

**Apa yang bisa diperiksa secara statis?** Nyaris apa pun yang bisa dibaca:
kebutuhan dan spesifikasi, kode sumber, desain dan model, test plan, test case
dan test charter, item product backlog, kontrak, dan dokumentasi pengguna. Batas
praktisnya yang perlu diingat — **ia harus terdokumentasi.** Pengetahuan yang
hanya hidup di kepala seseorang tidak bisa di-review.

**Kenapa ia layak dikerjakan.** Empat argumen, dan yang kedua adalah yang bisa
diujikan:

1. Ia menemukan cacat **lebih awal**, ketika ia paling murah diperbaiki — prinsip
   ketiga bab 1 diterapkan.
2. Ia menemukan cacat yang **sama sekali tidak bisa ditemukan** pengujian
   dinamis: kode yang tak terjangkau atau mati, dan — jauh lebih penting — cacat
   di dalam *test basis*-nya sendiri. Kerancuan, ketidakkonsistenan, kelalaian,
   duplikasi, dan kebutuhan yang tidak bisa diuji semuanya tak terlihat oleh
   eksekusi, karena tidak ada yang bisa dieksekusi.
3. Ia membangun pemahaman bersama dan kesepakatan antarpeserta.
4. Ia memperbaiki keterawatan dan konsistensi produknya.

Poin kedua itu adalah pusat gravitasi babnya: **kebutuhan yang bertentangan
dengan dirinya sendiri akan lolos dari setiap pengujian yang bisa Anda tulis
terhadapnya**, karena pengujiannya mewarisi kontradiksinya.

**Statis versus dinamis**, dan perbedaan yang diinginkan ujiannya dengan tepat:

| | Pengujian statis | Pengujian dinamis |
|---|---|---|
| Perangkat lunaknya berjalan? | Tidak | Ya |
| Menemukan | **Cacat, secara langsung** | **Failure**, dari mana cacatnya ditemukan |
| Bisa dimulai | Segera setelah sebuah draf ada | Begitu ada sesuatu yang bisa dieksekusi |
| Juga menilai | Keterawatan, konsistensi, keterujian | Perilaku pada kondisi tertentu |

Keduanya bertujuan memperbaiki kualitas dan keduanya menemukan cacat — tujuan
bersama itulah yang membuat pertanyaan bisa membuat keduanya terdengar bisa
saling menggantikan. Pemisahnya adalah pengujian dinamis mengamati sebuah
*failure* lalu menyimpulkan adanya cacat, sementara sebuah review membaca
cacatnya langsung dari halamannya.

## 3.2 Umpan balik dan proses review

**Kenapa umpan balik stakeholder yang dini dan sering.** Ia menyingkap
risiko lebih awal, mencegah kesalahpahaman tentang kebutuhannya, dan membuat
timnya membangun apa yang benar-benar dibutuhkan pelanggannya alih-alih menemukan
jurangnya saat acceptance. Alternatifnya adalah pengerjaan ulang yang mahal, dan
silabusnya membingkainya persis begitu.

**Proses review punya lima aktivitas**, dan semuanya bisa diujikan urutannya:

| Aktivitas | Yang terjadi |
|---|---|
| **Perencanaan** | Tetapkan cakupan, tujuan, jenis, peran, entry dan exit criteria |
| **Inisiasi review** | Berikan kepada peserta work product-nya dan semua yang mereka butuhkan |
| **Review individu** | Tiap reviewer memeriksanya sendirian dan mencatat calon cacat |
| **Komunikasi dan analisis** | Diskusikan, putuskan apa yang benar-benar cacat, sepakati tindakannya |
| **Perbaikan dan pelaporan** | Penulisnya memperbaiki; cacatnya dilaporkan dan statusnya dilacak |

Perhatikan bahwa **review individu datang sebelum rapatnya**, dan bahwa sebagian
besar nilai sebuah review terwujud di sana. Itu juga sebabnya "peserta punya
waktu untuk bersiap" adalah salah satu faktor keberhasilannya.

**Perannya**, dan tanggung jawabnya:

| Peran | Tanggung jawab |
|---|---|
| **Manajer** | Memutuskan apa yang di-review, mengalokasikan waktu dan sumber daya |
| **Penulis** | Menulis work product-nya; memperbaiki cacat yang ditemukan |
| **Moderator / fasilitator** | Menjalankan rapatnya, menjaganya efektif dan aman |
| **Notulis / pencatat** | Mencatat cacat yang ditemukan dan keputusan yang diambil |
| **Reviewer** | Memeriksa work product-nya dan melaporkan calon cacat |
| **Pemimpin review** | Memikul tanggung jawab keseluruhan, memutuskan siapa yang ikut, menjadwalkannya |

Satu orang bisa memegang lebih dari satu peran — aturan yang sama yang diberikan
bab 1 untuk peran test management dan testing.

**Empat jenis review-nya**, dengan formalitas yang meningkat. Tabel inilah tempat
nilai babnya berada:

| Jenis | Dipimpin oleh | Ciri |
|---|---|---|
| **Review informal** | Tanpa proses formal | Tidak mensyaratkan output terdokumentasi; murah, lazim, berguna |
| **Walkthrough** | **Penulisnya** | Penulis memandu kelompoknya menyusurinya; berbasis skenario; bisa mencakup persiapan |
| **Technical review** | Seorang **moderator terlatih** (bukan penulisnya) | Rekan sejawat yang berkualifikasi teknis; menuju kesepakatan dan keputusan teknis |
| **Inspection** | Seorang **moderator terlatih** (bukan penulisnya) | Paling formal: peran yang ditetapkan, entry dan exit criteria, metrik dikumpulkan, perbaikan proses |

**Pertanyaan ujiannya di sini nyaris selalu "siapa yang memimpinnya".**
Walkthrough adalah yang dipimpin penulisnya; technical review dan inspection
sengaja tidak, karena penulis adalah orang yang paling tidak mampu melihat
kelalaiannya sendiri.

**Apa yang membuat sebuah review berhasil** — daftar K1, dan yang diujikan adalah
butir-butir manusiawinya:

- tujuan yang jelas dan disepakati, dan **jenis review yang tepat** untuk tujuan
  itu, orang-orangnya, dan situasinya
- work product di-review dalam **potongan kecil**, supaya perhatiannya bertahan
- peserta diberi **waktu yang memadai untuk bersiap**
- **umpan balik disampaikan secara membangun** — cacat diangkat tentang work
  product-nya, bukan tentang penulisnya
- manajemen mendukungnya, dan ia bagian dari budaya organisasinya
- pesertanya terlatih, dan rapatnya dipimpin dengan baik

Budaya review mati oleh umpan balik yang terbaca sebagai kritik pribadi, dan
silabusnya menyatakannya; pertanyaan yang menawarkan "cacat diatribusikan kepada
individu yang bertanggung jawab" sebagai faktor keberhasilan sedang menawarkan
faktor kegagalan.

## Perbedaan yang menentukan nilai

| Pasangan yang tertukar | Garis pemisahnya |
|---|---|
| Statis / dinamis | Menemukan cacat secara langsung / mengamati failure lalu menyimpulkan cacat |
| Walkthrough / inspection | Dipimpin penulisnya / dipimpin moderator terlatih, paling formal |
| Technical review / inspection | Kesepakatan dan keputusan teknis / formal, metrik, entry-exit criteria |
| Review / analisis statis | Manusia membaca sebuah work product / alat memeriksanya tanpa dieksekusi |
| Review individu / rapatnya | Persiapan, tempat sebagian besar nilainya / diskusi dan keputusan |
| Peran penulisnya | Memperbaiki cacat; tidak pernah memimpin technical review atau inspection |
| Umpan balik membangun / atribusi | Sebuah faktor keberhasilan / hal yang membunuh praktiknya |

## Latih dengan drill

Delapan pertanyaan, tanpa batas waktu, setiap jawabannya dijelaskan:

**[Kuis bab 3 →](/academy/istqb/practice-exam/chapter/3)** — simulator ujiannya
berbahasa Inggris.

Bab ini lebih menghadiahi bacaan kedua daripada bab mana pun — daftarnya pendek,
dan pertanyaannya diambil nyaris langsung darinya.

**Selanjutnya:** Bab 4 — test analysis dan design, bab terbesar di silabusnya dan
yang pertama punya tujuan pembelajaran K3, tempat Anda harus menerapkan sebuah
teknik alih-alih mengenalinya.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Jenis review mana yang dipimpin oleh penulis work product-nya?",
      choices: [
        {
          id: "a",
          text: "Walkthrough",
        },
        {
          id: "b",
          text: "Inspection",
        },
        {
          id: "c",
          text: "Technical review",
        },
        {
          id: "d",
          text: "Semua jenis review dipimpin penulisnya, karena merekalah yang paling paham materinya",
        },
      ],
      explanation:
        "Walkthrough adalah jenis di mana penulisnya memandu kelompoknya menyusuri work product-nya, sering kali skenario demi skenario. Technical review dan inspection dipimpin moderator atau fasilitator terlatih justru karena penulis adalah orang yang paling tidak mampu melihat kelalaiannya sendiri — dengan inspection sebagai yang paling formal, lengkap dengan peran yang ditetapkan, entry dan exit criteria, serta metrik yang dikumpulkan. 'Siapa yang memimpinnya' adalah fakta tunggal yang paling sering diujikan di bab ini.",
    },
    {
      id: "q2",
      stem: "Apa yang bisa ditemukan pengujian statis yang tidak bisa ditemukan pengujian dinamis?",
      choices: [
        {
          id: "a",
          text: "Failure yang hanya terjadi di bawah beban berat",
        },
        {
          id: "b",
          text: "Cacat di dalam test basis-nya sendiri — kebutuhan yang rancu, tidak konsisten, hilang, atau tidak bisa diuji — serta kode yang tak terjangkau atau mati",
        },
        {
          id: "c",
          text: "Cacat yang disebabkan konfigurasi environment produksi",
        },
        {
          id: "d",
          text: "Tidak ada — pengujian statis menemukan sebagian dari yang ditemukan eksekusi, lebih awal",
        },
      ],
      explanation:
        "Kebutuhan yang bertentangan atau rancu tidak bisa ditemukan dengan mengeksekusi apa pun, karena pengujian yang ditulis darinya mewarisi kontradiksi yang sama lalu lulus. Kode mati dan tak terjangkau adalah contoh klasik lainnya: menurut definisinya eksekusi tidak pernah mencapainya. Itulah sebabnya pengujian statis bukan sekadar versi lebih awal dari pengujian dinamis — keduanya menemukan kelas cacat yang sungguh berbeda. Failure terkait beban dan perilaku khas environment butuh eksekusi di environment yang realistis, dan itu wilayah pengujian dinamis.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang merupakan faktor keberhasilan review sebagaimana disajikan silabusnya?",
      choices: [
        {
          id: "a",
          text: "Me-review work product-nya dalam potongan kecil alih-alih sekaligus",
        },
        {
          id: "b",
          text: "Memberi peserta waktu yang memadai untuk bersiap sebelum rapatnya",
        },
        {
          id: "c",
          text: "Mengangkat cacat secara membangun, tentang work product-nya alih-alih tentang penulisnya",
        },
        {
          id: "d",
          text: "Mencatat individu mana yang bertanggung jawab atas tiap cacat yang ditemukan, supaya pertanggungjawabannya jelas",
        },
      ],
      explanation:
        "Potongan kecil menjaga perhatian dan hasilnya tinggi; persiapan penting karena review individu adalah tempat sebagian besar cacatnya sebenarnya ditemukan, sebelum ada yang bertemu; dan pembingkaian yang membangun adalah yang menjaga orang tetap bersedia menyerahkan karyanya sama sekali. Yang keempat adalah kebalikannya — mengatribusikan cacat kepada individu adalah cara budaya review mati, dan silabusnya memperlakukan keamanan psikologis sebagai syarat berjalannya praktik itu alih-alih sebagai kesopanan opsional.",
    },
  ],
};
