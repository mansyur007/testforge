import type { LessonTranslation } from "../../../types";

export const defectLifecycleId: LessonTranslation = {
  slug: "defect-lifecycle",
  title: "Siklus hidup cacat",
  summary:
    "Ke mana laporan bug pergi setelah Anda ajukan, siapa yang menggesernya, dan cara menghadapi 'di komputer saya jalan' tanpa bertengkar.",
  body: `
## State-nya

Namanya berbeda-beda per alat; bentuknya tidak.

\`\`\`
New → Assigned → In progress → Fixed → Ready for test → Verified → Closed
                                   ↘ Reopened ↗
  ↘ Rejected (bukan bug / duplikat / memang begitu desainnya)
  ↘ Deferred (nyata, tapi tidak sekarang)
\`\`\`

- **New** — Anda mengajukannya; belum ada yang melakukan triase.
- **Triaged / Assigned** — seseorang menerimanya dan menetapkan priority.
  Biasanya lewat rapat rutin atau seorang lead.
- **In progress → Fixed** — state milik developer. "Fixed" berarti *kodenya sudah
  ditulis*, bukan bahwa ia bekerja.
- **Ready for test** — sudah ter-deploy di tempat yang bisa Anda jangkau. Tidak
  ada yang bisa diuji sebelum ini terjadi; bug yang ditandai Fixed di sebuah
  branch yang tidak di-deploy siapa pun belum jadi urusan Anda.
- **Verified → Closed** — **Anda** yang menggeser keduanya, dengan menjalankan
  ulang langkah aslinya (confirmation testing) *dan* memeriksa sekeliling
  perbaikannya untuk hal-hal yang mungkin ikut rusak.
- **Reopened** — perbaikannya tidak bekerja, atau hanya bekerja untuk langkah
  persis yang Anda tulis. Buka kembali dengan bukti baru; jangan mengajukan
  duplikat.
- **Rejected** — bukan cacat, duplikat, atau memang begitu desainnya.
- **Deferred** — diakui nyata, tidak diperbaiki sekarang. Sebaiknya disertai
  alasan.

**Aturan yang menentukan: siapa yang melaporkan, dia yang memverifikasi.**
Developer menutup bug mereka sendiri adalah cara regresi sampai ke produksi.

## Memverifikasi perbaikan dengan benar

Menjalankan ulang langkah persis Anda itu batas minimumnya, bukan pekerjaannya.
Ada tiga hal lagi:

1. **Ubah-ubah inputnya** di dalam partisi yang sama. Perbaikan yang hanya
   menangani nilai di laporan Anda adalah perbaikan untuk laporan Anda, bukan
   untuk bug-nya.
2. **Uji tetangganya.** Perubahan pada total keranjang menyentuh ongkir, diskon,
   pajak. Di sinilah bug regresi lahir.
3. **Periksa sisi lain batasnya.** Kalau bug-nya "100 diterima padahal maksimumnya
   99", pastikan 99 masih bekerja. Perbaikan rutin kebablasan.

## "Di komputer saya jalan"

Ini perbedaan kondisi, bukan tuduhan. Cari secara sistematis:

- **Data.** Akun mereka punya 3 pesanan, akun Anda punya 4.000.
- **Build.** Apakah Anda di versi yang sama? Apakah build Anda basi?
- **Environment.** Env var, feature flag, dan data awal yang berbeda.
- **Browser/perangkat.** Versi, ekstensi, tingkat zoom, lebar layar.
- **State.** Cache, cookie, service worker basi, sesi lama.
- **Waktu.** Jaringan lambat, request bersamaan, job latar.
- **Hak akses.** Akun admin mereka vs akun pelanggan Anda.

Lalu balas dengan *perbedaannya*, bukan dengan perselisihannya: "Terulang di
staging dengan akun customer, tidak dengan admin — sepertinya bergantung hak
akses." Anda baru saja mengubah kebuntuan menjadi petunjuk.

Dua kebiasaan yang mencegah sebagian besar kejadian ini: selalu catat
build/versinya, dan selalu coba sekali di sesi yang bersih sebelum mengajukan.

## Rejected — dan kapan mendorong balik

"Memang begitu desainnya" kadang berarti desainnya yang keliru. Itu bukan
perdebatan pengujian, itu perdebatan produk, jadi sampaikan dalam istilah produk:
siapa yang terdampak, seberapa sering, berapa ongkosnya. "Memang didesain begitu,
tapi 30% pendaftaran mendarat di layar ini dan 12 tiket support bulan lalu
berasal dari sana" adalah sebuah argumen. "Tapi ini kan bug" bukan.

Terimalah penolakan dengan lapang ketika alasannya masuk akal. Kredibilitas Anda
adalah anggaran; belanjakan pada laporan yang penting.

## Metrik cacat yang layak diketahui

Anda akan melihat ini di berbagai dashboard — termasuk milik TestForge:

- **Defect density** — cacat per modul/story. Menunjuk ke mana harus menguji
  lebih banyak (prinsip 4: cacat menggerombol).
- **Defect removal efficiency** — cacat yang ditemukan sebelum rilis ÷ total
  yang ditemukan termasuk yang setelah rilis. Ukuran jujur apakah pengujiannya
  bekerja.
- **Defect age / time to fix** — berapa lama laporan menganggur.
- **Reopen rate** — yang tinggi berarti "Fixed" dipakai untuk berarti "ditulis".
- **Escape rate** — apa yang ditemukan produksi dan luput dari Anda. Bacalah
  sebagai sumber test case baru, bukan sebagai pentungan.

Hati-hati dengan hitung-hitungan: "jumlah bug yang ditemukan" adalah ukuran yang
buruk untuk seorang tester. Ia menghadiahi pengajuan yang gaduh dan menghukum
pencegahan cacat saat peninjauan kebutuhan — hal paling berharga yang Anda
lakukan.

## Periksa pemahaman Anda

- Seorang developer menandai bug Anda Fixed. Apa tiga hal yang Anda periksa
  sebelum Closed?
- Bug-nya terulang pada Anda dan tidak pada developer. Sebutkan empat perbedaan
  yang layak diperiksa lebih dulu.
- Kenapa "jumlah bug yang ditemukan" adalah metrik kinerja yang buruk untuk
  seorang tester?

**Selanjutnya:** bagaimana semua ini menyatu ke dalam sprint dua mingguan.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Siapa yang seharusnya menggeser sebuah cacat ke Closed?",
      choices: [
        { id: "a", text: "Developer yang memperbaikinya" },
        { id: "b", text: "Orang yang melaporkannya, setelah memverifikasi" },
        { id: "c", text: "Product owner di akhir sprint" },
        { id: "d", text: "Siapa pun yang menyadari bug-nya sudah beres" },
      ],
      explanation:
        "Pelapor tahu apa yang mereka lihat dan bisa menjalankan ulang kondisi persisnya. Membiarkan developer menutup cacat mereka sendiri menghapus satu-satunya pemeriksaan independen dalam lingkarannya, dan itu cara yang andal untuk mengirim regresi ke produksi.",
    },
    {
      id: "q2",
      stem: "Sebuah cacat terulang pada Anda tapi tidak pada developer. Mana yang layak diperiksa lebih dulu?",
      choices: [
        { id: "a", text: "Apakah Anda berdua di build yang sama" },
        { id: "b", text: "Peran akun dan hak aksesnya" },
        { id: "c", text: "Volume data dan state awal yang ditanamkan" },
        { id: "d", text: "Apakah developer-nya seorang tester yang teliti" },
      ],
      explanation:
        "\"Di komputer saya jalan\" adalah perbedaan kondisi, bukan sengketa. Build, peran, dan data menjelaskan sebagian besar kejadiannya, dan membalas dengan perbedaan yang Anda temukan — alih-alih dengan perselisihannya — mengubah kebuntuan menjadi petunjuk.",
    },
    {
      id: "q3",
      stem: "Kenapa \"jumlah bug yang ditemukan\" adalah cara yang buruk untuk mengukur seorang tester?",
      choices: [
        { id: "a", text: "Bug sulit dihitung secara konsisten" },
        { id: "b", text: "Ia menghadiahi pengajuan yang gaduh dan menghukum pencegahan cacat sejak awal" },
        { id: "c", text: "Developer yang memunculkan bug-nya, jadi yang terukur justru mereka" },
        { id: "d", text: "Angkanya tidak bisa dibandingkan antarproyek" },
      ],
      explanation:
        "Pengujian yang paling berharga sering kali tidak menghasilkan laporan cacat sama sekali — sebuah pertanyaan saat refinement yang menghentikan cacat itu dibangun. Hitungan menghadiahi kuantitas di atas pencegahan, jadi metriknya diam-diam mendorong orang menjauh dari pekerjaan yang paling berarti.",
    },
  ],
};
