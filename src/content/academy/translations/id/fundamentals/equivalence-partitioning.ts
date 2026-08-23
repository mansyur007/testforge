import type { LessonTranslation } from "../../../types";

export const equivalencePartitioningId: LessonTranslation = {
  slug: "equivalence-partitioning",
  title: "Equivalence partitioning",
  summary:
    "Ubah ruang input yang tak terhingga menjadi segelintir pengujian, dengan mengelompokkan input yang diperlakukan sama oleh sistem.",
  body: `
## Gagasannya

Kalau sistem memperlakukan satu kelompok input **dengan cara yang sama**, menguji
satu anggota kelompok itu memberi tahu Anda kurang lebih sebanyak menguji
semuanya. Setiap kelompok itu disebut **equivalence partition** (partisi
ekuivalensi), atau equivalence class.

Jadi: pecah ruang input menjadi beberapa partisi, ambil satu wakil dari
masing-masing, dan "tak terhingga" tadi berganti jadi "segelintir" — lengkap
dengan alasan yang tegas dan bisa dipertanggungjawabkan atas apa yang Anda
tinggalkan.

Dua aturan yang membuatnya bekerja:

1. Antar partisi tidak boleh tumpang tindih, dan bersama-sama harus mencakup
   **segalanya** yang mungkin dimasukkan pengguna — termasuk yang ngawur.
2. Setiap partisi diuji. Baik yang **valid** (seharusnya diterima) maupun yang
   **invalid** (seharusnya ditolak, dengan baik-baik).

Pemula menguji tiga nilai valid lalu menganggapnya selesai. Bug-nya justru
tinggal di partisi yang invalid.

## Contoh dikerjakan: kuantitas di ShopMini

> **Kebutuhan.** Di halaman produk, pelanggan dapat memesan antara **1 sampai
> 99** item. Kuantitas adalah bilangan bulat.

Partisinya:

| # | Partisi | Valid? | Wakil |
|---|---|---|---|
| P1 | 1 … 99 | valid | 42 |
| P2 | kurang dari 1 (0, negatif) | invalid | -5 |
| P3 | lebih dari 99 | invalid | 500 |
| P4 | bukan bilangan bulat | invalid | 2.5 |
| P5 | bukan angka sama sekali | invalid | \`"abc"\` |
| P6 | kosong | invalid | \`""\` |

Enam pengujian, bukan tak terhingga — dan perhatikan bahwa P4–P6 adalah yang
biasanya tidak terpikirkan oleh developer, dan justru karena itulah ketiganya
menemukan bug.

## Partisi juga ada pada output

Jangan hanya mempartisi input. Tanyakan **hasil** berbeda apa saja yang bisa
diproduksi sistem, lalu pastikan masing-masing bisa dicapai oleh setidaknya satu
pengujian.

> **Kebutuhan.** Pesanan di atas Rp 500.000 gratis ongkir; di bawah itu ongkir
> Rp 20.000; pesanan di atas Rp 5.000.000 butuh persetujuan manajer.

Partisi output: *ongkir dibayar*, *gratis ongkir*, *gratis ongkir + butuh
persetujuan*. Tiga pengujian, diturunkan dari hasilnya, bukan dari kolomnya.

## Di mana teknik ini meleset

**Mengasumsikan sebuah partisi tanpa memeriksanya.** "Semua string di atas 255
karakter berperilaku sama" — sampai 256 terpotong diam-diam dan 10.000 membuat
request-nya jatuh. Kalau Anda menduga sistem memperlakukan sebagian kelompok
secara berbeda, berarti itu dua partisi.

**Lupa bahwa valid ≠ satu partisi.** Kalau aturannya "mahasiswa dapat diskon
20%, karyawan 30%, selain itu 0%", maka *valid* adalah tiga partisi, bukan satu.

**Menguji hanya satu nilai invalid per pengujian.** Masukkan satu kolom invalid
dalam satu waktu. Kalau Anda mengirim formulir dengan empat kolom bermasalah dan
hanya mendapat satu pesan kesalahan, Anda nyaris tidak belajar apa pun tentang
tiga sisanya.

**Berhenti di partisi.** Tepi setiap partisi adalah tempat bug yang sebenarnya
berada — dan itu isi pelajaran berikutnya.

## Latih sendiri

Ambil kebutuhan ini:

> Kode diskon ShopMini panjangnya 6–10 karakter, hanya huruf dan angka, dan
> tidak membedakan huruf besar-kecil. Kode kedaluwarsa ditolak dengan pesan
> khusus.

Tuliskan dulu partisinya sebelum Anda membaca lebih jauh. Setidaknya Anda mesti
sampai pada: terlalu pendek, panjang yang valid, terlalu panjang, mengandung
simbol, mengandung spasi, ekuivalensi huruf kecil vs huruf besar, valid tapi
kedaluwarsa, kode tak dikenal, dan kosong.

Itu ~9 pengujian untuk satu kolom teks — dan sembilan yang *bisa
dipertanggungjawabkan*, karena Anda bisa menyebutkan apa yang dicakup
masing-masing.

## 🛠 Giliran Anda, di TestForge

Latihan sandbox untuk pelajaran ini memakai kolom yang berbeda supaya tidak
mengulang tabel kuantitas di atas: **kode diskon** ShopMini (6–10 huruf atau
angka, tidak membedakan huruf besar-kecil). Tulis test case per partisi untuk
kolom itu di suite Checkout — valid, terlalu pendek, terlalu panjang, karakter
yang tidak diperbolehkan, kedaluwarsa — dan checker-nya mencari setidaknya tiga
partisi berbeda di seluruh case Anda, dinilai dari apa yang benar-benar
dikatakan judul dan langkah tiap case, bukan dari kecocokan kata per kata.

Kalau Anda ingin berlatih sebelum sandbox terbuka untuk Anda, tulis dulu tabel
kuantitas di atas dengan tangan: satu baris per partisi, berisi input yang akan
Anda pakai dan hasil yang Anda harapkan. Simpan daftarnya; Anda akan
memperluasnya di pelajaran berikutnya.

**Selanjutnya:** boundary value analysis — saat kebutuhan yang sama menyerahkan
bug-nya yang sesungguhnya.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Kuantitas ShopMini menerima bilangan bulat 1–99. Seorang rekan menguji 5, 40, dan 80 lalu menganggap kolom itu sudah tercakup. Apa yang keliru?",
      choices: [
        { id: "a", text: "Tidak ada — tiga nilai yang tersebar di rentangnya sudah masuk akal" },
        { id: "b", text: "Ketiganya ada di partisi yang sama, jadi dua di antaranya tidak menambah apa pun dan semua partisi invalid tak teruji" },
        { id: "c", text: "Seharusnya mereka menguji setiap nilai dari 1 sampai 99" },
        { id: "d", text: "Nilai-nilainya valid, jadi tidak mungkin ada cacat yang ditemukan" },
      ],
      explanation:
        "5, 40, dan 80 adalah satu partisi yang diambil sampelnya tiga kali — pengujian kedua dan ketiga nyaris tidak membawa informasi baru. Partisi yang tidak diuji justru yang menarik: di bawah 1, di atas 99, bukan bilangan bulat, bukan angka, dan kosong; di situlah asumsi developer tidak pernah diperiksa.",
    },
    {
      id: "q2",
      stem: "\"Mahasiswa dapat diskon 20%, karyawan 30%, selain itu tidak dapat apa-apa.\" Itu berapa partisi valid?",
      choices: [
        { id: "a", text: "Satu — semua pelanggan yang valid" },
        { id: "b", text: "Dua — yang mendapat diskon dan yang tidak" },
        { id: "c", text: "Tiga — mahasiswa, karyawan, selain itu" },
        { id: "d", text: "Tergantung berapa banyak pelanggan yang ada" },
      ],
      explanation:
        "Partisi adalah kelompok yang diperlakukan sistem dengan cara yang sama, dan ketiga kelompok ini menghasilkan tiga hasil berbeda. Meleburnya menjadi \"valid\" akan meninggalkan dua dari tiga aturan diskon tanpa pengujian.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang merupakan equivalence partition yang sah untuk diuji pada sebuah kolom teks wajib isi?",
      choices: [
        { id: "a", text: "Input kosong" },
        { id: "b", text: "Nilai dengan bentuk yang diharapkan" },
        { id: "c", text: "Input yang memuat karakter yang dilarang aturannya" },
        { id: "d", text: "Setiap string yang mungkin dengan panjang yang diperbolehkan" },
      ],
      explanation:
        "Input kosong, input yang bentuknya benar, dan input dengan karakter terlarang masing-masing ditangani secara berbeda, jadi masing-masing adalah partisinya sendiri. Mendaftar setiap string yang diperbolehkan adalah pengujian menyeluruh — justru hal yang ingin dihindari oleh partitioning.",
    },
  ],
};
