import type { LessonTranslation } from "../../../types";

export const testingInAgileId: LessonTranslation = {
  slug: "testing-in-agile",
  title: "Tester di dalam sebuah sprint",
  summary:
    "Apa yang Anda lakukan di tiap ceremony, cara menulis acceptance criteria yang bisa diuji, dan cara menghindari jebakan mini-waterfall.",
  body: `
## Jebakannya lebih dulu

Kebanyakan tim yang bilang "kami Agile" sebenarnya menjalankan
**mini-waterfall**: developer membangun selama delapan hari, melempar hasilnya
di hari kesembilan, dan QA punya satu setengah hari untuk menguji segalanya.
Sprint demi sprint, pengujian jadi bagian yang terjepit, dan kualitas berubah
menjadi negosiasi dengan kalender.

Obatnya bukan kepahlawanan di hari kesembilan. Obatnya adalah terlibat sejak
hari nol.

## Tugas Anda, ceremony demi ceremony

**Backlog refinement** — jam paling berdaya ungkit dalam sprint Anda. Anda
membaca story-nya sebelum siapa pun mengestimasi, lalu mengajukan pertanyaan yang
mengubah asumsi menjadi keputusan:

- Apa yang seharusnya terjadi kalau gagal? (jaringan, pembayaran, hak akses)
- Di mana batas-batas angka itu?
- Apa yang terjadi pada data yang sudah ada — apakah ada migrasi?
- Siapa yang *tidak boleh* melakukan ini? Peran mana yang dikecualikan?
- Bagaimana kita akan tahu ini berhasil di produksi?

Setiap pertanyaan itu lebih murah diajukan di sini daripada di mana pun
setelahnya.

**Sprint planning** — buat pengujian terlihat. Usaha pengujian adalah bagian dari
estimasi, bukan pajak yang dibayar belakangan. Kalau sebuah story tidak bisa
diuji di dalam sprint, itu fakta perencanaan, bukan masalah QA.

**Daily stand-up** — apa yang sedang Anda uji, apa yang menghambat, apa yang
berisiko tidak bisa diuji sebelum sprint berakhir.

**Selama sprint** — uji tiap story begitu ia siap, bukan semuanya di akhir.
Berpasanganlah dengan developer sebelum mereka menyebutnya selesai; lima menit
"apa yang terjadi kalau saya begini?" di meja mereka mengalahkan satu laporan
cacat besok.

**Sprint review / demo** — sering kali Andalah yang paling mengenal fiturnya.
Demokan juga kasus tepinya, bukan cuma happy path.

**Retrospective** — bawa bukti, bukan firasat: cacat yang lolos, ke mana waktunya
benar-benar habis, story mana yang datang dalam keadaan tak bisa diuji.

## Acceptance criteria yang bisa diuji

Artefak paling berguna yang bisa Anda pengaruhi. Given/When/Then bekerja karena
ia memaksa data yang konkret:

> **Given** sebuah keranjang berisi 1 × SKU-1042 dan stok 0
> **When** pelanggan mengeklik Checkout
> **Then** halaman keranjang menampilkan "Kaos Polos stoknya habis — hapus untuk
> melanjutkan" dan tidak ada pesanan yang dibuat

Bandingkan dengan: *"Checkout harus menangani item yang stoknya habis dengan
semestinya."* Yang kedua tidak bisa membuat sebuah pengujian gagal, artinya ia
juga tidak bisa membuatnya lulus.

Doronglah kriteria yang menyebutkan **datanya, pemicunya, dan hasil yang bisa
diamati**. Kalau Anda berhasil memasukkan itu ke refinement, separuh perancangan
pengujian Anda sudah selesai — dan begitu pula milik developer.

## Definition of Done

Standar bersama tim untuk "selesai". DoD yang memuat pengujian tampak seperti
ini:

- Acceptance criteria tercakup oleh pengujian, dan pengujiannya lulus
- Tidak ada cacat critical atau high yang terbuka pada story ini
- Regresi di sekitar area yang tersentuh sudah dijalankan
- Otomasi ditambahkan atau ditunda secara eksplisit dengan alasan
- Dokumentasi/release note diperbarui

Nilainya bukan pada daftarnya; nilainya pada berhentinya "selesai" menjadi
sekadar pendapat.

## Kuadran pengujian agile, sekilas

Peta untuk "pengujian macam apa sebenarnya yang sedang kita bicarakan":

| | Menghadap bisnis | Menghadap teknologi |
|---|---|---|
| **Mendukung tim** | Q2: pengujian fungsional, story test, contoh | Q1: unit & component test |
| **Mengkritik produk** | Q3: eksploratori, usability, UAT | Q4: performa, keamanan, keandalan |

Kebanyakan tim mengerjakan Q1 dan Q2 lalu melupakan Q3 dan Q4 sampai ada yang
terbakar. Mengenal petanya saja sudah cukup untuk melontarkan pertanyaannya saat
planning.

## Risk-based testing dalam satu paragraf

Waktu Anda tidak akan pernah cukup untuk semuanya, jadi urutkan berdasarkan
**dampak × kemungkinan**. Pembayaran dan hak akses berdampak tinggi; area yang
baru berubah, rumit, atau punya riwayat banyak bug berkemungkinan tinggi. Uji
sudut kanan atasnya secara mendalam, ambil sampel sisanya, dan **tuliskan apa
yang tidak Anda cakup**. Bagian terakhir itulah yang menjadikannya strategi
alih-alih alasan — dan itu versi profesional dari prinsip 2.

## Di mana track ini berakhir

Sekarang Anda punya kosakatanya dan empat teknik perancangan intinya, dan Anda
bisa menulis test case serta laporan cacat yang tahan ditinjau. Itu
sungguh-sungguh standar untuk sebuah posisi QA junior.

Berikutnya adalah mengerjakannya dalam kondisi nyata: perencanaan, pengujian
eksploratori, API, SQL, dan melaporkan kepada orang yang tidak membaca test case
— track [Manual QA Professional](/id/academy/manual-pro). Dari sana, otomasi.

## Periksa pemahaman Anda

- Sebutkan tiga pertanyaan yang akan Anda ajukan tentang sebuah story saat
  refinement.
- Tulis ulang "Login harus aman" menjadi acceptance criterion yang bisa diuji.
- Sprint Anda berupa mini-waterfall. Apa hal pertama yang akan Anda ubah, dan di
  ceremony mana itu terjadi?
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Tim Anda membangun selama delapan hari dan menyerahkan semuanya ke QA di hari kesembilan. Di mana tempat paling berdaya ungkit untuk turun tangan?",
      choices: [
        { id: "a", text: "Sprint review — demokan kasus tepinya" },
        { id: "b", text: "Backlog refinement — pertanyakan story-nya sebelum diestimasi" },
        { id: "c", text: "Daily stand-up — laporkan hambatannya setiap pagi" },
        { id: "d", text: "Retrospective — angkat setelah sprint berakhir" },
      ],
      explanation:
        "Jepitannya sudah tercipta jauh sebelum hari kesembilan, yaitu ketika story diterima dan diestimasi tanpa biaya pengujiannya dan tanpa pertanyaannya terjawab. Refinement adalah tempat kerancuan paling murah disingkirkan dan tempat usaha pengujian menjadi bagian dari estimasi.",
    },
    {
      id: "q2",
      stem: "Acceptance criterion mana yang benar-benar bisa membuat sebuah pengujian gagal?",
      choices: [
        { id: "a", text: "Checkout harus menangani item yang stoknya habis dengan semestinya" },
        { id: "b", text: "Given keranjang berisi item yang stoknya habis, when pelanggan mengeklik Checkout, then keranjang menampilkan \"stok habis\" dan tidak ada pesanan yang dibuat" },
        { id: "c", text: "Keranjang harus andal ketika beban tinggi" },
        { id: "d", text: "Penanganan stok habis harus ramah pengguna" },
      ],
      explanation:
        "Kriteria yang menyebutkan datanya, pemicunya, dan hasil yang bisa diamati dapat dieksekusi dan dapat gagal. \"Semestinya\", \"andal\", dan \"ramah pengguna\" tidak bisa membuat pengujian gagal, artinya juga tidak bisa membuatnya lulus.",
    },
    {
      id: "q3",
      stem: "Mana yang layak berada dalam Definition of Done yang memuat pengujian?",
      choices: [
        { id: "a", text: "Acceptance criteria tercakup oleh pengujian, dan pengujiannya lulus" },
        { id: "b", text: "Tidak ada cacat critical atau high yang terbuka pada story ini" },
        { id: "c", text: "Regresi dijalankan di sekitar area yang tersentuh perubahan" },
        { id: "d", text: "Nol cacat yang diketahui di seluruh produk" },
      ],
      explanation:
        "DoD harus bisa diperiksa per story: kriteria yang tercakup, severity cacat yang terbuka, dan regresi di sekitar perubahan semuanya memenuhi syarat itu. \"Nol cacat di seluruh produk\" tidak tercapai dan tidak menyangkut story ini, jadi ia mengubah DoD menjadi sesuatu yang dihindari tim.",
    },
  ],
};
