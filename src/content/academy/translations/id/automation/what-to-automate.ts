import type { LessonTranslation } from "../../../types";

export const whatToAutomateId: LessonTranslation = {
  slug: "what-to-automate",
  title: "Apa yang layak diotomasi",
  summary:
    "Piramida, para pengkritiknya, dan biaya perawatan yang tidak dianggarkan siapa pun.",
  body: `
## "Otomasikan semuanya" adalah rencana untuk merawat dua produk

Setiap pengujian otomatis adalah kode. Ia harus ditulis, ditinjau, dijalankan,
di-debug ketika rusak, dan diperbarui setiap kali hal yang diujinya berubah.
Sebuah suite pengujian adalah **aplikasi kedua** — yang tidak punya pengguna,
tidak punya pendapatan, dan punya tagihan perawatan yang sama besarnya dengan
yang pertama.

Itulah biaya yang tidak dimasukkan siapa pun ke dalam estimasi, dan itulah
sebabnya pertanyaan yang menarik bukan *"bisakah ini diotomasi?"* — hampir apa
pun bisa — melainkan **"akankah pengujian ini membayar dirinya sendiri?"**

## Hitungan balik modalnya

Bukan rumus untuk dihitung; sekumpulan suku untuk disimpan di kepala.

**Yang ia biayai:** menulisnya, ditambah perawatan setiap kali fiturnya berubah,
ditambah waktu jalan di setiap run, ditambah waktu triase untuk setiap
kegagalan — *termasuk kegagalan palsu*.

**Yang ia kembalikan:** berapa kali ia dijalankan, dikali ongkos bug yang akan
ditangkapnya, dikali peluang ia benar-benar menangkap sesuatu.

Pemeriksaan login pada halaman yang stabil yang berjalan di setiap pull request —
300 kali setahun, menjaga jalur yang dilalui setiap pelanggan — membayar dirinya
sendiri dalam sebulan. Usaha yang sama yang dibelanjakan pada layar yang didesain
ulang setiap sprint tidak pernah mengembalikan apa pun: Anda akan menulisnya
ulang empat kali dan ia tidak akan menemukan apa-apa, karena fiturnya toh sedang
aktif dilihat manusia.

Tiga pertanyaan sudah membawa Anda hampir sampai:

1. **Akankah ia sering dijalankan?** Nilainya per run. Pengujian yang
   berjalan dua kali itu skrip.
2. **Akankah ia rusak karena alasan yang benar?** Pengujian yang memerah karena
   perubahan CSS adalah kontrak perawatan, bukan jaring pengaman.
3. **Akankah ada yang bertindak ketika ia memerah?** Pengujian yang tidak
   diselidiki siapa pun adalah biaya dengan centang hijau di atasnya.

## Piramida, dan para pengkritiknya

Bentuk klasiknya: banyak unit test yang cepat di dasar, lebih sedikit integration
test di atasnya, dan lapisan tipis end-to-end test di puncak.

Penalarannya masuk akal dan sebenarnya bukan soal jumlah:

- **Kecepatan.** Unit test berjalan dalam milidetik, E2E dalam detik atau menit,
  dan suite yang harus ditunggu orang adalah suite yang berhenti dijalankan
  orang.
- **Kelokalan.** Unit test yang gagal menyebutkan nama fungsinya. E2E test yang
  gagal berkata "checkout rusak" lalu menyerahkan satu sore kepada Anda.
- **Determinisme.** Setiap lapisan yang Anda tambahkan — jaringan, browser, basis
  data, layanan pihak ketiga — adalah sumber kegagalan lain yang bukan cacat.

Para pengkritiknya layak ditanggapi serius alih-alih ditepis:

- **Lapisannya tidak terdefinisi rapi.** Tanyakan ke tiga tim apa itu "unit" dan
  Anda mendapat tiga jawaban, jadi berdebat soal rasionya sering kali berdebat
  soal kosakata.
- **Testing trophy** (front end): sebagian besar bug tinggal di sambungan
  antarkomponen, jadi integrasi layak mendapat pita terlebar, dan unit test yang
  terikat pada detail implementasi adalah beban — ia gagal pada refactor yang
  tidak merusak apa pun.
- **Honeycomb** (layanan): untuk sistem yang sebagian besarnya panggilan
  jaringan, integrasi adalah bagian tengah yang jujur dan pita dasar piramidanya
  memang tipis menurut kodratnya.

Yang selamat dari ketiga argumen itu adalah satu prinsip, dan inilah yang perlu
diingat: **dorong setiap pengujian serendah mungkin selagi ia masih memberi tahu
Anda sesuatu yang benar tentang apa yang diterima pengguna.** Bentuk yang
dihasilkannya mengikuti arsitektur Anda; ia konsekuensi, bukan target.

Satu hal yang disepakati semua orang adalah mode kegagalannya — **kerucut es
krim**, di mana nyaris segalanya diuji lewat UI. Lambat, labil, mahal, dan tetap
melewatkan logika di bawahnya.

## Apa yang diotomasi, secara konkret

| Kandidat bagus | Kandidat buruk |
|---|---|
| Pemeriksaan regresi pada jalur stabil bernilai tinggi — login, checkout, hak akses | Layar yang masih sedang didesain |
| Pemeriksaan yang sama untuk banyak input — 20 aturan pajak, 3 negara | Reproduksi sekali pakai atas temuan eksploratori |
| Suite smoke yang berjalan di setiap deploy | "Apakah ini terlihat menarik?" dan segala yang butuh pertimbangan |
| Pemeriksaan API dan kontrak di bawah UI | Alur yang berganti bentuk setiap sprint |
| Apa pun yang selain itu akan Anda jalankan lebih dari sekitar lima kali | Apa pun yang hasil harapannya tidak bisa dinyatakan siapa pun dengan tepat |

Satu entri layak dinaikkan keluar dari tabel itu: **mengotomasi data uji Anda.**
Skrip yang membuat akun dengan tiga pesanan lampau dan kode diskon kedaluwarsa,
dalam dua detik alih-alih dua puluh menit mengklik, sering kali adalah imbal
hasil tertinggi yang tersedia bagi tim yang sebagian besar manual — dan ia proyek
otomasi pertama yang jauh lebih mudah daripada sebuah suite UI.

## Mengotomasi di lapisan yang keliru adalah kekeliruan yang umum

Bentuknya, yang akan Anda temui di repositori sungguhan:

~~~
12 pengujian UI untuk validasi kata sandi
  - terlalu pendek     -> browser, isi form, tunggu, asersi
  - tanpa angka        -> browser, isi form, tunggu, asersi
  - tanpa huruf besar  -> browser, isi form, tunggu, asersi
  ...
4 menit waktu jalan, 12 hal untuk diperbarui ketika markup form-nya berubah
~~~

Kedua belasnya menguji satu fungsi yang memutuskan apakah sebuah string adalah
kata sandi yang bisa diterima. Versi yang biayanya sepersepuluh dan temuannya
justru lebih banyak:

~~~
1 pengujian UI   -> kata sandi tidak valid menampilkan pesannya, inline, di
                    form
N unit test      -> setiap aturan, setiap batas, dalam milidetik
~~~

Cakupan aturan yang sama, satu pengujian browser alih-alih dua belas, dan
kegagalannya kini menyebutkan aturan yang rusak alih-alih halaman tempat ia
rusak. Satu langkah itu — *"bisakah ini tinggal lebih ke bawah?"* — adalah
percepatan terbesar yang tersedia bagi sebagian besar suite.

## Biaya perawatan yang tidak dianggarkan siapa pun

- **Menulisnya kira-kira sepertiga dari biaya seumur hidupnya.** Sisanya adalah
  perawatan, triase, dan rerun.
- **Kelabilan berbunga.** Setiap kegagalan palsu berbiaya dua puluh menit
  seseorang dan sedikit kepercayaan, dan begitu sebuah suite melewati satu-dua
  persen hasil labil, orang berhenti memercayai warna merah sama sekali — dan
  pada titik itu Anda membayar suite yang tidak lagi berfungsi sebagai oracle.
  Itulah flake rate dari pelajaran metrik, dan itulah alasan ia layak berada di
  dashboard.
- **Suite yang lambat lebih jarang dijalankan**, dan suite yang lebih jarang
  dijalankan menemukan sesuatu lebih terlambat, dan itu seluruh proposisi
  nilainya berjalan mundur.
- **Pengujian dipensiunkan.** Pemeriksaan yang tidak pernah gagal selama setahun
  pada fitur yang tidak disentuh siapa pun adalah kandidat penghapusan, dan
  menghapusnya adalah tindakan yang normal dan profesional, bukan pengakuan
  bahwa ada yang terbuang.

Anggarkan perawatannya secara terbuka ketika pekerjaannya direncanakan. Otomasi
tidak pernah "gratis setelah sprint yang menulisnya", dan berpura-pura sebaliknya
adalah cara sebuah tim berakhir dengan 4.000 pengujian yang hanya dua belas di
antaranya dipercaya siapa pun.

## Apa yang bukan otomasi

Ia bukan pengganti pengujian, dan bersikap cermat soal ini melindungi pekerjaan
Anda sekaligus kualitas tim Anda.

Pengujian otomatis **menjalankan ulang pemeriksaan yang sudah dipikirkan
seseorang**. Ia tidak mengajukan pertanyaan, tidak menyadari apa pun yang tidak
diperintahkan untuk dilihat, dan seumur hidupnya tidak pernah menemukan kelas bug
yang tidak diantisipasi siapa pun. Segala yang ada di track manual — risiko,
eksplorasi, oracle, pertanyaan yang Anda ajukan saat refinement — berada di
hulunya dan tetap manusiawi.

Yang sebenarnya dibeli otomasi adalah **perhatian Anda**: ia mengangkat
konfirmasi berulang dari meja Anda supaya Anda bisa menghabiskan minggu itu untuk
pekerjaan yang hanya bisa dikerjakan manusia. Itu tawaran yang jujur, dan ia
lebih baik daripada tawaran yang biasanya diberikan orang.

## Di mana TestForge berperan

Catat keputusannya, bukan cuma hasilnya. Case yang ditandai \`automate\`,
\`manual\`, atau \`retire\` — dengan alasan satu baris — mengubah "kita tidak punya
cakupan di sana" menjadi "kita memilih untuk tidak, karena alasan ini", dan itu
langkah yang sama dengan yang dilakukan pelajaran risiko untuk fitur.

Lalu biarkan riwayat run memberi tahu Anda kapan sebuah keputusan kedaluwarsa:
case yang lulus setiap kali selama setahun adalah kandidat pensiun, dan case yang
lulus sekaligus gagal pada build yang sama adalah kelabilan untuk diperbaiki atau
dikarantina dengan jujur. Keduanya adalah perawatan yang hanya bisa Anda lakukan
kalau ada yang memperhatikan.

**Selanjutnya:** fondasi pemrograman untuk menulisnya — variabel, fungsi, async,
dan keahlian yang jauh lebih berguna yaitu membaca kode orang lain.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Sebuah repositori punya dua belas pengujian UI, satu per aturan validasi kata sandi, dengan waktu jalan empat menit. Apa perubahan terbaiknya?",
      choices: [
        {
          id: "a",
          text: "Jalankan paralel supaya waktu jam dindingnya turun",
        },
        {
          id: "b",
          text: "Pertahankan satu pengujian UI bahwa kata sandi tidak valid menampilkan pesannya, dan turunkan setiap aturan ke unit test",
        },
        {
          id: "c",
          text: "Gabungkan menjadi satu pengujian UI yang mencoba kedua belas kata sandi secara berurutan",
        },
        {
          id: "d",
          text: "Hapus saja — aturan validasi adalah tanggung jawab developer",
        },
      ],
      explanation:
        "Kedua belasnya menjalankan satu fungsi lewat jalur paling lambat dan paling rapuh yang tersedia, jadi perbaikannya adalah mendorongnya turun: aturannya diuji dalam milidetik dan pengujian browser-nya hanya membuktikan aturan itu tersambung ke form-nya. Paralelisme membeli waktu jam dinding sambil tetap menyisakan dua belas hal untuk diperbarui ketika markup-nya berubah. Menggabungkannya jadi satu pengujian mempertahankan biaya yang sama dan memperburuk pesan kegagalannya — Anda jadi tahu ada sesuatu tentang kata sandi yang rusak, bukan aturan mana. Dan menghapusnya sekaligus menghilangkan pemeriksaan sambungannya, dan itu satu hal yang tidak bisa diberikan unit test.",
    },
    {
      id: "q2",
      stem: "Sifat mana yang paling menentukan apakah mengotomasi sebuah pemeriksaan itu balik modal?",
      choices: [
        {
          id: "a",
          text: "Seberapa sulit pemeriksaan itu dikerjakan dengan tangan",
        },
        {
          id: "b",
          text: "Seberapa sering ia akan dijalankan, dibanding seberapa sering ia perlu ditulis ulang",
        },
        {
          id: "c",
          text: "Apakah perkakasnya bisa mengemudikan bagian aplikasi itu",
        },
        {
          id: "d",
          text: "Berapa lama versi otomatisnya ditulis",
        },
      ],
      explanation:
        "Imbal hasilnya per run dan biayanya sebagian besar perawatan, jadi rasio keduanya-lah yang menentukan: 300 run setahun di jalur yang stabil itu balik modal, sementara pengujian yang sama pada layar yang didesain ulang setiap sprint akan ditulis ulang empat kali dan tidak mengembalikan apa pun. Kesulitan manual adalah alasan untuk menginginkan otomasinya, bukan bukti ia akan balik modal. Kelayakan menjawab pertanyaan lain — hampir semuanya bisa diotomasi, dan itulah sebabnya \"bisakah kita\" berhenti menjadi pertanyaan yang berguna. Dan waktu menulis kira-kira sepertiga biaya seumur hidupnya, jadi mengoptimalkannya berarti mengoptimalkan angka yang lebih kecil.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang merupakan kandidat buruk untuk otomasi?",
      choices: [
        {
          id: "a",
          text: "Layar checkout yang tata letak dan alurnya didesain ulang setiap sprint",
        },
        {
          id: "b",
          text: "\"Apakah dashboard baru ini terasa jelas dan menarik bagi pengguna yang pertama kali datang?\"",
        },
        {
          id: "c",
          text: "Pemeriksaan smoke login dan checkout yang berjalan di setiap deploy",
        },
        {
          id: "d",
          text: "Reproduksi sekali pakai atas sesuatu yang ditemukan di sesi eksploratori kemarin",
        },
      ],
      explanation:
        "Fitur yang sedang aktif didesain ulang menjamin penulisan ulang dan toh sudah dilihat orang; pertanyaan tentang bagaimana sesuatu terasa tidak punya hasil harapan untuk diasersikan; dan reproduksi sekali pakai berjalan sekali, dan itu skrip alih-alih pengujian. Pemeriksaan smoke adalah kasus sebaliknya dan hal paling jelas di daftar itu untuk diotomasi — stabil, bernilai tinggi, dan ia berjalan di setiap deploy, jadi imbal hasil per run-nya menumpuk. Layak dicatat tentang yang sekali pakai: kalau reproduksi yang sama ternyata risiko regresi yang ingin Anda periksa setiap rilis, ia naik kelas menjadi kandidat yang bagus, dan itulah beda antara berjalan sekali dan berjalan sering.",
    },
  ],
};
