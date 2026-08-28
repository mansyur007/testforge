import type { LessonTranslation } from "../../../types";

export const bugReportsId: LessonTranslation = {
  slug: "bug-reports",
  title: "Menulis laporan bug yang berujung diperbaiki",
  summary:
    "Langkah reproduksi, bukti, dan bedanya laporan yang bisa ditindaklanjuti developer dengan laporan yang akan mereka tutup.",
  body: `
## Laporan Anda bersaing memperebutkan perhatian

Backlog seorang developer berisi empat puluh item. Milik Anda diperbaiki kalau
ia **murah untuk dipercaya dan murah untuk direproduksi**. Setiap menit yang
Anda hemat untuk mereka adalah satu menit lebih dekat ke perbaikan; setiap
kerancuan adalah alasan untuk beralih ke tiket berikutnya.

"Tidak bisa direproduksi" hampir selalu berarti cacat pada laporannya, bukan
pada pembacanya.

## Bentuknya

**Judul — satu baris, tiga bagian:** apa yang terjadi, di mana, pada kondisi apa.

- ✅ *Total keranjang tidak dihitung ulang setelah item terakhir dihapus (Chrome
  126, checkout tamu)*
- ❌ *Keranjang rusak*
- ❌ *Bug di checkout* — semuanya bug di checkout

**Environment.** Build/versi, browser + versinya, OS, perangkat, akun dan
perannya, environment (staging/prod), dan waktu kejadiannya (supaya log-nya bisa
ditemukan).

**Prakondisi.** Keadaan sebelum langkah 1, dengan data sungguhan: akun yang mana,
produk yang mana, berapa isi keranjangnya.

**Langkah reproduksi.** Bernomor, minimal, deterministik. *Minimal* itu penting:
buang setiap langkah yang tidak diperlukan. Reproduksi 12 langkah yang
sebenarnya bisa 4 langkah justru mengubur penyebabnya.

**Hasil sebenarnya.** Apa yang Anda lihat. Kutip teks kesalahannya persis; jangan
diparafrasa.

**Hasil yang diharapkan.** Apa yang seharusnya terjadi, **dan kenapa** — tautkan
ke kebutuhannya, acceptance criterion-nya, atau test case-nya. Tanpa ini Anda
hanya sedang menawarkan pendapat.

**Bukti.** Tangkapan layar dengan kesalahannya terlihat, rekaman layar pendek
untuk apa pun yang menyangkut waktu atau animasi, request/response yang gagal
dari tab network, error di console, baris log yang relevan, correlation/trace ID.

**Keterulangan.** "5 dari 5 percobaan" atau "2 dari 10 — tampaknya terkait
jaringan yang lambat". Sebutkan terus terang. Sifat kadang-kadang itu fakta
tentang bug-nya, bukan pembelaan tentang diri Anda.

## Severity vs priority — dua hal yang berbeda

Perbedaan ini ditanyakan di setiap wawancara dan disalahgunakan di setiap proyek.

- **Severity** — seberapa buruk *dampaknya* secara teknis. Kehilangan data,
  crash, uang yang salah: kritis. Ketidakrapian tampilan: rendah. **Tester yang
  menetapkan ini.**
- **Priority** — seberapa *cepat* harus diperbaiki, mengingat konteks bisnisnya.
  **Product owner yang menetapkan ini.**

Keduanya sering berpisah jalan:

| Kasus | Severity | Priority |
|---|---|---|
| Aplikasi crash di perangkat yang dipakai 3 pengguna | Tinggi | Rendah |
| Nama perusahaan salah eja di halaman depan | Rendah | Mendesak |
| Kesalahan pembulatan Rp 1 di setiap faktur | Sedang | Mendesak (ini uang, dan terjadi di setiap faktur) |
| Ekspor admin gagal, dipakai sekali per kuartal | Tinggi | Sedang |

Nyatakan severity dengan bukti dan biarkan priority jadi keputusan bisnis.
Bertengkar soal priority adalah cara tester kehilangan kredibilitas; memaparkan
dampak dengan jernih adalah cara mereka mendapatkannya.

## Sebelum mengajukan: tiga pemeriksaan

1. **Reproduksi sekali lagi**, dari keadaan bersih (sesi baru, incognito, data
   segar). Separuh "bug" ternyata cuma state lokal yang basi.
2. **Kecilkan.** Buang langkah sampai bug-nya berhenti muncul. Langkah terakhir
   yang Anda buang adalah petunjuk tentang penyebabnya.
3. **Cari duplikatnya.** Menautkan ke laporan yang sudah ada lebih berguna
   daripada salinan keduanya.

Lalu, kalau bisa, tambahkan satu diagnosis: apakah terjadi di browser lain? akun
lain? lewat API alih-alih UI? Satu titik data tambahan itu sering kali sudah
melokalisasi bug-nya untuk developer.

## Sebelum / sesudah

**Sebelum**

> **Judul:** Checkout tidak jalan
> **Langkah:** Coba checkout, gagal
> **Diharapkan:** Seharusnya jalan

**Sesudah**

> **Judul:** Checkout mengembalikan 500 ketika keranjang berisi item yang stoknya
> habis (staging, build 1.4.2)
>
> **Environment:** staging, build 1.4.2, Chrome 126 / Windows 11, akun
> \`buyer@shopmini.test\` (peran: customer), 2026-08-10 14:32 WIB
>
> **Prakondisi:** Keranjang berisi 1 × SKU-1042 "Kaos Polos". Stok SKU-1042
> disetel ke 0 oleh admin *setelah* item itu dimasukkan ke keranjang.
>
> **Langkah:**
> 1. Buka \`/cart\`
> 2. Klik **Checkout**
>
> **Sebenarnya:** Halaman menampilkan "Something went wrong". \`POST
> /api/checkout\` mengembalikan **500**; isi response \`{"error":"stock_unavailable"}\`;
> log server menunjukkan \`TypeError: Cannot read properties of null (reading
> 'reserve')\` di \`checkout.service.ts:88\`. Trace ID \`a41f-99c2\`.
>
> **Diharapkan:** Pelanggan melihat "Kaos Polos stoknya habis — hapus untuk
> melanjutkan" dan tetap berada di keranjang (AC-4 story ShopMini #212). Perebutan
> stok tidak seharusnya menghasilkan 500.
>
> **Keterulangan:** 5/5. Juga terulang lewat API tanpa melibatkan UI sama sekali.
>
> **Severity:** Tinggi (checkout terhalang, kesalahan server tidak tertangani).
> **Attachment:** tangkapan layar, berkas HAR.

Yang kedua diperbaiki hari itu juga. Ia juga memperagakan sesuatu yang layak
diperhatikan: laporannya lebih berharga *karena* tester-nya memeriksa API dan
log-nya.

## 🛠 Giliran Anda, di TestForge

Latihan sandbox memberi Anda satu cacat ShopMini yang sudah ditanam untuk Anda
temukan dan ajukan sebagai laporan bug yang benar — judul, environment, langkah,
sebenarnya vs diharapkan, severity — dan checker-nya menilai strukturnya, bukan
pilihan kata Anda: langkah yang minimal, hasil sebenarnya yang bisa diamati,
hasil yang diharapkan yang terikat pada sebuah kebutuhan, dan severity yang bisa
Anda pertanggungjawabkan.

**Selanjutnya:** apa yang terjadi pada laporan itu setelah Anda mengajukannya.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Nama perusahaan salah eja di halaman depan. Bagaimana Anda menggolongkannya?",
      choices: [
        { id: "a", text: "Severity tinggi, priority tinggi" },
        { id: "b", text: "Severity rendah, priority tinggi" },
        { id: "c", text: "Severity tinggi, priority rendah" },
        { id: "d", text: "Severity rendah, priority rendah" },
      ],
      explanation:
        "Severity mengukur dampak teknis: tidak ada yang rusak, tidak ada yang hilang, jadi rendah. Priority adalah keputusan bisnis tentang seberapa cepat harus diperbaiki, dan nama perusahaan yang salah eja di halaman depan cukup memalukan untuk menyerobot antrean. Kedua sumbu itu saling bebas.",
    },
    {
      id: "q2",
      stem: "Sebelum mengajukan, langkah mana yang membuat laporan Anda lebih sulit ditutup sebagai \"tidak bisa direproduksi\"?",
      choices: [
        { id: "a", text: "Mereproduksinya sekali lagi dari sesi yang bersih" },
        { id: "b", text: "Membuang langkah sampai bug-nya berhenti muncul" },
        { id: "c", text: "Mencatat build, browser, dan akun persis yang dipakai" },
        { id: "d", text: "Segera mengajukannya supaya tidak ada detail yang terlupa" },
      ],
      explanation:
        "Reproduksi dari sesi bersih menyingkirkan kemungkinan state lokal yang basi, mengurangi langkah melokalisasi penyebabnya, dan environment-nya adalah yang memungkinkan orang lain berdiri di tempat Anda berdiri. Mengajukan dulu lalu menyelidiki belakangan justru yang menghasilkan laporan-laporan yang dipantulkan kembali.",
    },
    {
      id: "q3",
      stem: "Anda melihat bug itu sekali dalam sepuluh percobaan. Apa yang Anda lakukan?",
      choices: [
        { id: "a", text: "Jangan diajukan sampai bisa direproduksi dengan andal" },
        { id: "b", text: "Ajukan dan sebutkan 1 dari 10, beserta dugaan Anda tentang apa yang berubah-ubah" },
        { id: "c", text: "Ajukan seolah-olah selalu terjadi, supaya diperhatikan" },
        { id: "d", text: "Minta seorang developer mereproduksinya dulu sebelum diajukan" },
      ],
      explanation:
        "Sifat kadang-kadang adalah fakta tentang cacatnya, bukan kelemahan laporannya — dan sering kali justru petunjuk terkuat, yang menunjuk ke soal waktu, konkurensi, atau jaringan yang lambat. Melebih-lebihkan frekuensi demi perhatian menghancurkan kredibilitas yang akan Anda butuhkan pada laporan berikutnya.",
    },
  ],
};
