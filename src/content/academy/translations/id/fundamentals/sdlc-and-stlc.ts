import type { LessonTranslation } from "../../../types";

export const sdlcAndStlcId: LessonTranslation = {
  slug: "sdlc-and-stlc",
  title: "SDLC dan STLC",
  summary:
    "Bagaimana software dibangun, di mana pengujian duduk di dalamnya, dan kenapa “shift left” bukan sekadar slogan.",
  body: `
## SDLC: bagaimana software dibangun

**Software Development Life Cycle** hanyalah urutan aktivitas yang mengubah
sebuah gagasan menjadi software yang berjalan: kebutuhan → desain →
implementasi → pengujian → deployment → pemeliharaan.

Yang berbeda antar metodologi bukan aktivitas *mana* yang terjadi, melainkan
**seberapa besar ukuran batch**-nya dan **seberapa sering** dijalankan.

| Model | Ukuran batch | Pengujian terjadi | Anda akan menemuinya di |
|---|---|---|---|
| Waterfall | Seluruh produk | Sekali, menjelang akhir | Pemerintahan, medis, sebagian perbankan |
| V-model | Seluruh produk | Tiap fase pembangunan punya level pengujian pasangannya, direncanakan di awal | Pekerjaan teregulasi / safety-critical |
| Iteratif / inkremental | Sepotong | Setiap iterasi | Tim enterprise yang lebih lama |
| Agile (Scrum, Kanban) | Satu story | Terus-menerus, di dalam sprint | Mayoritas perusahaan produk saat ini |
| DevOps / CD | Satu commit | Di setiap push, otomatis | Tim web modern |

V-model layak dipahami meskipun Anda tidak pernah bekerja dengannya, karena ia
menggambarkan satu hal terpenting dalam pengujian: **setiap tingkat spesifikasi
punya tingkat pengujian yang memverifikasinya.**

\`\`\`
Kebutuhan ────────────────────────► Acceptance testing
   Desain sistem ────────────────► System testing
      Arsitektur ──────────────► Integration testing
         Desain rinci ───────► Component (unit) testing
                    Kode
\`\`\`

Baca menurun di sisi kiri, lalu menaik di sisi kanan. Acceptance testing
menjawab "apakah kita membangun hal yang benar?" terhadap kebutuhan. Unit
testing menjawab "apakah fungsi ini melakukan apa yang dimaksud penulisnya?".
Mencampuradukkan keduanya adalah cara sebuah tim berakhir dengan unit coverage
90% dan produk yang tidak bisa dipakai checkout oleh siapa pun.

## STLC: bagaimana pengujian dikerjakan

**Software Testing Life Cycle** adalah gagasan yang sama, diterapkan pada
pekerjaan Anda sendiri. Enam fase, dan semuanya berulang mengikuti irama rilis
tim Anda — sekali per rilis di waterfall, sekali per story di Agile.

1. **Analisis kebutuhan.** Baca story-nya. Temukan yang hilang, rancu, atau
   saling bertentangan. *Output: pertanyaan, dan daftar hal yang bisa diuji.*
2. **Perencanaan pengujian.** Cakupan, risiko, apa yang akan diuji dan apa yang
   sengaja tidak, environment, siapa mengerjakan apa, kapan Anda berhenti.
   *Output: sebuah test plan — satu halaman sudah cukup.*
3. **Perancangan pengujian.** Ubah kebutuhan menjadi test case memakai
   teknik-teknik di track ini. *Output: test case dan data uji.*
4. **Penyiapan environment.** Tempat untuk menjalankan, dengan data yang
   menyerupai kenyataan. Sering kali justru inilah yang membuat Anda tertunda.
5. **Eksekusi pengujian.** Jalankan; catat hasilnya; ajukan cacat; uji ulang
   perbaikannya. *Output: hasil, laporan bug.*
6. **Penutupan pengujian.** Apa yang kita pelajari? Apa yang lolos ke produksi
   dan kenapa? *Output: ringkasan dan, jujur saja, test case yang lebih baik
   lain kali.*

Dua gagasan entry/exit mengalir di keenam fase itu:

- **Entry criteria** — apa yang harus benar sebelum sebuah fase dimulai
  (misalnya "build sudah ter-deploy ke staging, smoke lolos").
- **Exit criteria** — apa yang harus benar untuk menyebutnya selesai (misalnya
  "semua case P1 dieksekusi, tidak ada cacat critical yang terbuka, seluruh
  acceptance criteria tercakup"). Perhatikan bahwa "tidak ada bug tersisa" tidak
  pernah menjadi exit criterion, karena hal itu tidak bisa dicapai.

## Shift left, dan kenapa itu menguntungkan

Biaya memperbaiki cacat naik seiring makin telatnya Anda menemukannya —
kerancuan di tahap kebutuhan berbiaya satu percakapan, kerancuan yang sama
ditemukan di produksi berbiaya hotfix, rollback, tiket dukungan, dan
kepercayaan.

"Shift left" berarti memindahkan aktivitas pengujian lebih awal: meninjau
kebutuhan, hadir di diskusi desain, menulis acceptance criteria *bersama*
product owner, berpasangan dengan developer memikirkan ide unit test. Tidak satu
pun dari itu mengeksekusi test case, dan semuanya adalah pengujian.

Versi praktisnya untuk pekerjaan pertama Anda: **ketika sebuah story masuk
refinement, baca dan bawalah tiga pertanyaan.** Kebiasaan itu saja akan mengubah
cara tim memandang Anda.

## Uji pemahaman Anda

- Di V-model, level pengujian mana yang memverifikasi dokumen *kebutuhan*?
- Tim Anda merilis setiap hari dari \`main\`. Apa yang terjadi pada fase-fase
  STLC — apakah semuanya hilang?
- Sebutkan satu exit criterion yang benar-benar bisa Anda ukur.

**Selanjutnya:** empat level pengujian, secara rinci.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Di V-model, level pengujian mana yang memverifikasi dokumen kebutuhan?",
      choices: [
        { id: "a", text: "Component (unit) testing" },
        { id: "b", text: "Integration testing" },
        { id: "c", text: "System testing" },
        { id: "d", text: "Acceptance testing" },
      ],
      explanation:
        "Setiap tingkat spesifikasi berpasangan dengan level pengujian yang memverifikasinya: desain rinci dengan unit, arsitektur dengan integration, desain sistem dengan system testing, dan kebutuhan dengan acceptance testing — itulah sebabnya acceptance menanyakan apakah kita membangun hal yang benar, bukan apakah kodenya bekerja.",
    },
    {
      id: "q2",
      stem: "Tim Anda merilis ke produksi beberapa kali sehari. Apa yang terjadi pada keenam fase STLC?",
      choices: [
        { id: "a", text: "Semuanya hilang — continuous delivery menggantikannya" },
        { id: "b", text: "Semuanya tetap terjadi, tapi per story alih-alih per rilis" },
        { id: "c", text: "Hanya eksekusi yang bertahan; perencanaan dan perancangan ditiadakan" },
        { id: "d", text: "Semuanya berpindah sepenuhnya ke pekerjaan para developer" },
      ],
      explanation:
        "Fase adalah aktivitas, bukan kalender. Merilis lebih cepat mengubah ukuran batch dan iramanya, jadi analisis, perencanaan, perancangan, penyiapan, eksekusi, dan penutupan terjadi untuk setiap story alih-alih sekali per rilis — semuanya menjadi lebih kecil dan lebih sering, bukan menjadi opsional.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang merupakan exit criterion yang bisa dipakai?",
      choices: [
        { id: "a", text: "Tidak ada bug tersisa di produk" },
        { id: "b", text: "Tim merasa yakin terhadap rilis ini" },
        { id: "c", text: "Semua case P1 dieksekusi dan tidak ada cacat critical yang terbuka" },
        { id: "d", text: "Pengujian sudah berjalan dua minggu penuh" },
      ],
      explanation:
        "Sebuah exit criterion harus bisa diukur dan bisa dicapai. \"Tidak ada bug tersisa\" tidak bisa dibuktikan, keyakinan bukan bukti, dan durasi tetap tidak mengatakan apa pun tentang cakupan — sedangkan jumlah case yang dieksekusi ditambah severity cacat yang terbuka bisa diperiksa siapa saja.",
    },
  ],
};
