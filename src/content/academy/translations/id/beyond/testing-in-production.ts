import type { LessonTranslation } from "../../../types";

export const testingInProductionId: LessonTranslation = {
  slug: "testing-in-production",
  title: "Observabilitas dan pengujian di produksi",
  summary:
    "Feature flag, canary, pemeriksaan sintetis, dan membaca log Anda sendiri.",
  body: `
## Apa yang bukan ini

"Menguji di produksi" bukan berarti melewati pengujian sebelumnya. Setiap argumen
di sebelas pelajaran sebelumnya tetap berlaku.

Artinya menerima sesuatu yang tidak bisa diperbaiki staging. Staging punya
sepersekian datanya, nol trafiknya, pihak ketiga yang ditiru, jaringan yang
berbeda, dan tidak satu pun pengguna Anda. Sebagian cacat hanya ada di tempat
hal-hal itu nyata — dan semuanya toh ditemukan di produksi. **Pertanyaannya cuma
apakah Anda menemukannya sebelum pengguna Anda, atau membacanya di sebuah tiket
support.**

Pelajaran sebelumnya tentang mendapatkan keyakinan tanpa environment penuh
sebelum deploy. Yang ini tentang paruh yang datang sesudahnya.

## Dua prasyarat, dan tidak satu pun opsional

Anda boleh menguji di produksi ketika Anda bisa melakukan keduanya:

**Melihat apa yang terjadi.** Log, metrik, dan trace, terjangkau oleh Anda, bukan
hanya oleh tim platform. Tanpa itu Anda tidak sedang menguji, Anda sedang
mencolek-colek.

**Membatasi kerusakannya.** Sebuah feature flag, sebuah canary, dan rollback yang
memakan hitungan menit. Tanpa itu, setiap pengujian produksi adalah taruhan bahwa
Anda benar.

Tim yang tidak punya keduanya sebaiknya memperlakukan "kami menguji di produksi"
sebagai gambaran tentang apa yang sedang menimpa mereka, bukan sebagai strategi.

## Observabilitas, dalam bahasa tester

| | Menjawab | Anda memakainya untuk |
|---|---|---|
| **Metrik** | *Apakah* ada yang salah? | Menyadari perubahan: laju kesalahan, latensi, throughput |
| **Trace** | *Di mana* salahnya? | Mengikuti satu request lintas layanan |
| **Log** | *Apa* yang terjadi? | Membaca detail kegagalan yang spesifik |

Versi praktisnya untuk seorang tester: ketika Anda mereproduksi sesuatu di
produksi, **tangkap trace id-nya.** Laporan bug yang membawa trace id melewati
seluruh bolak-balik "bisa berikan timestamp-nya, nanti kami cari", dan itu
kebiasaan paling bernilai di pelajaran ini.

**Empat sinyal emas** adalah apa yang diawasi ketika Anda tidak tahu apa yang
harus diawasi: latensi, trafik, kesalahan, kejenuhan. Sebagian besar kejutan
produksi muncul di salah satu dari keempatnya sebelum ada yang mengajukan apa
pun.

Dan versi numerik dari aturan T2 — angka tanpa kondisinya hanyalah pendapat —
adalah **SLO**: "99,5% request checkout di bawah 800md selama 30 hari". Kalimat
itu punya target, cakupan, dan jendela waktu, jadi ia bisa dipenuhi atau
dilewatkan alih-alih diperdebatkan. Jarak antara ia dan 100% adalah anggaran
kesalahannya, dan anggaran yang habis adalah alasan yang sah untuk berhenti
mengirim fitur.

## Deploy dan rilis adalah dua peristiwa berbeda

Memisahkan keduanya adalah kemenangan ketereujian terbesar yang tersedia di
produksi, dan itulah yang membuat semua yang di bawah ini aman.

**Feature flag** mengirim kodenya dalam keadaan gelap lalu menyalakannya untuk
siapa pun yang Anda pilih — akun Anda sendiri lebih dulu, lalu pengguna internal,
lalu sebuah persentase. Menguji dengan data sungguhan, integrasi sungguhan, dan
trafik sungguhan, dengan sakelar mati yang tidak butuh deploy.

Tiga hal yang dituntut flag sebagai gantinya:

- **Uji kedua keadaannya.** Jalur mati adalah jalur rollback-nya. Flag yang
  cabang matinya tidak pernah dijalankan adalah rollback yang gagal di saat yang
  paling buruk.
- **Ia melipatgandakan ruang state.** Sepuluh flag yang saling bebas berarti 1024
  kombinasi. Tidak ada yang menguji 1024 kombinasi, jadi jaga jumlah flag yang
  *hidup bersamaan* tetap sedikit dan ketahui mana yang saling berinteraksi.
- **Ia utang.** Flag yang sudah menyala untuk semua orang selama enam bulan
  adalah konfigurasi mati dan cabang yang tak teruji. Menghapusnya adalah sebuah
  tugas, dan tempatnya di papan pekerjaan.

**Canary release** mengirim sebagian kecil trafik sungguhan ke versi barunya lalu
membandingkan laju kesalahan dan latensinya dengan yang lama. Ini bisa diotomasi
dan biasanya kurang diotomasi: perbandingannya adalah pengujiannya, dan
rollback-nya seharusnya berupa asersinya yang gagal.

**Blue-green** memelihara dua environment penuh lalu mengalihkan trafiknya.
Rollback lebih cepat, infrastruktur lebih banyak, dan — bagian yang dilupakan
orang — **migrasi basis data Anda harus bekerja untuk kedua versi sekaligus**,
dan itu masalah pengujian sebelum ia masalah operasi.

## Pemantauan sintetis: tempat suite E2E Anda pergi untuk hidup

Ambil lima atau enam pengujian yang mencakup jalur kritis Anda — login,
pencarian, checkout — lalu jalankan terhadap produksi secara terjadwal dari
beberapa wilayah. Semuanya menjawab pertanyaan yang tidak dijawab dashboard mana
pun: *apakah benda itu bekerja saat ini juga, entah sudah ada yang mencobanya
atau belum.*

Aturan yang mencegahnya menjadi beban:

- **Akun uji yang khusus dan bisa dikenali**, jangan pernah milik pelanggan
  sungguhan.
- **Hanya-baca sebisa mungkin**, dan kalau tidak bisa, bersihkan bekas Anda.
- **Tandai trafiknya** supaya ia dikecualikan dari analitik, metrik konversi, dan
  pelaporan pendapatan. Checkout sintetis di dalam angka penjualan adalah
  kekeliruan yang mudah dibuat sekali.
- **Tidak ada yang merusak**, tanpa sistem pihak ketiga (pembayaran sintetis
  adalah pembayaran sungguhan), dan tidak meninggalkan data uji di tempat support
  akan menemukannya lalu membuka tiket.

Pemantauan sintetis dan pemantauan pengguna sungguhan menjawab pertanyaan yang
berbeda dan Anda menginginkan keduanya: RUM memberi tahu apa yang benar-benar
dialami pengguna Anda di perangkat sungguhan mereka, sintetis memberi tahu apakah
sebuah perjalanan tertentu bekerja pukul 4 pagi di Minggu yang sepi.

## Produksi juga sumber gagasan pengujian terbaik Anda

Inilah bagian yang kurang dimanfaatkan tester. Sebelum merancang putaran
pengujian berikutnya, pergilah dan bacalah:

- **Alur yang paling banyak dipakai.** Usaha sebaiknya mengikuti penggunaan, dan
  urutannya nyaris tidak pernah seperti yang diduga tim.
- **Bauran browser dan perangkat yang sungguhan.** Pelajaran kompatibilitas T2
  menyuruh menyusun matriksnya dari analitik Anda sendiri alih-alih dari grafik
  pangsa pasar — inilah datanya.
- **Endpoint yang memikul sebagian besar trafiknya**, dan di situlah regresi
  performa paling menyakitkan.
- **Kesalahan yang sudah terjadi.** Sebagian besar aplikasi mencatat kegagalan
  yang belum ditriase siapa pun. Membaca satu minggu isinya sering kali jam
  paling berhasil-guna dalam sebuah sprint.
- **Pencarian yang tidak mengembalikan apa pun**, formulir yang ditinggalkan di
  satu langkah tertentu, percobaan ulang.

Dan setelah setiap insiden: **insiden yang tidak menghasilkan sebuah pengujian
adalah insiden yang Anda sepakati untuk dialami lagi.** Tulis pemeriksaan
regresinya selagi post-mortem-nya masih terbuka, bukan dari tiketnya tiga minggu
kemudian.

## Di mana TestForge berperan

Arahkan pelaksanaan sintetis terjadwalnya ke sebuah proyek tersendiri lalu unggah
tiap hasilnya lewat \`/api/v1/junit\` sebagaimana yang dilakukan karya penutup T3.
Nilainya bukan pada satu pelaksanaannya, melainkan pada catatannya: sebuah suite
yang dinamai menurut tiap perjalanan kritis, satu hasil per selang waktu,
sehingga **"apakah checkout bekerja Selasa lalu pukul 03:00"** menjadi sebuah
kueri alih-alih sebuah ingatan.

Keterbatasan yang jujur: ini sistem manajemen pengujian, bukan platform
peringatan. Ia akan menyimpan riwayatnya dan menunjukkan polanya kepada Anda; ia
tidak akan membangunkan siapa pun pukul 3 pagi. Sambungkan peringatannya ke
tumpukan pemantauan Anda dan simpan TestForge untuk catatan yang selamat dari
insidennya.

**Selanjutnya:** AI di QA — di mana ia sungguh membantu, dan di mana pengujian
yang tampak masuk akal justru lebih buruk daripada tidak ada pengujian sama
sekali.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Sebuah tim ingin mulai menguji fitur baru terhadap trafik produksi. Apa yang harus ada lebih dulu?",
      choices: [
        {
          id: "a",
          text: "Suite end-to-end yang lengkap dan lulus di staging, sehingga pengujian produksinya hanya konfirmasi",
        },
        {
          id: "b",
          text: "Kemampuan mengamati apa yang terjadi — log, metrik, trace — dan kemampuan membatasi radius ledakannya dengan flag, canary, dan rollback yang cepat",
        },
        {
          id: "c",
          text: "Salinan basis data produksi yang bisa dikueri langsung para tester",
        },
        {
          id: "d",
          text: "Persetujuan tertulis dari support bahwa mereka akan menangani dampak apa pun ke pelanggan",
        },
      ],
      explanation:
        "Kedua kemampuan itulah yang memisahkan menguji di produksi dari berjudi di produksi. Tanpa observabilitas Anda tidak bisa tahu apa yang dilakukan perubahan Anda, jadi tidak ada yang Anda pelajari yang menjadi bukti; tanpa sebuah flag, canary, atau rollback yang cepat, setiap percobaan adalah taruhan bahwa Anda benar. Suite staging yang hijau layak dimiliki dan tidak menggantikan keduanya — seluruh premisnya justru bahwa staging tidak punya data, trafik, dan integrasi sungguhan tempat cacat-cacat ini tinggal. Akses kueri langsung ke data pelanggan adalah masalah privasi alih-alih prasyarat, dan persetujuan dari support bukan sebuah kendali: ia memindahkan konsekuensinya ke tim lain alih-alih membatasinya.",
    },
    {
      id: "q2",
      stem: "Kenapa keadaan 'mati' sebuah feature flag perlu diuji sesengaja keadaan 'menyala'-nya?",
      choices: [
        {
          id: "a",
          text: "Karena keadaan mati adalah jalur rollback-nya, dan rollback yang tidak pernah dijalankan gagal persis ketika Anda membutuhkannya",
        },
        {
          id: "b",
          text: "Karena flag yang dievaluasi mati tetap mengeksekusi kedua cabang kodenya",
        },
        {
          id: "c",
          text: "Karena kebanyakan platform flag default-nya menyala kalau layanannya tidak terjangkau",
        },
        {
          id: "d",
          text: "Karena keadaan mati adalah yang diindeks mesin pencari",
        },
      ],
      explanation:
        "Mematikan flag-nya adalah rencana daruratnya, jadi cabang mati yang tak teruji berarti pemulihannya belum terverifikasi pada saat ia paling menentukan — biasanya di tengah insiden, di bawah tekanan waktu, dengan orang yang menulisnya sedang tidur. Ini juga sebabnya jumlah flag yang hidup bersamaan itu penting: sepuluh flag yang saling bebas berarti 1024 kombinasi, dan tidak ada yang menguji 1024 apa pun, jadi disiplinnya adalah menjaga himpunan yang hidup tetap kecil dan mengetahui mana yang saling berinteraksi. Pilihan lainnya menggambarkan perilaku yang tidak dimiliki sistem flag; klien yang terkonfigurasi baik gagal ke jalur lama justru karena jalur itulah yang aman.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang merupakan praktik sehat untuk suite pemantauan sintetis yang berjalan terhadap produksi?",
      choices: [
        {
          id: "a",
          text: "Memakai akun uji khusus yang bisa dikenali alih-alih akun pelanggan sungguhan",
        },
        {
          id: "b",
          text: "Menandai trafiknya supaya ia dikecualikan dari analitik dan pelaporan pendapatan",
        },
        {
          id: "c",
          text: "Membersihkan data apa pun yang dibuat pelaksanaannya, dan menjaga pemeriksaannya hanya-baca sebisa mungkin",
        },
        {
          id: "d",
          text: "Menyertakan pembayaran sungguhan lewat penyedia pembayaran yang hidup, supaya pemeriksaannya mencakup seluruh perjalanannya",
        },
      ],
      explanation:
        "Tiga yang pertama adalah yang mencegah suite produksi menyebabkan masalah yang justru ingin ia deteksi: akun yang bisa dikenali berarti support dan tim data bisa mengenali aktivitasnya, penandaan menjaga pelaksanaan sintetis keluar dari angka konversi dan pendapatan, dan pembersihan mencegah suite-nya memenuhi produksi dengan puing yang harus ditriase orang lain. Pembayarannya adalah batasnya: transaksi sintetis lewat penyedia yang hidup adalah transaksi sungguhan dengan uang sungguhan dan pihak ketiga yang sungguhan, dan itu dikecualikan aturan mainnya — batas yang sama dengan yang digariskan pelajaran keamanan. Cakup perjalanannya sampai batas penyedianya lalu verifikasi integrasinya sendiri di environment sandbox yang dibangun untuk itu.",
    },
  ],
};
