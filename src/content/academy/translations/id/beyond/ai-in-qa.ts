import type { LessonTranslation } from "../../../types";

export const aiInQaId: LessonTranslation = {
  slug: "ai-in-qa",
  title: "AI di QA: apa yang dikerjakannya dengan baik, di mana ia berbohong",
  summary:
    "Membangkitkan test case, meninjau kebutuhan, dan kenapa pengujian yang masuk akal itu berbahaya.",
  body: `
## Sifat yang seharusnya membuat tester waspada

Sebuah model bahasa menghasilkan teks yang **tampak seperti** teks yang
dipelajarinya. Itulah seluruh triknya, dan ia sungguh berguna. Ia juga persis
sifat yang seharusnya dicurigai seorang tester, karena output jawaban yang
buruk dan output jawaban yang baik terlihat sama.

Pengujian yang jelas-jelas keliru dihapus dalam sepuluh detik. Pengujian yang
**masuk akal** — bentuknya tepat, namanya wajar, asersinya percaya diri,
harapannya keliru — ditinjau, disetujui, di-merge, lalu dibela selama dua tahun
karena "kan selama ini lulus".

Itulah bingkai untuk semua yang di bawah: bukan "apakah AI bagus atau buruk untuk
pengujian" melainkan **"ketika ini keliru, bagaimana ia gagalnya?"**

## Aturan yang mengurutkan setiap pemakaian

> **Gagal dengan berisik itu murah. Lulus secara keliru itu mahal.**

Urutkan setiap usulan pemakaian AI menurut mana di antara keduanya yang ia
hasilkan ketika modelnya keliru. Locator hasil pembangkitan yang tidak ada gagal
di run pertama dan berbiaya satu menit Anda. Asersi hasil pembangkitan
yang mengodekan aturan yang keliru menjadi hijau selamanya dan berbiaya cacat
yang seharusnya ia tangkap.

Semua di daftar pertama di bawah adalah murah-ketika-keliru. Semua di yang kedua
adalah mahal-ketika-keliru.

## Di mana ia sungguh membantu

**Memperluas draf cakupan pertama.** Anda sudah menulis enam case untuk sebuah
form. Mintalah nilai batas, case negatif, dan case yang dilewati orang pukul
empat sore hari Jumat. Separuhnya tidak relevan, dan itu tidak apa-apa — Andalah
penyaringnya. Saran yang keliru tidak berbiaya apa pun karena Anda tinggal tidak
mengambilnya.

**Memburu kerancuan di kebutuhan.** Pemakaian terkuat di daftar ini, dan yang
paling kurang dimanfaatkan. *"Daftarkan setiap kerancuan, asumsi tak tertulis,
dan kasus kesalahan yang hilang di acceptance criterion ini."* Ini murni tugas
kebahasaan, dan itulah gunanya alat ini sebenarnya, dan ia menghasilkan
pertanyaan alih-alih jawaban — pertanyaan yang Anda bawa ke orang yang menulis
kebutuhannya. Pelajaran perencanaan pengujian T2 bilang cacat terbaik ditemukan
sebelum kodenya ditulis; ini cara termurah menghabiskan dua puluh menit
mengerjakan itu.

**Data uji.** Nama yang realistis, alamat, string unicode, input yang absurd tapi
sah, daftar alamat email yang valid tapi terlihat tidak valid. Nol risiko:
datanya *diperiksa* oleh pengujian Anda, bukan dipercaya olehnya.

**Menjelaskan sesuatu yang asing.** Sebuah fungsi warisan, sebuah stack trace,
sebuah regex yang ditinggalkan seseorang. Anda memverifikasi penjelasannya
terhadap kode yang ada di depan Anda, jadi jawaban yang keliru tertangkap oleh
tindakan yang sama yang memakainya.

**Transformasi mekanis.** Mengubah tabel case menjadi berkas fixture, membuat
rangka page object dari sebuah dump DOM, mengganti nama lintas suite.
Membosankan, struktural, dan langsung terlihat ketika ia melenceng.

## Di mana ia berbohong

**Ia mengarang asersi dari nama.** Ditunjukkan \`applyDiscount()\`, ia akan dengan
percaya diri mengasersikan 10%. Spesifikasi Anda bilang berjenjang menurut nilai
pesanan. Pengujiannya kini entah gagal terhadap kode yang benar atau — lebih
buruk — lulus terhadap sebuah bug, karena implementasinya menebak hal yang sama.

**Ia mengarang API dan locator.** \`page.waitForSelectorVisible()\` tidak ada;
\`getByRole("button", { name: "Submit" })\` ketika tombolnya bertulisan "Save"
tidak cocok. Ini kebohongan yang *murah*: keduanya gagal seketika dan berisik.
Varian yang mahal adalah locator yang cocok dengan **sesuatu yang lain di
halaman itu**, dan itu pengujian yang diam-diam memeriksa elemen yang keliru.

**Ia menulis pengujian yang menyatakan ulang implementasinya.** Mintalah
pengujian "untuk fungsi ini" dan Anda sering mendapat logika fungsi itu
sendiri dipantulkan kembali sebagai harapan — termasuk bug-nya. Pengujian itu
tidak mungkin gagal, dan itu sama saja dengan tidak ada.

**Runtuhnya oracle — yang paling dalam.** Pelajaran test oracle T2: sebuah oracle
harus datang dari **luar** implementasinya. Model yang sudah ditunjukkan
implementasinya berada di dalamnya. Kalau alat yang sama menulis kodenya dan
pengujiannya, Anda punya satu pendapat yang ditulis dua kali, dan kesalahpahaman
atas kebutuhannya terkodekan di kedua sisi tempat tidak ada yang bisa
membantahnya.

Itu bukan argumen menentang memakainya untuk keduanya. Itu argumen agar oracle-nya
tetap manusiawi: **Andalah yang menyediakan apa arti "benar", dari kebutuhannya,
sebelum pengujiannya ditulis.**

## Meninjau pengujian hasil pembangkitan

Lima pertanyaan. Pengujian hasil pembangkitan yang tidak bisa menjawabnya
dikembalikan:

1. **Apakah setiap asersinya bisa dilacak ke sebuah kebutuhan yang dinyatakan**,
   atau modelnya menyimpulkannya dari sebuah nama?
2. **Apakah ia menguji perilaku atau menyatakan ulang implementasinya?**
3. **Akankah ia gagal kalau cacatnya dimasukkan kembali?** Yang ini bisa
   diperiksa — rusakkan kodenya dengan sengaja lalu jalankan. Kalau ia tetap
   hijau, ia hiasan.
4. **Apakah ia menduplikasi case yang sudah Anda punya?** Suite hasil
   pembangkitan menggembung cepat, dan suite yang tidak bisa dibaca siapa pun
   adalah suite yang tidak dirawat siapa pun.
5. **Apakah ia deterministik?** Pengujian hasil pembangkitan menyukai \`sleep\`,
   id yang tertanam, dan tanggal hari ini. Setiap kebiasaan yang dibongkar T3
   sepanjang satu track penuh.

Pertanyaan 3 adalah yang paling bernilai dan nyaris tidak ada yang
menjalankannya. Memutasi kodenya untuk memeriksa bahwa sebuah pengujian bisa
gagal bernilai lebih dari sebanyak apa pun membaca.

## Dua batas yang tidak bisa ditawar

**Kerahasiaan.** Spesifikasi yang belum dirilis, data pelanggan, kredensial, URL
internal, dan kode berpemilik bukan milik Anda untuk ditempelkan ke layanan yang
belum disetujui organisasinya. Ketahui ke mana prompt-nya pergi dan apa yang
disimpan penyedianya. "Cuma potongan kecil kok" adalah cara kode sumber dan data
pribadi meninggalkan sebuah perusahaan.

**Pertanggungjawaban.** *"AI yang menulisnya"* bukan pembelaan bagi pengujian
yang meloloskan sebuah cacat, sebagaimana "template-nya yang menulis" juga bukan.
Siapa pun yang mem-merge-nya memilikinya.

## Apa yang menguat, apa yang melemah

Jujurlah tentang keahlian Anda yang mana yang diubah hal ini.

**Melemah:** menulis case keempat puluh yang strukturnya serupa dengan tangan,
page object yang berupa boilerplate, mengonversi format, prosa draf pertama.

**Menguat:** memutuskan apa yang layak diuji, mengetahui apa arti "benar" dan
dari mana jawaban itu berasal, menimbang risiko, mengenali pengujian yang tampak
masuk akal padahal keliru, dan mengajukan pertanyaan di tinjauan kebutuhan yang
menyelamatkan sprint-nya.

Setiap satunya adalah pertimbangan, dan itulah yang menjadi pokok empat track
sebelumnya. Tester yang nilainya adalah mengetik sedang dalam masalah. Tester
yang nilainya adalah **memutuskan** baru saja mendapat pengetik yang lebih cepat.

## Di mana TestForge berperan

AI assist milik TestForge sengaja dibentuk oleh argumen di atas. Ia opt-in per
klik dan tidak pernah otomatis, ia berjalan dengan key dan endpoint milik
organisasi Anda sendiri, dan — bagian yang menanggung beban — **case hasil
pembangkitan dimasukkan sebagai \`DRAFT\`**. Manusialah yang menaikkannya. Desain
alatnya sendiri menyatakan bahwa modelnya menghasilkan sebuah saran, bukan sebuah
test case.

Versi terukurnya, setelah Anda menjalankan ini beberapa lama: tandai case yang
didraf AI, lalu setelah beberapa bulan ajukan satu-satunya pertanyaan yang
menyelesaikan perdebatannya — **case mana yang pernah gagal atas sebuah cacat
yang nyata?** Hitungan cakupan tidak membuktikan apa pun; peringatan tentang
teater pass-rate dari pelajaran metrik T2 berlaku untuk suite hasil pembangkitan
lebih daripada untuk jenis mana pun.

**Selanjutnya:** membangun portofolio QA — menerbitkan pekerjaan sungguhan yang
bisa dibuka dan dinilai seorang hiring manager.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Kenapa pengujian hasil pembangkitan AI yang tampak masuk akal lebih berbahaya daripada yang jelas-jelas rusak?",
      choices: [
        {
          id: "a",
          text: "Ia lebih lama dieksekusi, memperlambat suite-nya",
        },
        {
          id: "b",
          text: "Ia selamat dari tinjauan lalu lulus selamanya, jadi cacat yang seharusnya ia tangkap tidak pernah tertangkap dan tidak ada yang melihat pengujiannya lagi",
        },
        {
          id: "c",
          text: "Ia lebih sulit diubah menjadi page object belakangan",
        },
        {
          id: "d",
          text: "Ia tidak bisa dijalankan di CI tanpa modifikasi",
        },
      ],
      explanation:
        "Pengujian yang jelas-jelas rusak dihapus dalam hitungan detik — biayanya satu menit. Pengujian dengan bentuk yang tepat, nama yang wajar, dan asersi yang percaya diri tapi keliru akan disetujui dan di-merge, dan sejak itu hasil hijaunya diperlakukan sebagai bukti bahwa perilakunya benar. Itulah aturan pengurutan untuk setiap pemakaian AI dalam pengujian: gagal dengan berisik itu murah, lulus secara keliru itu mahal. Waktu eksekusi, struktur, dan kecocokan dengan CI semuanya hal yang Anda sadari seketika, dan persis karena itulah semuanya bukan bahayanya.",
    },
    {
      id: "q2",
      stem: "Apa itu 'runtuhnya oracle' ketika alat AI yang sama menulis implementasinya sekaligus pengujiannya?",
      choices: [
        {
          id: "a",
          text: "Suite pengujiannya tumbuh lebih cepat daripada kemampuan tim meninjaunya",
        },
        {
          id: "b",
          text: "Hasil yang diharapkan pengujiannya berasal dari sumber yang sama dengan kodenya, jadi kesalahpahaman atas kebutuhannya terkodekan di kedua sisi tanpa apa pun yang tersisa untuk membantahnya",
        },
        {
          id: "c",
          text: "Modelnya kehabisan konteks lalu mulai menghilangkan asersi",
        },
        {
          id: "d",
          text: "Pengujian hasil pembangkitannya menjadi tak deterministik dan labil",
        },
      ],
      explanation:
        "Sebuah oracle adalah jawaban atas 'ini seharusnya melakukan apa', dan pelajaran oracle T2 bersikeras ia harus datang dari luar implementasinya — sebuah kebutuhan, sebuah standar, sebuah sistem pembanding, seorang manusia. Model yang sudah ditunjukkan implementasinya tidak berada di luarnya, jadi pengujiannya sepakat dengan kodenya menurut konstruksinya dan hanya bisa menegaskan apa yang sudah dilakukan kodenya. Perbaikannya bukan menghindari alatnya melainkan menjaga oracle-nya tetap manusiawi: nyatakan apa arti benar, dari kebutuhannya, sebelum pengujiannya ditulis. Menggembungnya suite dan kelabilan memang masalah nyata pengujian hasil pembangkitan, tapi keduanya kasatmata; runtuhnya oracle tak terlihat dan ia lulus.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang merupakan pemakaian LLM berisiko rendah dalam pengujian, dalam arti jawaban yang keliru berbiaya murah?",
      choices: [
        {
          id: "a",
          text: "Memintanya mendaftar kerancuan dan asumsi tak tertulis di sebuah acceptance criterion",
        },
        {
          id: "b",
          text: "Membangkitkan data uji yang realistis dan rumit — nama unicode, alamat email yang valid tapi aneh",
        },
        {
          id: "c",
          text: "Meminta gagasan case batas dan case negatif tambahan di atas draf yang Anda tulis",
        },
        {
          id: "d",
          text: "Membiarkannya menulis hasil yang diharapkan untuk sebuah fungsi penetapan harga dari nama dan tanda tangan fungsinya",
        },
      ],
      explanation:
        "Tiga yang pertama gagal dengan murah karena Anda tetap menjadi penyaringnya dan tidak ada yang dipercaya begitu saja atas ucapan modelnya: kerancuan yang tidak relevan diabaikan, data hasil pembangkitan diperiksa oleh pengujian Anda alih-alih dipercayai olehnya, dan gagasan case yang buruk tinggal tidak ditulis. Yang keempat adalah mode kegagalan yang mahal — asersi yang disimpulkan dari sebuah nama adalah oracle karangan, dan kalau implementasinya menebak aturan yang sama, pengujiannya menjadi hijau di atas sebuah cacat. Hasil yang diharapkan berasal dari kebutuhannya, dan itu bagian yang disediakan manusia sebelum pembangkitannya, bukan sesudah.",
    },
  ],
};
