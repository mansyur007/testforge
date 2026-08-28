import type { LessonTranslation } from "../../../types";

export const stateTransitionTestingId: LessonTranslation = {
  slug: "state-transition-testing",
  title: "State transition testing",
  summary:
    "Untuk sistem yang punya ingatan: uji perpindahannya, lalu uji perpindahan yang seharusnya mustahil.",
  body: `
## Ketika aksi yang sama memberi hasil berbeda

Klik **Bayar** pada pesanan yang *pending* dan Anda mendapat layar pembayaran.
Klik **Bayar** pada pesanan yang sudah *dibayar* dan… apa? Inputnya identik;
output-nya bergantung pada **state** (keadaan) yang sedang ditempati sistem.

Apa pun yang punya siklus hidup membutuhkan teknik ini: pesanan, langganan, akun
pengguna, tiket, sesi, unggahan, alur persetujuan. Dalam pekerjaan sehari-hari,
inilah yang paling jarang dipakai dari empat teknik dasar, dan di sinilah bug
produksi yang buruk berada — tagihan ganda, refund atas pesanan yang dibatalkan,
tiket yang hidup kembali sendiri.

## Modelnya

Empat bahan:

- **State** — Draft, Menunggu pembayaran, Dibayar, Dikirim, Dibatalkan, Direfund
- **Transisi** — perpindahan yang sah di antaranya
- **Event** — apa yang memicu perpindahan (pelanggan membayar, admin
  membatalkan, timeout)
- **Aksi** — apa lagi yang terjadi sepanjang jalan (kirim email, lepas stok)

Digambar sebagai tabel, untuk pesanan ShopMini:

| Dari \\ Event | bayar | kirim | batal | refund |
|---|---|---|---|---|
| **Pending** | → Dibayar | – | → Dibatalkan | – |
| **Dibayar** | – | → Dikirim | → Dibatalkan | → Direfund |
| **Dikirim** | – | – | – | → Direfund |
| **Dibatalkan** | – | – | – | – |
| **Direfund** | – | – | – | – |

Setiap sel terisi adalah transisi yang sah. **Setiap tanda hubung juga sebuah
pengujian** — lihat di bawah.

## Tiga tingkat cakupan

**0-switch (semua transisi).** Satu pengujian per transisi sah.
Pending→Dibayar, Dibayar→Dikirim, Dibayar→Dibatalkan, dan seterusnya. Ini
garis dasarnya, dan untuk kebanyakan fitur takarannya memang pas.

**1-switch (semua pasangan transisi berurutan).** Pending→Dibayar→Dikirim,
Pending→Dibayar→Dibatalkan, Pending→Dibayar→Direfund… Menangkap bug ketika
*rute* menuju sebuah state itu berpengaruh — pesanan yang direfund setelah
dikirim berperilaku berbeda dari yang direfund sebelum dikirim, karena stoknya
sudah dilepas.

**Semua state.** Paling lemah: sekadar singgahi setiap state minimal sekali.
Murah, dan lebih baik daripada tidak sama sekali ketika waktu sudah habis.

## Pengujian yang paling berarti: transisi yang tidak sah

Setiap tanda hubung di tabel itu adalah sebuah klaim: *"ini tidak boleh
terjadi."* Tidak ada yang mengujinya, jadi tidak ada yang sadar ketika ternyata
bisa terjadi.

Cara sungguh-sungguh mencobanya — karena UI biasanya menyembunyikan tombolnya:

- Buka pesanan itu di dua tab browser. Batalkan di satu, lalu kirim di yang lain.
- Panggil API-nya langsung: \`POST /orders/42/ship\` pada pesanan yang
  dibatalkan.
- Pakai tombol back browser setelah perubahan state, lalu kirim ulang.
- Putar ulang webhook yang sudah dikirimkan penyedia pembayaran.
- Biarkan sebuah job latar (timeout pembayaran 30 menit) menyala tepat ketika
  manusia sedang mengeklik.

Pengujian kirim-ganda dan dua-tab menemukan bug uang dengan keandalan yang
mengejutkan. Kalau Anda hanya memungut satu kebiasaan dari pelajaran ini,
jadikan itu **"coba dua kali, coba terlambat, coba lewat API"**.

## Contoh dikerjakan: refund yang seharusnya tidak ada

Kebutuhan menyebut refund diperbolehkan dari *Dibayar* dan *Dikirim*. Tabelnya
tidak punya transisi Dibatalkan→Direfund. Maka:

1. Buat pesanan, bayar.
2. Batalkan (state: Dibatalkan, uang dikembalikan).
3. Kirim permintaan refund sekali lagi — dari API, atau dari tab yang basi.

Kalau sistem merefund untuk kedua kalinya, Anda menemukan cacat yang nilainya
melebihi seluruh pengujian sisa sprint itu digabungkan. Hasil yang diharapkan:
ditolak dengan pesan kesalahan yang jelas, dan pesanannya tetap Dibatalkan.

## Di mana state bersembunyi

Tidak semua yang punya state berbentuk pesanan:

- Sebuah **wizard form** — bisakah Anda melompat ke langkah 3 lewat URL
  tanpa menyelesaikan langkah 2?
- **Autentikasi** — keluar, masuk, sesi kedaluwarsa, reset kata sandi tertunda,
  tantangan 2FA belum tuntas. Apa yang dilakukan tombol back setelah logout?
- **Unggahan** — antre, mengunggah, memproses, selesai, gagal. Coba lagi dari
  gagal?
- **Feature flag dan hak akses** — peran pengguna berubah selagi halamannya
  masih terbuka.

## Periksa pemahaman Anda

- Gambar tabel transisi untuk sebuah langganan: Trial, Aktif, Menunggak,
  Dibatalkan. Sel mana yang jadi tanda hubung, dan bagaimana Anda akan mencoba
  salah satunya?
- Apa yang ditangkap cakupan 1-switch yang tidak ditangkap 0-switch?
- Kenapa "tombolnya tidak ditampilkan pada state itu" tidak menutup sebuah
  pengujian transisi tidak sah?

**Selanjutnya:** merangkainya — menulis test case yang bisa dijalankan orang
lain.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Apa yang ditangkap cakupan 1-switch yang tidak ditangkap cakupan 0-switch?",
      choices: [
        { id: "a", text: "Transisi yang sama sekali tidak pernah ditempuh" },
        { id: "b", text: "Cacat ketika rute menuju sebuah state mengubah perilakunya" },
        { id: "c", text: "State yang tidak pernah bisa dicapai" },
        { id: "d", text: "Transisi tidak sah yang disembunyikan UI" },
      ],
      explanation:
        "0-switch menempuh setiap transisi sah satu kali, terpisah-pisah. 1-switch menempuhnya berpasangan secara berurutan, dan itulah yang menyingkap bug bergantung riwayat — refund setelah pengiriman berperilaku berbeda dari refund sebelum pengiriman, karena stoknya sudah dilepas.",
    },
    {
      id: "q2",
      stem: "Tabel transisi memberi tanda hubung untuk Dibatalkan → Direfund, dan UI menyembunyikan tombol refund pada pesanan yang dibatalkan. Apakah transisi tidak sah itu sudah teruji?",
      choices: [
        { id: "a", text: "Ya — kalau tombolnya disembunyikan, transisinya tidak mungkin terjadi" },
        { id: "b", text: "Belum — aturannya harus tetap berlaku ketika UI dilewati" },
        { id: "c", text: "Belum, tapi hanya layak diuji kalau API-nya publik" },
        { id: "d", text: "Ya, asalkan tombol tersembunyi itu tercakup oleh pengujian otomatis" },
      ],
      explanation:
        "Tombol yang disembunyikan adalah kenyamanan UI, bukan aturan yang ditegakkan. Transisinya harus dicoba di tempat penjaganya benar-benar berada: lewat API, dari tab kedua yang basi, dari tombol back, atau dengan memutar ulang webhook yang sudah dikirimkan penyedia.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang layak diserang dengan state transition testing?",
      choices: [
        { id: "a", text: "Sebuah wizard form banyak langkah" },
        { id: "b", text: "Autentikasi: keluar, sesi kedaluwarsa, 2FA tertunda" },
        { id: "c", text: "Sebuah unggahan: antre, mengunggah, memproses, gagal" },
        { id: "d", text: "Halaman harga statis tanpa interaksi" },
      ],
      explanation:
        "Apa pun yang mengingat apa yang terjadi sebelumnya punya state yang layak dimodelkan — wizard, sesi, dan unggahan semuanya berperilaku berbeda tergantung bagaimana mereka sampai ke posisinya. Halaman tanpa state tidak punya transisi untuk dirusak.",
    },
  ],
};
