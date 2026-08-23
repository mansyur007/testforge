import type { LessonTranslation } from "../../../types";

export const boundaryValueAnalysisId: LessonTranslation = {
  slug: "boundary-value-analysis",
  title: "Boundary value analysis",
  summary:
    "Bug tinggal di tepi. BVA adalah teknik dengan rasio cacat-per-pengujian terbaik dalam pengujian perangkat lunak.",
  body: `
## Kenapa tepi itu rapuh

Hampir setiap rentang di perangkat lunak diwujudkan lewat sebuah perbandingan,
dan perbandingan adalah tempat jari-jari tergelincir:

\`\`\`js
if (qty > 0 && qty < 99) { ... }   // 99 ditolak diam-diam
if (age >= 18) { ... }             // benar
if (age > 18) { ... }              // yang berumur 18 ditolak
for (let i = 0; i <= items.length; i++)  // membaca satu langkah melewati ujung
\`\`\`

Tidak ada yang salah menulis \`if (qty === 47)\`. Bagian tengah sebuah partisi
itu aman; **batas**-nya yang jadi rumah bagi off-by-one. Itulah sebabnya boundary
value analysis menemukan lebih banyak cacat per pengujian dibanding teknik dasar
mana pun — dan sebabnya ini hal pertama yang diminta pewawancara untuk Anda
peragakan.

BVA bukan pengganti [equivalence
partitioning](/id/academy/fundamentals/equivalence-partitioning) — ia paruh
kedua dari teknik itu. Partisi dulu, baru uji tepi setiap partisi.

## BVA 2 nilai (bentuk yang lazim)

Untuk setiap batas, uji **nilai di masing-masing sisinya**: nilai terakhir dari
satu partisi dan nilai pertama dari partisi berikutnya.

Kuantitas ShopMini, rentang valid **1 … 99**:

| Batas | Nilai yang diuji | Diharapkan |
|---|---|---|
| Tepi bawah | **0** | ditolak |
| | **1** | diterima |
| Tepi atas | **99** | diterima |
| | **100** | ditolak |

Empat pengujian. Tambahkan satu nilai di tengah partisi (misalnya 42) kalau Anda
ingin sanity check, dan jadilah lima.

## BVA 3 nilai

Sebagian standar (dan sebagian pewawancara) menginginkan **di bawah, tepat di,
dan di atas** setiap batas: 0, 1, 2 dan 98, 99, 100. Biayanya dua pengujian
tambahan dan tangkapannya kelas kekeliruan yang lebih sempit (\`>=\` ditulis
\`>\` *sekaligus* off-by-one di sebelahnya). Pakai kalau ongkos kegagalannya
tinggi; 2 nilai adalah bawaan sehari-hari.

## Batas ada di mana-mana, bukan cuma di kolom angka

Inilah yang memisahkan orang yang "tahu BVA" dari orang yang memakainya:

| Hal | Batas yang sebaiknya Anda uji |
|---|---|
| Kolom teks, 6–10 karakter | 5, 6, 10, 11 karakter |
| Unggahan berkas, maksimal 5 MB | tepat 5 MB, 5 MB + 1 byte, berkas 0 byte |
| Rentang tanggal "30 hari terakhir" | hari ini, 30 hari lalu, 31 hari lalu, pergantian DST, 29 Februari |
| Paginasi, 20 per halaman | 19, 20, 21 item; halaman 1; halaman terakhir; satu halaman setelahnya |
| Sesi kedaluwarsa 15 menit | 14:59, 15:01 |
| Diskon pada ≥ Rp 500.000 | 499.999 / 500.000 / 500.001 |
| Daftar dengan batas 99 | 0 item (empty state!), 1, 99, 100 |
| Uang | 0,00, 0,01, negatif, satuan terkecil mata uangnya, nilai yang perlu pembulatan |

**Nol dan kosong adalah batas.** Empty state — tanpa hasil, tanpa item, belum
ada data — adalah layar yang paling sering rusak di produk mana pun, karena di
mesin developer selalu ada datanya.

## Awasi batas yang tidak diberitahukan kepada Anda

Kebutuhan menyebutkan batas bisnis. Sistem juga punya batas **teknis**, dan tak
seorang pun mendokumentasikannya: limit \`int\`, panjang VARCHAR, timeout
unggahan, batas page size di sebuah API, batas 1000 baris di sebuah ekspor.
Ketika Anda menemukan salah satunya, itu sendiri sudah temuan — entah perlu
ditangani, entah perlu didokumentasikan.

## Contoh dikerjakan: aturan diskon

> Pesanan **di atas** Rp 500.000 gratis ongkir.

Kata "di atas" memikul beban besar. Uji tepat 500.000 — di sinilah kerancuan
kebutuhan berubah jadi cacat, karena separuh tim membaca "di atas" sebagai "≥".
Kalau pengujian Anda pada tepat 500.000 berselisih dengan pembacaan developer,
yang Anda temukan bukan bug kode; yang Anda temukan bug **kebutuhan**, dan itu
lebih berharga.

## 🛠 Giliran Anda, di TestForge

Latihan sandbox untuk pelajaran ini: tulis test case batas untuk kolom kuantitas
ShopMini di proyek sungguhan, dan checker-nya mencari empat nilai tepi di atas
(0, 1, 99, 100) dengan hasil yang diharapkan jelas di masing-masing. Yang paling
sering terlewat adalah **99** — orang menguji 0, 1, 100 lalu berhenti, sehingga
tepi *valid* teratas, yang paling mungkin rusak, tidak teruji.

Sementara itu, perluas daftar partisi kemarin dengan tepi-tepinya. Sekarang Anda
mestinya punya sekitar sembilan sampai sebelas case untuk satu kolom angka — dan
setiap satunya layak ada di sana.

## Periksa pemahaman Anda

- Aturannya "kata sandi harus 8–64 karakter". Sebutkan enam nilai yang akan Anda
  uji untuk BVA 3 nilai.
- Kenapa berkas 0 byte layak diuji pada unggahan yang dibatasi 5 MB?
- Nilai tunggal mana yang akan Anda uji lebih dulu kalau Anda hanya punya satu
  kesempatan untuk "pesanan di atas Rp 500.000 gratis ongkir"?

**Selanjutnya:** decision table, untuk saat aturannya berhenti berupa satu
rentang dan mulai berkombinasi.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Kuantitas valid adalah 1–99. Seseorang menguji 0, 1, dan 100. Nilai batas mana yang mereka lewatkan, dan kenapa itu yang paling berarti?",
      choices: [
        { id: "a", text: "50 — bagian tengah rentangnya tidak teruji" },
        { id: "b", text: "99 — tepi valid teratas, yang paling mungkin ditolak secara keliru" },
        { id: "c", text: "-1 — angka negatif tidak teruji" },
        { id: "d", text: "Tidak ada yang terlewat; 0, 1, dan 100 sudah BVA 2 nilai yang lengkap" },
      ],
      explanation:
        "Setiap batas butuh satu nilai di kedua sisinya. Mereka mencakup tepi bawah sepenuhnya dan hanya sisi invalid dari tepi atas, sehingga kondisi yang ditulis qty < 99 alih-alih qty <= 99 akan lolos dari semua pengujian yang mereka jalankan sambil diam-diam menolak pesanan sah yang terbesar.",
    },
    {
      id: "q2",
      stem: "Aturannya \"kata sandi harus 8–64 karakter\". Untuk BVA 3 nilai di batas bawah, panjang mana yang Anda uji?",
      choices: [
        { id: "a", text: "8, 9, 10" },
        { id: "b", text: "7, 8, 9" },
        { id: "c", text: "6, 7, 8" },
        { id: "d", text: "1, 8, 64" },
      ],
      explanation:
        "BVA tiga nilai mengambil nilai di bawah batas, batas itu sendiri, dan nilai di atasnya. Untuk minimum 8 berarti 7, 8, dan 9 — cukup untuk menangkap baik off-by-one maupun operator perbandingan yang ditulis terbalik.",
    },
    {
      id: "q3",
      stem: "Sebuah unggahan dibatasi 5 MB. Mana di antara ini yang merupakan batas yang layak diuji?",
      choices: [
        { id: "a", text: "Berkas berukuran tepat 5 MB" },
        { id: "b", text: "Berkas satu byte di atas 5 MB" },
        { id: "c", text: "Berkas 0 byte" },
        { id: "d", text: "Berkas sekitar 2 MB" },
      ],
      explanation:
        "Tepat di batas dan satu byte di atasnya menguji perbandingannya sendiri, dan nol adalah batas yang semua orang lupakan — input kosong rutin menempuh jalur kode yang berbeda dan jatuh di tempat yang berkas kecil justru aman. Berkas di tengah rentang duduk nyaman di dalam partisi dan sedikit sekali memberi tahu Anda.",
    },
  ],
};
