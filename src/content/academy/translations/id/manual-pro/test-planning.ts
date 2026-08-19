import type { LessonTranslation } from "../../../types";

export const testPlanningId: LessonTranslation = {
  slug: "test-planning",
  title: "Perencanaan pengujian yang muat di satu halaman",
  summary:
    "Cakupan, risiko, environment, entry dan exit criteria — tanpa template 40 halaman.",
  body: `
## Template bukanlah rencananya

Cari "test plan template" dan Anda akan menemukan dokumen empat puluh halaman
dengan bagian *Test Item Pass/Fail Criteria*, *Suspension Criteria*, dan halaman
tanda tangan. Akan ada yang memberi tahu Anda bahwa itu standar IEEE 829 dan
bahwa para profesional mengisinya.

Inilah yang terjadi pada dokumen itu: ditulis sekali, sebelum apa pun diketahui,
disetujui orang-orang yang cuma membacanya sekilas, lalu tak pernah dibuka lagi.
Pada minggu kedua ia menggambarkan proyek yang sudah tidak ada lagi.

Test plan bukan dokumen yang Anda produksi. Ia adalah **sekumpulan keputusan yang
Anda ambil, dituliskan di tempat yang bisa dilihat dan dibantah tim**. Keputusan
muat di satu halaman. Upacara-lah yang mengisi empat puluh.

## Enam pertanyaan yang harus dijawab sebuah rencana

Kalau halaman Anda menjawab keenamnya, itu sebuah rencana. Kalau ia menjawabnya
masing-masing dalam satu baris, itu rencana yang benar-benar akan dibaca orang.

| Pertanyaan | Kenapa ia layak satu baris |
|---|---|
| Apa yang kita uji? | Menyebut fitur dan perubahannya, sehingga "selesai" punya tepi |
| Apa yang **tidak** kita uji? | Baris paling berharga di halaman itu — lihat di bawah |
| Apa yang bisa salah, dan seberapa parah? | Risiko-lah yang menentukan ke mana jam-jam kerja pergi |
| Di mana kita mengujinya? | Environment, data, akun, feature flag |
| Kapan kita mulai? | Entry criteria — apa yang harus benar sebelum pengujian dimulai |
| Kapan kita selesai? | Exit criteria — terukur, atau ia cuma perasaan |

Perhatikan apa yang tidak ada: jadwal dengan estimasi per tugas, bagan
organisasi, dan glosarium. Kalau ada yang membutuhkannya, mereka bisa minta.

## Cakupan adalah apa yang Anda tinggalkan

Semua orang menulis daftar *in scope*. Itu mudah dan terasa produktif.

Baris yang menyelamatkan Anda adalah baris yang satunya. "**Tidak dicakup:**
Safari di iOS 15 ke bawah, dan alur bulk import" adalah kalimat yang mengerjakan
tiga tugas sekaligus. Ia memberi tahu tim risiko apa yang sedang mereka terima.
Ia memberi mereka kesempatan untuk tidak setuju *sekarang*, saat
ketidaksetujuan masih murah. Dan ketika sebuah bug muncul di bulk importer tiga
minggu kemudian, percakapannya jadi "kita sudah menyepakati itu" alih-alih
"kenapa QA tidak menangkap ini?".

Anda tidak sedang melindungi diri dengan menuliskannya. Anda sedang membiarkan
tim mengambil keputusan yang sadar alih-alih yang tidak sengaja.

> Kalau Anda tidak bisa menyebutkan satu pun hal yang Anda tinggalkan, Anda belum
> merencanakan — Anda berjanji. Segalanya tidak mungkin diuji, jadi rencana tanpa
> pengecualian hanyalah rencana yang belum Anda pikirkan sampai tuntas.

## Entry dan exit criteria yang berarti

**Entry criteria** mencegah Anda membakar dua hari menguji build yang memang
tidak akan pernah jalan. Buatlah membosankan dan bisa dicentang:

- fiturnya sudah ter-deploy ke environment pengujian dan smoke check-nya lolos
- acceptance criteria sudah ada dan tidak menyisakan pertanyaan terbuka
- data uji untuk ketiga jenis akun sudah ditanamkan

**Exit criteria** adalah tempat kebanyakan rencana melembek. "Semua pengujian
lulus" bukan kriteria — itu harapan, dan ia tidak memberi Anda kosakata apa pun
untuk rapat di mana satu pengujian tidak lulus. Tulis kriteria yang selamat
ketika bertemu kenyataan:

- setiap case yang direncanakan untuk alur checkout sudah dijalankan
- tidak ada cacat terbuka dengan severity Critical atau High
- dua cacat Medium masih terbuka, keduanya didaftar per ID, keduanya diterima
  product owner
- area yang dikecualikan di *Tidak dicakup* masih tetap dikecualikan

Bentuk terakhir itu — **pengecualian yang disebutkan namanya, diterima oleh orang
yang disebutkan namanya** — adalah beda antara QA yang menghambat rilis dan QA
yang dipercaya atas rilis.

## Satu contoh dikerjakan

Ini seluruh rencana untuk sebuah perubahan checkout di ShopMini, toko yang hidup
di sandbox Academy Anda. Sengaja dibuat pendek.

~~~
Fitur:     guest checkout (SM-214)
Perubahan: izinkan pesanan tanpa akun; email wajib, tanpa kata sandi

Dicakup:       pembuatan pesanan tamu, validasi email, konfirmasi pesanan,
               alur pengguna yang sudah masuk (regresi)
Tidak dicakup: penyedia pembayarannya sendiri (mode sandbox saja),
               iOS Safari < 15, bulk import, beban/performa

Risiko (dampak x kemungkinan):
  H  pesanan tamu tidak tertaut ke email -> pelanggan tidak menemukan pesanannya
  H  checkout pengguna yang sudah masuk teregresi oleh komponen bersama
  M  pesanan ganda saat kirim dua kali
  L  redaksi email konfirmasi

Environment:  staging, penyedia pembayaran dalam mode sandbox
              akun: tamu, pelanggan lama, admin

Entry: ter-deploy ke staging, smoke lolos, AC tanpa pertanyaan terbuka
Exit:  semua case rencana dijalankan; tidak ada Critical/High terbuka; Medium
       didaftar dan diterima PO; area yang dikecualikan tetap dikecualikan
~~~

Lima belas baris. Seorang developer bisa membacanya dalam satu menit lalu
memberi tahu Anda bahwa risiko komponen bersama itu nyata — dan itu persis
percakapan yang Anda inginkan.

## Jaga tetap hidup, atau buang saja

Rencana yang ditulis di hari pertama lalu dibiarkan tak tersentuh lebih buruk
daripada tanpa rencana, karena ia tampak berwibawa padahal keliru. Ketika daftar
risikonya berubah — dan itu akan terjadi, begitu Anda benar-benar menyentuh
fiturnya — ubah halamannya dan sebutkan di stand-up.

Dua menit menyunting menjaga halaman itu tetap jujur. Itulah seluruh biaya
perawatannya, dan itu sebabnya halamannya pendek.

## Di mana TestForge berperan

Sebuah rencana di TestForge bukan berkas teks: ia objek **Test Plan** tempat
Anda melekatkan case sungguhan, sehingga cakupan berhenti jadi prosa dan mulai
jadi daftar yang bisa Anda hitung. Exit criteria lalu bisa dibaca langsung dari
run-nya — case yang dieksekusi, cacat terbuka per severity — alih-alih dari
ingatan seseorang.

Itulah latihannya di bawah: Anda akan menulis rencana ini terhadap sandbox
ShopMini, dan menautkannya ke case yang sudah Anda tulis.

**Selanjutnya:** mengurutkan daftar risiko itu dengan benar — dampak,
kemungkinan, dan cara mempertahankan apa yang Anda pilih untuk tidak diuji.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Seorang peninjau meminta Anda menghapus bagian \"Tidak dicakup\" karena \"membuat kita tampak tidak menguji dengan benar\". Apa argumen terkuat untuk mempertahankannya?",
      choices: [
        {
          id: "a",
          text: "Ia melindungi QA dari disalahkan ketika ada cacat yang lolos",
        },
        {
          id: "b",
          text: "Ia mengubah risiko yang tak sengaja menjadi risiko yang diterima tim secara sadar, selagi mengubahnya masih murah",
        },
        {
          id: "c",
          text: "Template IEEE 829 mewajibkan bagian pengecualian cakupan",
        },
        {
          id: "d",
          text: "Ia memperpendek rencana dengan membuang area dari suite pengujian",
        },
      ],
      explanation:
        "Pengujian menyeluruh itu mustahil, jadi pengecualian tetap ada entah ada yang menuliskannya atau tidak — satu-satunya pilihan adalah apakah tim mengetahuinya. Menyebutkannya lebih awal memberi orang kesempatan untuk tidak setuju selagi ketidaksetujuan tidak berbiaya. Perlindungan dari disalahkan adalah efek samping, bukan alasannya, dan tidak ada otoritas template yang perlu dijadikan pembenaran.",
    },
    {
      id: "q2",
      stem: "Exit criterion mana yang benar-benar bisa dipakai dalam rapat rilis?",
      choices: [
        { id: "a", text: "Semua pengujian lulus" },
        { id: "b", text: "Tim merasa yakin dengan build-nya" },
        {
          id: "c",
          text: "Semua case rencana dijalankan; tidak ada Critical/High terbuka; SM-231 dan SM-238 masih terbuka di Medium, diterima product owner",
        },
        { id: "d", text: "Cakupan pengujian di atas 80%" },
      ],
      explanation:
        "Sebuah kriteria harus tetap berguna pada hari sesuatu gagal, dan justru saat itulah \"semua pengujian lulus\" dan \"tim merasa yakin\" kehabisan kosakata. Versi yang bisa dipakai menyatakan apa yang dijalankan, apa yang terbuka, dan siapa yang menerima pengecualiannya, lengkap dengan nama dan ID. Cakupan mengukur apa yang dieksekusi, bukan apakah hasilnya bisa diterima.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang layak berada di rencana satu halaman?",
      choices: [
        {
          id: "a",
          text: "Environment, data uji, dan akun yang dibutuhkan pekerjaannya",
        },
        {
          id: "b",
          text: "Daftar risiko yang diurutkan berdasarkan dampak dan kemungkinan",
        },
        {
          id: "c",
          text: "Jadwal per tugas yang mengestimasi tiap test case dalam jam",
        },
        {
          id: "d",
          text: "Entry criteria yang harus berlaku sebelum pengujian dimulai",
        },
      ],
      explanation:
        "Environment, risiko, dan entry criteria semuanya keputusan yang mengubah ke mana jam-jam kerja pergi, jadi masing-masing layak satu baris. Jadwal per case dalam jam adalah presisi yang tidak bisa ditopang rencananya dan tidak dibaca siapa pun — estimasi itu urusan sprint, dan rencananya hanya perlu menyebut kapan pengujian bisa mulai dan kapan ia selesai.",
    },
  ],
};
