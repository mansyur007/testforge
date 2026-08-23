import type { LessonTranslation } from "../../../types";

export const ch4TestAnalysisDesignId: LessonTranslation = {
  slug: "ch4-test-analysis-design",
  title: "Bab 4 — Test analysis dan design",
  summary:
    "Teknik black-box, white-box, dan berbasis pengalaman, plus pendekatan berbasis kolaborasi.",
  body: `
## Bab yang menentukan hasil Anda

Bab 4 menyumbang **11 dari 40 pertanyaan** di paket latihan kami — lebih banyak
daripada bab mana pun, dan lebih banyak daripada bab 3 dan 6 digabungkan. Ia juga
bab pertama dengan **tujuan pembelajaran K3**, dan itu perubahan jenis, bukan
perubahan derajat.

Pertanyaan K1 dan K2 meminta Anda mengingat atau menjelaskan. **K3 meminta Anda
menerapkan sebuah teknik pada materi yang tercetak di pertanyaannya** lalu
menghasilkan sebuah jawaban: sejumlah test case, sekumpulan nilai, sebuah
persentase cakupan. Anda tidak bisa mengulang belajar untuk itu dengan membaca.
Anda harus mengerjakannya sampai mekanismenya otomatis, karena dalam tekanan
waktu ujian Anda akan punya kira-kira sembilan puluh detik untuk masing-masing.

| Bagian | Tujuan | Tingkat K | Yang diinginkannya |
|---|---|---|---|
| 4.1 Ikhtisar | 1 | K2 | Ketiga kategorinya, dan masing-masing berdasar apa |
| 4.2 Teknik black-box | 4 | **Semuanya K3** | Terapkan EP, BVA, decision table, state transition |
| 4.3 Teknik white-box | 3 | K2 | Statement, branch, dan apa nilai white-box |
| 4.4 Berbasis pengalaman | 3 | K2 | Error guessing, eksploratori, berbasis checklist |
| 4.5 Berbasis kolaborasi | 3 | K2, K2, **K3** | User story, acceptance criteria, ATDD |

**Lima dari 14 tujuan pembelajaran babnya adalah K3, dan empat di antaranya ada
di §4.2.** Di situlah waktu latihan Anda sebaiknya dibelanjakan.

## 4.1 Ketiga kategorinya

| Kategori | Diturunkan dari | Melihat kodenya? |
|---|---|---|
| **Black-box** | Perilaku objek uji yang dispesifikasikan | Tidak |
| **White-box** | Struktur internal atau implementasinya | Ya |
| **Berbasis pengalaman** | Pengetahuan dan pengalaman testernya | Bisa keduanya |

Teknik black-box tidak bergantung pada bagaimana sesuatu dibangun, jadi
pengujiannya selamat dari penulisan ulang. Teknik white-box mengukur seberapa
banyak strukturnya yang Anda jalankan. Teknik berbasis pengalaman menemukan apa
yang dilewatkan dua yang lain, justru karena ia tidak diturunkan dari sebuah
dokumen yang mungkin dirinya sendiri tidak lengkap.

## 4.2 Teknik black-box — bagian K3-nya

Track 1 mengajarkan keempatnya secara mendalam:
[equivalence partitioning](/id/academy/fundamentals/equivalence-partitioning),
[boundary value analysis](/id/academy/fundamentals/boundary-value-analysis),
[decision table](/id/academy/fundamentals/decision-tables), dan
[state transition testing](/id/academy/fundamentals/state-transition-testing).
Yang menyusul adalah versi berbentuk-ujiannya: bagaimana pertanyaannya diajukan,
bagaimana Anda menghitung, dan di mana nilainya bocor.

### Equivalence partitioning

Bagi domain input (atau output) menjadi partisi yang anggotanya semua seharusnya
ditangani dengan cara yang sama, lalu uji satu nilai dari masing-masing. Setiap
partisi entah **valid** entah **invalid**, dan domainnya harus dipartisi
sepenuhnya — setiap nilai yang mungkin berada tepat di satu partisi.

**Contoh dikerjakan.** Sebuah kolom menerima umur dari 18 sampai 65 inklusif.

| Partisi | Jenis | Sebuah nilai wakil |
|---|---|---|
| di bawah 18 | invalid | 12 |
| 18–65 | valid | 40 |
| di atas 65 | invalid | 70 |
| bukan angka | invalid | "abc" |

**Cakupan = partisi yang dijalankan ÷ total partisi × 100%.** Empat partisi,
empat pengujian, 100%.

**Aturan yang menggerus nilai: jalankan hanya satu partisi invalid per
pengujian.** Kalau Anda mengirim umur 12 *dan* sebuah nilai bukan angka di
pengujian yang sama lalu ditolak, Anda tidak bisa tahu aturan mana yang
menolaknya — dan cacat keduanya tetap tersembunyi. Partisi valid boleh
digabungkan dengan bebas.

### Boundary value analysis

BVA memperhalus EP: cacat menggerombol di tepi partisi yang terurut, jadi uji
tepinya. Ia berlaku **hanya di tempat partisinya terurut** — 18 sampai 65 punya
batas, "metode pembayaran" tidak.

Dua varian, dan ujiannya mengharapkan Anda tahu yang mana yang ditanyakannya:

| Untuk rentang valid 18–65 | Nilai yang diuji |
|---|---|
| **BVA 2 nilai** | Tiap batas dan tetangga terdekatnya di luar: **17, 18, 65, 66** |
| **BVA 3 nilai** | Tiap batas plus kedua tetangganya: **17, 18, 19, 64, 65, 66** |

**Cakupan = nilai batas yang dijalankan ÷ total nilai batas × 100%.**

Hitunglah dengan cermat. Pertanyaan yang berbunyi "memakai boundary value
analysis 3 nilai, berapa test case yang dibutuhkan untuk cakupan penuh" sedang
meminta Anda menghitung nilai, bukan partisi — dan ia sedang menanyakan apakah
Anda ingat bahwa BVA 3 nilai mengambil tetangga di *kedua* sisi.

### Decision table testing

Untuk aturan yang menggabungkan beberapa kondisi. Kondisinya di atas, aksinya di
bawah, dan tiap **kolom adalah sebuah aturan** — satu kombinasi kondisi beserta
aksi yang dipicunya.

**Contoh dikerjakan.** Gratis ongkir berlaku ketika pesanannya di atas 50 **dan**
pelanggannya member; member selalu mendapat diskon 10%.

| | R1 | R2 | R3 | R4 |
|---|---|---|---|---|
| **Pesanan di atas 50** | T | T | F | F |
| **Member** | T | F | T | F |
| Gratis ongkir | ✓ | – | – | – |
| Diskon 10% | ✓ | – | ✓ | – |

**Cakupan penuh berarti satu pengujian per aturan**, jadi empat pengujian di
sini. Dengan *n* kondisi biner sebuah tabel penuh punya **2ⁿ** kolom — tiga
kondisi memberi delapan, empat memberi enam belas, dan pertumbuhan itulah yang
membuat tabel diringkas.

**Meringkas** melebur kolom di tempat sebuah kondisi tidak bisa memengaruhi
hasilnya, dengan menandainya "–" (tidak peduli). Tabel yang diringkas punya lebih
sedikit aturan, dan karenanya lebih sedikit pengujian, tanpa kehilangan kombinasi
yang penting. Kalau sebuah pertanyaan menunjukkan tabel dengan tanda hubung,
hitung kolom yang ditampilkannya — bukan 2ⁿ.

### State transition testing

Untuk perilaku yang bergantung pada apa yang terjadi sebelumnya. Empat bahan:
**state**, **event** yang memicu transisi, **transisi** antarstate, dan secara
opsional **guard** dan **aksi**.

**Contoh dikerjakan.** Sebuah login yang terkunci setelah tiga kegagalan:

| State | Event | State berikutnya |
|---|---|---|
| Keluar | kredensial valid | Masuk |
| Keluar | kredensial tidak valid (ke-1, ke-2) | Keluar |
| Keluar | kredensial tidak valid (ke-3) | Terkunci |
| Masuk | keluar | Keluar |
| Terkunci | reset kata sandi | Keluar |

Tiga kriteria cakupan, dengan kekuatan yang meningkat:

- **Semua state**: setiap state disinggahi setidaknya sekali.
- **Semua transisi sah** (cakupan 0-switch): setiap panah di diagramnya
  dijalankan setidaknya sekali. Ini arti biasa dari "cakupan 100%" di sini.
- **Semua transisi**, yang sah *dan* yang tidak sah: setiap pasangan state-event
  di **tabel** state-nya, termasuk sel yang tidak digambar diagramnya — apa yang
  terjadi kalau Anda mengirim "reset kata sandi" selagi masuk?

**Diagram state hanya menunjukkan transisi yang sah; tabel state menunjukkan
setiap pasangan state–event, termasuk yang mustahil.** Perbedaan itu persis yang
dimanfaatkan sebuah pertanyaan ketika ia menanyakan berapa pengujian yang
dibutuhkan untuk sebuah tabel state versus sebuah diagram.

## 4.3 Teknik white-box

Kembali ke K2 — Anda harus menjelaskannya, bukan menghitung contoh yang besar,
meski aritmetikanya cukup sederhana sehingga sebuah pertanyaan tetap bisa
meminta sebuah persentase.

**Statement testing** menjalankan pernyataan yang bisa dieksekusi.
**Cakupan = pernyataan yang dijalankan ÷ total pernyataan × 100%.**

**Branch testing** menjalankan keluaran keputusan — setiap cabang yang diambil
dan yang tidak diambil. **Cakupan = cabang yang dijalankan ÷ total cabang ×
100%.**

**Fakta tunggal yang paling sering diujikan di bagian ini:**

> **Cakupan branch 100% menjamin cakupan statement 100%. Kebalikannya tidak
> benar.**

Inilah sebabnya, dalam empat baris:

~~~
1  if (balance > 100) {
2      applyBonus();
3  }
4  print(balance);
~~~

Satu pengujian dengan \`balance = 150\` mengeksekusi setiap pernyataan —
**cakupan statement 100%** — sementara cabang false-nya tidak pernah diambil,
jadi cakupan branch-nya cuma 50%. Kalau cacatnya tinggal di apa yang seharusnya
terjadi ketika kondisinya false, cakupan statement berkata "lengkap" dan tidak
menemukan apa pun.

**Apa nilai pengujian white-box.** Ia mengukur cakupan kodenya secara *objektif*,
alih-alih lewat pendapat siapa pun tentang ketuntasan; ia menemukan kode yang tak
terjangkau, kode mati, dan perilaku yang tidak terdokumentasi; dan ia menjalankan
implementasinya sebagaimana adanya alih-alih sebagaimana yang digambarkan
spesifikasinya.

**Dan batasnya, yang diujikan sesering nilainya:** teknik white-box **tidak bisa
menemukan kebutuhan yang tidak pernah diimplementasikan.** Tidak ada kode untuk
dicakup. Itulah sebabnya ia melengkapi pengujian black-box alih-alih
menggantikannya.

## 4.4 Teknik berbasis pengalaman

| Teknik | Apa itu | Kelemahannya |
|---|---|---|
| **Error guessing** | Mengantisipasi error, cacat, dan kegagalan dari pengalaman, lalu menyerangnya dengan sengaja — sering dari sebuah checklist jenis cacat masa lalu | Sepenuhnya bergantung pada pengalaman testernya |
| **Pengujian eksploratori** | Merancang, mengeksekusi, dan belajar **pada saat yang sama**, biasanya ber-timebox di bawah sebuah **charter**, dengan catatan yang direkam | Sulit direproduksi dan diukur; bukan pengganti cakupan yang terstruktur |
| **Berbasis checklist** | Pengujian yang dipandu sebuah checklist berisi hal-hal yang harus dipastikan, dibangun dari pengalaman | Checklist **kehilangan efektivitasnya** seiring ia menua dan diulang-ulang |

Dua hal yang harus dicermati. **Pengujian eksploratori bukan pengujian ad hoc** —
ia ber-timebox, ber-charter, dan terdokumentasi, dan itulah yang menjadikannya
sebuah teknik alih-alih klik-klik sembarangan; ia paling berharga di tempat
spesifikasinya buruk, waktunya sempit, atau timnya perlu cepat mengenal
produknya. Dan kelemahan checklist itu adalah prinsip *pengujian menjadi aus*
dari bab 1 yang memakai topi berbeda.

## 4.5 Pendekatan berbasis kolaborasi

**Menulis user story secara kolaboratif.** **Tiga C**-nya:

- **Card** — story-nya sendiri, cukup kecil untuk muat di satu kartu
- **Conversation** — bagaimana fiturnya dijelaskan dan dipahami, dan di situlah
  kebutuhan yang sesungguhnya diselesaikan
- **Confirmation** — acceptance criteria yang menyatakan kapan ia selesai

Ditulis oleh ketiga sudut pandang bersama-sama — bisnis, pengembangan, pengujian
— dan itulah sebabnya cacatnya tercegah alih-alih ditemukan.

**Dua cara menulis acceptance criteria:**

| Gaya | Bentuk |
|---|---|
| **Berorientasi skenario** | **Given** sebuah prakondisi, **when** sebuah peristiwa terjadi, **then** sebuah hasil menyusul |
| **Berorientasi aturan** | Sebuah daftar verifikasi, atau sekumpulan aturan berbutir yang harus dipenuhi fiturnya |

**ATDD (K3) — menurunkan test case dari acceptance criteria.** Timnya menulis
pengujiannya *sebelum* pengembangannya dimulai, dari kriterianya sendiri. Tujuan
pembelajaran ini K3, jadi sebuah pertanyaan bisa mencetak sebuah kriteria lalu
menanyakan pengujian apa yang keluar darinya.

**Contoh dikerjakan.** Kriteria: *Given seorang member dengan pesanan di atas 50,
when mereka checkout, then ongkirnya gratis.*

| Pengujian | Diturunkan dari | Diharapkan |
|---|---|---|
| Member, pesanan 60 | Kriterianya sebagaimana dinyatakan | Gratis ongkir |
| Member, pesanan 50 | Batas — apakah "di atas" itu inklusif? | Sesuai aturannya; **tanyakan kalau tidak dinyatakan** |
| Member, pesanan 40 | Negatif — kondisinya tidak terpenuhi | Ongkir dibebankan |
| Bukan member, pesanan 60 | Negatif — kondisi yang satunya tidak terpenuhi | Ongkir dibebankan |

Perhatikan apa yang diperagakan contoh itu, karena itulah inti tujuan
pembelajarannya: **penurunan menghasilkan pengujian positif *dan* negatif**, dan
ia menyingkap kerancuan di "di atas 50" sebelum satu baris kode pun ada — dan itu
argumen bab 3 untuk pengujian statis yang tiba dari arah sebaliknya.

## Perbedaan yang menentukan nilai

| Pasangan yang tertukar | Garis pemisahnya |
|---|---|
| Cakupan statement / branch | 100% branch ⇒ 100% statement; tidak pernah sebaliknya |
| BVA 2 nilai / 3 nilai | Tetangga di satu sisi / di kedua sisi |
| Partisi / nilai batas | Yang dihitung EP / yang dihitung BVA |
| Partisi valid / partisi invalid | Digabung bebas / **satu invalid per pengujian** |
| Decision table penuh / diringkas | 2ⁿ aturan / lebih sedikit, dengan sel "tidak peduli" — hitung yang tercetak |
| Diagram state / tabel state | Hanya transisi sah / setiap pasangan state–event, termasuk yang tidak sah |
| Semua state / semua transisi | Menyinggahi tiap state / menjalankan setiap panah |
| Eksploratori / ad hoc | Ber-charter, ber-timebox, terdokumentasi / tanpa struktur |
| Nilai white-box / batas white-box | Cakupan kode yang objektif / buta terhadap apa yang tidak pernah ditulis |
| Black-box / berbasis pengalaman | Diturunkan dari spesifikasi / dari pengetahuan testernya |

## Cara membelanjakan minggu terakhir

Khusus untuk bab ini, dan ini berbeda dari bab lainnya: **jangan membacanya
ulang.** Kerjakan keempat teknik §4.2 terhadap materi yang segar sampai Anda bisa
menghasilkan partisinya, nilai batasnya, hitungan aturannya, dan hitungan
transisinya tanpa ragu. Di dalam ujian, pertanyaan-pertanyaan ini bernilai lebih
dari seperempat kertasnya dan hanya di situlah jawabannya benar atau salah tanpa
kerancuan — dan itu bermata dua.

## Latih dengan drill

Delapan pertanyaan, tanpa batas waktu, setiap jawabannya dijelaskan:

**[Kuis bab 4 →](/academy/istqb/practice-exam/chapter/4)** — simulator ujiannya
berbahasa Inggris.

Hitung waktu Anda sendiri: kalau sebuah pertanyaan K3 memakan lebih dari dua
menit di sini, ia akan memakan dua pertanyaan lain di kertas ujian yang
sesungguhnya.

**Selanjutnya:** Bab 5 — mengelola aktivitas pengujian, bab dengan tujuan
pembelajaran terbanyak di seluruh silabusnya.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Sebuah kolom menerima nilai dari 10 sampai 99 inklusif. Memakai boundary value analysis 3 nilai, nilai apa saja yang disumbangkan batas bawah rentang valid-nya?",
      choices: [
        {
          id: "a",
          text: "9, 10, dan 11",
        },
        {
          id: "b",
          text: "9 dan 10",
        },
        {
          id: "c",
          text: "10 dan 11",
        },
        {
          id: "d",
          text: "10 saja, karena itulah batasnya",
        },
      ],
      explanation:
        "Boundary value analysis 3 nilai mengambil batasnya sendiri plus tetangganya di kedua sisi, jadi batas bawahnya menyumbang 9, 10, dan 11 (dan batas atasnya akan menyumbang 98, 99, dan 100). Varian 2 nilai hanya mengambil batasnya dan tetangga terdekatnya di luar partisi — 9 dan 10 — dan itu pilihan b, dan ujiannya mengharapkan Anda tahu varian mana yang ditanyakan. Membaca 'boundary value analysis' tanpa menyadari keterangan 2 atau 3 nilai adalah cara paling umum kehilangan nilai ini.",
    },
    {
      id: "q2",
      stem: "Sebuah suite pengujian mencapai cakupan statement 100% atas sebuah modul. Apa yang bisa Anda simpulkan tentang cakupan branch-nya?",
      choices: [
        {
          id: "a",
          text: "Cakupan branch-nya juga 100%, karena setiap pernyataan dieksekusi",
        },
        {
          id: "b",
          text: "Cakupan branch-nya bisa kurang dari 100% — sebuah `if` tanpa `else` menjangkau setiap pernyataan sambil tidak pernah mengambil keluaran false-nya",
        },
        {
          id: "c",
          text: "Cakupan branch-nya tepat separuh cakupan statement-nya",
        },
        {
          id: "d",
          text: "Sama sekali tidak ada yang bisa disimpulkan di antara kedua ukurannya",
        },
      ],
      explanation:
        "Implikasinya berjalan satu arah saja: cakupan branch 100% menjamin cakupan statement 100%, tapi tidak sebaliknya. Sebuah `if` tanpa `else` adalah contoh tandingan bakunya — satu pengujian yang memenuhi kondisinya mengeksekusi setiap pernyataan di modul itu sementara keluaran false-nya tidak pernah dijalankan, sehingga cakupan branch-nya tinggal 50%. Itu penting karena cacat pada apa yang seharusnya terjadi ketika kondisinya false duduk di jalur yang sudah dinyatakan lengkap oleh cakupan statement. Hubungannya adalah implikasi yang tetap, bukan sebuah rasio, dan ia fakta yang paling sering diujikan di §4.3.",
    },
    {
      id: "q3",
      stem: "Anda menguji sebuah formulir dengan tiga partisi input yang invalid. Kenapa tiap pengujian sebaiknya menjalankan hanya satu partisi invalid dalam satu waktu?",
      choices: [
        {
          id: "a",
          text: "Karena menggabungkannya akan melampaui jumlah maksimum test case yang diizinkan tekniknya",
        },
        {
          id: "b",
          text: "Karena sebuah penolakan tidak akan memberi tahu Anda input invalid mana yang menyebabkannya, jadi cacat kedua bisa tetap tersembunyi di balik yang pertama",
        },
        {
          id: "c",
          text: "Karena partisi invalid tidak bisa digabungkan satu sama lain di equivalence partitioning",
        },
        {
          id: "d",
          text: "Karena tiap partisi invalid milik batas yang berbeda",
        },
      ],
      explanation:
        "Kalau sebuah pengujian mengirim dua nilai invalid lalu sistemnya menolak, yang Anda pelajari hanyalah bahwa sesuatu ditolak — validasi untuk input keduanya bisa jadi sama sekali tidak ada dan Anda tidak akan pernah tahu, karena penolakan pertama menutupinya. Itulah sebabnya partisi invalid dijalankan satu per pengujian sementara partisi valid boleh digabungkan bebas. Tidak ada apa pun di tekniknya yang membatasi jumlah test case, dan tidak ada aturan yang melarang penggabungannya secara prinsip; alasannya bersifat diagnostik, dan itulah yang sebenarnya diuji pertanyaannya.",
    },
    {
      id: "q4",
      stem: "Pernyataan mana tentang teknik berbasis pengalaman dan teknik white-box yang benar?",
      choices: [
        {
          id: "a",
          text: "Teknik white-box tidak bisa menyingkap kebutuhan yang tidak pernah diimplementasikan, karena tidak ada kode untuk dicakup",
        },
        {
          id: "b",
          text: "Pengujian eksploratori ber-timebox dan dipandu sebuah charter, dengan catatan yang direkam — ia tidak sama dengan pengujian ad hoc",
        },
        {
          id: "c",
          text: "Pengujian berbasis checklist kehilangan efektivitasnya seiring checklist yang sama dipakai berulang-ulang",
        },
        {
          id: "d",
          text: "Error guessing adalah teknik black-box, karena ia menurunkan pengujiannya dari spesifikasinya",
        },
      ],
      explanation:
        "Kebutaan pengujian white-box terhadap kebutuhan yang tidak diimplementasikan adalah batas yang menentukan dirinya dan alasan ia melengkapi alih-alih menggantikan kerja black-box. Charter, timebox, dan catatan pengujian eksploratori persis yang memisahkan sebuah teknik dari klik-klik tanpa struktur, dan itulah cara ia dikelola dan diukur. Menuanya checklist adalah prinsip 'pengujian menjadi aus' dari bab 1 yang muncul lagi. Error guessing berbasis pengalaman, bukan black-box: ia diturunkan dari pengetahuan testernya tentang apa yang cenderung melenceng, bukan dari spesifikasi apa pun.",
    },
  ],
};
