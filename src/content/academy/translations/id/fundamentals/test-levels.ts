import type { LessonTranslation } from "../../../types";

export const testLevelsId: LessonTranslation = {
  slug: "test-levels",
  title: "Level pengujian",
  summary:
    "Unit, integration, system, dan acceptance testing — apa yang bisa ditangkap masing-masing, dan apa yang secara struktural tidak bisa.",
  body: `
## Empat level, empat pertanyaan berbeda

Sebuah "level" ditentukan oleh **apa yang Anda uji dan terhadap spesifikasi
apa**. Tiap level hanya bisa menangkap kelas cacat tertentu. Justru itulah alasan
adanya empat level.

### 1. Component / unit testing

**Apa:** satu fungsi, kelas, atau modul, secara terisolasi, dengan
kolaboratornya dipalsukan.
**Terhadap:** desain rinci atau maksud kode itu sendiri.
**Ditulis oleh:** developer, hampir selalu.
**Menangkap:** aritmetika yang salah, null yang tak tertangani, off-by-one,
percabangan yang keliru.
**Tidak bisa menangkap:** apa pun tentang bagaimana dua bagian saling menyatu.
Suite unit test dengan coverage 100% tidak mengatakan apa pun tentang apakah
aplikasinya berjalan.

\`\`\`js
// Cepat, terisolasi, dan sama sekali buta terhadap ada-tidaknya API yang disuapinya.
expect(cartTotal([{ price: 1000, qty: 3 }])).toBe(3000);
\`\`\`

### 2. Integration testing

**Apa:** dua komponen atau lebih yang saling berbicara — atau layanan Anda
berbicara dengan basis data, antrean, atau API pihak ketiga.
**Terhadap:** arsitektur / desain antarmuka.
**Menangkap:** kontrak yang tidak cocok, asumsi yang keliru tentang sisi
seberang, serialisasi yang salah, transaksi yang tidak ter-rollback, header auth
yang hilang di jalan.

Dua ragam yang namanya perlu Anda tahu: **component integration** (modul-modul
di dalam satu aplikasi) dan **system integration** (sistem Anda terhadap sistem
lain — payment gateway, penyedia pengiriman).

Cacat integrasi yang klasik: front-end mengirim \`{ quantity: "3" }\` dan
back-end mengharapkan angka. Kedua suite unit test hijau. Fiturnya rusak.

### 3. System testing

**Apa:** keseluruhan aplikasi yang sudah terpasang, ujung ke ujung, di
environment yang menyerupai produksi.
**Terhadap:** kebutuhan sistem — fungsional *maupun* non-fungsional.
**Menangkap:** alur ujung-ke-ujung yang putus, perilaku yang salah lintas layar,
dan segala hal non-fungsional: performa, keamanan, kebergunaan, kompatibilitas.

Di sinilah sebagian besar upaya QA manual berada, dan di sinilah teknik-teknik
di track ini terbayar. Anda menguji sebagai pengguna sistem, tetapi dengan
dokumen kebutuhan terbuka di sebelah Anda.

### 4. Acceptance testing

**Apa:** sistem yang sama, tetapi pertanyaannya berubah — bukan "apakah ini
bekerja?" melainkan **"apakah kita menerimanya?"**
**Terhadap:** kebutuhan pengguna, proses bisnis, kontrak, regulasi.
**Dijalankan oleh:** pengguna, product owner, pelanggan, kadang regulator.

Bentuk yang umum:

- **UAT** — pengguna sungguhan menjalankan alur kerja mereka yang sungguhan.
- **Operational acceptance** — bisakah kita mencadangkannya, memulihkannya,
  memantaunya, men-deploy-nya pukul 2 pagi? (Dicintai tim ops, dilupakan semua
  orang lain.)
- **Acceptance kontraktual / regulatif** — checklist yang bisa berujung
  tuntutan hukum.
- **Alpha / beta** — alpha di tempat pengembang, beta di dunia nyata.

## Jebakannya: "sudah lolos system testing, berarti aman"

Tiap level buta terhadap apa yang berada di luar cakupannya. Sebuah fitur bisa
lolos di setiap level dan tetap salah, karena tidak satu pun dari level itu
menanyakan apakah kebutuhannya sendiri masuk akal. Itulah sebabnya acceptance
testing ada, dan sebabnya peninjauan kebutuhan (pelajaran sebelumnya) juga
termasuk pengujian.

## Bagaimana ini memetakan ke pekerjaan harian Anda

Di tim web modern, umumnya Anda akan melihat:

| Level | Siapa | Berjalan di mana |
|---|---|---|
| Unit | Developer | Di setiap commit, hitungan detik |
| Integration / API | Developer + QA | CI, detik sampai menit |
| System / E2E | QA | CI tiap malam + sebelum rilis, hitungan menit |
| Acceptance | PO / pengguna | Staging, sebelum rilis |

Ketika Anda sampai di [track otomasi](/id/academy/automation), tabel ini menjadi
piramida pengujian — sekaligus perdebatan tentang bentuknya.

## Uji pemahaman Anda

- Seorang pengguna bisa login tetapi foto profilnya tidak pernah muncul karena
  front-end meminta \`/avatar\` sementara layanannya menyajikan \`/avatars\`.
  Level mana yang seharusnya menangkapnya?
- Level mana yang akan menangkap "laporan butuh 40 detik untuk dirender dengan
  data satu tahun"?
- Kenapa coverage unit 100% adalah argumen yang lemah untuk merilis?

**Selanjutnya:** *tipe* pengujian — sumbu yang sama sekali berbeda, dan yang
paling sering tertukar dengan level.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Login bekerja, tetapi avatar tidak pernah muncul: front-end meminta /avatar sementara layanannya menyajikan /avatars. Level mana yang seharusnya menangkapnya?",
      choices: [
        { id: "a", text: "Component (unit) testing" },
        { id: "b", text: "Integration testing" },
        { id: "c", text: "Acceptance testing" },
        { id: "d", text: "Tidak ada — ini cacat desain" },
      ],
      explanation:
        "Kedua sisi bisa sama-sama benar secara terpisah dan tetap tidak sepakat soal kontrak di antara keduanya. Path, tipe, atau header yang tidak cocok adalah contoh baku cacat integrasi: tiap suite unit tetap hijau karena tidak satu pun unit pernah benar-benar berbicara dengan yang lain.",
    },
    {
      id: "q2",
      stem: "\"Laporan butuh 40 detik untuk dirender dengan data satu tahun.\" Ini biasanya ditemukan di level mana?",
      choices: [
        { id: "a", text: "Unit — fungsi query-nya lambat" },
        { id: "b", text: "System, di environment dengan volume data yang realistis" },
        { id: "c", text: "Integration — basis datanya terlibat" },
        { id: "d", text: "Ini bukan temuan yang bisa diuji" },
      ],
      explanation:
        "Perilaku non-fungsional memerlukan sistem yang sudah terpasang utuh dan data yang menyerupai produksi. Unit test pada query-nya tidak membuktikan apa pun tentang keseluruhan halaman, dan integration test dengan tiga baris data tidak akan pernah mereproduksi data satu tahun.",
    },
    {
      id: "q3",
      stem: "Kenapa coverage unit test 100% adalah argumen yang lemah untuk merilis?",
      choices: [
        { id: "a", text: "Ia tidak mengatakan apa pun tentang bagaimana komponen berperilaku bersama-sama" },
        { id: "b", text: "Coverage mengukur apa yang dieksekusi, bukan apakah hasilnya benar" },
        { id: "c", text: "Ia tidak bisa memberi tahu Anda apakah kebutuhannya sendiri masuk akal" },
        { id: "d", text: "Unit test tidak bisa diandalkan dan biasanya flaky" },
      ],
      explanation:
        "Coverage adalah metrik eksekusi atas potongan-potongan yang terisolasi. Ia buta terhadap integrasi, buta terhadap apakah asersinya bermakna, dan buta terhadap apakah spesifikasinya benar sejak awal — dan justru itulah alasan keempat level ada. Unit test yang flaky bukan persoalannya; justru unit test adalah pengujian yang paling stabil.",
    },
  ],
};
