import type { LessonTranslation } from "../../../types";

export const testOraclesId: LessonTranslation = {
  slug: "test-oracles",
  title: "Test oracle: dari mana Anda tahu ini keliru?",
  summary:
    "Kebutuhan, produk pembanding, riwayat, dan heuristik untuk saat tidak ada spesifikasi.",
  body: `
## Setiap pengujian punya paruh kedua yang tersembunyi

Sebuah test case punya dua bagian, dan hanya satu yang dituliskan dengan cermat.
Paruh yang terlihat adalah *apa yang Anda lakukan*. Paruh yang tak terlihat
adalah **bagaimana Anda memutuskan hasilnya keliru**.

Paruh kedua itu punya nama: **oracle**. Ia sumber yang Anda pakai membandingkan
perilaku yang teramati. Setiap kali Anda mengajukan sebuah bug, Anda sudah
berkonsultasi dengan satu oracle, entah Anda bisa menyebutkan namanya atau tidak.

Pemula mengira hanya ada satu oracle dan itu adalah dokumen kebutuhan. Lalu
mereka bertemu pekerjaan nyata, tempat kebutuhannya berupa pesan Slack dari bulan
Maret, dan mereka menyimpulkan bahwa tanpa spesifikasi tidak ada yang bisa diuji.
Kesimpulan itu keliru, dan pelajaran inilah alasannya.

## Kebutuhan hanyalah satu oracle, dan bukan yang terbaik

Dokumen kebutuhan adalah oracle yang paling sering dikutip dan paling
dipercaya berlebihan. Tiga hal bisa salah dengannya:

- **Ia bisa diam.** Ia menyebut apa yang terjadi untuk input valid dan tidak
  menyebut apa pun tentang string kosong, dan diam bukanlah izin.
- **Ia bisa rancu.** Aturan ShopMini sendiri berkata gratis ongkir berlaku "di
  atas Rp 500.000" dan secara terpisah berkata member selalu dapat gratis ongkir
  dan internasional tidak pernah dapat. Seorang member di Singapura kena
  keduanya. Tidak ada implementasi yang bisa benar terhadap sebuah kontradiksi.
- **Ia bisa keliru.** Kebutuhan yang diimplementasikan dengan sempurna tetap bisa
  menjadi produk yang merugikan pengguna. "Ia melakukan apa yang dikatakan
  spesifikasi" adalah pembelaan bagi developer, bukan vonis atas software-nya.

Poin ketiga itulah yang layak dihayati. **Kesesuaian dengan spesifikasi bukanlah
definisi dari benar** — ia satu keping bukti tentangnya. Tester yang hanya bisa
membandingkan dengan sebuah dokumen telah menyerahkan pertimbangannya kepada
siapa pun yang menulis dokumen itu.

## Oracle lain yang sebenarnya sudah Anda pakai

Ketika tidak ada spesifikasi — atau spesifikasinya diam, rancu, atau mencurigakan
— Anda membandingkan dengan sesuatu yang lain. Inilah sumber-sumber yang
sesungguhnya bekerja dalam praktik.

| Oracle | Pertanyaan yang diajukannya | Di mana ia gagal |
|---|---|---|
| **Riwayat** | Apakah ini berperilaku berbeda sebelum perubahan? | Perilaku lama bisa jadi justru bug-nya |
| **Produk pembanding** | Bagaimana toko lain menangani ini? | Pilihan mereka belum tentu cocok untuk produk ini |
| **Fitur saudara** | Pencarian melakukannya begini; kenapa Keranjang tidak? | Ketidakkonsistenannya bisa jadi disengaja |
| **Klaim** | Pemasaran, halaman bantuan, label UI-nya sendiri | Klaim bergeser dari kodenya |
| **Standar & hukum** | Kode status HTTP, pembulatan mata uang, aturan pajak, aksesibilitas | Perlu dicari; jangan diuji dari ingatan |
| **Harapan pengguna** | Akankah orang sungguhan terkejut? | Harapan Anda bukan harapan pengguna rata-rata |
| **Tujuan** | Apakah ini mencapai alasan fitur itu ada? | Menuntut pemahaman bisnisnya |
| **Data & konsistensi internal** | Apakah totalnya sama dengan jumlah barisnya? | — yang satu ini jarang mengecewakan Anda |

Dua di antaranya layak ditekankan.

**Konsistensi internal** adalah oracle paling andal dalam daftar itu dan yang
paling jarang diajarkan. Anda sama sekali tidak butuh kebutuhan untuk tahu bahwa
subtotal keranjang harus sama dengan jumlah baris itemnya, bahwa pesanan yang
ditandai Dikirim tidak mungkin punya alamat kosong, atau bahwa angka di badge
header harus cocok dengan jumlah baris di halaman. Semua itu terang dengan
sendirinya dari datanya, bisa diperiksa tanpa bertanya kepada siapa pun, dan
ketika gagal, bug-nya tidak terbantahkan.

**Klaim** adalah yang termurah. UI produknya sendiri terus-menerus berjanji —
sebuah placeholder bertulisan *"6-10 karakter"*, sebuah tooltip, sebuah tombol
berlabel *Simpan draf*. Setiap satunya adalah asersi yang bisa diuji, yang
disodorkan produk itu tentang dirinya sendiri, dan tak seorang pun perlu
menyetujuinya lebih dulu sebagai sebuah kebutuhan.

## Heuristik konsistensi, satu baris masing-masing

Cara ringkas untuk memegang sebagian besar hal di atas. Tanyakan apakah
software-nya konsisten dengan:

- **riwayatnya** — perilaku yang berubah tanpa ada yang memutuskan mengubahnya
- **dirinya sendiri** — gagasan yang sama bekerja dengan dua cara di dua tempat
- **produk pembanding** — konvensi yang dibawa serta pengguna
- **klaimnya** — label, dokumentasi, dan pemasaran yang menyertainya
- **harapan pengguna** — apa yang akan diperkirakan orang yang wajar
- **tujuannya** — untuk apa fitur itu ada
- **standar** — aturan luar yang berlaku entah ada yang menuliskannya atau tidak

Lewatkan satu layar melalui daftar itu dan Anda akan menemukan sesuatu. Itu cara
tercepat mengubah "saya tidak punya kebutuhan" menjadi satu pagi pengujian yang
sungguhan.

## Oracle punya tingkat kewenangan, dan laporannya sebaiknya menyebut yang mana

Inilah bagian yang memisahkan laporan yang berujung diperbaiki dari laporan yang
berujung diperdebatkan. Ketika Anda mengajukan sebuah temuan, sebutkan **oracle
mana** yang Anda pakai, karena itu memberi tahu pembaca seberapa banyak ruang
perdebatan yang tersedia:

| Oracle yang dipakai | Temuannya terbaca sebagai | Tanggapan yang mungkin |
|---|---|---|
| Kebutuhan eksplisit | "Melanggar AC-3" | Diperbaiki, tanpa diskusi |
| Konsistensi internal | "Total ≠ jumlah baris" | Diperbaiki, tanpa diskusi |
| Standar | "Mengembalikan 200 pada penulisan yang gagal" | Biasanya diperbaiki |
| Klaim produk itu sendiri | "Placeholder bilang 6-10, tapi 11 diterima" | Diperbaiki, atau labelnya yang diubah |
| Produk pembanding | "Semua toko lain mempertahankan keranjang saat logout" | Sebuah diskusi |
| Harapan pengguna | "Ini akan mengejutkan orang" | Sebuah diskusi, dan Anda perlu argumen |

Tidak ada yang tidak sah di dua baris terbawah — banyak cacat sungguhan tinggal
di situ. Tapi **menyajikan temuan heuristik seolah-olah ia pelanggaran kebutuhan
adalah cara tester kehilangan kredibilitas**, dan itu cukup terjadi dua kali
saja. Tulis "keranjang kami mengosong saat logout; Tokopedia, Shopee, dan Amazon
semuanya mempertahankannya — apakah itu disengaja?" dan Anda mendapat sebuah
keputusan. Tulis "keranjang mengosong saat logout adalah bug" tanpa apa pun di
belakangnya dan Anda mendapat "itu memang desainnya", dan itu benar.

Laporan terkuat menumpuk oracle. *"Placeholder-nya bilang 6-10 karakter (klaim),
API-nya menerima 11 (ketidakkonsistenan antarlapisan), lalu pesanannya gagal di
pembayaran dengan 500 (standar: itu seharusnya 400)"* adalah tiga sumber
independen yang saling menyetujui, dan tidak ada cara membacanya yang menyimpulkan
tidak ada yang keliru.

## Ketika Anda sungguh-sungguh tidak bisa memastikan

Kadang Anda melihat sebuah perilaku dan tidak ada oracle yang menyelesaikannya.
Kasus member yang berkirim ke luar negeri di ShopMini persis seperti itu:
aturannya saling bertentangan, jadi apa pun yang dilakukan kodenya, Anda tidak
bisa menyebutnya benar atau keliru.

**Itu sebuah temuan, bukan kegagalan.** Ajukan sebagai pertanyaan terhadap
kebutuhannya, bukan sebagai cacat terhadap kodenya. Kerancuan yang ditemukan
sebelum rilis berbiaya satu pesan Slack; ditemukan setelah rilis ia berbiaya satu
perdebatan dengan pelanggan, satu utas support, dan satu hotfix — dan pada saat
itu sudah ada yang mengirimkan tebakan.

> Kalau Anda tidak bisa menyebutkan apa perilaku yang benar, jangan menebak dan
> jangan diam. Tuliskan kedua pembacaannya dan siapa yang harus memilih.

## Di mana TestForge berperan

Kolom **hasil yang diharapkan** pada sebuah case adalah tempat oracle Anda
mendarat, jadi tulislah sedemikian rupa sehingga orang berikutnya bisa tahu yang
mana yang Anda pakai. "Berjalan dengan benar" tidak menyebut oracle apa pun dan
tak terbantahkan dalam arti yang terburuk — tak seorang pun bisa memeriksanya dan
tak seorang pun bisa tidak setuju dengannya. "Subtotal sama dengan jumlah baris
itemnya; ongkir Rp 20.000 untuk pesanan domestik non-member pada tepat
Rp 500.000, sesuai aturan yang dinyatakan" menyebut dua oracle, dan seorang
peninjau bisa membantah salah satunya.

**Selanjutnya:** HTTP dan dev tools browser — tempat sangat banyak oracle
berhenti menjadi soal pendapat dan mulai menjadi sesuatu yang bisa Anda baca
langsung dari kabelnya.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Tidak ada spesifikasi untuk fitur yang diminta untuk Anda uji. Mana alasan terkuat bahwa ini tidak menghalangi pengujian?",
      choices: [
        {
          id: "a",
          text: "Anda bisa menulis sendiri kebutuhan yang hilang itu lalu menguji terhadapnya",
        },
        {
          id: "b",
          text: "Beberapa oracle lain tetap berlaku — klaim produk itu sendiri, konsistensi internalnya, riwayatnya, dan standar yang berlaku",
        },
        {
          id: "c",
          text: "Tanpa spesifikasi, perilaku apa pun yang diimplementasikan developer benar menurut definisi",
        },
        {
          id: "d",
          text: "Anda bisa menguji bahwa software-nya tidak crash, dan itu sama sekali tidak butuh oracle",
        },
      ],
      explanation:
        "Dokumen kebutuhan adalah satu oracle di antara banyak, dan bukan yang paling andal. Subtotal yang berselisih dengan baris itemnya sendiri sudah keliru tanpa dokumen apa pun terlibat, dan placeholder yang menjanjikan 6-10 karakter adalah klaim yang disodorkan produknya sendiri dan bisa Anda tagih. Mengarang kebutuhan menukar keputusan yang dimiliki bisnis dengan tebakan Anda. \"Tanpa spesifikasi berarti apa pun benar\" adalah keyakinan yang ingin dihapus pelajaran ini, dan pemeriksaan crash pun tetap memakai oracle — kebetulan saja oracle yang tidak dibantah siapa pun.",
    },
    {
      id: "q2",
      stem: "Anda menemukan ShopMini mengosongkan keranjang ketika pengguna logout. Tidak ada kebutuhan yang menyebutnya. Semua pesaing besar mempertahankannya. Bagaimana ini sebaiknya dilaporkan?",
      choices: [
        {
          id: "a",
          text: "Sebagai cacat: kehilangan keranjang pengguna jelas keliru",
        },
        {
          id: "b",
          text: "Sebagai temuan yang menyebut oracle-nya — pesaing mempertahankan keranjang — dan menanyakan apakah perilaku itu disengaja",
        },
        {
          id: "c",
          text: "Jangan dilaporkan sama sekali, karena tidak ada kebutuhan yang dilanggar",
        },
        {
          id: "d",
          text: "Sebagai cacat terhadap dokumen kebutuhannya, karena gagal menetapkan persistensi keranjang",
        },
      ],
      explanation:
        "Produk pembanding adalah oracle yang sah tapi berkewenangan lemah, dan laporannya sebaiknya membawa fakta itu dengan jujur: menyebut sumbernya mengubahnya menjadi keputusan yang diambil seseorang alih-alih klaim yang bisa mereka tepis. Mengajukannya sebagai cacat begitu saja mengundang penolakan \"memang desainnya\" yang tepat dan menghabiskan kredibilitas yang akan Anda butuhkan nanti. Diam saja membuang temuan sungguhan hanya karena ia datang dari sumber yang keliru. Mengajukan cacat terhadap dokumennya untuk celah yang belum Anda tetapkan pentingnya menaruh perdebatannya di tempat yang salah.",
    },
    {
      id: "q3",
      stem: "Pengamatan mana yang bisa dinilai keliru hanya dengan konsistensi internal, tanpa perlu menengok kebutuhan apa pun?",
      choices: [
        {
          id: "a",
          text: "Badge keranjang menunjukkan 3 item sementara halaman keranjang mendaftar 4 baris",
        },
        {
          id: "b",
          text: "Total ringkasan pesanan Rp 480.000 tapi baris itemnya berjumlah Rp 500.000",
        },
        {
          id: "c",
          text: "Gratis ongkir mulai di atas Rp 500.000 alih-alih di Rp 400.000",
        },
        {
          id: "d",
          text: "Pesanan berstatus Dikirim tidak menyimpan alamat pengiriman",
        },
      ],
      explanation:
        "Hitungan yang berselisih dengan apa yang dihitungnya, total yang berselisih dengan bagian-bagiannya sendiri, dan state yang bertentangan dengan data yang disiratkannya semuanya terang-terangan rusak — software-nya berselisih dengan dirinya sendiri, dan Anda tidak butuh persetujuan siapa pun untuk mengatakannya. Ambang ongkir berbeda jenisnya: 500.000 tidak bertentangan dengan apa pun, ia semata-mata pilihan bisnis, dan hanya bisnis yang bisa menyatakan apakah itu pilihan yang keliru.",
    },
  ],
};
