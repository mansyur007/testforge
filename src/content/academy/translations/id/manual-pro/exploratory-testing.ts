import type { LessonTranslation } from "../../../types";

export const exploratoryTestingId: LessonTranslation = {
  slug: "exploratory-testing",
  title: "Pengujian eksploratori dan berbasis sesi",
  summary:
    "Charter, timebox, pencatatan, dan kenapa pengujian tanpa skrip menemukan hal yang tidak bisa ditemukan skrip.",
  body: `
## Pengujian berskrip hanya bisa menemukan yang sudah Anda pikirkan

Sebuah test case adalah pertanyaan yang Anda tuliskan *sebelum* Anda melihat
software-nya. Ia ditulis dari sebuah kebutuhan, dan karena itu ia hanya pernah
bisa memeriksa apakah kebutuhan itu diimplementasikan. Itu layak dikerjakan —
sebagian besar isi track sebelumnya tentang itu — tapi perhatikan langit-langitnya:
**suite berisi 300 case memuat tepat 300 pertanyaan, semuanya diajukan oleh versi
diri Anda yang informasinya lebih sedikit daripada sekarang.**

Segala yang Anda pelajari selagi menguji — bahwa pesan kesalahannya berkelip lalu
hilang, bahwa halamannya baik-baik saja sampai Anda memakai tombol Back browser,
bahwa dua tab terbuka sekaligus merusak keranjang — tiba *selama* sesi dan tidak
punya tempat tujuan dalam run berskrip selain catatan di pinggir halaman.

Pengujian eksploratori adalah praktik membiarkan apa yang baru Anda pelajari
menentukan apa yang Anda lakukan berikutnya. Perancangan, eksekusi, dan
pembelajaran terjadi bersamaan, dengan sengaja.

## Apa yang bukan

Ini bukan "klik-klik sembarangan". Kekeliruan itu membuat teknik ini kehilangan
reputasinya di separuh tim yang mencobanya, jadi bedakan dengan cermat:

| Klik ad-hoc | Pengujian eksploratori |
|---|---|
| Tanpa tujuan yang dinyatakan | Sebuah **charter**: satu kalimat yang menyebut sasarannya |
| Berjalan sampai Anda bosan | Sebuah **timebox**, biasanya 45–90 menit |
| Tidak meninggalkan jejak | **Catatan** yang dibuat sambil jalan, dan sebuah debrief |
| Tidak bisa diulang atau ditinjau | Menghasilkan case, cacat, dan bukti cakupan |
| "Sudah saya uji" | "Saya habiskan 60 menit untuk kode diskon; ini yang saya temukan dan ini yang tidak sempat saya capai" |

Strukturnya yang membuatnya bisa dipertanggungjawabkan. Tanpa itu Anda tidak
bisa memberi tahu seorang manajer apa yang Anda lakukan dengan satu sore Anda,
dan itulah sebabnya eksplorasi tanpa struktur terus kalah berdebat melawan suite
berskrip bahkan ketika ia menemukan lebih banyak.

## Charter

Charter adalah seluruh rencana untuk satu sesi, dan ia muat dalam satu kalimat.
Bentuk yang bekerja:

> **Jelajahi** *(sasaran)* **dengan** *(sumber daya)* **untuk menemukan**
> *(informasi)*.

Contoh sungguhan:

- Jelajahi **kolom kode diskon** dengan **kode kedaluwarsa, cacat bentuk, dan berpanjang batas** untuk menemukan **apakah ada kode tidak valid yang pernah diterima**.
- Jelajahi **checkout** dengan **dua tab browser pada keranjang yang sama** untuk menemukan **bug perusakan state**.
- Jelajahi **keranjang** dengan **tombol Back browser dan muat ulang halaman** untuk menemukan **apakah totalnya bisa berselisih dengan baris itemnya**.

Yang membuat ketiganya bagus adalah masing-masing menyebut **musuh yang
spesifik**. "Jelajahi checkout" bukan charter; itu angkat bahu. Paruh keduanya —
*dengan* apa, *untuk menemukan* apa — di situlah pemikirannya berada. Kalau Anda
tidak bisa mengisi "untuk menemukan", Anda belum tahu kenapa Anda membuka fitur
itu, dan sesinya akan melantur.

Satu charter per sesi. Dua charter berarti dua sesi.

## Timebox, dan kenapa jam adalah disiplinnya

Sesi berlangsung 45–90 menit. Pendek (sekitar 45) ketika charter-nya sempit atau
areanya asing; panjang (sekitar 90) ketika Anda perlu menumpuk state dulu sebelum
sesuatu yang menarik terjadi.

Timebox mengerjakan tiga tugas:

1. **Ia mengakhiri sesinya.** Eksplorasi tidak punya titik berhenti alami —
   selalu ada satu ide lagi — jadi tanpa jam, satu sesi akan memakan satu hari.
2. **Ia membuat pekerjaannya bisa dihitung.** "Empat sesi untuk checkout minggu
   ini" adalah satuan yang bisa dipakai manajer untuk merencanakan.
   Berjam-jam-pengujian-samar tidak.
3. **Ia memberi izin untuk mendalam.** Mengetahui ada titik berhenti yang tegas
   itulah yang memungkinkan Anda mengikuti firasat aneh selama lima belas menit
   tanpa merasa sedang membuang satu sore.

Jauhkan ponsel dan jangan membalas utas standup. Sesi yang terinterupsi di menit
ke-20 bukanlah sesi 60 menit dengan jeda; state yang sudah Anda bangun di kepala
sudah hilang, dan state itulah aset utama teknik ini.

## Mencatat, tanpa berhenti untuk menulis esai

Buat catatan *selagi* menguji, dalam bentuk yang cukup cepat sehingga tidak
memutus alirannya. Empat tanda mencakup hampir segalanya:

~~~
CHARTER: Jelajahi kode diskon dengan kode kedaluwarsa/cacat bentuk/berpanjang
         batas untuk menemukan apakah ada kode tidak valid yang pernah diterima
MULAI:   14:05

TEST  coba SAVE10 (valid, 6 karakter) -> diterima, -10% diterapkan
TEST  coba save10 huruf kecil -> diterima (tidak beda huruf, sesuai spesifikasi)
BUG   coba SAVE10 dengan spasi di akhir -> diterima! spesifikasi bilang hanya
      huruf+angka
NOTE  kolomnya memangkas input sebelum memvalidasi tapi setelah cek panjang?
Q     apakah 10 karakter itu inklusif? spesifikasi bilang "6-10", coba 10 ->
      diterima
BUG   kode kedaluwarsa EXPIRE99 -> "kode tidak valid" yang umum, spesifikasi
      minta pesan khusus. Support akan kebanjiran tiket soal ini.
NOTE  tidak terlihat ada rate limit pada percobaan kode - bukan charter saya,
      layak satu sesi sendiri
TEST  coba 5 karakter, 11 karakter, kosong, unicode -> semua ditolak dengan benar

SELESAI:  15:02
PERSIAPAN: ~10 mnt (perlu menanam kode kedaluwarsa)
CHARTER:   ~40 mnt
KESEMPATAN: ~10 mnt (colekan soal rate limit)
TIDAK TERCAPAI: menumpuk dua kode; kode pada item yang sudah didiskon
~~~

**BUG**, **NOTE**, **Q**, dan **TEST** adalah seluruh kosakatanya. Yang orang
lewatkan adalah **Q** — pertanyaan yang tidak bisa Anda jawab sendiri. Itulah
output bernilai tertinggi dari sebuah sesi, karena pertanyaan yang Anda bawa ke
product owner ("apakah 10 karakter itu inklusif?") sering ternyata sebuah
kebutuhan yang belum diputuskan siapa pun, dan menemukan kebutuhan yang belum
diputuskan sebelum ia terkirim mengalahkan menemukan bug-nya setelah itu.

**TIDAK TERCAPAI** adalah hal kedua yang orang lewatkan dan yang membuat sesinya
jujur. Ini langkah yang sama dengan baris *Tidak dicakup* di test plan: ia
menyatakan di mana cakupannya berakhir alih-alih membiarkan kesunyian
menyiratkan kelengkapan.

## Debrief

Session-based test management menambahkan satu langkah lagi: seseorang membaca
catatan Anda bersama Anda, selama lima menit, di akhir. Ajukan tiga pertanyaan.

- **Apa yang Anda temukan?** — bug-nya, dan pertanyaannya.
- **Apa yang tidak sempat Anda capai?** — memberi umpan untuk charter berikutnya.
- **Apakah charter-nya sudah tepat?** — kadang jawabannya "area yang menarik
  ternyata ada di sebelah", dan itu persis informasi yang menjadi alasan
  eksplorasi ada.

Kalau tidak ada yang bisa mendebrief Anda, debrief diri Anda sendiri secara
tertulis. Nilainya sebagian besar ada pada dipaksanya Anda meringkas selagi masih
segar.

## Kapan menjangkaunya

Pengujian eksploratori bukan pengganti case berskrip; keduanya menjawab
pertanyaan yang berbeda. Jangkau eksplorasi ketika:

- kebutuhannya tipis, tidak ada, atau Anda menduga ia keliru
- fiturnya baru dan belum ada yang memakainya sungguh-sungguh
- run berskrip kembali serba hijau dan Anda tidak memercayainya
- Anda mewarisi sistem yang tidak Anda kenal
- sebuah cacat baru saja diperbaiki dan Anda ingin tahu apa *lagi* yang
  dilakukan area itu (perbaikan adalah perubahan, dan perubahan menggerombolkan
  cacat)

Dan sadarilah kelemahannya: **ia tidak bisa diulang**. Dua tester dengan charter
yang sama menjalankan sesi yang berbeda. Itu keunggulan untuk menemukan sesuatu
dan masalah untuk regresi, bukti kepatuhan, atau apa pun yang harus menghasilkan
hasil identik kuartal depan. Pakai case berskrip di sana.

Pengaturan praktis yang akhirnya dipakai kebanyakan tim: case berskrip untuk
jalur yang tidak boleh rusak, sesi eksploratori untuk segala yang belum Anda
pikirkan — dan setiap temuan bagus dari sebuah sesi dituliskan menjadi case,
sehingga suite-nya tumbuh dari apa yang ditemukan eksplorasi, bukan dari dokumen
kebutuhan semata.

## Di mana TestForge berperan

Output sebuah sesi bukan perasaan; ia baris-baris data. Bug-nya menjadi cacat,
catatannya menjadi deskripsi cacat itu (sudah tertulis, saat itu juga, dengan
input persis yang Anda pakai), dan temuan yang bisa diulang menjadi case di
sebuah suite sehingga rilis berikutnya mendapatkannya cuma-cuma.

Itulah latihannya di bawah: jalankan satu sesi 45 menit yang sungguhan terhadap
ShopMini, dengan charter tertulis dan catatan, lalu ubah yang Anda temukan
menjadi sebuah cacat dan setidaknya satu case.

**Selanjutnya:** pertanyaan yang mendasari semua ini — ketika tidak ada kebutuhan
untuk dijadikan pembanding, bagaimana Anda tahu bahwa yang Anda lihat itu keliru?
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Mana di antara ini yang merupakan charter sesi yang bisa dipakai?",
      choices: [
        { id: "a", text: "Uji halaman checkout" },
        {
          id: "b",
          text: "Jelajahi keranjang dengan tombol Back browser dan muat ulang, untuk menemukan apakah totalnya bisa berselisih dengan baris itemnya",
        },
        {
          id: "c",
          text: "Pastikan kuantitas keranjang 100 ditolak dengan pesan \"Maksimal 99 per pesanan\"",
        },
        {
          id: "d",
          text: "Habiskan Kamis sore mencari sebanyak mungkin bug di mana pun di produk ini",
        },
      ],
      explanation:
        "Sebuah charter menyebut sasarannya, sumber daya atau serangan yang akan Anda pakai, dan informasi yang Anda buru — bagian ketiga itulah yang mencegah sesinya melantur. \"Uji halaman checkout\" dan satu sore tanpa batas sama-sama gagal di titik itu: tidak ada apa pun di dalamnya yang bisa memberi tahu Anda apakah sesinya berjalan baik. Item soal kuantitas gagal dari arah sebaliknya; ia punya satu jawaban yang sudah ditentukan, dan itu menjadikannya sebuah test case, dan case lebih baik dijalankan sebagai case daripada sebagai satu jam eksplorasi.",
    },
    {
      id: "q2",
      stem: "Tim Anda ingin pengujian eksploratori dihitung sebagai pekerjaan sungguhan di laporan rilis. Praktik mana yang paling memungkinkannya?",
      choices: [
        {
          id: "a",
          text: "Mewajibkan setiap sesi menemukan setidaknya satu cacat",
        },
        {
          id: "b",
          text: "Sesi ber-timebox dengan charter tertulis, catatan, dan daftar tersurat tentang apa yang tidak tercapai",
        },
        {
          id: "c",
          text: "Mengubah tiap sesi menjadi test case berskrip sebelum dijalankan",
        },
        {
          id: "d",
          text: "Meminta dua tester menjalankan charter yang sama supaya hasilnya bisa dibandingkan",
        },
      ],
      explanation:
        "Alasan eksplorasi tanpa struktur kalah berdebat melawan suite berskrip adalah karena ia tidak meninggalkan jejak, bukan karena ia menemukan lebih sedikit. Charter, jam, dan catatan mengubah satu sore menjadi satuan yang bisa dihitung dengan cakupan dan celah yang dinyatakan, dan itulah yang dibutuhkan laporan rilis. Kuota cacat menghadiahi laporan yang gaduh dan menghukum sesi yang secara tepat tidak menemukan apa-apa. Menskripkannya di depan menghapus tekniknya sama sekali, dan menggandakan charter menghabiskan dua tester untuk memperoleh cakupan satu sesi.",
    },
    {
      id: "q3",
      stem: "Selama sesi tentang kode diskon Anda menyadari halaman login tidak punya rate limiting. Itu bukan charter Anda. Apa langkah terbaiknya?",
      choices: [
        {
          id: "a",
          text: "Tinggalkan charter-nya dan kejar itu — temuan keamanan mengalahkan sesi yang direncanakan",
        },
        {
          id: "b",
          text: "Catat, habiskan paling lama beberapa menit, dan angkat saat debrief sebagai calon charter",
        },
        {
          id: "c",
          text: "Abaikan sepenuhnya; apa pun di luar charter berada di luar cakupan sesi",
        },
        {
          id: "d",
          text: "Tambahkan ke charter-nya supaya sesinya mencakup kedua area",
        },
      ],
      explanation:
        "Sesi memperhitungkan waktu kesempatan justru karena hal menarik muncul di sebelah — sedikit melipir memang diperkirakan, dan catatannya adalah yang membawa temuan itu keluar dari sesi dalam keadaan utuh. Menjatuhkan charter di tengah sesi menghilangkan cakupan yang sedang Anda kerjakan separuh jalan dan tidak menyisakan apa pun yang bisa Anda laporkan. Mengabaikannya membuang informasi sungguhan demi kerapian. Melebarkan charter adalah pilihan terburuk: satu kalimat per sesi adalah yang membuat timebox-nya berarti, dan sesi yang mencakup dua sasaran tidak bisa dengan jujur mengklaim satu pun.",
    },
  ],
};
