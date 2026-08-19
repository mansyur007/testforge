import type { LessonTranslation } from "../../../types";

export const portfolioId: LessonTranslation = {
  slug: "portfolio",
  title: "Membangun portofolio QA",
  summary:
    "Terbitkan proyek sungguhan — suite, run, hasil — yang bisa dibuka seorang hiring manager.",
  body: `
## Kenapa CV saja kalah

Setiap CV QA menyebutkan hal yang sama: *perancangan pengujian yang kuat,
ketelitian, berpengalaman dengan Playwright dan pengujian API.* Tidak satu pun
bisa diperiksa. Seorang hiring manager dengan dua ratus lamaran dan satu sore
tidak sedang membaca kata sifat — mereka sedang mencari **alasan untuk memasukkan
Anda ke daftar pendek**, dan alasan tercepat yang tersedia adalah pekerjaan yang
bisa mereka buka di sebuah browser.

Itulah seluruh argumen untuk sebuah portofolio. Bukan bahwa ia membuktikan Anda
hebat, melainkan bahwa ia memindahkan percakapannya dari *apa yang Anda klaim* ke
**apa yang Anda kerjakan**, dan di tanah itulah Anda ingin berdiri.

## Portofolio itu bukan

- Daftar alat dengan bilah kemajuan.
- Gambar sertifikat. (Sertifikat menyatakan Anda lulus ujian. Ia tidak menyatakan
  Anda bisa menguji.)
- Repositori privat yang tidak bisa dibuka siapa pun.
- PDF test plan empat puluh halaman. Tidak ada yang membuka PDF.

## Tiga artefak, dan apa yang dibuktikan masing-masing

**1. Suite pengujian untuk aplikasi publik yang sungguhan.** Pilih sesuatu yang
bisa dibuka siapa pun — situs demo publik, alat sumber terbuka, formulir
pemerintah. Ini lebih penting daripada kedengarannya: seorang peninjau bisa
menempelkan case Anda di sebelah benda aslinya lalu menilai apakah Anda
memahaminya.

**2. Riwayat eksekusi.** Case menunjukkan Anda bisa merancang. Run menunjukkan
Anda mengeksekusi, merawat, dan menjalankannya ulang, dan bahwa sebuah kegagalan
yang nyata ditemukan dan dicatat. Katalog tanpa run terbaca sebagai latihan
menulis.

**3. Sebuah argumen tertulis.** Dua atau tiga paragraf: risiko apa yang Anda
prioritaskan, di mana cakupan Anda berhenti, dan **apa yang sengaja tidak Anda
uji**. Inilah pembedanya. Siapa pun bisa mendaftar case; sangat sedikit kandidat
yang bisa menjelaskan sebuah kelalaian yang disengaja, dan menjelaskan kelalaian
adalah sebagian besar dari pekerjaannya.

## Kedalaman mengalahkan keluasan, dan selisihnya jauh

Satu fitur yang diuji dengan tuntas — dengan batas, case negatif, sudut hak
akses, dan alasan risiko yang dinyatakan — mengalahkan tiga ratus case dangkal
yang mencakup satu aplikasi utuh.

Tiga ratus case terbaca sebagai hasil pembangkitan, dan pikiran berikutnya
seorang peninjau adalah *"berapa banyak di antaranya yang pernah gagal?"*, dan
itu argumen teater pass-rate T2 diarahkan kepada Anda. Lima belas case dengan
penalaran yang terlihat terbaca sebagai seorang tester.

## Paruh otomasinya

Repositori kecil lebih berharga daripada yang besar di sini. Yang sebenarnya
diperiksa seorang peninjau, dalam sekitar empat menit:

- **Apakah ia jalan?** Satu perintah yang terdokumentasi, dari clone yang bersih.
  Kalau butuh lebih dari dua menit untuk mulai, mereka berhenti.
- **Apakah ia deterministik?** Tanpa \`sleep\`, tanpa kebergantungan pada urutan
  pengujian, tanpa tanggal kemarin yang tertanam. T3 menghabiskan satu track
  penuh untuk ini dan persis itulah yang dicari.
- **Apakah asersinya sungguhan?** Suite yang tidak mungkin gagal adalah hiasan —
  ujian yang sama yang diterapkan pada pengujian hasil pembangkitan di pelajaran
  sebelumnya.
- **Apakah kegagalannya terbaca?** Rusakkan sesuatu dengan sengaja, tangkap
  layarnya, dan pastikan ia menyebutkan apa yang melenceng.
- **CI yang berjalan saat push**, dengan hasil yang terlihat. Inilah beda antara
  "pernah menulis pengujian" dan "menjalankan pengujian".

Tambahkan dua atau tiga **laporan bug yang sangat baik** — judul, lingkungan,
langkah, diharapkan versus sebenarnya, bukti, dampak — ditulis sesuai standar T1.
Laporan bug yang bagus adalah peragaan kepedulian yang paling murah.

## Apa yang tidak boleh sama sekali masuk ke dalamnya

Ini garis tegas, bukan selera gaya:

- **Tidak ada apa pun milik pemberi kerja sekarang atau sebelumnya.** Bukan test
  case, bukan tangkapan layar, bukan dokumen internal yang "dianonimkan".
- **Tidak ada data pelanggan sungguhan**, selamanya.
- **Tidak ada URL internal, id tiket, nama rekan kerja** di tangkapan layar.
  Potong dan periksa sebelum menerbitkan.
- **Tidak ada kredensial** — dan periksa **riwayat git**-nya, bukan cuma pohon
  yang sekarang. Rahasia yang dihapus di commit berikutnya tetap terbit.

Hiring manager yang membuka portofolio Anda lalu melihat suite pengujian internal
pemberi kerja sebelumnya mempelajari satu hal tentang Anda, dan itu bukan hal
yang baik. Ini juga jenis kekeliruan yang mengakhiri hubungan kerja alih-alih
sebuah percakapan.

## 🛠 Latihan Anda

Proyek sandbox Academy Anda adalah proyek sungguhan dengan case sungguhan dan run
sungguhan. Terbitkan lalu bacalah sebagaimana orang asing membacanya.

1. Buka proyek sandbox Anda → **Settings → Public sharing**.
2. Nyalakan sakelar utamanya, lalu aktifkan **Test Cases**, **Runs**, dan
   **Reports** satu per satu.
3. Salin URL publiknya — bentuknya \`/public/<slug-proyek-Anda>\` — dan buka di
   **jendela privat**, dalam keadaan keluar. Itulah yang dilihat seorang
   peninjau.
4. Sekarang nilai diri Anda pada pemeriksaan enam puluh detik:
   - Apakah proyeknya punya deskripsi yang menyatakan ia apa?
   - Apakah judul case-nya bermakna, atau berbunyi "Test 1", "Test 2"?
   - Apakah setiap case punya hasil yang diharapkan, bukan cuma langkah?
   - Adakah riwayat run, dengan setidaknya satu kegagalan yang sungguhan?
   - Akankah orang asing memahami apa yang Anda uji dan kenapa?
5. Perbaiki tiga hal terburuk yang Anda temukan. Lalu biarkan berbaginya menyala
   dan taruh URL-nya di CV Anda.

Dua fakta tentang halaman itu yang layak diketahui sebelum Anda memakainya dalam
sebuah lamaran. **Publik berarti publik, bukan tak terdaftar** — URL-nya adalah
slug proyek Anda, jadi perlakukan apa pun yang Anda aktifkan sebagai bisa dibaca
siapa pun yang menebaknya. Dan halamannya \`noindex\` secara bawaan: kalau Anda
ingin ia muncul di hasil pencarian, itu sakelar terpisah yang Anda nyalakan
dengan sengaja.

Apa yang tidak pernah ia paparkan, apa pun yang Anda aktifkan: komentar,
lampiran, penerima tugas, tautan cacat, catatan tester per hasil, nama anggota
atau email. Run berupa daftar dengan statusnya dan tidak ada halaman per hasil
yang bisa membocorkan apa pun, dan Reports hanya berupa agregat. Anda bisa
menerbitkan pekerjaan Anda tanpa menerbitkan rekan-rekan Anda.

## Menaruhnya di tempat ia terlihat

Satu baris, di bagian atas CV, bukan di footer: **Portofolio pengujian:
\`<URL Anda>\`**. Baris yang sama di kolom headline LinkedIn atau di baris pertama
bagian about. Di kotak "ada lagi?" sebuah formulir lamaran, tautan itu bernilai
lebih daripada paragraf yang hendak Anda tulis.

Lalu periksa tiap beberapa bulan. Tautan mati di CV lebih buruk daripada tanpa
tautan, dan portofolio yang run terakhirnya empat belas bulan lalu mengatakan
sesuatu yang tidak Anda maksudkan.

**Selanjutnya:** persiapan wawancara — pertanyaan yang selalu datang, dan cara
menjawabnya dengan bukti yang baru saja Anda terbitkan.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Kenapa portofolio berisi 15 case yang dirancang tuntas untuk satu fitur biasanya mengalahkan 300 case dangkal yang mencakup satu aplikasi utuh?",
      choices: [
        {
          id: "a",
          text: "Peninjau tidak diperbolehkan menghabiskan lebih dari beberapa menit untuk satu lamaran",
        },
        {
          id: "b",
          text: "Kedalaman adalah tempat penalarannya terlihat; katalog dangkal yang besar terbaca sebagai hasil pembangkitan dan mengundang pertanyaan berapa banyak case itu yang pernah gagal",
        },
        {
          id: "c",
          text: "Suite yang besar lebih sulit dijaga tetap lulus di CI",
        },
        {
          id: "d",
          text: "Hiring manager lebih menyukai case manual daripada yang otomatis",
        },
      ],
      explanation:
        "Portofolio adalah bukti pertimbangan, dan pertimbangan hanya terlihat dalam kedalaman — batas, case negatif, sudut hak akses, dan alasan yang dinyatakan tentang di mana cakupannya berhenti. Tiga ratus case dangkal memperagakan kuantitas, dan justru itulah yang tidak kurang dimiliki siapa pun, dan semuanya memicu pertanyaan teater pass-rate dari pelajaran metrik T2: berapa banyak di antaranya yang pernah menangkap sesuatu? Waktu peninjau dan perawatan CI itu nyata, tapi bukan itu alasannya — peninjau dengan waktu tak terbatas pun akan tetap belajar lebih banyak dari yang lima belas.",
    },
    {
      id: "q2",
      stem: "Mana di antara ini yang layak berada di portofolio QA publik?",
      choices: [
        {
          id: "a",
          text: "Catatan tertulis yang menjelaskan apa yang sengaja Anda pilih untuk tidak diuji, dan kenapa",
        },
        {
          id: "b",
          text: "Riwayat run terhadap aplikasi publik, termasuk kegagalan sungguhan yang Anda temukan",
        },
        {
          id: "c",
          text: "Salinan yang dianonimkan dari suite regresi milik pemberi kerja sebelumnya",
        },
        {
          id: "d",
          text: "Dua atau tiga laporan bug dengan lingkungan, langkah, diharapkan versus sebenarnya, dan bukti",
        },
      ],
      explanation:
        "Kelalaian yang dinyatakan adalah artefak paling membedakan, karena menjelaskan apa yang Anda tinggalkan dan kenapa adalah sebagian besar dari pekerjaannya dan nyaris tidak ada yang melakukannya. Riwayat eksekusi membuktikan Anda menjalankan dan merawat suite-nya alih-alih cuma menulisnya, dan kegagalan yang benar-benar Anda temukan adalah bukti bahwa ia bisa gagal. Laporan bug yang bentuknya baik adalah peragaan kepedulian yang termurah yang ada. Suite milik pemberi kerja adalah garis tegasnya: menganonimkan tidak menjadikannya milik Anda, dan peninjau yang mengenalinya belajar sesuatu tentang bagaimana Anda akan memperlakukan bahan milik mereka.",
    },
    {
      id: "q3",
      stem: "Anda mengaktifkan public sharing pada proyek sandbox Anda untuk dipakai sebagai portofolio. Apa yang benar tentang halaman itu?",
      choices: [
        {
          id: "a",
          text: "Ia tak terdaftar — URL-nya tidak bisa ditebak, jadi hanya orang yang Anda kirimi yang bisa menjangkaunya",
        },
        {
          id: "b",
          text: "Ia publik di slug proyek Anda dan tiap bagiannya opt-in, dan ia tidak pernah memaparkan komentar, penerima tugas, tautan cacat, atau catatan tester per hasil",
        },
        {
          id: "c",
          text: "Ia menerbitkan segalanya di proyek itu, jadi apa pun yang privat harus dihapus lebih dulu",
        },
        {
          id: "d",
          text: "Ia muncul di hasil pencarian begitu berbaginya diaktifkan",
        },
      ],
      explanation:
        "URL-nya dibangun dari slug proyek Anda, dan itu membuatnya bisa ditebak — itulah beda yang disengaja antara public sharing dan tautan bertoken yang tak terdaftar, dan halaman pengaturannya menyatakannya. Apa yang muncul bersifat opt-in bagian demi bagian (Cases, Runs, Reports), dan hal-hal yang akan memaparkan orang alih-alih pekerjaan — komentar, lampiran, penerima tugas, tautan cacat, catatan per hasil, nama anggota — tidak pernah diterbitkan dengan pengaturan apa pun, jadi Anda tidak perlu menghapus apa pun untuk berbagi dengan aman. Pengindeksan adalah sakelar terpisah: halamannya noindex sampai Anda memutuskan lain.",
    },
  ],
};
