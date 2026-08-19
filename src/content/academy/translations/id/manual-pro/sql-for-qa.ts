import type { LessonTranslation } from "../../../types";

export const sqlForQaId: LessonTranslation = {
  slug: "sql-for-qa",
  title: "SQL untuk verifikasi",
  summary:
    "SELECT, JOIN, dan GROUP BY — cukup untuk membuktikan apa yang sedang diklaim layar.",
  body: `
## Anda belajar SQL bukan untuk membangun sesuatu

Developer belajar SQL untuk menulis fitur. Anda mempelajarinya untuk dua tugas
yang jauh lebih sempit, dan keduanya butuh mungkin sepersepuluh bahasanya:

1. **Verifikasi** — layar bilang pesanannya Paid. Apakah ia *tersimpan* sebagai
   Paid?
2. **Data uji** — Anda butuh akun dengan kode diskon kedaluwarsa dan tiga pesanan
   lampau, dan mengklik sampai ke sana makan dua puluh menit.

Sudah, itu saja. \`SELECT\`, sebuah \`WHERE\`, beberapa \`JOIN\`, dan \`GROUP BY\`
akan menjawab hampir semua pertanyaan Anda. Sisa bahasanya boleh Anda lewati
dulu tanpa rasa bersalah.

## Kenapa layar saja tidak cukup

Pesan konfirmasi berarti aplikasinya *meyakini* ia berhasil. Di antara keyakinan
itu dan basis datanya duduk cache, antrean, retry, dan transaksi, dan semuanya
tempat di mana sebuah UI bisa berkata jujur tentang apa yang ia lakukan sementara
datanya berkata lain.

Bug yang bersembunyi di celah itu adalah bug yang mahal, karena ia lolos dari
setiap pengujian UI:

- pesanannya tampil sebagai Paid, dan \`orders.status\` masih \`PENDING\` — sebuah
  webhook memperbarui layarnya dan penulisannya gagal
- alamatnya berubah di layar, dan salah satu dari dua tabel tidak menerimanya —
  penulisan separuh jalan, dan sekarang dua layar berselisih tentang pelanggan
  yang sama
- item yang dihapus lenyap dari daftar tapi barisnya masih ada dengan
  \`deleted_at\` terisi, lalu ia muncul lagi di ekspor bulanan
- total di layar benar karena front end menghitung ulang, dan total yang
  tersimpan keliru

Setiap satunya tak terlihat oleh tester yang hanya membaca layar.

## Lima klausa, dalam urutan yang dijalankan basis datanya

Layak diketahui karena ia menjelaskan error yang paling sering akan Anda temui:

~~~
FROM      tabel yang mana
WHERE     baris yang mana        <- jalan SEBELUM pengelompokan
GROUP BY  lipat baris jadi satu
HAVING    kelompok yang mana     <- menyaring SETELAH pengelompokan
SELECT    kolom yang mana
ORDER BY  urutkan
~~~

**\`WHERE\` menyaring baris; \`HAVING\` menyaring kelompok.** Anda tidak bisa
menaruh \`COUNT(*) > 1\` di dalam \`WHERE\` — pada titik itu penghitungannya belum
terjadi. Fakta tunggal itu ada di balik sebagian besar error yang didapat pemula.

## Sintaks secukupnya untuk berguna

Andaikan skema ShopMini: \`orders\`, \`order_items\`, \`customers\`,
\`discount_codes\`.

~~~sql
-- Pesanan yang baru saja saya buat
SELECT id, status, total, created_at
FROM orders
WHERE customer_email = 'buyer@shopmini.test'
ORDER BY created_at DESC
LIMIT 5;
~~~

\`ORDER BY created_at DESC LIMIT 5\` adalah bentuk yang paling sering akan Anda
ketik — *"tunjukkan apa yang baru saja terjadi"*.

~~~sql
-- Apakah total tersimpan cocok dengan jumlah baris itemnya?
SELECT o.id,
       o.total                              AS stored_total,
       SUM(oi.unit_price * oi.quantity)     AS calculated_total
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE o.id = 'ord_8831'
GROUP BY o.id, o.total;
~~~

Query itu adalah oracle *konsistensi internal* dari pelajaran oracle, ditulis
turun. Tak seorang pun perlu menyetujuinya sebagai sebuah kebutuhan: kalau kedua
kolom itu berselisih, software-nya keliru, dan Anda bisa menyatakannya tanpa
bertanya kepada siapa pun.

## JOIN, hanya dalam detail yang Anda butuhkan

\`JOIN\` mengikuti sebuah relasi: item milik pesanan ini, produk milik item ini,
pesanan milik pelanggan ini. \`INNER JOIN\` (bawaannya) hanya menyimpan baris yang
cocok di **kedua** sisi.

Bawaan itu jebakan bagi tester, dan inilah bentuknya:

~~~sql
-- SALAH: diam-diam menyembunyikan pesanan yang tidak punya item
SELECT o.id, COUNT(oi.id) AS items
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id;

-- BENAR: menyimpan setiap pesanan; yang kosong tampil 0
SELECT o.id, COUNT(oi.id) AS items
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id;
~~~

Pesanan tanpa baris item **justru bug yang sedang Anda buru**, dan \`INNER JOIN\`
menghapusnya dari hasil Anda. Ketika Anda mencari data yang hilang atau
terlantar, jangkaulah \`LEFT JOIN\` — lalu \`WHERE oi.id IS NULL\` untuk melihat
hanya yang rusak:

~~~sql
-- Pesanan yang sama sekali tidak punya baris item
SELECT o.id, o.status, o.created_at
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE oi.id IS NULL;
~~~

> **Query yang tidak menemukan apa pun bukanlah bukti.** Artinya "tidak ada baris
> yang cocok dengan query ini" — dan itu juga yang dihasilkan oleh salah ketik
> pada sebuah nilai kolom. Sebelum memercayai hasil kosong, jalankan query yang
> sama tanpa \`WHERE\`-nya dan pastikan ia mengembalikan sesuatu sama sekali.

## GROUP BY, untuk pertanyaan yang layak diajukan

Menghitung adalah tempat seorang tester menemukan masalah yang tidak dilaporkan
siapa pun:

~~~sql
-- Pesanan ganda: pelanggan sama, total sama, dalam satu menit
SELECT customer_email, total, COUNT(*) AS n
FROM orders
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY customer_email, total, DATE_TRUNC('minute', created_at)
HAVING COUNT(*) > 1;
~~~

Kirim ganda, ditemukan dalam satu query alih-alih dengan mengklik cepat-cepat.
Dan bentuknya bisa digeneralisasi — *"kelompokkan berdasarkan hal yang seharusnya
unik, simpan kelompok yang berisi lebih dari satu"* adalah cara Anda menemukan
duplikat apa pun.

~~~sql
-- Pemeriksaan sebaran: apakah semua state bisa dicapai?
SELECT status, COUNT(*) FROM orders GROUP BY status ORDER BY 2 DESC;
~~~

Jalankan itu setelah sebuah rilis. State dengan nol baris yang dulunya berisi
ribuan adalah bug yang tidak ditulis test case-nya oleh siapa pun.

## Aturan saat menyentuh basis data sungguhan

1. **Hanya-baca, selalu.** Mintalah akun hanya-baca dan pakailah. Satu kali Anda
   menjalankan \`UPDATE\` tanpa \`WHERE\` adalah hari Anda belajar kenapa.
2. **Jangan pernah di produksi tanpa izin**, dan jangan pernah dengan apa pun
   yang mengunci. Query berat di basis data hidup adalah gangguan layanan yang
   Anda sebabkan.
3. **Bungkus penulisan apa pun yang terpaksa Anda lakukan dalam sebuah
   transaksi**, dan periksa sebelum commit:

~~~sql
BEGIN;
UPDATE orders SET status = 'PAID' WHERE id = 'ord_8831';
-- lihat dulu hasilnya
SELECT id, status FROM orders WHERE id = 'ord_8831';
COMMIT;   -- atau ROLLBACK kalau bukan itu maksud Anda
~~~

4. **Perhatikan apa yang Anda salin ke sebuah tiket.** Hasil query adalah data
   pelanggan yang sungguhan. Email, alamat, dan detail pembayaran tidak layak
   berada di laporan bug — kutip id-nya dan kolom yang bermasalah, bukan
   barisnya.

## Kebiasaan yang layak dibangun

Setiap kali Anda memverifikasi sesuatu yang penting lewat UI, **ajukan
pertanyaan yang sama kepada basis datanya.** Itu makan satu menit, dan ia
pemeriksaan yang menangkap kelas cacat di mana aplikasi dan datanya berselisih —
kelas yang tidak akan pernah dicapai sebanyak apa pun klik.

## Di mana TestForge berperan

Taruh query-nya di dalam case. Langkah yang berbunyi *"pastikan pesanannya sudah
dibayar"* adalah pengujian yang berbeda tergantung siapa yang menjalankannya;
langkah yang berbunyi \`SELECT status FROM orders WHERE id = :orderId\` dengan
hasil yang diharapkan \`PAID\` adalah pengujian yang sama setiap kali, dan itu
beda antara case yang memeriksa layar dan case yang memeriksa sistemnya.

Apa pun yang Anda temukan dengan cara ini menjadi sebuah cacat dengan query
terlampir — developer bisa menjalankannya ulang, artinya mereka tidak mungkin
gagal mereproduksinya.

**Selanjutnya:** membawa semua ini ke lebih dari satu perangkat — menyusun
matriks browser dan perangkat dari analitik alih-alih dari takhayul.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Anda ingin menemukan pesanan yang tidak punya baris item — bug perusakan data yang Anda duga ada. Bentuk query mana yang akan menemukannya?",
      choices: [
        {
          id: "a",
          text: "JOIN orders ke order_items lalu group by id pesanan, mencari hitungan nol",
        },
        {
          id: "b",
          text: "LEFT JOIN orders ke order_items, lalu WHERE id item-nya IS NULL",
        },
        {
          id: "c",
          text: "SELECT dari order_items WHERE order_id IS NULL",
        },
        {
          id: "d",
          text: "JOIN kedua tabel lalu tambahkan HAVING COUNT(*) = 0",
        },
      ],
      explanation:
        "Inner join hanya menyimpan baris yang cocok di kedua sisi, jadi ia diam-diam menghapus justru pesanan yang sedang Anda buru — dan sebanyak apa pun pengelompokan sesudahnya tidak bisa memulihkan baris yang sudah dijatuhkan join-nya, dan itulah sebabnya varian hitungan-nol maupun HAVING sama-sama tidak mengembalikan apa pun. Left join menyimpan setiap pesanan dan membiarkan kolom item-nya null di tempat tidak ada yang cocok, jadi menyaring pada null itulah yang mengisolasinya. Mencari di order_items menjawab pertanyaan lain: item yang menunjuk ke pesanan yang tidak ada, bukan pesanan tanpa item.",
    },
    {
      id: "q2",
      stem: "Layar checkout menampilkan pesanan sebagai Paid. Kenapa mengajukan query ke basis data sepadan dengan satu menit tambahan?",
      choices: [
        {
          id: "a",
          text: "Ia lebih cepat daripada memeriksa ulang lewat antarmukanya",
        },
        {
          id: "b",
          text: "Layar menunjukkan apa yang diyakini aplikasinya; cache, antrean, dan penulisan yang gagal bisa membuat data tersimpan berselisih",
        },
        {
          id: "c",
          text: "Nilai di basis data adalah kebutuhannya, jadi layar selamanya cuma pendekatan",
        },
        {
          id: "d",
          text: "Ia memungkinkan Anda membetulkan barisnya kalau statusnya keliru",
        },
      ],
      explanation:
        "Di antara pesan konfirmasi dan baris tersimpan duduk cache, antrean, retry, dan transaksi, dan masing-masing tempat di mana UI bisa dengan jujur melaporkan keberhasilan yang penulisannya tidak pernah mendarat. Celah itulah tempat bug yang mahal tinggal, karena ia lolos dari setiap pengujian UI. Kecepatan bukan alasannya. Nilai tersimpan juga tidak otomatis menjadi kebutuhannya — sisi mana pun bisa jadi yang keliru, dan justru itulah sebabnya membandingkan keduanya informatif. Dan membetulkan barisnya akan menghancurkan bukti yang Anda cari.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang merupakan praktik yang sehat ketika seorang tester mengajukan query ke basis data sungguhan?",
      choices: [
        {
          id: "a",
          text: "Pakai akun hanya-baca untuk pekerjaan verifikasi",
        },
        {
          id: "b",
          text: "Sebelum memercayai hasil kosong, jalankan ulang query-nya tanpa klausa WHERE",
        },
        {
          id: "c",
          text: "Tempelkan baris hasil selengkapnya ke dalam cacatnya supaya developer punya seluruh konteksnya",
        },
        {
          id: "d",
          text: "Bungkus penulisan apa pun yang terpaksa Anda lakukan dalam sebuah transaksi dan periksa hasilnya sebelum commit",
        },
      ],
      explanation:
        "Akun hanya-baca menyingkirkan satu kelas kecelakaan sekaligus, dan sebuah transaksi memberi Anda jalan pulang dari penulisan yang memang Anda butuhkan. Menjalankan ulang tanpa penyaringnya adalah yang membedakan \"tidak ada yang rusak\" dari \"query saya yang keliru\" — keduanya mengembalikan nol baris dan tampak identik. Menempelkan baris utuh adalah yang harus dihindari: hasil query adalah data pelanggan yang sungguhan, dan email, alamat, serta detail pembayaran tidak layak berada di sebuah tiket. Kutip id-nya dan kolom yang keliru.",
    },
  ],
};
