import type { LessonTranslation } from "../../../types";

export const securityForTestersId: LessonTranslation = {
  slug: "security-for-testers",
  title: "Pengujian keamanan untuk QA",
  summary:
    "OWASP Top 10 lewat mata seorang tester, beserta pemeriksaan yang bisa Anda jalankan hari ini.",
  body: `
## Baca bagian ini lebih dulu

Semua di pelajaran ini untuk sistem yang **Anda punya izin untuk mengujinya**.
Sebelum apa pun:

- **Izin tertulis.** "Ya sudah, silakan" secara lisan bukan itu. Cakupannya
  tertulis, menyebutkan environment-nya.
- **Hanya environment yang disebutkan**, jangan pernah produksi kecuali ia
  eksplisit masuk cakupan dengan sebuah jendela waktu dan seseorang yang
  mengawasi.
- **Tidak ada pihak ketiga.** Kalau aplikasi Anda berbicara dengan penyedia
  pembayaran, sistem mereka tidak pernah masuk cakupan.
- **Tanpa payload yang merusak**, tanpa data pelanggan sungguhan, tanpa denial of
  service.
- **Pada temuan yang nyata: berhenti, dokumentasikan, laporkan lewat kanal
  keamanan.** Jangan terus menggali untuk melihat seberapa jauh ia bisa dibawa.
  Membuktikan pintunya tidak terkunci itulah pekerjaannya; melangkah masuk lalu
  mendata isinya bukan.

Pelajaran non-fungsional T2 menetapkan aturan-aturan ini dan di sini ia tidak
lebih lunak. Tester yang mencolek kontrol akses tanpa aturan itu bukan sedang
teliti, ia sedang dipecat.

## Kenapa tester menemukan bug-bug ini

Anda tidak akan mengungguli seorang penetration tester dalam hal perkakas. Yang
Anda punya sebagai gantinya lebih baik daripada sebuah alat: **Anda tahu apa yang
seharusnya dilakukan aplikasinya, dan siapa yang seharusnya boleh
melakukannya.**

Sebagian besar cacat keamanan berdampak tertinggi tidak eksotis. Semuanya
kegagalan logika bisnis dan otorisasi — seorang pengguna menjangkau data pengguna
lain, sebuah langkah yang bisa dilewati, sebuah harga yang bisa disunting.
Pemindai terkenal buruk untuk itu, karena pemindai tidak tahu bahwa proyek 7
milik orang lain. Anda tahu.

## Broken access control: mulai di sini, selalu

Kelas serius yang paling umum, dan yang paling mungkin ditemukan seorang tester.
Tiga pemeriksaan, berurutan menurut hasil-gunanya:

**1. Ubah id di URL-nya.**

~~~
/projects/108/settings     ← milik Anda
/projects/109/settings     ← milik orang lain
~~~

Kalau itu termuat, Anda menemukan IDOR — insecure direct object reference — dan
itu cacat yang serius. Id yang berurutan membuat pencacahannya sepele.

**2. Panggil endpoint yang disembunyikan UI.** Ini argumen track otomasi dibuat
konkret: tombol yang disembunyikan bukan pemeriksaan hak akses.

~~~bash
curl -X DELETE https://app.example.com/api/v1/suites/s_123 \
  -H "Authorization: Bearer $VIEWER_TOKEN"
~~~

Token viewer seharusnya mendapat 403. Kalau ia mendapat 200, hak aksesnya hanya
ada di antarmukanya.

**3. Ubah peran di dalam request-nya, bukan di UI.** Payload pendaftaran atau
pembaruan profil yang diam-diam menerima \`"role": "ADMIN"\` adalah peningkatan
hak istimewa, dan itu terjadi lebih sering daripada yang Anda inginkan.

Sebuah matriks yang berguna, diisi dengan *mencoba* alih-alih dengan membaca
kodenya:

| | Catatan sendiri | Milik pengguna lain | Milik organisasi lain |
|---|---|---|---|
| Admin | ✓ | ? | **harus 403/404** |
| Member | ✓ | ? | **harus 403/404** |
| Viewer | baca | ? | **harus 403/404** |
| Keluar | **harus 401** | **harus 401** | **harus 401** |

Setiap sel adalah sebuah pengujian. Kebanyakan tim belum pernah mengisi satu pun.

## Sisa Top 10, sebagai pemeriksaan seukuran tester

| Kelas | Yang dicoba | Yang Anda cari |
|---|---|---|
| **Injeksi** | \`' OR '1'='1\`, \`'; --\` di input, dan di parameter URL | Error basis data, kumpulan hasil yang berubah, stack trace |
| **XSS** | \`<script>alert(1)</script>\`, \`"><img src=x onerror=alert(1)>\` | Input Anda kembali dalam keadaan **dieksekusi** alih-alih ditampilkan |
| **Kegagalan auth** | Kata sandi lama setelah diganti; sesi setelah logout; token setelah peran berubah | Sesi yang hidup lebih lama daripada hal yang mengizinkannya |
| **Salah konfigurasi keamanan** | \`/.env\`, \`/.git/config\`, \`/admin\`, kredensial bawaan | Apa pun yang terjangkau padahal seharusnya tidak |
| **Data sensitif terpapar** | Baca response API-nya, bukan layarnya | Hash kata sandi, email pengguna lain, id internal di payload yang tidak pernah ditampilkan UI |
| **Desain yang tidak aman** | Lewati satu langkah di alur banyak langkah; putar ulang sebuah request | Logika bisnis yang ditegakkan semata-mata oleh urutan penyajian UI |

Dua di antaranya layak lebih dari satu baris.

**Data sensitif terpapar adalah tempat UI paling banyak membohongi Anda.**
Endpoint profil yang mengembalikan seluruh catatan pengguna lalu membiarkan front
end me-render tiga kolom berarti membocorkan sisanya kepada siapa pun yang
membuka devtools. Bacalah isi response-nya, selalu — ini kebiasaan dari pelajaran
otomasi API diarahkan ke pertanyaan yang berbeda.

**Desain yang tidak aman adalah yang sama sekali tidak bisa disentuh pemindai.**
Tambahkan item ke keranjang, lanjut ke pembayaran, lalu ubah kuantitas atau
harganya di dalam request-nya. Lompat dari langkah 1 ke langkah 4 sebuah wizard.
Putar ulang request "konfirmasi pesanan" dua kali. Checkout yang memvalidasi
harganya hanya di browser adalah cacat yang nyata dan berulang, dan tidak ada
alat yang akan menemukannya karena tidak ada apa pun tentangnya yang cacat
bentuk.

## Hal-hal yang layak diperiksa yang tidak ada di Top 10

- **Rate limiting.** Bisakah Anda mencoba 500 kata sandi? Meminta 1000 reset kata
  sandi?
- **Pesan kesalahan yang membedakan** "tidak ada pengguna itu" dari "kata sandi
  salah" — itu pencacahan pengguna, dan itu argumen 403-versus-404 yang sama
  dengan yang dibuat track otomasi tentang tidak mengonfirmasi keberadaan sebuah
  catatan.
- **Unggah berkas.** Apakah ia menerima \`.php\` atau \`.svg\`? Apakah ia disajikan
  kembali dari domain yang sama? Adakah batas ukurannya?
- **Token reset kata sandi.** Sekali pakai? Kedaluwarsa? Dibatalkan ketika kata
  sandinya berubah?
- **Header keamanan**, sekilas: \`Content-Security-Policy\`,
  \`Strict-Transport-Security\`, \`X-Content-Type-Options\`.

## Alat membantu, tapi ia paruh yang lebih kecil

**OWASP ZAP** dalam mode pasif adalah hal berguna yang termurah: alirkan sesi
eksploratori biasa Anda lewat ia lalu baca apa yang ia sadari. **Pemindaian
dependensi** — \`npm audit\`, Dependabot, Snyk — tempatnya di CI, karena
dependensi yang rentan adalah cara paling umum sebuah aplikasi mewarisi cacat
yang tidak ditulis siapa pun.

Tapi perlakukan seluruh keluaran pemindai sebagai **temuan untuk diverifikasi,
bukan cacat untuk diajukan.** Positif palsu adalah normanya, dan QA yang
mengajukan tiga puluh tiket pemindai tanpa verifikasi mengajari tim keamanan
untuk mengabaikannya.

## Melaporkan temuan keamanan

Berbeda dari laporan bug biasa dalam tiga hal: **kanal, kerincian, dan radius
ledakan.**

- **Kanal.** Bug keamanan di pelacak publik adalah sebuah pengungkapan. Pakai
  jalur privat apa pun yang tersedia; kalau tidak ada, ketiadaan itu sendiri
  layak diangkat.
- **Kerincian.** Request persis, response persis, akun dan peran yang dipakai,
  dan langkah seminimal mungkin. "Auth-nya rusak" tidak bisa ditindaklanjuti.
- **Dampak dalam bahasa biasa.** "Pengguna mana pun yang sudah masuk bisa membaca
  test case organisasi mana pun dengan mengubah id di URL-nya. Terkonfirmasi di
  staging dengan dua akun." Kalimat itu membuat perbaikannya terjadwal hari itu
  juga.

Dan sebutkan apa yang **tidak** Anda lakukan: sampai di mana Anda berhenti, apa
yang tidak Anda akses. Itu meyakinkan tim keamanan bahwa temuannya terkurung dan
memperagakan bahwa Anda bekerja di dalam aturannya.

## Di mana TestForge berperan

Matriks otorisasi di atas adalah sebuah suite pengujian, dan ia salah satu dari
sedikit area keamanan yang bisa diotomasi dengan rapi — contoh token viewer di
pelajaran otomasi API persis ini. Setiap selnya adalah sebuah request dengan kode
status yang diharapkan, semuanya berjalan dalam milidetik, dan semuanya tidak
pernah basi sebagaimana pemeriksaan manual.

Menuliskannya sebagai case dengan tanda \`security\` berarti riwayat run-nya
menjawab pertanyaan yang cepat atau lambat diajukan seorang auditor: *kapan
terakhir kali Anda memverifikasi bahwa seorang viewer tidak bisa menghapus sebuah
suite?* "Setiap build sejak Maret" adalah jawaban yang jauh lebih baik daripada
"kami mengujinya sekali".

**Selanjutnya:** contract testing — menangkap kerusakan integrasi antarlayanan
tanpa mendirikan environment end-to-end yang lengkap.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Kenapa tester sering lebih baik daripada pemindai dalam menemukan cacat keamanan berdampak tertinggi?",
      choices: [
        {
          id: "a",
          text: "Tester punya pengetahuan teknik eksploitasi yang lebih dalam daripada alat otomatis",
        },
        {
          id: "b",
          text: "Cacat terburuk biasanya kegagalan otorisasi dan logika bisnis, dan pemindai tidak tahu siapa yang seharusnya boleh melakukan apa",
        },
        {
          id: "c",
          text: "Pemindai tidak bisa mengirim request yang terautentikasi",
        },
        {
          id: "d",
          text: "Pemindai hanya memeriksa front end, tidak pernah API-nya",
        },
      ],
      explanation:
        "Pemindai mencari hal-hal yang cacat bentuk — string injeksi, versi yang diketahui rentan, header yang hilang. Ia sama sekali tidak tahu bahwa proyek 109 milik organisasi yang berbeda, bahwa langkah sebuah wizard tidak seharusnya bisa dilewati, atau bahwa sebuah harga tidak seharusnya bisa disunting di dalam request-nya, karena tidak satu pun dari itu cacat bentuk. Semuanya request yang bentuknya sempurna yang melakukan sesuatu yang tidak pernah dimaksudkan bisnisnya. Keunggulan tester adalah pengetahuan domain: Anda tahu untuk apa aplikasinya dan siapa yang seharusnya boleh melakukan apa, dan persis itulah yang dikodekan sebuah matriks otorisasi. Pemindai memang melakukan autentikasi dan memang menguji API — bukan di situ celahnya.",
    },
    {
      id: "q2",
      stem: "Anda mengubah id di sebuah URL dari /projects/108 menjadi /projects/109 dan data organisasi lain termuat. Apa yang Anda lakukan berikutnya?",
      choices: [
        {
          id: "a",
          text: "Cacah lebih jauh untuk menetapkan berapa banyak catatan yang terpapar, supaya laporannya punya data dampak yang lengkap",
        },
        {
          id: "b",
          text: "Berhenti, dokumentasikan request dan response persisnya, dan laporkan lewat kanal keamanan privat",
        },
        {
          id: "c",
          text: "Ajukan di pelacak isu publik supaya timnya cepat melihat",
        },
        {
          id: "d",
          text: "Coba id yang sama di produksi untuk memastikan ia masalah yang nyata",
        },
      ],
      explanation:
        "Membuktikan pintunya tidak terkunci itulah pekerjaannya; melangkah masuk lalu mendata isinya bukan — terus mencacah berarti mengakses lebih banyak data yang Anda tidak berhak atasnya, dan itu bisa mengubah temuan yang bersih menjadi insiden yang melibatkan Anda. Laporannya butuh request persis, response-nya, akun dan peran yang dipakai, serta dampaknya dalam bahasa biasa, dan semua itu sudah Anda punya dari satu kejadian tadi. Kanalnya sama pentingnya dengan isinya: bug keamanan di pelacak publik adalah sebuah pengungkapan. Dan menjangkau produksi membawa Anda sepenuhnya keluar dari cakupan yang diizinkan, dan itu satu batas yang tidak pernah layak dilanggar demi memastikan sesuatu yang sudah ditunjukkan staging kepada Anda.",
    },
    {
      id: "q3",
      stem: "Mana di antara pemeriksaan ini yang paling mungkin dijalankan seorang QA tanpa perkakas spesialis?",
      choices: [
        {
          id: "a",
          text: "Memanggil endpoint delete secara langsung dengan token seorang viewer untuk melihat apakah ia mengembalikan 403",
        },
        {
          id: "b",
          text: "Membaca isi response API untuk kolom yang tidak pernah ditampilkan UI",
        },
        {
          id: "c",
          text: "Mengubah harga atau kuantitas di dalam request checkout setelah langkah keranjang",
        },
        {
          id: "d",
          text: "Menjalankan beban 10.000 request bersamaan untuk melihat apakah endpoint login-nya tumbang",
        },
      ],
      explanation:
        "Tiga yang pertama semuanya pemeriksaan logika bisnis dan otorisasi yang tidak butuh apa pun selain devtools browser atau curl, dan ketiganya kelas yang paling buruk ditangani pemindai: hak akses yang ditegakkan hanya di UI, response yang membocorkan kolom yang disaring layar, dan alur yang aturannya hanya ada di urutan penyajian antarmukanya. Yang keempat adalah percobaan denial-of-service alih-alih pemeriksaan keamanan — ia eksplisit dikecualikan oleh aturan main di awal pelajaran ini, dan kalau Anda memang perlu tahu bagaimana sistemnya berperilaku di bawah beban, itu pengujian performa yang dijalankan di jendela waktu yang disepakati terhadap environment yang disepakati.",
    },
  ],
};
