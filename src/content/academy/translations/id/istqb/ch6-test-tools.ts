import type { LessonTranslation } from "../../../types";

export const ch6TestToolsId: LessonTranslation = {
  slug: "ch6-test-tools",
  title: "Bab 6 — Alat pengujian",
  summary:
    "Dukungan alat bagi pengujian, dan risiko mengadopsi salah satunya.",
  body: `
## Bab terkecil di silabusnya

Bab 6 menyumbang **2 dari 40 pertanyaan** di paket latihan kami, dari **dua
tujuan pembelajaran** — satu K2, satu K1. Ia satu-satunya bab yang masuk akal
Anda harapkan bisa dicakup sepenuhnya dalam satu kali duduk.

| Bagian | Tujuan | Tingkat K |
|---|---|---|
| 6.1 Dukungan alat bagi pengujian | Bagaimana jenis-jenis alat menopang pengujian | K2 |
| 6.2 Manfaat dan risiko otomasi pengujian | Kedua sisi mengadopsi salah satunya | K1 |

Dua pertanyaan bukan berarti nol — itu 5% kertasnya, dan garis kelulusannya 65%,
jadi keduanya termasuk nilai termurah yang tersedia. Jangan melewati bab sekecil
ini justru karena ia kecil.

## 6.1 Bagaimana alat menopang pengujian

Silabusnya mengelompokkan alat menurut **aktivitas apa yang ditopangnya**, dan
pengelompokan itulah yang diminta sebuah pertanyaan K2 untuk Anda kenali:

| Dukungan alat untuk | Contoh apa yang dilakukannya |
|---|---|
| **Test management dan testware** | Melacak case, run, hasil, cacat, kebutuhan, ketertelusuran |
| **Pengujian statis** | Dukungan review, dan analisis statis atas kode serta artefak lain |
| **Test design dan implementation** | Membangkitkan case, data uji, dan test procedure |
| **Eksekusi pengujian dan cakupan** | Menjalankan pengujian secara otomatis, membandingkan hasil, mengukur cakupan |
| **Pengujian non-fungsional** | Pembangkitan performa dan beban, scanning keamanan, pemantauan |
| **DevOps** | Pipeline, otomasi build dan deploy, pipa-pipa tempat pengujiannya berjalan |
| **Kolaborasi** | Komunikasi dan pemahaman bersama lintas tim |
| **Skalabilitas dan standardisasi** | Mesin virtual, kontainer, environment yang dibakukan |
| **Apa pun lainnya** | Spreadsheet, klien SQL — sebuah alat adalah apa pun yang menopang sebuah aktivitas |

Baris terakhir itu lebih penting daripada kelihatannya. **Sebuah alat tidak harus
berupa produk pengujian.** Sebuah spreadsheet yang dipakai membangun decision
table, atau klien basis data yang dipakai memverifikasi apa yang benar-benar
tersimpan, adalah dukungan alat bagi pengujian persis dalam arti yang dimaksud
silabusnya.

TestForge sendiri duduk di baris pertama — test management dan testware — dan
itu juga sebabnya latihan-latihan di Academy ini memakainya dengan cara itu
alih-alih sebagai alat eksekusi pengujian.

## 6.2 Manfaat dan risiko otomasi pengujian

Tujuan pembelajaran K1, jadi pengenalan sudah cukup — tapi kenali **kedua
kolomnya**, karena sebuah pertanyaan nyaris selalu meminta satu sisi tertentu
lalu menawarkan sisi yang lain sebagai pengecoh.

| Manfaat | Risiko |
|---|---|
| Waktu yang dihemat dengan menyingkirkan kerja manual berulang | Harapan terhadap alatnya bisa tidak realistis |
| Konsistensi lebih besar — alatnya melakukan hal yang sama setiap kali | Waktu, biaya, dan usaha memperkenalkannya diremehkan |
| Pengukuran yang objektif, misalnya cakupan | Usaha **merawat** aset pengujiannya diremehkan |
| Akses lebih mudah ke informasi tentang pengujiannya — statistik dan laporan | Alatnya bisa diandalkan alih-alih berpikir, menggantikan test design dengan output alatnya |
| | Kendali versi testware-nya bisa terabaikan |
| | Hubungan dan interoperabilitas antaralat bisa terlewat |
| | Vendornya bisa gagal, menarik dukungan, atau menjual produknya |
| | Dukungan sumber terbuka bisa berhenti, atau proyeknya ditinggalkan |
| | Alat yang dipilih bisa tidak cocok dengan platformnya, atau tidak kompatibel |

**Dua risiko yang layak dihafal**, karena keduanya paling sering diujikan dan
paling benar: **usaha perawatannya rutin diremehkan**, dan **sebuah alat bisa
menggantikan berpikir alih-alih menopangnya** — sebuah suite otomatis bertambah
besar, terus lulus, lalu diam-diam berhenti dirancang.

Dua poin lagi yang dibuat silabusnya tentang adopsi:

- **Jalankan sebuah pilot** sebelum menggelar sebuah alat secara luas, untuk
  mempelajari apa yang sesungguhnya dituntutnya dan untuk memutuskan apakah cara
  Anda bekerja harus berubah.
- **Keberhasilannya bukan pembeliannya.** Ia bergantung pada penyesuaian proses
  agar cocok dengan alatnya, penyediaan pelatihan dan pendampingan, penetapan
  pedoman pemakaian, dan pengumpulan informasi tentang pemakaian alatnya yang
  sebenarnya — alat yang tidak seorang pun dilatih memakainya adalah barang rak
  dengan tagihan terlekat.

Track otomasi T3 adalah versi praktisi dari seluruh bab ini, dan pelajaran
framework-nya membuat argumen yang sama panjang lebar: yang Anda bangun adalah
sebuah lingkaran umpan balik, bukan tumpukan skrip.

## Perbedaan yang menentukan nilai

| Pasangan yang tertukar | Garis pemisahnya |
|---|---|
| Manfaat / risiko otomasi | Kedua daftarnya ada; pertanyaannya menginginkan salah satunya |
| Alat / produk pengujian | Alat apa pun yang menopang sebuah aktivitas terhitung — termasuk spreadsheet |
| Membeli sebuah alat / mengadopsinya | Pilot, pelatihan, pedoman, dan penyesuaian prosesnya |
| Konsistensi / kebenaran | Sebuah alat mengulang dengan andal; ia tidak tahu apa yang benar |
| Pengukuran cakupan / pengujian yang baik | Sebuah angka yang objektif, bukan penilaian tentang nilainya |

## Latih dengan drill

Delapan pertanyaan, tanpa batas waktu:

**[Kuis bab 6 →](/academy/istqb/practice-exam/chapter/6)** — simulator ujiannya
berbahasa Inggris.

Dengan hanya dua tujuan pembelajaran di belakangnya, apa pun yang kurang dari
nilai penuh di sini layak dibayar dengan bacaan kedua atas dua tabel di atas —
ini satu-satunya bab yang cakupan penuhnya sungguh-sungguh bisa dicapai.

**Selanjutnya:** strategi ujian — pengaturan waktunya, gaya pertanyaannya, dan
apa yang dilakukan dengan sepuluh menit terakhir.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Mana di antara ini yang merupakan risiko otomasi pengujian sebagaimana disajikan silabusnya?",
      choices: [
        {
          id: "a",
          text: "Usaha yang dibutuhkan untuk merawat aset pengujiannya diremehkan",
        },
        {
          id: "b",
          text: "Alatnya diandalkan alih-alih berpikir, sehingga test design digantikan output alatnya",
        },
        {
          id: "c",
          text: "Vendornya bisa menarik dukungan, atau proyek sumber terbukanya ditinggalkan",
        },
        {
          id: "d",
          text: "Pengujian otomatis dieksekusi lebih konsisten daripada yang manual",
        },
      ],
      explanation:
        "Usaha perawatan adalah risiko yang paling sering benar-benar terjadi — sebuah suite ditulis sekali dan dirawat bertahun-tahun, dan biaya keduanya jarang dianggarkan. Ketergantungan berlebih adalah yang lebih halus: suite yang terus bertambah dan selalu lulus bisa diam-diam berhenti dirancang, dan itu jebakan yang sama dengan prinsip paradoks pestisida dari bab 1. Berhentinya dukungan vendor dan sumber terbuka adalah risiko kebergantungan yang nyata dan disebut eksplisit silabusnya. Konsistensi eksekusi adalah manfaat, bukan risiko, dan ia muncul di sini karena pertanyaan di bab ini rutin mencampurkan satu kolom ke kolom yang lain.",
    },
    {
      id: "q2",
      stem: "Seorang tester memakai spreadsheet untuk membangun sebuah decision table dan klien SQL untuk memverifikasi apa yang tersimpan. Dalam istilah silabusnya, apakah ini dukungan alat bagi pengujian?",
      choices: [
        {
          id: "a",
          text: "Ya — sebuah alat adalah apa pun yang menopang sebuah aktivitas pengujian, dan keduanya masing-masing menopang test design dan eksekusi pengujian",
        },
        {
          id: "b",
          text: "Tidak — hanya produk pengujian khusus yang terhitung sebagai alat pengujian",
        },
        {
          id: "c",
          text: "Hanya klien SQL-nya yang terhitung, karena ia menyentuh sistem yang diuji",
        },
        {
          id: "d",
          text: "Hanya kalau keduanya diadopsi secara formal lewat proses pemilihan alat",
        },
      ],
      explanation:
        "Silabusnya mengelompokkan alat menurut aktivitas yang ditopangnya alih-alih menurut bagaimana ia dipasarkan, dan ia eksplisit membolehkan bahwa alat yang menopang aktivitas pengujian mana pun adalah alat pengujian. Spreadsheet-nya menopang test design dan implementation; klien basis datanya menopang eksekusi dengan memungkinkan Anda memverifikasi apa yang benar-benar tersimpan alih-alih apa yang ditampilkan layarnya. Mensyaratkan proses pemilihan yang formal mencampuradukkan praktik adopsi dengan definisinya — nasihat tentang pilot, pelatihan, dan pedoman berlaku untuk menggelar sebuah alat ke seluruh tim, bukan untuk apakah sesuatu terhitung sebagai alat.",
    },
  ],
};
