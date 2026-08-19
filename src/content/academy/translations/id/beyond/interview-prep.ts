import type { LessonTranslation } from "../../../types";

export const interviewPrepId: LessonTranslation = {
  slug: "interview-prep",
  title: "Persiapan wawancara",
  summary:
    "Pertanyaan yang selalu datang, dan cara menjawabnya dengan bukti.",
  body: `
## Apa yang sebenarnya sedang dinilai

Wawancara QA bukan kuis definisi. Seperti apa pun rupa pertanyaannya, seorang
pewawancara sedang berusaha menuntaskan tiga hal:

1. **Bisakah Anda menemukan masalah** — secara sistematis, bukan karena
   kebetulan.
2. **Bisakah Anda menjelaskan penalaran Anda** — karena tester yang tidak bisa
   menjelaskan sebuah risiko tidak bisa membuatnya ditindaklanjuti.
3. **Bisakah Anda berbeda pendapat dengan baik** — dengan developer, dengan
   product owner, di bawah tekanan tenggat.

Hampir setiap pertanyaan baku adalah salah satu dari ketiganya yang memakai
kostum. Mengetahui yang mana yang sedang ditanyakan kepada Anda adalah sebagian
besar persiapannya.

## Pertanyaan yang selalu datang

| Pertanyaan | Yang sebenarnya ditanyakan |
|---|---|
| "Bagaimana Anda akan menguji halaman login?" | Apakah Anda sistematis, dan apakah Anda menyatakan asumsi |
| "Ceritakan bug yang Anda banggakan" | Bisakah Anda bercerita dengan bukti dan dampak |
| "Developer bilang itu bukan bug — apa yang Anda lakukan?" | Apakah Anda berdebat dengan bukti atau dengan otoritas |
| "Bagaimana Anda memutuskan apa yang diotomasi?" | Pertimbangan biaya-dan-nilai, bukan pengetahuan alat |
| "Kita kirim besok dan pengujiannya belum selesai. Apa kata Anda?" | Bisakah Anda memberi pernyataan risiko alih-alih ya atau tidak |
| "Bagaimana Anda menguji sesuatu tanpa kebutuhan?" | Apakah Anda tahu dari mana sebuah oracle berasal |
| "Bagaimana Anda menangani pengujian yang labil?" | Apakah Anda mengarantina dan memperbaiki, atau menjalankan ulang dan berharap |

Setiap satunya punya pelajaran di baliknya di Academy ini. Wawancaranya sebagian
besar adalah latihan memampatkan.

## Jawaban "bagaimana Anda akan menguji X", dalam empat langkah

Ini struktur paling bisa dipakai ulang di seluruh pelajaran ini, karena versi
tertentu dari pertanyaan itu muncul di hampir setiap wawancara QA.

**1. Bertanyalah sebelum menjawab.** Siapa yang memakai ini? Web saja, atau
mobile juga? Adakah alur password manager, SSO, 2FA? Apa yang terjadi di
hilirnya kalau ia gagal? Kandidat yang langsung mulai mendaftar case sudah
memberi tahu pewawancaranya bahwa mereka juga tidak bertanya kepada product
owner.

**2. Nyatakan asumsi Anda** terang-terangan: *"Saya akan mengandaikan aplikasi
web dengan login email-dan-kata-sandi dan tanpa SSO — beri tahu saya kalau itu
keliru."* Sekarang jawaban Anda tercakup batasnya alih-alih tidak lengkap.

**3. Jalanlah per kategori, bukan per daftar.** Kategori menunjukkan sebuah
metode; daftar menunjukkan sebuah ingatan:

- Happy path fungsional, dan jalur kesalahan utamanya
- Batas dan negatif — kosong, panjang maksimum, unicode, spasi, input mirip-SQL
  dan mirip-skrip
- Data dan state — akun terkunci, email belum terverifikasi, sudah masuk di
  tempat lain
- Keamanan — rate limiting, apakah pesan kesalahannya membedakan "tidak ada
  pengguna itu" dari "kata sandi salah", apa yang terjadi pada sesinya setelah
  kata sandinya berubah
- Kompatibilitas — browser dan perangkat yang **ditunjukkan analitik Anda**,
  bukan grafik pangsa pasar
- Aksesibilitas — hanya keyboard, fokus yang terlihat, pesan kesalahan yang
  diumumkan ke pembaca layar
- Non-fungsional — waktu response di bawah beban, dan perilakunya ketika layanan
  auth-nya lambat
- Di produksi — apa yang akan Anda awasi setelah rilis

**4. Sebutkan di mana Anda akan berhenti, dan kenapa.** *"Dengan dua hari saya
akan mencakup tiga kelompok pertama sepenuhnya lalu mengambil sampel sisanya,
karena penanganan kredensial adalah tempat kerusakannya berada."* Kalimat itu
adalah jawaban atas pertanyaan yang sebenarnya mereka ajukan.

Itu seluruh track T2 dalam sembilan puluh detik, dan itulah sebabnya track-nya
ada.

## Pertanyaan bercerita

Pakai STAR — situation, task, action, result — dengan satu tambahan yang
dibutuhkan tester: **akhiri dengan apa yang berubah setelahnya.** Sebuah case
regresi ditambahkan, sebuah proses diperbaiki, sebuah pemeriksaan dipindah lebih
awal. Itu mengubah "saya menemukan sebuah bug" menjadi "saya memperbaiki sistem
yang meloloskan bug", dan itu beda antara jawaban menengah dan jawaban senior.

Siapkan tiga cerita, dan latih sampai masing-masing dua menit alih-alih enam:

- **Bug yang Anda temukan dan berarti**, dengan dampaknya dinyatakan dalam mata
  uang bisnisnya — pendapatan, pengguna yang terdampak, data yang terancam.
  Bukan "sebuah bug critical".
- **Perbedaan pendapat yang Anda tangani** — idealnya yang ternyata Anda sebagian
  keliru. Pewawancara lebih memercayai cerita itu daripada cerita ketika Anda
  terbukti benar.
- **Sesuatu yang Anda perbaiki** — suite labil yang distabilkan, pemeriksaan
  rilis yang bergeser ke kiri, laporan yang mulai dibaca orang.

Untuk *"developer bilang itu bukan bug"*: jawabannya adalah **bukti, lalu
kebutuhannya, lalu eskalasi dengan keputusannya didokumentasikan**. Reproduksi
dengan bersih, tunjukkan apa kata spesifikasinya atau harapan penggunanya, dan
kalau ia masih disengketakan, serahkan keputusannya kepada siapa pun yang
memiliki rilisnya **dan catat bahwa keputusannya diambil**. Itu pembagian
pengamatan-versus-penilaian dari T2, dan itulah jawaban yang terbaca sebagai
senior.

## Take-home dan latihan langsung

Formatnya yang lazim: uji sebuah fitur yang dijabarkan, temukan bug di sebuah
aplikasi demo, tulis satu pengujian otomatis kecil, atau tinjau test case orang
lain.

Yang sebenarnya dinilai, kira-kira berurutan menurut bobotnya:

- **Struktur** — apakah Anda menata pekerjaannya, atau menghasilkan daftar tanpa
  pembeda.
- **Asumsi yang dinyatakan** — setiap take-home sengaja kurang spesifik.
  Menyebutkan kerancuannya mendapat nilai; menebak diam-diam tidak.
- **Keterulangan** — laporan bug yang tidak bisa direproduksi peninjaunya
  bernilai nol, terlepas dari nyata tidaknya bug-nya.
- **Apakah kodenya jalan**, dari clone yang bersih, dengan perintah yang Anda
  dokumentasikan.
- **Prioritas** — memberi tahu mereka apa yang akan Anda kerjakan berikutnya
  dengan waktu lebih adalah bukti pertimbangan, bukan alasan atas apa yang
  hilang.

Beri timebox dan sebutkan berapa timebox Anda. Kandidat yang menghabiskan empat
belas jam untuk latihan empat jam sudah memperagakan sesuatu yang mengkhawatirkan
alih-alih mengesankan.

## Pertanyaan Anda untuk mereka

Anda akan ditanya apakah Anda punya pertanyaan. Ajukan yang jawabannya memang
ingin Anda ketahui, karena ini juga bagian tempat Anda menyaring pekerjaannya:

- Seperti apa proses rilisnya, dari ujung ke ujung?
- Siapa yang memutuskan bahwa sesuatu siap dikirim?
- Berapa lama pipeline-nya, dan seberapa sering ia merah?
- Apa yang terjadi ketika sebuah cacat sampai ke produksi?
- Apakah QA ada di refinement, atau pekerjaannya tiba sudah diestimasi?
- Apa yang Anda inginkan sudah saya capai setelah tiga bulan?

Jawabannya memberi tahu Anda apakah perannya adalah pengujian atau sekadar cap
stempel dengan gelar pekerjaan pengujian, dan itu lebih berharga bagi Anda
daripada satu kesempatan tambahan untuk mengesankan.

## Dua catatan yang jujur

**Klaim tingkat yang bisa Anda pertahankan.** Melamar sebagai senior berarti
ditanya bagaimana Anda akan menstabilkan suite yang labil, menyusun framework
untuk tim beranggota lima, atau menegosiasikan sebuah rilis. Menjadi kandidat
tingkat menengah yang sangat baik mengalahkan menjadi senior yang tidak
meyakinkan, dan tawaran yang datang dari gambaran yang akurat adalah yang selamat
melewati tiga bulan pertama.

**Penolakan itu berkeragaman tinggi.** Kecocokan tim, kandidat internal,
pembekuan anggaran, seseorang dengan domain yang persis — sebagian besar itu
tidak ada hubungannya dengan Anda. Prosesnya adalah penjodohan alih-alih vonis.
Jalani cukup sering dan kumpulkan umpan balik yang bisa Anda kumpulkan.

## Bawa portofolionya

Semua di atas jadi lebih mudah ketika Anda bisa mengakhiri sebuah jawaban dengan
*"saya bisa tunjukkan."* Proyek publik dari pelajaran sebelumnya mengerjakan
lebih banyak dalam sebuah wawancara daripada kata sifat mana pun: case sungguhan,
run sungguhan, kegagalan sungguhan yang Anda temukan, dan penjelasan tertulis
tentang apa yang Anda pilih untuk tidak dicakup.

Ketika pertanyaannya *"dari mana Anda tahu pengujian Anda bagus?"*, membuka
sebuah riwayat run lalu menunjuk cacat yang tertangkap sebelum rilis adalah
jawaban yang tidak bisa dibantah siapa pun.

## Anda telah menyelesaikan Melampaui Fungsional

Performa dan keamanan sebagai pertanyaan seorang tester alih-alih sebagai alat
seorang spesialis. Kontrak sebelum deploy dan observabilitas sesudahnya. AI
diurutkan menurut bagaimana ia gagal alih-alih menurut apa yang dijanjikannya.
Dan dua pelajaran yang mengubah semuanya menjadi sesuatu yang bisa dinilai orang
asing.

Empat track, dari apa yang dikerjakan QA sampai bagaimana Anda dibayar untuk itu.
Kalau sertifikasi adalah langkah Anda berikutnya, roadmap-nya punya satu track
untuk itu — kuis per bab dan satu paket latihan penuh — dan ia menyebut skemanya
di sana, dengan pemberitahuan yang semestinya menyertainya.

Pergilah dan uji sesuatu yang nyata. Hanya bagian itu dari semua ini yang memang
akan mengajari Anda.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Anda ditanya \"bagaimana Anda akan menguji halaman login?\" Apa yang seharusnya pertama keluar dari mulut Anda?",
      choices: [
        {
          id: "a",
          text: "Daftar test case-nya, dimulai dari kredensial yang valid",
        },
        {
          id: "b",
          text: "Pertanyaan penjernih tentang pengguna, platform, dan apa yang gagal di hilirnya — lalu asumsi yang akan Anda pakai",
        },
        {
          id: "c",
          text: "Jenis-jenis pengujian yang akan Anda pakai, disebut dengan istilah silabus yang formal",
        },
        {
          id: "d",
          text: "Pernyataan bahwa halamannya tidak bisa diuji tanpa spesifikasi tertulis",
        },
      ],
      explanation:
        "Pertanyaannya adalah ujian metode, dan metodenya dimulai sebelum case-nya: siapa yang memakainya, platform mana, adakah SSO atau 2FA, apa yang rusak di hilirnya. Kandidat yang langsung mendaftar case sudah memperagakan bahwa mereka juga tidak akan bertanya kepada seorang product owner. Menyatakan asumsi setelah pertanyaannya membuat sisa jawabannya tercakup batasnya alih-alih tidak lengkap, dan itu memungkinkan pewawancaranya mengoreksi Anda dengan murah. Peristilahan sendirian tidak mengesankan siapa pun, dan menolak melanjutkan tanpa spesifikasi menggagalkan pertanyaan oracle-nya — Anda selalu bisa menguji terhadap harapan pengguna, sistem pembanding, dan sebuah asumsi yang dinyatakan.",
    },
    {
      id: "q2",
      stem: "Seorang developer menolak cacat Anda sebagai 'bukan bug'. Apa jawaban yang terbaca sebagai senior?",
      choices: [
        {
          id: "a",
          text: "Reproduksi dengan bersih, tunjukkan apa kata kebutuhannya atau harapan penggunanya, dan kalau masih disengketakan eskalasikan ke siapa pun yang memiliki rilisnya lalu catat keputusannya",
        },
        {
          id: "b",
          text: "Buka kembali tiketnya dengan severity yang lebih tinggi supaya ia tidak bisa diabaikan",
        },
        {
          id: "c",
          text: "Terima penilaian developer-nya, karena merekalah yang paling paham implementasinya",
        },
        {
          id: "d",
          text: "Angkat langsung ke product owner tanpa memberi tahu developer-nya",
        },
      ],
      explanation:
        "Bukti lebih dulu, lalu standar yang Anda pakai mengukur, lalu sebuah keputusan yang diambil orang yang memikul konsekuensinya — dan didokumentasikan, sehingga risiko yang diterima menjadi pilihan yang tercatat alih-alih perdebatan yang Anda kalah. Ini pembagian pengamatan-versus-penilaian dari pelajaran pelaporan T2: reproduksinya tidak bisa disengketakan, vonisnya adalah keputusan seseorang. Mengeskalasi lewat penggelembungan severity mengajari orang mengabaikan severity Anda; menyerah sepenuhnya meninggalkan alasan Anda ada; dan melangkahi developer-nya memenangkan satu tiket dengan ongkos hubungan kerja yang Anda butuhkan untuk lima puluh tiket berikutnya.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang benar-benar bernilai baik pada sebuah latihan take-home QA?",
      choices: [
        {
          id: "a",
          text: "Menyebutkan kerancuan di dalam briefnya dan menyatakan asumsi yang Anda pakai saat menguji",
        },
        {
          id: "b",
          text: "Laporan bug yang bisa direproduksi peninjaunya dari langkah Anda saja",
        },
        {
          id: "c",
          text: "Menyebutkan berapa timebox Anda dan apa yang akan Anda kerjakan berikutnya dengan waktu lebih",
        },
        {
          id: "d",
          text: "Menghabiskan tiga kali waktu yang disarankan demi mencakup sebanyak mungkin",
        },
      ],
      explanation:
        "Take-home sengaja dibuat kurang spesifik, jadi menyebutkan kerancuannya adalah latihannya alih-alih halangan terhadapnya, dan laporan yang bisa direproduksi adalah satu-satunya jenis yang bernilai terlepas dari nyata tidaknya cacatnya. Menyatakan timebox dan prioritas berikutnya adalah bukti pertimbangan — ia memberi tahu peninjaunya bahwa apa yang hilang adalah sebuah keputusan alih-alih kelalaian. Melampaui waktunya secara besar-besaran justru berbalik merugikan: ia membuat pekerjaannya mustahil dibandingkan dengan kandidat lain dan menandakan orang yang tidak bisa membatasi cakupan, dan persis itulah keahlian yang sedang diuji latihannya.",
    },
  ],
};
