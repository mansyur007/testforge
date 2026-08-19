import type { LessonTranslation } from "../../../types";

export const decisionTablesId: LessonTranslation = {
  slug: "decision-tables",
  title: "Decision table",
  summary:
    "Ketika beberapa kondisi bergabung menghasilkan keluaran berbeda, sebuah tabel menemukan aturan yang tidak ditulis siapa pun.",
  body: `
## Kapan menjangkaunya

Partitioning dan BVA menangani *satu* input dalam satu waktu. Decision table
(tabel keputusan) menangani **kombinasi**: "gratis ongkir kalau pesanan di atas
Rp 500.000 **dan** alamatnya domestik, **kecuali** pelanggannya member, yang
dalam hal itu…".

Prosa menyembunyikan celah pada aturan semacam itu. Sebuah tabel membuatnya
mustahil disembunyikan — dan karena itulah nilai sesungguhnya teknik ini sering
ditemukan **sebelum** Anda menjalankan apa pun: Anda mengisi tabelnya, tiga sel
tidak punya jawaban yang terdefinisi, lalu Anda pergi bertanya.

## Membangunnya, langkah demi langkah

> **Kebutuhan.** Checkout ShopMini: pelanggan mendapat **gratis ongkir** kalau
> total pesanan di atas Rp 500.000. **Member** selalu mendapat gratis ongkir.
> Pesanan ke alamat **internasional** tidak pernah mendapat gratis ongkir.

**Langkah 1 — daftar kondisinya** (inputnya, dibuat ya/tidak sebisa mungkin):

- C1: total di atas Rp 500.000?
- C2: pelanggan adalah member?
- C3: alamat internasional?

**Langkah 2 — daftar aksinya** (keluarannya):

- A1: gratis ongkir
- A2: bebankan ongkir Rp 20.000

**Langkah 3 — daftar seluruh kombinasinya.** Tiga kondisi biner → 2³ = 8 aturan.

| | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 |
|---|---|---|---|---|---|---|---|---|
| C1 di atas 500rb | Y | Y | Y | Y | N | N | N | N |
| C2 member | Y | Y | N | N | Y | Y | N | N |
| C3 internasional | Y | N | Y | N | Y | N | Y | N |
| **A1 gratis ongkir** | ? | ✓ | ✗ | ✓ | ? | ✓ | ✗ | ✗ |
| **A2 bebankan 20rb** | ? | | ✓ | | ? | | ✓ | ✓ |

**Langkah 4 — isi aksinya, dan tandai yang tidak bisa Anda isi.** R1 dan R5
adalah tanda tanya: seorang *member* dengan alamat *internasional*. "Member
selalu mendapat gratis ongkir" dan "internasional tidak pernah mendapat gratis
ongkir" saling bertentangan. Kebutuhannya tidak menyebutkan mana yang menang.

**Itulah keluarannya.** Sebelum menulis satu pengujian pun Anda sudah menemukan
cacat sungguhan di spesifikasi — jenis yang tiga bulan kemudian terkirim sebagai
perdebatan antara support dan keuangan. Bawa R1 dan R5 ke product owner.

**Langkah 5 — satu test case per aturan.** Delapan kolom, delapan pengujian,
masing-masing dengan data konkret.

## Meringkas tabelnya

2ⁿ tumbuh cepat: enam kondisi berarti 64 aturan. Ada dua cara sah untuk
mengecilkannya:

**Tanda hubung untuk kondisi yang tidak relevan.** Kalau internasional selalu
berarti ongkir dibayar terlepas dari yang lain, R3 dan R7 melebur jadi satu
aturan dengan C1 dan C2 diisi "–" (tidak peduli). Lebih sedikit pengujian,
cakupan *keluaran* yang sama.

**Uji aksi yang berbeda, bukan setiap kombinasi.** Kalau delapan aturan hanya
menghasilkan dua keluaran berbeda, prioritaskan setidaknya satu pengujian per
keluaran, ditambah kombinasi yang melibatkan kondisi paling licin.

Hati-hati: meringkas mengandaikan Anda sudah tahu kondisi-kondisinya saling
bebas. Andaian itu justru yang ingin diperiksa oleh decision table, jadi ringkas
*setelah* Anda mendaftar semuanya, bukan sebagai gantinya.

## Cakupan, dinyatakan terus terang

Cakupan minimum decision table = **satu pengujian per aturan** (per kolom).
Kalau ada yang bertanya "dari mana Anda tahu logika harga ini sudah tercakup?",
tabelnya adalah jawabannya, dan itu jawaban yang jauh lebih baik daripada sebuah
angka.

## Contoh kedua, yang lebih licik

> Login: sebuah akun bisa *belum terverifikasi*, *aktif*, atau *terkunci*. Kata
> sandinya bisa benar atau salah. 2FA bisa aktif atau tidak.

3 × 2 × 2 = 12 aturan. Sekarang coba jawab dari kebutuhannya: apa yang terjadi
kalau akun **terkunci** memasukkan kata sandi **benar** dengan 2FA **aktif**?
Haruskah pesan kesalahannya mengungkap bahwa akun itu terkunci (membantu) atau
tetap umum (aman)? Tidak ada yang menuliskannya. Tabelnya yang menemukannya.

## 🛠 Giliran Anda, di TestForge

Latihan sandbox meminta Anda membangun tabel ongkir ShopMini sebagai satu suite
test case — satu case per aturan, dinamai supaya pembaca tahu aturan mana yang
dicakupnya, dengan aturan yang bertentangan diangkat sebagai pertanyaan alih-alih
ditebak-tebak.

Checker-nya menghargai dua hal: cakupan aturan yang penuh, dan *tidak*
diam-diam mengarang jawaban untuk R1/R5.

## Periksa pemahaman Anda

- Empat kondisi biner. Berapa aturan sebelum diringkas?
- Apa yang Anda lakukan pada sel yang keluarannya tidak didefinisikan
  kebutuhannya?
- Kenapa "kami sudah menguji kombinasi utamanya" adalah jawaban yang lebih lemah
  daripada sebuah decision table?

**Selanjutnya:** state transition testing, untuk perilaku yang bergantung pada
apa yang terjadi *sebelumnya*.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Empat kondisi biner. Berapa banyak aturan yang dimiliki tabelnya sebelum diringkas sama sekali?",
      choices: [
        { id: "a", text: "4" },
        { id: "b", text: "8" },
        { id: "c", text: "16" },
        { id: "d", text: "Tergantung aksinya" },
      ],
      explanation:
        "Setiap kondisi melipatduakan kombinasinya, jadi n kondisi biner memberi 2 pangkat n aturan — di sini 16. Pertumbuhan itulah persis alasan meringkas dengan entri tidak-peduli menjadi penting begitu Anda melewati empat atau lima kondisi.",
    },
    {
      id: "q2",
      stem: "Saat mengisi tabelnya, Anda menemukan kombinasi yang tidak pernah didefinisikan kebutuhannya. Apa langkah yang tepat?",
      choices: [
        { id: "a", text: "Uji apa yang saat ini dilakukan kodenya lalu catat itu sebagai hasil yang diharapkan" },
        { id: "b", text: "Lewati aturan itu — di luar cakupan" },
        { id: "c", text: "Angkat sebagai celah di kebutuhannya sebelum memutuskan hasil yang diharapkan" },
        { id: "d", text: "Pilih keluaran yang tampak paling masuk akal lalu lanjut" },
      ],
      explanation:
        "Kombinasi yang tidak terdefinisi adalah cacat di spesifikasi, dan menemukannya adalah hal paling berharga yang dilakukan sebuah decision table. Mencatat perilaku saat ini sebagai yang diharapkan diam-diam mengubah apa pun yang kebetulan dilakukan kodenya menjadi kebutuhan.",
    },
    {
      id: "q3",
      stem: "Apa arti cakupan minimum sebuah decision table?",
      choices: [
        { id: "a", text: "Satu pengujian per kondisi" },
        { id: "b", text: "Satu pengujian per aturan, yaitu per kolom" },
        { id: "c", text: "Satu pengujian per aksi yang berbeda" },
        { id: "d", text: "Satu pengujian per pasangan kondisi-nilai" },
      ],
      explanation:
        "Satuan cakupannya adalah aturan: satu pengujian untuk setiap kolom tabel. Itu jawaban yang jauh lebih kuat atas \"apakah logika harga ini tercakup?\" daripada sebuah persentase, karena siapa pun bisa menunjuk kolom tempat sebuah pengujian berada.",
    },
  ],
};
