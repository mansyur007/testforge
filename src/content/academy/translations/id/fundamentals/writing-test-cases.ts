import type { LessonTranslation } from "../../../types";

export const writingTestCasesId: LessonTranslation = {
  slug: "writing-test-cases",
  title: "Menulis test case yang benar-benar bisa dijalankan orang",
  summary:
    "Anatomi test case yang baik, lima cara test case menjadi buruk, dan seberapa rinci itu takaran yang tepat.",
  body: `
## Satu pengujian yang menentukan

**Bisakah orang kompeten yang belum pernah melihat fitur ini menjalankan case
Anda dan sampai pada kesimpulan yang sama dengan Anda?** Kalau ya, itu test case
yang baik. Semua yang di bawah ini mengabdi pada pertanyaan itu.

## Anatomi

| Bagian | Gunanya | Contoh |
|---|---|---|
| **Judul** | Mudah dicari, dan memberi tahu pembaca apa yang dicakup tanpa membukanya | *Checkout — kuantitas di atas maksimum (100) ditolak* |
| **Prakondisi** | Keadaan yang harus berlaku sebelum langkah 1 | *Masuk sebagai pelanggan; keranjang berisi 1 × "Kaos Polos"; stok ≥ 200* |
| **Data uji** | Nilai konkret, bukan deskripsi | *kuantitas = 100* |
| **Langkah** | Aksi bernomor, satu aksi per langkah | *1. Buka keranjang. 2. Set kuantitas ke 100. 3. Klik Update.* |
| **Hasil yang diharapkan** | Bisa diamati, spesifik, satu per langkah bila perlu | *Kuantitas tetap 99; error inline "Maksimal 99 per pesanan"; total keranjang tidak berubah* |
| **Prioritas** | Yang dijalankan lebih dulu ketika waktu habis | *Tinggi* |

TestForge memberi kolom untuk masing-masing bagian ini, dan langkahnya berupa
pasangan aksi/harapan — jadi struktur di atas adalah formulir yang akan Anda isi.

## Judul: bagian yang semua orang buru-buru

Judul dibaca seratus kali dan ditulis sekali. Pakai satu pola dan pegang terus:

> **[Area] — [kondisi] → [hasil yang diharapkan]**

- ✅ *Checkout — kuantitas di atas maksimum (100) ditolak*
- ✅ *Login — akun terkunci dengan kata sandi benar menampilkan pesan umum*
- ❌ *Uji kuantitas* — mencakup apa? lulus kapan?
- ❌ *Pastikan sistem berjalan dengan benar* — tidak berisi apa pun
- ❌ *TC-17* — ID bukan judul

Ujinya: baca judulnya saja lalu tebak hasil yang diharapkan. Kalau Anda tidak
bisa, tulis ulang.

## Hasil yang diharapkan harus bisa diamati

"Berjalan dengan benar", "sesuai harapan", "sistem berperilaku semestinya"
bukanlah hasil yang diharapkan — itu janji untuk berdebat belakangan. Tuliskan
apa yang bisa **dilihat** orang:

- ❌ *Pesanan diproses dengan benar*
- ✅ *Status pesanan menjadi "Paid"; email konfirmasi tiba di alamat pelanggan
  dalam 1 menit; stok SKU-1042 turun dari 200 menjadi 198*

Kalau hasil yang diharapkan tidak bisa diamati dari luar, sebutkan di mana harus
melihat — sebuah baris basis data, satu baris log, isi sebuah webhook. Itu tetap
terhitung bisa diamati.

## Lima cara test case menjadi buruk

**1. Terlalu kabur.** "Masukkan email yang tidak valid." Email tidak valid yang
mana? \`a@b\`, \`no-at-sign\`, \`x@x.\`, 300 karakter, unicode? Masing-masing
partisi yang berbeda dan tidak berperilaku sama.

**2. Terlalu rinci.** Dua belas langkah untuk login, dijabarkan klik demi klik,
di setiap case. Taruh persiapan bersama di prakondisi, atau di satu kelompok
langkah bersama, dan mulailah case-nya di hal yang benar-benar diujinya. Sebuah
case sebaiknya ~3–8 langkah.

**3. Menguji lima hal sekaligus.** Case yang memeriksa login, lalu dashboard,
lalu halaman profil akan gagal di langkah 2 dan tidak memberi tahu apa pun
tentang sisanya. **Satu case, satu alasan gagal.**

**4. Bergantung pada sisa-sisa pengujian sebelumnya.** Case 12 lulus hanya kalau
case 11 dijalankan lebih dulu dan meninggalkan keranjang berisi. Ada yang
menjalankan case 12 sendirian, gagal, dan semua orang membuang satu jam. Nyatakan
prakondisinya, atau buat case itu menyiapkan dirinya sendiri.

**5. Menyalin implementasinya.** "Klik tombol berkelas \`.btn-primary\` di kanan
atas." Ketika desainnya berubah, case-nya salah padahal software-nya baik-baik
saja. Jabarkan maksudnya — "Konfirmasi pesanan" — bukan markup-nya.

## Serinci apa yang tepat?

Tergantung siapa yang menjalankannya dan seberapa sering, dan ada pertukaran
nyata di sini:

| Situasi | Gaya |
|---|---|
| Anda jalankan sekali, hari ini, sendiri | Sebuah charter atau satu baris checklist. Jangan dipoles berlebihan |
| Anggota baru akan menjalankannya | Langkah lengkap, data eksplisit |
| Case regresi yang dijalankan tiap rilis | Langkah lengkap — ia akan hidup lebih lama dari Anda |
| Diatur regulasi / bisa diaudit | Langkah lengkap, plus bukti pelaksanaannya |
| Akan Anda otomasi sprint depan | Data dan asersi yang presisi; lewati koreografi UI-nya |

Cara khas QA junior tersandung adalah menulis 200 case rinci luar biasa yang tak
seorang pun rawat. Kerincian berbiaya perawatan. Belanjakan di tempat sebuah case
akan dijalankan ulang oleh orang yang bukan Anda.

## Contoh dikerjakan

> **Kebutuhan.** Keranjang ShopMini: kuantitas 1–99 per baris item.

Buruk:

> **Judul:** Uji kuantitas
> **Langkah:** Uji kolom kuantitas dengan berbagai nilai
> **Diharapkan:** Berjalan dengan benar

Baik — dan perhatikan ini *satu* partisi, dengan case-nya sendiri:

> **Judul:** Keranjang — kuantitas di atas maksimum (100) ditolak
> **Prioritas:** Tinggi
> **Prakondisi:** Masuk sebagai pelanggan \`buyer@shopmini.test\`; keranjang
> berisi 1 × "Kaos Polos" (SKU-1042); stok ≥ 200
> **Langkah:**
> 1. Buka \`/cart\` → baris item menunjukkan kuantitas 1
> 2. Ketik \`100\` di kolom kuantitas untuk SKU-1042
> 3. Klik **Update cart**
>
> **Hasil yang diharapkan:** Kuantitas kembali ke 99 (atau tetap 1 dan tidak
> diterapkan); error inline "Maksimal 99 per pesanan" muncul di sebelah kolom;
> subtotal keranjang tidak berubah; tidak ada request yang dikirim ke layanan
> pesanan.

Saudara-saudaranya — 0, 1, 99, 2.5, "abc", kosong — adalah case terpisah, hasil
kerja partisi dan batas Anda di pelajaran sebelumnya.

## 🛠 Giliran Anda, di TestForge

Latihan sandbox: buat case di atas (beserta saudara-saudara batasnya) di proyek
ShopMini sungguhan, dengan langkah dan hasil yang diharapkan yang nyata.
Checker-nya mencari sebuah case di suite Checkout dengan setidaknya tiga langkah,
hasil yang diharapkan yang tidak kosong, dan nilai batas di datanya — standar
yang sama yang akan diterapkan seorang peninjau.

**Selanjutnya:** hal lain yang akan Anda tulis setiap hari — laporan bug yang
berujung diperbaiki alih-alih ditutup sebagai "tidak bisa direproduksi".
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Hasil yang diharapkan mana yang bisa dipakai?",
      choices: [
        { id: "a", text: "Pesanan diproses dengan benar" },
        { id: "b", text: "Sistem berperilaku sesuai harapan" },
        { id: "c", text: "Status menjadi \"Paid\", email konfirmasi tiba, dan stok SKU-1042 turun dari 200 menjadi 198" },
        { id: "d", text: "Tidak ada pesan kesalahan yang muncul" },
      ],
      explanation:
        "Hasil yang diharapkan harus bisa diamati oleh orang yang belum pernah melihat fiturnya. \"Dengan benar\" dan \"sesuai harapan\" menunda perselisihan sampai saat pengujiannya gagal; state, pesan, dan angka yang konkret menyelesaikannya di depan.",
    },
    {
      id: "q2",
      stem: "Case 12 hanya lulus kalau case 11 dijalankan lebih dulu dan meninggalkan item di keranjang. Apa cacat pada case itu?",
      choices: [
        { id: "a", text: "Terlalu rinci" },
        { id: "b", text: "Punya prakondisi yang tidak dinyatakan, jadi gagal kalau dijalankan sendirian" },
        { id: "c", text: "Menguji terlalu banyak hal sekaligus" },
        { id: "d", text: "Tidak ada — pengujian memang diharapkan berjalan berurutan" },
      ],
      explanation:
        "Case yang diam-diam bergantung pada sisa case sebelumnya akan gagal bagi siapa pun yang menjalankannya terpisah, dan satu jam yang mereka buang habis untuk case itu, bukan untuk produknya. Nyatakan prakondisinya, atau buat case itu menyiapkan dirinya sendiri.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang layak berada di dalam sebuah test case?",
      choices: [
        { id: "a", text: "Data uji yang konkret, bukan deskripsi tentangnya" },
        { id: "b", text: "Judul yang menyebutkan kondisi dan hasilnya" },
        { id: "c", text: "Selektor CSS tombol yang harus diklik" },
        { id: "d", text: "Prakondisi yang menempatkan keadaan pada titik yang diketahui" },
      ],
      explanation:
        "Data, judul yang informatif, dan prakondisi sama-sama selamat ketika produknya didesain ulang. Selektor CSS menyalin implementasinya, jadi case-nya jadi salah begitu markup-nya berubah padahal software-nya masih baik-baik saja.",
    },
  ],
};
