import type { LessonTranslation } from "../../../types";

export const whatQaDoesId: LessonTranslation = {
  slug: "what-qa-does",
  title: "Apa yang sebenarnya dikerjakan seorang tester",
  summary:
    "Pekerjaan ini apa adanya: bukan mengklik semua tombol, melainkan memutuskan risiko mana yang layak dibayar dengan waktu yang Anda punya.",
  body: `
## Pekerjaannya dalam satu kalimat

Tugas seorang tester adalah **memberi tim informasi tentang kualitas produk yang
mereka bangun, cukup cepat sampai informasi itu masih ada gunanya**.

Baca sekali lagi, karena hampir semua kekeliruan pemula berawal dari
mempercayai hal lain:

- *"Tugas saya menemukan semua bug."* Tidak bisa. Tidak ada yang bisa — lihat
  [tujuh prinsip pengujian](/id/academy/fundamentals/seven-principles).
- *"Tugas saya membuktikan software-nya jalan."* Itu juga tidak bisa dibuktikan.
  Pengujian menunjukkan adanya cacat, tidak pernah ketiadaannya.
- *"Tugas saya jadi penjaga gerbang yang bilang tidak."* Keputusan rilis ada di
  tangan tim, dan biasanya di tangan product owner. Tugas Anda memastikan
  keputusan itu diambil dengan fakta di depan mata.

## Satu hari yang realistis

Tidak ada yang menghabiskan delapan jam mengeksekusi test case. Hari biasa
seorang QA di tim produk lebih mirip ini:

| Waktu | Yang Anda kerjakan |
|---|---|
| Stand-up pagi | Sampaikan apa yang sedang Anda uji, angkat hal yang menghambat |
| ~1 jam | Baca tiket/story fitur yang masuk pengujian *hari ini*, ajukan pertanyaan yang belum ditanyakan siapa pun |
| ~2 jam | Ujilah: sebagian dengan test case tertulis, sebagian menjelajah |
| ~1 jam | Tulis cacat yang Anda temukan — dengan benar, supaya diperbaiki |
| ~1 jam | Regresi di area yang tersentuh perubahan |
| ~1 jam | Tinjau acceptance criteria milik orang lain, atau perbaiki suite pengujian |

Perhatikan betapa banyak porsinya adalah **membaca dan bertanya**, bukan
mengklik. Bug termurah untuk diperbaiki adalah yang Anda tangkap di tahap
kebutuhan, sebelum satu baris kode pun ada. Tester yang membaca story lalu
bertanya *"apa yang seharusnya terjadi kalau kartu pengguna ditolak di tengah
proses?"* baru saja menghemat satu minggu.

## Anda sebenarnya dibayar untuk apa

**Pertimbangan atas risiko.** Waktu tidak akan pernah cukup untuk menguji
segalanya, jadi keahliannya ada pada memilih. Diberi alur checkout dan dua hari,
Anda pakai untuk happy path di enam browser, atau untuk berbagai mode kegagalan
pembayaran di satu browser? (Biasanya yang kedua — happy path itu justru yang
sudah dicoba developer.)

**Presisi.** "Rusak" tidak ada nilainya. "Di Safari 17, menambahkan item ke-100
ke keranjang mengosongkan keranjang dan memunculkan 500; di item ke-99 masih
normal; ini request yang gagal" bernilai satu sore waktu kerja orang lain.

**Keberpihakan pada pengguna.** Anda sering jadi orang pertama yang memakai
fitur itu sebagaimana manusia sungguhan akan memakainya, bukan sebagaimana
pembuatnya membayangkan.

## Manual vs otomasi bukan jenjang karier

Anda akan mendengar "QA manual" disebut sebagai tahap yang harus Anda tinggalkan.
Itu keliru, dan mempercayainya justru akan membuat Anda jadi automation engineer
yang lebih buruk.

Otomasi adalah **eksekusi**, bukan pengujian. Otomasi mengulang pemeriksaan yang
sudah Anda rancang, supaya manusia tidak perlu mengerjakannya. Merancang apa yang
layak diperiksa, dan menyadari hal yang tidak terpikirkan siapa pun untuk
diperiksa — itulah pengujian, dan itu bagian yang tidak bisa diotomasi.
Automation engineer terbaik adalah mereka yang sebelumnya tester manual yang
bagus, karena mereka tahu pemeriksaan mana yang sepadan dengan biaya perawatan
skripnya.

Yang *memang* berubah dengan otomasi adalah skala dan kecepatan. Itu sebabnya
Academy ini membahas keduanya, dengan urutan seperti itu.

## Di mana TestForge berperan

Semua yang di atas menghasilkan artefak: test case, run, hasil, cacat. Untuk
itulah tool test management ada — termasuk TestForge. Sepanjang track ini
Anda akan menulis test case sungguhan di proyek sungguhan, sehingga di akhir Anda
punya keahliannya sekaligus sesuatu yang bisa ditunjukkan saat wawancara.

**Selanjutnya:** bagaimana pekerjaan pengujian menyatu dengan cara software
benar-benar dibangun.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Seorang stakeholder meminta Anda menjamin rilis ini bebas bug. Apa jawaban yang jujur?",
      choices: [
        { id: "a", text: "Ya, asalkan suite regresi lengkap dijalankan lebih dulu" },
        { id: "b", text: "Tidak — pengujian bisa menunjukkan cacat itu ada, tidak pernah bahwa tidak ada yang tersisa" },
        { id: "c", text: "Ya, begitu cakupan otomasi mencapai 100%" },
        { id: "d", text: "Tidak, karena para developer terus memunculkan bug baru" },
      ],
      explanation:
        "Sebanyak apa pun pengujian tidak membuktikan ketiadaan cacat; ia hanya menurunkan peluang kegagalan. Angka cakupan mengukur apa yang dieksekusi, bukan apa yang benar, dan jawaban yang jujur menyebutkan apa yang sudah diuji, apa yang ditemukan, dan apa yang dibiarkan tanpa cakupan.",
    },
    {
      id: "q2",
      stem: "Anda punya dua hari sebelum rilis checkout. Waktu itu biasanya sebaiknya ke mana?",
      choices: [
        { id: "a", text: "Happy path di enam browser" },
        { id: "b", text: "Mode kegagalan pembayaran dan batas hak akses di satu browser" },
        { id: "c", text: "Menjalankan ulang setiap case di suite tanpa memandang perubahannya" },
        { id: "d", text: "Menulis lebih banyak test case untuk area yang tidak diubah siapa pun" },
      ],
      explanation:
        "Happy path adalah yang sudah dicoba developer, jadi di situlah tempat paling kecil kemungkinannya menemukan sesuatu yang baru. Pilihan berbasis risiko mengarahkan waktu yang langka ke mode kegagalan dan hak akses, tempat dampaknya berupa uang dan akses, lalu menyatakan terbuka apa yang tidak tercakup oleh matriks browser.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang termasuk aktivitas pengujian, meskipun tidak satu pun mengeksekusi test case?",
      choices: [
        { id: "a", text: "Bertanya saat refinement apa yang terjadi ketika kartu ditolak di tengah pembayaran" },
        { id: "b", text: "Meninjau acceptance criteria sebuah story untuk mencari kerancuan" },
        { id: "c", text: "Menulis pengumuman rilis" },
        { id: "d", text: "Berpasangan dengan developer menentukan unit test mana yang perlu ditambah" },
      ],
      explanation:
        "Pengujian adalah pekerjaan memperoleh informasi tentang kualitas, dan tempat termurah memperolehnya adalah sebelum kode ada. Pertanyaan saat refinement, peninjauan kriteria, dan pembentukan unit test sama-sama mencegah cacat; pengumuman rilis itu komunikasi, bukan pengujian.",
    },
  ],
};
