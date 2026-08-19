import type { LessonTranslation } from "../../../types";

export const accessibilityBasicsId: LessonTranslation = {
  slug: "accessibility-basics",
  title: "Dasar-dasar aksesibilitas",
  summary:
    "Keyboard, kontras, label, pembaca layar — pemeriksaan yang memakan sepuluh menit.",
  body: `
## Tiga alasan, dan yang ketiga adalah sebab tester jadi mahir di sini

Yang pertama sudah jelas: sebagian pengguna Anda menavigasi dengan keyboard,
pembaca layar, zoom 300%, atau sebuah switch — dan checkout yang tidak bisa
mereka selesaikan adalah cacat, bukan selera.

Yang kedua, untuk sangat banyak produk ini **kewajiban hukum**, bukan kebajikan.
Pengadaan sektor publik di Eropa merujuk EN 301 549, European Accessibility Act
mencakup rentang luas produk dan jasa konsumen, dan aturan federal serta badan
publik AS juga menunjuk ke WCAG. Apa yang berlaku bagi perusahaan Anda adalah
pertanyaan untuk pengacara perusahaan Anda, bukan untuk Anda. Tugas Anda lebih
sempit dan sepenuhnya jelas: temukan kegagalannya dan laporkan **terhadap sebuah
standar yang disebutkan namanya**.

Alasan ketiga adalah yang mengubah tester menjadi pembela. Cacat aksesibilitas
hampir selalu cacat *semantik* — tombol yang sebenarnya \`div\` bergaya, input
tanpa label yang terkait, state yang hanya disampaikan lewat warna. Cacat yang
sama itulah yang membuat otomasi rapuh: sebuah locator tidak punya apa pun yang
stabil untuk dipegang, jadi ada yang menulis \`div:nth-child(3) > span\` dan ia
rusak sprint depan. Membetulkan aksesibilitas membetulkan fondasi otomasi Anda.
Anda akan bertemu ini lagi di track otomasi, dari sisi yang berlawanan.

Dan ini bukan minoritas kecil. Tambahkan kasus sementara dan situasional — lengan
digips, ponsel di bawah matahari terik, layar retak, ruangan bising dengan
autoplay — dan yang Anda gambarkan adalah semua orang, cepat atau lambat.

## Standarnya, di bagian yang Anda butuhkan hari ini

**WCAG 2.2**, tiga tingkat: A, AA, AAA. Hampir setiap komitmen yang akan Anda
temui adalah **AA**, jadi perlakukan AA sebagai standarnya kecuali diberi tahu
lain.

Kriterianya bernomor, dan nomor itulah yang membuat temuan aksesibilitas berhenti
menjadi perdebatan estetika. *"Kontrasnya agak terang"* adalah pendapat. *"Teks
badan pada 2,8:1 gagal memenuhi 1.4.3 Contrast (Minimum), yang mensyaratkan
4,5:1"* adalah cacat dengan spesifikasi di belakangnya. Pelajari selusin nomor di
pelajaran ini dan Anda bisa menulis laporan yang tidak dibantah siapa pun.

Empat prinsip yang menggantungi kriterianya (**POUR**) masing-masing layak satu
baris: **Perceivable** — bisakah mereka menerimanya; **Operable** — bisakah
mereka mengemudikannya; **Understandable** — bisakah mereka mengikutinya;
**Robust** — apakah ia selamat di teknologi bantu mereka.

## Pemeriksaan sepuluh menit

Tujuh pemeriksaan. Tidak satu pun butuh spesialis, semuanya perlu dikerjakan
sebelum rilis, dan di sebagian besar produk yang pertama saja sudah menemukan
sesuatu.

### 1. Singkirkan tetikusnya

Tab, Shift+Tab, Enter, Space, Escape, tombol panah. Tidak ada yang lain. Coba
selesaikan alur utama produk Anda.

- Bisakah Anda **menjangkau** setiap hal interaktif — termasuk dropdown kustom
  itu, tombol tutup modal, dan aksi berikon saja di baris tabel?
- Apakah **indikator fokus selalu terlihat** (2.4.7)? Desainer yang menghapus
  "garis luar yang jelek" adalah regresi aksesibilitas paling umum yang ada.
- Apakah fokusnya mengikuti **urutan visual** (2.4.3)? Sidebar yang datang
  terakhir di DOM tapi pertama di layar akan di-Tab dengan urutan yang tidak
  masuk akal.
- Apakah fokus pernah **terjebak** di luar sebuah modal (2.1.2) — widget yang
  bisa Anda tab masuki tapi tidak bisa Anda tinggalkan?
- Di dalam modal: apakah fokusnya **masuk ke sana**, bertahan di dalamnya,
  menutup dengan Escape, dan **kembali** ke kontrol yang membukanya?
- Apakah elemen yang terfokus pernah **tersembunyi di balik header lengket**
  (2.4.11)? Tab pelan-pelan menuruni halaman panjang dan perhatikan.

Pemeriksaan ini bernilai lebih daripada enam lainnya digabungkan, karena pengguna
pembaca layar menavigasi dengan keyboard. Apa pun yang tidak bisa Anda jangkau
dengan Tab, sama sekali tidak bisa mereka jangkau.

### 2. Klik labelnya

Klik *teks* yang terlihat dari sebuah kolom formulir — bukan kotaknya, tapi
kata-kata di sebelahnya. Kolomnya seharusnya terfokus.

Kalau tidak, labelnya tidak terkait dengan input-nya, artinya pembaca layar
mencapai kolom itu dan mengumumkan sesuatu seperti *"edit text, blank"*.
Penggunanya diminta mengetikkan sesuatu ke dalam kotak tanpa nama. Itu 1.3.1 dan
3.3.2, ia tak terlihat di layar, dan mengujinya makan satu detik per kolom.

Lalu tombol berikon saja: tempat sampah, pensil, "×" telanjang. Masing-masing
butuh nama yang bisa diakses. Buka panel aksesibilitas browser (dev tools →
Accessibility) dan baca apa yang sebenarnya diekspos elemennya; kolom nama yang
kosong adalah cacatnya (4.1.2).

### 3. Zoom

Dua pemeriksaan yang berbeda, dan orang sering mencampuradukkannya:

- **Zoom halaman ke 400%** pada jendela 1280px — kontennya harus mengalir ulang
  ke setara kolom 320px **tanpa penggulingan dua dimensi** (1.4.10). Harus
  menggulir ke samping untuk membaca setiap baris paragraf adalah kegagalannya.
- **Pembesaran teks saja ke 200%** (1.4.4) — tempat tombol dan kartu bertinggi
  tetap memotong labelnya sendiri.

Di mobile, hal yang sama datang sebagai penskalaan font sistem, yang di pelajaran
sebelumnya didaftar sebagai konfigurasi yang didukung, persis karena alasan ini.

### 4. Kontras

Ambangnya, dan hanya inilah yang perlu Anda ingat:

| Apa | Rasio minimum |
|---|---|
| Teks badan | **4,5:1** |
| Teks besar (≥24px, atau ≥18,7px tebal) | **3:1** |
| Batas komponen UI, grafis bermakna, indikator fokus | **3:1** |

Pemilih warna browser mana pun atau ekstensi pemeriksa kontras memberi Anda
angkanya dalam hitungan detik. Di mana kegagalannya selalu berada: teks
placeholder yang dipakai sebagai label, tombol "hantu" berwarna merek yang pucat,
teks bantuan abu-abu terang di bawah kolom, teks yang duduk di atas foto, dan
cincin fokusnya sendiri.

### 5. Jangan pernah warna sendirian (1.4.1)

Ambil tangkapan layar lalu buang warnanya, atau sekadar picingkan mata. Adakah
informasi yang *hanya* dibawa oleh warna?

- kolom tidak valid dengan garis merah dan tanpa pesan
- kolom status titik hijau / titik merah tanpa teks atau bentuk
- *"Kolom wajib ditandai dengan warna merah"*
- grafik yang enam garisnya dibedakan semata-mata oleh rona warna

Perbaikannya selalu menambahkan kanal kedua: teks, ikon, pola, label.

### 6. Pesan kesalahan yang bekerja (3.3.1, 3.3.3)

Kirim sebuah formulir secara keliru dengan sengaja, lalu periksa empat hal:
pesannya **menyebut kolomnya** dan mengatakan cara membetulkannya; ia berupa
**teks di dekat kolomnya**, bukan cuma garis merah; ia **terikat secara
program** ke input-nya sehingga pembaca layar mengumumkannya; dan formulirnya
tidak **membuang** apa yang sudah Anda ketik (3.3.7).

Yang terakhir itu bukan kerewelan — pengguna pembaca layar yang harus mengisi
ulang delapan kolom demi membetulkan satu salah ketik akan menyerah.

### 7. Satu smoke test dengan pembaca layar

Sepuluh menit dengan pembaca layar sungguhan mengajarkan lebih banyak daripada
satu jam membaca tentangnya. NVDA di Windows gratis; VoiceOver sudah tertanam di
macOS dan iOS.

Nyalakan lalu Tab menyusuri satu formulir dengan mata tetap di layar (tidak ada
yang meminta Anda bekerja dalam gelap). Untuk tiap kontrol, dengarkan tiga hal —
**nama**-nya, **peran**-nya, dan **state**-nya: *"Email, edit, required,
invalid"*. Kontrol yang mengumumkan peran tanpa nama, atau kotak tercentang yang
tidak pernah berkata "checked", adalah 4.1.2 di alam liar.

Anda tidak sedang menyimulasikan pengguna pembaca layar; mereka jauh lebih mahir
daripada Anda. Anda sedang menangkap pengumuman yang **sama sekali hilang**, dan
itu standar yang jauh lebih rendah namun tetap menemukan banyak.

## Jalankan pemindainya terakhir, bukan pertama

axe DevTools, Lighthouse, dan WAVE sungguh berguna, cukup satu klik, dan
sebaiknya ada di setiap rilis. Ketiganya juga sumber kesimpulan keliru yang
paling umum di seluruh bidang ini:

| Alat otomatis menemukan | Hanya manusia yang menemukan |
|---|---|
| \`alt\` yang hilang, tombol kosong, label formulir yang hilang | Apakah \`alt\`-nya **menggambarkan gambarnya** |
| Kontras pada latar polos | Apakah urutan tab-nya **masuk akal** |
| Bahasa halaman yang hilang, id ganda | Apakah pesan kesalahannya **bisa dipahami** |
| ARIA tidak valid, penyarangan keliru | Apakah widget kustom itu **bisa dioperasikan** sama sekali |

Tergantung studi siapa yang Anda percaya, pemeriksaan otomatis menangkap
antara sepertiga sampai separuh isu yang sungguhan. Jadi **"Lighthouse bilang
100" berarti halamannya tidak rusak secara kasatmata.** Itu tidak berarti ada
orang yang bisa memakainya — halaman dengan atribut alt berbunyi \`"image1.png"\`
di setiap gambar mendapat nilai penuh.

> **Tanpa ARIA lebih baik daripada ARIA yang buruk.** \`<button>\` bawaan datang
> dalam keadaan aksesibel secara cuma-cuma. \`<div role="button">\` adalah janji
> yang lalu harus Anda tepati dengan tangan, lengkap dengan tabindex, penangan
> Enter dan Space, serta gaya fokus — dan salah satunya selalu hilang. Sementara
> itu \`aria-hidden\` pada sesuatu yang bisa difokuskan menghasilkan hasil
> terburuk yang tersedia: elemen yang didarati keyboard dan yang menurut pembaca
> layar tidak ada.

## Melaporkannya supaya diperbaiki

Dua hal memisahkan cacat aksesibilitas yang terjadwal dari yang duduk di backlog
selamanya: **kriterianya** dan **dampak bagi penggunanya**.

~~~
Ringkasan: Checkout tidak bisa diselesaikan dengan keyboard — tombol Bayar tak
           terjangkau
WCAG:      2.1.1 Keyboard (A), 2.4.7 Focus Visible (AA)
Dampak:    Pengguna keyboard dan pembaca layar tidak bisa membeli apa pun. Tidak
           ada jalan memutar.
Langkah:   Keranjang -> Checkout, lalu Tab dari kolom Nomor kartu
Sebenarnya: Fokus melompat dari Nomor kartu ke tautan footer; Bayar dilewati
Diharapkan: Bayar menerima fokus sesuai urutan visual dan aktif dengan Enter atau
            Space
Catatan:   Bayar berupa <div onclick>; sebuah <button> akan memenuhi kedua
           kriteria itu
~~~

Lalu pertahankan severity-nya. *"Seorang pengguna tidak bisa menyelesaikan
pembelian"* adalah penghalang, entah penyebabnya null pointer atau tabindex yang
hilang, dan "kosmetik" adalah label yang diberikan pada kelas bug ini ketika tak
seorang pun di ruangan itu terdampak olehnya. Menjadi orang yang menyuarakan itu
adalah bagian dari pekerjaannya.

## Di mana TestForge berperan

Jadikan pemeriksaan sepuluh menit itu sebuah **suite**, bukan niat baik: satu
case per pemeriksaan di atas, dijalankan terhadap dua atau tiga alur kritis Anda
setiap rilis. Tulis tiap hasil yang diharapkan sebagai fakta yang bisa diamati
dengan kriterianya di dalamnya — *"indikator fokus terlihat di setiap kontrol
sepanjang alur (2.4.7)"* — sehingga tester lain sampai pada kesimpulan yang sama
dengan Anda.

Tandai cacatnya \`a11y\` dan Anda mendapat paruh lain argumennya secara
cuma-cuma: sebuah hitungan yang naik atau turun sepanjang rilis, dan itulah yang
mengubah perjuangan pribadi menjadi atribut kualitas yang terlacak.

**Selanjutnya:** kualitas-kualitas lain yang tidak ditulis kebutuhannya oleh
siapa pun — kecepatan, keamanan, dan ketangguhan — beserta pemeriksaan awal murah
yang menemukan yang memalukan.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Seorang developer menutup temuan aksesibilitas Anda dengan \"Lighthouse memberi halaman ini nilai 100 untuk aksesibilitas\". Apa tanggapan yang akurat?",
      choices: [
        {
          id: "a",
          text: "Nilainya hanya berlaku pada halaman tempat ia dijalankan, jadi halaman lain tetap perlu dipindai",
        },
        {
          id: "b",
          text: "Alat otomatis memeriksa sebagian kriteria dan tidak bisa menilai apakah alt text, label, urutan tab, atau pesan kesalahannya bermakna — nilai sempurna sejalan dengan halaman yang tidak bisa dipakai",
        },
        {
          id: "c",
          text: "Lighthouse hanya mengukur WCAG tingkat A, jadi kriteria AA tidak teruji",
        },
        {
          id: "d",
          text: "Nilainya tidak bisa diandalkan karena berubah-ubah antar-pelaksanaan",
        },
      ],
      explanation:
        "Pemindai bisa memberi tahu bahwa sebuah gambar punya atribut alt; ia tidak bisa memberi tahu bahwa alt-nya berbunyi \"image1.png\", bahwa urutan tab-nya melompat-lompat di layar, atau bahwa pesan kesalahannya tidak bisa dipahami. Berbagai studi menempatkan deteksi otomatis antara sepertiga sampai separuh isu yang sungguhan, jadi nilai penuh berarti \"tidak ada yang rusak secara kasatmata\", bukan \"bisa dipakai\". Poin per-halaman itu benar tapi jauh lebih lemah — ia menyiratkan halaman sisanya cukup dipindai dengan cara yang sama. Klaim soal tingkatnya semata-mata keliru, dan pemindaian aksesibilitas bersifat deterministik, tidak seperti nilai performa yang sering dikira orang sama.",
    },
    {
      id: "q2",
      stem: "Anda mengeklik teks yang terlihat \"Alamat email\" di sebelah sebuah kolom formulir dan tidak terjadi apa-apa — fokusnya tetap di tempatnya. Apa artinya itu?",
      choices: [
        {
          id: "a",
          text: "Tidak berarti banyak; mengeklik label itu kenyamanan, bukan keharusan",
        },
        {
          id: "b",
          text: "Labelnya tidak terkait secara program dengan input-nya, jadi pembaca layar akan mengumumkan kolom itu tanpa nama",
        },
        {
          id: "c",
          text: "Kolomnya nonaktif atau hanya-baca",
        },
        {
          id: "d",
          text: "Labelnya butuh sebuah peran ARIA supaya diumumkan",
        },
      ],
      explanation:
        "Fokus yang berpindah ketika label diklik adalah efek samping dari keterkaitan antara label dan input-nya, jadi klik itu adalah pengganti satu detik untuk pemeriksaan sambungan yang selain itu butuh dev tools. Tanpa keterkaitan itu kolomnya diumumkan sebagai kotak edit tanpa nama — penggunanya diminta mengetik ke dalam sesuatu yang tak bernama, gagal memenuhi 1.3.1 dan 3.3.2. Kolom yang nonaktif juga akan menolak fokus, dan itulah sebabnya Anda melihat state kolomnya sebelum menyimpulkan, tapi kolom aktif biasa yang mengabaikan labelnya adalah bug keterkaitan itu. Menambahkan peran pada labelnya adalah perbaikan yang keliru: elemen label biasa sudah semantik yang tepat, ia hanya perlu menunjuk ke input-nya.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang benar-benar cacat aksesibilitas?",
      choices: [
        {
          id: "a",
          text: "Garis luar fokus dihapus di seluruh situs karena seorang desainer menganggapnya jelek",
        },
        {
          id: "b",
          text: "Kolom yang tidak valid ditandai dengan garis merah dan tidak ada yang lain",
        },
        {
          id: "c",
          text: "Ikon pembatas yang murni dekoratif membawa atribut alt kosong",
        },
        {
          id: "d",
          text: "Aksi hapus sebuah baris berupa tombol berikon saja tanpa nama yang bisa diakses",
        },
      ],
      explanation:
        "Menghapus indikator fokus gagal memenuhi 2.4.7 dan membuat pengguna keyboard tidak tahu di mana mereka berada; garis merah sendirian membawa kesalahannya semata-mata lewat warna, gagal memenuhi 1.4.1 dan 3.3.1 sekaligus; dan tombol ikon tanpa nama mengumumkan sebuah peran tanpa nama, gagal memenuhi 4.1.2 — penggunanya diberi tahu ada tombol dan tidak diberi tahu tombol itu untuk apa. Atribut alt kosong adalah yang berbeda sendiri, dan ia praktik yang benar alih-alih cacat: gambar dekoratif memang sebaiknya disembunyikan dari teknologi bantu, dan alt kosong persis cara melakukannya. Menggambarkannya justru menambah kebisingan tanpa menambah informasi.",
    },
  ],
};
