import type { LessonTranslation } from "../../../types";

export const testTypesId: LessonTranslation = {
  slug: "test-types",
  title: "Tipe pengujian",
  summary:
    "Pengujian fungsional, non-fungsional, white-box, dan yang terkait perubahan — serta kenapa smoke dan regression bukan hal yang sama.",
  body: `
## Level menjawab "di bagian mana", tipe menjawab "apanya"

Sebuah **level** adalah *potongan sistem mana* yang Anda uji (unit → acceptance).
Sebuah **tipe** adalah *properti apa* yang Anda ujikan padanya. Keduanya sumbu
yang saling bebas: Anda bisa melakukan performance testing (tipe) di level
integration, atau pengujian fungsional di level acceptance.

Ada empat keluarga.

## 1. Functional testing — "apa yang dikerjakannya?"

Apakah sistem melakukan apa yang semestinya ia lakukan? Setiap teknik di sisa
track ini — equivalence partitioning, boundary value, decision table, state
transition — adalah cara merancang pengujian fungsional.

Coverage di sini diukur terhadap *kebutuhan*: kriteria penerimaan mana yang sudah
punya pengujian, mana yang belum.

## 2. Non-functional testing — "seberapa baik ia mengerjakannya?"

Propertinya, bukan perilakunya. Inilah keluarga yang paling sering dilewati, dan
yang kemudian menenggelamkan sebuah peluncuran.

| Tipe | Pertanyaannya | Pemeriksaan awal yang murah |
|---|---|---|
| Performance / load | Cukup cepat, pada trafik sebesar apa? | Ukur waktu halaman paling lambat dengan volume data yang realistis |
| Reliability | Apakah ia tetap hidup? Bisa pulih? | Putuskan koneksi basis data di tengah request |
| Security | Bisakah seseorang melakukan yang tidak boleh? | Ganti ID di URL dengan milik orang lain |
| Usability | Bisakah orang sungguhan menuntaskan tugasnya? | Amati satu orang, diam-diam saja |
| Compatibility | Browser/perangkat/OS yang mana? | Dua yang benar-benar terlihat di analytics Anda |
| Accessibility | Bisakah dipakai dengan keyboard, dengan screen reader? | Tab-kan saja melewatinya. Cukup tab saja |
| Portability | Bisakah kita memasang/memigrasikannya? | Ikuti dokumen pemasangan Anda sendiri di mesin yang bersih |

Anda tidak perlu menjadi ahli di semuanya untuk mengujinya secara berguna.
"Halaman pencarian butuh 11 detik dengan 50.000 produk" adalah temuan yang bisa
dihasilkan seorang junior dalam satu sore, dan yang belum dicari siapa pun di tim.

## 3. White-box (pengujian struktural) — "kode mana yang berjalan?"

Pengujian yang diturunkan dari struktur, bukan dari spesifikasi: statement
coverage, branch coverage, path coverage. Sebagian besar berada di wilayah
developer, sebagian besar di level unit — tetapi *gagasannya* penting untuk Anda:
coverage memberi tahu apa yang **dieksekusi**, tidak pernah apakah hasilnya
**benar**. Pengujian yang menjalankan setiap baris dan tidak mengasersi apa pun
punya coverage 100% dan nilai nol.

## 4. Change-related testing — "apakah kita merusaknya?"

Dua nama yang sering dipertukarkan orang, padahal tidak boleh:

**Confirmation testing (pengujian ulang)** — cacatnya sudah diperbaiki; Anda
menjalankan *langkah-langkah yang sama yang tadinya gagal* untuk memastikan ia
benar-benar sudah beres. Sempit, terarah, wajib.

**Regression testing** — ada perubahan; Anda menjalankan pengujian atas area yang
mungkin terpengaruh perubahan itu, untuk melihat apakah sesuatu yang tadinya
bekerja kini tidak lagi. Luas, berulang, dan kandidat nomor satu untuk otomasi —
justru karena ia pengujian yang sama, berulang-ulang, selamanya.

**Smoke testing** adalah hal ketiga: sekumpulan pemeriksaan tipis dan cepat —
bisakah saya login, apakah halaman depan tampil, bisakah saya membuat satu
pesanan — dijalankan *paling awal*, untuk memutuskan apakah build-nya layak diuji
sama sekali. Smoke soal **triase**, regression soal **perubahan**. Suite smoke
yang butuh 40 menit sudah berhenti menjadi suite smoke.

Pembagian mental yang berguna:

\`\`\`
build ter-deploy
  └─ smoke  (5 menit)  → kalau merah, tolak build-nya, jangan buang sehari
       └─ pengujian fitur baru (fungsional, dirancang dari story-nya)
            └─ regression  (di sekitar yang berubah)
                 └─ confirmation (tiap cacat yang diperbaiki, sebelum ditutup)
\`\`\`

## Memilih tipe di bawah tekanan waktu

Anda tidak akan menjalankan setiap tipe. Pilih berdasarkan risiko:

- Ada uang yang berpindah → security + reliability lebih dulu.
- Formulir pendaftaran publik → compatibility + accessibility, karena pengguna
  Anda tidak memakai laptop Anda.
- Perkakas admin internal yang dipakai enam orang → fungsional saja adalah
  keputusan yang bisa dipertanggungjawabkan. Katakan itu terang-terangan, di
  dalam test plan, supaya ia menjadi keputusan dan bukan kelalaian.

## Uji pemahaman Anda

- Seorang developer memperbaiki bug yang Anda laporkan. Anda menjalankan
  langkah-langkah awal Anda. Apa nama kegiatan itu, dan apakah itu cukup?
- Suite regression Anda butuh 6 jam dan menghambat setiap rilis. Tipe pengujian
  apa yang akan Anda bangun lebih dulu untuk melepaskan tim dari kemacetan?
- "Tombol checkout tidak bisa dijangkau dengan keyboard" masuk ke mana?

**Selanjutnya:** tujuh prinsip — pelajaran terpendek di sini, dan yang paling
banyak menghemat perdebatan Anda.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Seorang developer memperbaiki cacat yang Anda laporkan. Anda menjalankan ulang langkah-langkah awal Anda dan semuanya lolos. Apa yang baru saja Anda lakukan, dan apakah itu cukup?",
      choices: [
        { id: "a", text: "Regression testing — ya, itu menutup laporannya" },
        { id: "b", text: "Confirmation testing — belum, area di sekitar perubahan itu masih butuh regression" },
        { id: "c", text: "Smoke testing — ya, build-nya sudah bagus" },
        { id: "d", text: "Acceptance testing — belum, product owner harus menyetujuinya" },
      ],
      explanation:
        "Menjalankan ulang langkah yang tadinya gagal adalah confirmation testing, dan itu hanya membuktikan bahwa satu jalur itu kini bekerja. Sebuah perbaikan bisa merusak tetangganya, jadi radius dampak perubahan itu masih perlu regression sebelum cacatnya ditutup.",
    },
    {
      id: "q2",
      stem: "Suite regression Anda butuh enam jam dan menghambat setiap rilis. Apa yang Anda bangun lebih dulu untuk melepaskan kemacetan tim?",
      choices: [
        { id: "a", text: "Suite smoke berisi beberapa pemeriksaan kritis yang cepat" },
        { id: "b", text: "Lebih banyak kasus regression, supaya masalah ditemukan lebih awal" },
        { id: "c", text: "Pengujian performa atas halaman-halaman terlambat" },
        { id: "d", text: "Tidak ada — suite-nya memang harus berjalan penuh setiap kali" },
      ],
      explanation:
        "Smoke testing adalah triase: segenggam pemeriksaan cepat yang memutuskan apakah sebuah build layak diuji sama sekali. Ia tidak menggantikan regression, tetapi ia menghentikan tim membakar enam jam untuk build yang bahkan tidak bisa login.",
    },
    {
      id: "q3",
      stem: "\"Tombol checkout tidak bisa dijangkau dengan keyboard.\" Pengujian jenis apa yang menemukan ini?",
      choices: [
        { id: "a", text: "Pengujian fungsional" },
        { id: "b", text: "Pengujian white-box" },
        { id: "c", text: "Non-fungsional — accessibility" },
        { id: "d", text: "Pengujian terkait perubahan" },
      ],
      explanation:
        "Tombolnya melakukan apa yang semestinya ketika diklik, jadi perilakunya benar — yang gagal adalah atribut kualitas tentang bagaimana ia bisa dipakai. Itu pengujian non-fungsional, dan accessibility adalah yang paling murah untuk dimulai dari keluarga itu: tab-kan saja melewati halamannya.",
    },
  ],
};
