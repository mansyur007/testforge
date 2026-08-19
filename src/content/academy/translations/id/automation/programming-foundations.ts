import type { LessonTranslation } from "../../../types";

export const programmingFoundationsId: LessonTranslation = {
  slug: "programming-foundations",
  title: "Fondasi pemrograman untuk tester",
  summary:
    "Variabel, fungsi, async, dan membaca kode orang lain — jalur JS/TS.",
  body: `
## Anda tidak sedang menjadi developer

Anda sedang menjadi orang yang bisa **membaca dan mengubah kode pengujian tanpa
takut kepadanya**. Itu sasaran yang jauh lebih kecil daripada "belajar
JavaScript", dan ia bisa dicapai dalam dua minggu.

Dua hal mengikutinya. Pertama, yang Anda butuhkan mungkin sepersepuluh bahasanya
— sepersepuluh yang ada di halaman ini. Kedua, **membaca lebih penting daripada
menulis**: pekerjaan otomasi pertama nyaris tidak pernah berupa suite dari nol.
Ia repositori yang dibangun orang lain, dengan 400 pengujian, tiga helper yang
tidak Anda pahami, dan satu job gagal yang tidak dilihat siapa pun sejak Selasa.

Kenapa JavaScript dan TypeScript di sini: ia bahasa milik browser sendiri, ia
bahasa penulis Playwright, dan ia hampir pasti sudah ada di repositori tim Anda.
Python dengan pytest adalah jalur yang sama terhormatnya dan setiap konsep di
bawah bisa dipindahkan — sintaksnya berjarak satu minggu, bukan satu karier.

## Yang perlu terpasang

Node.js (LTS terkini) dan sebuah editor — VS Code, kecuali Anda sudah punya
pendapat sendiri. Lalu:

~~~bash
node -v
~~~

Kalau itu mencetak sebuah versi, Anda selesai. Playwright-nya sendiri datang di
pelajaran berikutnya.

## Nilai, dan dua kata yang paling sering Anda ketik

~~~ts
const orderId = "ord_8831";   // tidak pernah ditugaskan ulang
let attempts = 0;             // yang ini berubah
attempts = attempts + 1;
~~~

**\`const\` sebagai bawaan, \`let\` ketika nilainya memang berubah, \`var\` jangan
pernah.** Menjadikan \`const\` bawaan bukan kerewelan gaya — artinya editor Anda
menangkap penugasan ulang yang tak sengaja, dan di kode pengujian itu biasanya
bug yang kalau tidak begitu akan memakan satu jam Anda.

Tipe-tipe yang akan Anda temui: string, number, boolean, array, object, dan dua
rasa dari ketiadaan.

~~~ts
const name = "Ada";           // string
const total = 41.5;           // number
const isPaid = true;          // boolean
const codes = ["A1", "B2"];   // array
const order = { id: "ord_8831", status: "PAID", total: 41.5 };  // object

order.status;      // "PAID"      — notasi titik
codes[0];          // "A1"        — array mulai dari 0
codes.length;      // 2
~~~

\`null\` berarti *sengaja dikosongkan*; \`undefined\` berarti *tidak pernah
disetel*. Perbedaannya penting karena kolom yang tiba sebagai \`undefined\`
padahal Anda mengharapkan \`null\` biasanya berarti API-nya sama sekali tidak
mengirimnya — dan itu sebuah temuan, bukan gangguan.

**Template string** adalah hal lain yang akan terus-menerus Anda ketik, untuk
membangun URL dan pesan kegagalan:

~~~ts
const url = \`/api/v1/orders/\${orderId}\`;
~~~

Backtick, bukan tanda kutip, dan \`\${...}\` untuk apa pun yang ingin Anda
sisipkan.

**Destructuring** layak sepuluh menit hidup Anda karena API Playwright sendiri
memakainya di setiap pengujian:

~~~ts
const { id, status } = order;   // dua variabel dari satu objek
~~~

Itu persis yang dilakukan \`async ({ page }) => { ... }\` di bawah nanti: menarik
\`page\` keluar dari objek yang diserahkan Playwright kepada Anda.

## Fungsi

~~~ts
// deklarasi
function totalWithTax(amount: number) {
  return amount * 1.2;
}

// arrow function — bentuk yang akan Anda lihat di berkas pengujian
const totalWithTax = (amount: number) => amount * 1.2;
~~~

Keduanya melakukan hal yang sama di sini. Arrow function mendominasi kode
pengujian karena pengujian ditulis dengan cara *menyerahkan sebuah fungsi ke
sesuatu yang lain*:

~~~ts
test("checkout shows a confirmation", async ({ page }) => {
  // ...
});
~~~

Bacalah itu sebagai: panggil \`test\`, serahkan kepadanya sebuah nama dan **sebuah
fungsi untuk dijalankan nanti**. Fungsinya tidak dieksekusi di baris itu;
Playwright yang menentukan kapan. Begitu itu klik, sebagian besar sintaks
framework pengujian berhenti terlihat seperti sihir.

## Perbandingan, dan yang satu ini menggigit

~~~ts
"5" === 5     // false — tipenya berbeda. Pakai yang ini.
"5" ==  5     // true  — mengonversi dulu. Hindari.
~~~

**Selalu \`===\`.** Yang longgar ada karena alasan sejarah dan menghasilkan persis
kelas kebingungan yang Anda dibayar untuk mencegahnya.

Jebakan yang satunya adalah falsiness. Semua ini "falsy": \`false\`, \`0\`, \`""\`,
\`null\`, \`undefined\`, \`NaN\`.

~~~ts
if (order.total) { /* ... */ }        // dilewati ketika total 0 — bug sungguhan
if (order.total !== undefined) { }    // yang sebenarnya Anda maksud
~~~

Pesanan gratis dengan total \`0\` yang lenyap dari sebuah pemeriksaan adalah cacat
*di pengujian Anda*, dan itu yang paling umum terjadi.

## Perulangan dan daftar

~~~ts
for (const code of codes) {
  console.log(code);
}

const paid = orders.filter((o) => o.status === "PAID");
const ids  = orders.map((o) => o.id);
const one  = orders.find((o) => o.id === "ord_8831");
~~~

\`filter\`, \`map\`, dan \`find\` mencakup sebagian besar yang akan Anda butuhkan,
dan \`for...of\` mencakup sisanya. Pengujian berbasis data dibangun persis dari
ini:

~~~ts
const cases = [
  { input: "abc",      valid: false },
  { input: "Abc12345", valid: true },
];

for (const c of cases) {
  test(\`password "\${c.input}" is \${c.valid ? "accepted" : "rejected"}\`, async () => {
    // ...
  });
}
~~~

Satu perulangan, N pengujian, masing-masing dengan namanya sendiri — dan itulah
bentuk yang Anda inginkan, bukan satu pengujian dengan perulangan di dalamnya.
Perulangan di dalam sebuah pengujian berhenti pada kegagalan pertama dan
menyembunyikan sisanya.

## Async: bagian yang benar-benar penting

Semua yang dilakukan browser memakan waktu, jadi hampir setiap panggilan
Playwright mengembalikan sebuah **Promise** — sebuah objek yang berarti *"nilai
yang belum ada di sini"*. \`await\` berkata *"tunggu, lalu berikan hasilnya
kepada saya"*.

~~~ts
test("checkout", async ({ page }) => {   // perhatikan: async
  await page.goto("/cart");
  await page.getByRole("button", { name: "Checkout" }).click();
  await expect(page.getByText("Thank you")).toBeVisible();
});
~~~

**Aturannya: kalau ia mengembalikan Promise, await.** \`await\` yang hilang adalah
sumber terbesar kegagalan pengujian yang membingungkan dan kadang-kadang di
ekosistem ini, dan alasannya layak dipahami alih-alih dihafal:

~~~ts
page.getByRole("button", { name: "Checkout" }).click();   // TIDAK di-await
await expect(page.getByText("Thank you")).toBeVisible();  // berlomba dengan klik
~~~

Klik-nya *dimulai*, bukan diselesaikan. Eksekusi langsung berlanjut, asersinya
berjalan terhadap halaman yang sedang di tengah navigasi, dan ia gagal mungkin
satu dari lima kali jalan — di mesin CI yang lambat, dan tidak pernah di laptop
Anda. Lebih buruk lagi, ketika sebuah pengujian berakhir selagi operasi yang
tidak di-await masih berjalan, error-nya muncul di pengujian **berikutnya**, dan
itu mengirim Anda men-debug berkas yang tidak rusak.

Dua konsekuensinya:

- \`await\` hanya bekerja di dalam fungsi yang ditandai \`async\` — dan itulah
  sebabnya setiap callback pengujian Playwright berupa \`async ({ page })\`.
- Kalau sebuah pengujian gagal dengan cara yang tidak masuk akal, **periksa
  \`await\` yang hilang sebelum memeriksa apa pun yang lain.** Editor dan linter
  bisa menandainya; nyalakan itu sejak awal.

## Membaca suite milik orang lain

Keahlian yang sesungguhnya, dan ia punya metode:

1. **Mulai dari nama pengujiannya.** Nama yang baik memberi tahu Anda klaim yang
   sedang dibuat. Kalau namanya buruk, itu temuan pertama Anda tentang suite-nya.
2. **Temukan asersinya lebih dulu.** \`expect(...)\` adalah apa yang diklaim benar
   oleh pengujiannya; segala yang di atasnya adalah persiapan. Membaca mundur
   dari asersinya jauh lebih cepat daripada membaca maju dari baris pertama.
3. **Ikuti import-nya.** \`import { loginAs } from "./helpers/auth"\` memberi tahu
   Anda di mana mesin bersamanya tinggal. Buka sekali; Anda akan bertemu ia di
   setiap berkas.
4. **Jalankan satu pengujian secara terpisah dan tontonlah.** Sepuluh detik
   menonton mengalahkan sepuluh menit membaca.
5. **Jangan ubah apa pun yang kosmetik di hari pertama.** Mengganti nama variabel
   sesuai selera Anda di suite yang belum Anda pahami menghasilkan diff yang
   besar, nol informasi, dan seorang peninjau yang kini kurang memercayai Anda.

## TypeScript, sebanyak yang Anda butuhkan bulan ini

TypeScript adalah JavaScript dengan tipe yang dilekatkan. Yang ia beli untuk
seorang tester langsung terasa dan praktis: editor memberi tahu Anda apa yang
diterima \`page.getByRole(\` *sebelum* Anda menjalankan apa pun, dan salah ketik
menjadi garis merah alih-alih kegagalan pengujian tiga menit.

~~~ts
const orderId: string = "ord_8831";

function totalWithTax(amount: number): number {
  return amount * 1.2;
}

type Order = { id: string; status: "PAID" | "PENDING"; total: number };
~~~

Baris ketiga itulah yang layak diperhatikan: \`status\` selamanya hanya bisa
berupa salah satu dari dua string, jadi salah ketik seperti \`"PAId"\` tertangkap
selagi Anda mengetik. Generic, decorator, dan sisa sistem tipenya bisa menunggu
tanpa batas waktu.

## Git, dalam satu paragraf

Anda akan segera berada di repositori yang sama dengan para developer, jadi: buat
sebuah branch, jaga commit tetap kecil, buka pull request, harapkan komentar
tinjauan dan jangan menerimanya secara pribadi. \`git status\` sebelum apa pun,
dan jangan pernah meng-commit sebuah \`.only\` — satu \`test.only\` yang
tertinggal di sebuah berkas mengubah seluruh suite CI menjadi satu pengujian,
hijau tanpa suara.

## Error yang akan Anda temui di minggu pertama

| Pesan | Biasanya berarti |
|---|---|
| \`Cannot read properties of undefined (reading 'id')\` | Hal sebelum titiknya tidak ada — biasanya langkah persiapan yang tidak berjalan, atau \`await\` yang hilang |
| \`x is not a function\` | Salah ketik nama, atau Anda meng-import hal yang keliru |
| \`Timeout 30000ms exceeded waiting for locator\` | Elemennya tidak pernah muncul: locator keliru, atau halamannya memang rusak — periksa yang mana sebelum "membetulkan" locator-nya |
| Unhandled rejection setelah sebuah pengujian lulus | Sebuah Promise yang tidak di-await siapa pun, di pengujian yang barusan "lulus" |
| \`SyntaxError: Unexpected token\` | Hampir selalu sebuah kurung atau tanda kutip, di baris yang dilaporkan atau tepat sebelumnya |

Baca error **pertama**, bukan yang terakhir. Semua sesudahnya biasanya
konsekuensi.

## Di mana TestForge berperan

Satu keputusan yang sebaiknya diambil sekarang alih-alih nanti: **namai pengujian
Anda supaya ia memetakan ke case Anda.** Karya penutup di track ini mengunggah
JUnit XML ke \`/api/v1/junit\`, dan pencocokannya dilakukan berdasarkan nama
pengujian — jadi pengujian bernama \`"TC-SHOP-14 checkout with an expired
discount code"\` menjadi sebuah hasil pada case yang sudah Anda tulis, sementara
\`"test checkout 2"\` menjadi anak yatim yang harus direkonsiliasi seseorang
dengan tangan.

Polanya adalah \`TC-<PROJECT>-<nomor>\`, dengan \`<PROJECT>\` adalah slug proyek
Anda (\`SHOP\` di atas) dan nomornya adalah nomor case di dalamnya. Slug-nya jadi
bagian darinya karena nomor case hanya berlaku di dalam satu proyek. Karya
penutup membahas detailnya; yang penting sekarang adalah memutuskan untuk membawa
sebuah id sama sekali.

Memutuskan konvensi itu di minggu pertama Anda tidak berbiaya apa pun.
Memasangnya belakangan ke 400 pengujian berbiaya satu sprint.

**Selanjutnya:** memasang Playwright dan menulis pengujian pertama — lalu
memahami setiap baris dari yang baru saja Anda tulis.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Sebuah pengujian lulus di laptop Anda dan gagal kira-kira satu dari lima kali jalan di CI, dan error-nya kadang muncul di pengujian berikutnya. Apa yang Anda periksa lebih dulu?",
      choices: [
        {
          id: "a",
          text: "Apakah CI menjalankan versi browser yang berbeda",
        },
        {
          id: "b",
          text: "await yang hilang pada panggilan yang mengembalikan Promise, sehingga pengujiannya lanjut sebelum aksinya selesai",
        },
        {
          id: "c",
          text: "Apakah mesin CI-nya butuh timeout global yang lebih panjang",
        },
        {
          id: "d",
          text: "Apakah data ujinya dipakai bersama pengujian lain",
        },
      ],
      explanation:
        "Panggilan yang tidak di-await dimulai lalu ditinggalkan, jadi eksekusinya berlomba maju ke asersinya dan hasilnya bergantung pada kecepatan mesin — dan persis itulah sebabnya ia gagal di CI yang lebih lambat dan tidak di lokal. Error yang muncul di pengujian berikutnya nyaris jadi tanda tangannya: Promise yang ditinggalkan itu menolak setelah pengujiannya sendiri berakhir. Versi browser dan data bersama juga menyebabkan kelabilan yang nyata, tapi tidak satu pun menjelaskan error yang mendarat di pengujian yang berbeda. Menaikkan timeout adalah tanggapan yang harus dihindari sama sekali: ia menyembunyikan perlombaannya untuk sementara dan mengajari suite-nya menjadi lambat.",
    },
    {
      id: "q2",
      stem: "Anda diserahi suite 400 pengujian yang asing dan diminta mencari tahu apa yang sebenarnya diperiksa oleh satu pengujian yang gagal. Apa langkah pertama yang tercepat?",
      choices: [
        {
          id: "a",
          text: "Baca berkasnya dari baris pertama ke bawah, supaya Anda memahami persiapannya sebelum pemeriksaannya",
        },
        {
          id: "b",
          text: "Baca nama pengujiannya dan asersi expect(...)-nya, lalu bekerja mundur menelusuri persiapannya",
        },
        {
          id: "c",
          text: "Buka berkas helper-nya lebih dulu, karena mesin bersamanya menjelaskan semua yang lain",
        },
        {
          id: "d",
          text: "Tulis ulang pengujiannya dengan gaya yang menurut Anda mudah dibaca",
        },
      ],
      explanation:
        "Asersinya adalah klaim yang dibuat pengujiannya, dan namanya semestinya menyatakannya dalam bahasa manusia — bersama-sama keduanya memberi tahu Anda inti pengujiannya dalam hitungan detik, dan setelah itu persiapannya terbaca sebagai \"apa yang harus benar supaya klaim itu bisa diperiksa\". Membaca maju berarti menahan dua puluh baris persiapan tanpa penjelasan di kepala sebelum Anda tahu semua itu untuk apa. Helper layak dibuka, tapi belakangan: ia masuk akal begitu Anda tahu apa yang sedang dicoba pengujiannya. Dan menulis ulang sesuatu yang belum Anda pahami menghasilkan diff yang besar, nol informasi baru, dan seorang peninjau yang kini kurang memercayai Anda.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang merupakan kebiasaan sehat ketika bekerja di sebuah repositori pengujian untuk pertama kalinya?",
      choices: [
        {
          id: "a",
          text: "Jadikan const bawaan, dan pakai let hanya di tempat nilainya memang berubah",
        },
        {
          id: "b",
          text: "Hasilkan satu pengujian bernama per baris data alih-alih melakukan perulangan di dalam satu pengujian",
        },
        {
          id: "c",
          text: "Pakai == alih-alih === supaya \"5\" dan 5 dianggap sama tanpa konversi tambahan",
        },
        {
          id: "d",
          text: "Jangan masukkan apa pun yang masih memuat test.only ke version control",
        },
      ],
      explanation:
        "Menjadikan const bawaan mengubah penugasan ulang yang tak sengaja menjadi error di editor alih-alih satu sore yang hilang; satu pengujian bernama per baris berarti setiap baris melaporkan hasilnya sendiri alih-alih perulangannya berhenti di kegagalan pertama dan menyembunyikan sisanya; dan sebuah test.only yang tertinggal diam-diam menyusutkan seluruh suite CI menjadi satu pengujian, dan itu lebih buruk daripada build merah karena tampilannya hijau. Kesetaraan longgar adalah yang harus ditolak: ia mengonversi tipe sebelum membandingkan, jadi ia menutupi persis kebingungan string-versus-angka yang seorang tester dibayar untuk menyadarinya.",
    },
  ],
};
