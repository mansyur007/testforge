import type { LessonTranslation } from "../../../types";

export const sevenPrinciplesId: LessonTranslation = {
  slug: "seven-principles",
  title: "Tujuh prinsip pengujian",
  summary:
    "Tujuh pernyataan yang terdengar seperti hafalan sampai Anda membutuhkannya untuk mempertahankan sebuah keputusan di rapat rilis.",
  body: `
Prinsip-prinsip ini biasa diajarkan sebagai daftar untuk dihafalkan. Ia jauh
lebih berguna sebagai **argumen yang benar-benar akan Anda perlukan**, maka tiap
butir di bawah ini datang bersama situasi tempat Anda akan meraihnya.

## 1. Pengujian menunjukkan adanya cacat, bukan ketiadaannya

Anda bisa membuktikan sebuah bug ada. Anda tidak akan pernah bisa membuktikan
tidak ada lagi yang tersisa. Pengujian yang lolos menurunkan probabilitas
kegagalan; ia tidak menegakkan kebenaran.

*Anda akan memerlukannya ketika:* seseorang berkata "QA sudah menyetujui, berarti
sudah teruji" setelah sebuah insiden produksi. Rumusan yang jujur adalah "kami
menjalankan X, menemukan Y, dan area-area ini tidak tercakup."

## 2. Pengujian menyeluruh itu mustahil

Satu formulir dengan 10 isian yang masing-masing punya 10 nilai yang mungkin
berarti 10 miliar kombinasi. Tambahkan urutan dan waktu, dan keadaannya lebih
buruk lagi. Jadi Anda mengambil sampel — dan seluruh keahlian ini adalah soal
mengambil sampel dengan *baik*, memakai risiko dan teknik-teknik perancangan di
pelajaran berikutnya.

*Anda akan memerlukannya ketika:* ditanya "sudah diuji semuanya?" Jawabannya
adalah "belum, dan inilah yang saya prioritaskan beserta alasannya."

## 3. Pengujian yang dini menghemat waktu dan biaya

Cacat yang ditemukan di tahap kebutuhan berbiaya satu percakapan. Cacat yang sama
di produksi berbiaya hotfix, rollback, beban dukungan, dan kepercayaan. Meninjau
sebuah story juga pengujian.

*Anda akan memerlukannya ketika:* Anda diberi tahu bahwa pengujian dimulai
setelah pengembangan selesai.

## 4. Cacat mengelompok

Sejumlah kecil modul memuat sebagian besar cacat — halaman checkout, logika
perizinan, satu modul impor warisan itu. Bug tidak tersebar merata, jadi upaya
Anda pun tidak seharusnya merata. Data cacat masa lalu adalah prediktor terbaik
Anda tentang di mana cacat berikutnya bersarang.

*Anda akan memerlukannya ketika:* memutuskan ke mana dua hari regression
dihabiskan.

## 5. Pengujian menjadi tumpul (paradoks pestisida)

Jalankan suite yang sama selamanya dan ia berhenti menemukan apa pun — ia hanya
membunuh bug yang memang menjadi rancangannya. Suite perlu ditinjau, diperluas,
dan sesekali diganti dengan gagasan baru; dan sebagian upaya harus selalu
disisakan tanpa skrip (exploratory testing).

*Anda akan memerlukannya ketika:* "suite regression kami hijau di setiap
jalannya" disodorkan sebagai bukti kualitas. Hijau selamanya bisa berarti
suite-nya sudah berhenti mencari.

## 6. Pengujian bergantung pada konteks

Anda menguji alat pacu jantung dengan cara berbeda dari situs pemasaran. Teknik
yang sama, tetapi kedalaman, bukti, dan titik berhenti yang jauh berbeda.

*Anda akan memerlukannya ketika:* seseorang mengimpor proses dari tempat kerjanya
yang lama, bulat-bulat.

## 7. Ketiadaan kesalahan adalah kekeliruan berpikir

Anda bisa membangun perangkat lunak nyaris tanpa cacat yang tidak diinginkan
siapa pun, atau yang tidak menyelesaikan masalah penggunanya. Kesesuaian dengan
tujuan mengalahkan jumlah cacat.

*Anda akan memerlukannya ketika:* daftar bug sudah kosong dan fiturnya masih
saja keliru.

## Dua yang paling sering dikutipkan kepada Anda

Prinsip 1 dan 2 adalah yang muncul di wawancara kerja dan, kelak, di rapat-rapat
yang tidak nyaman. Belajarlah menyatakannya tanpa terdengar defensif:

> "Kami tidak bisa menguji setiap kombinasi, jadi kami menguji berdasarkan
> risiko: kegagalan pembayaran dan batas perizinan mendapat waktu paling banyak,
> matriks browser paling sedikit. Inilah yang karenanya belum tercakup."

Kalimat itu adalah seluruh pekerjaan ini.

**Selanjutnya:** teknik perancangan yang pertama — equivalence partitioning, cara
Anda mengubah "10 miliar kombinasi" menjadi "enam pengujian".
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Suite regression Anda sudah hijau selama enam bulan. Prinsip mana yang seharusnya membuat Anda gelisah?",
      choices: [
        { id: "a", text: "Pengujian menunjukkan adanya cacat" },
        { id: "b", text: "Pengujian menjadi tumpul — paradoks pestisida" },
        { id: "c", text: "Pengujian bergantung pada konteks" },
        { id: "d", text: "Pengujian yang dini menghemat waktu dan biaya" },
      ],
      explanation:
        "Sebuah suite hanya menangkap cacat yang memang menjadi rancangannya. Hijau terus-menerus bisa berarti produknya stabil, bisa juga berarti suite-nya berhenti mencari — dan itulah sebabnya suite perlu ditinjau dan diperluas, serta sebagian upaya harus tetap tanpa skrip.",
    },
    {
      id: "q2",
      stem: "Waktu regression Anda terbatas. Prinsip mana yang memberi tahu ke mana waktu itu dihabiskan?",
      choices: [
        { id: "a", text: "Cacat mengelompok" },
        { id: "b", text: "Pengujian menyeluruh itu mustahil" },
        { id: "c", text: "Ketiadaan kesalahan adalah kekeliruan berpikir" },
        { id: "d", text: "Pengujian bergantung pada konteks" },
      ],
      explanation:
        "Cacat tidak tersebar merata — segelintir modul memuat sebagian besarnya. Data cacat masa lalu adalah prediktor terbaik yang tersedia tentang di mana cacat berikutnya bersarang, jadi upaya sebaiknya mengikuti kelompok-kelompok itu alih-alih disebar rata.",
    },
    {
      id: "q3",
      stem: "Daftar bug sudah kosong dan fiturnya tetap belum tepat bagi pengguna. Prinsip mana yang menamai keadaan ini?",
      choices: [
        { id: "a", text: "Pengujian menunjukkan adanya cacat, bukan ketiadaannya" },
        { id: "b", text: "Pengujian yang dini menghemat waktu dan biaya" },
        { id: "c", text: "Ketiadaan kesalahan adalah kekeliruan berpikir" },
        { id: "d", text: "Pengujian menyeluruh itu mustahil" },
      ],
      explanation:
        "Perangkat lunak bisa nyaris bebas cacat dan tetap menyelesaikan masalah yang keliru. Kesesuaian dengan tujuan mengalahkan jumlah cacat, dan itulah sebabnya acceptance testing serta peninjauan kebutuhan ada berdampingan dengan pengujian fungsional.",
    },
  ],
};
