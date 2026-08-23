import type { LessonTranslation } from "../../../types";

export const testDataId: LessonTranslation = {
  slug: "test-data",
  title: "Data uji dan fixture",
  summary:
    "Pengujian yang saling bebas, state yang ditanamkan, dan membersihkan bekas Anda sendiri.",
  body: `
## Kegagalan yang mengajarkan pelajaran ini

Suite Anda hijau. Anda menambahkan satu pengujian. Kini pengujian *lain* gagal —
yang tidak Anda sentuh. Anda menjalankannya sendirian dan ia lulus. Anda
menjalankan suite-nya lagi dan sesuatu yang lain gagal.

Itu state bersama, dan ia sumber terbesar kedua otomasi yang tak bisa diandalkan
setelah locator. Penyebabnya hampir selalu sama: dua pengujian memakai catatan
yang sama, dan salah satunya mengubahnya.

~~~ts
// kedua pengujian memakai proyek tertanam "Demo"
test("renames the project", async ({ page }) => { /* mengganti Demo → Demo v2 */ });
test("shows the project name", async ({ page }) => { /* mengharapkan "Demo" */ });
~~~

Jalankan dalam urutan itu dan yang kedua gagal. Jalankan sebaliknya dan keduanya
lulus. Playwright menjalankan berkas secara paralel secara bawaan, jadi urutannya
bukan milik Anda untuk diandalkan — dan pengujian yang bergantung pada urutan
pelaksanaan adalah pengujian yang cepat atau lambat akan gagal di mesin orang
lain, pada saat yang paling tidak nyaman.

## Aturan yang dilayani seluruh pelajaran ini

**Setiap pengujian membuat data yang dibutuhkannya dan tidak peduli apa lagi yang
sudah berjalan.**

Nyatakan sebagai pemeriksaan yang bisa Anda terapkan pada pengujian mana pun saat
tinjauan: *bisakah ini berjalan sendirian, dua kali berturut-turut, bersamaan
dengan salinan dirinya sendiri?* Kalau salah satu dari ketiganya tidak, pengujian
itu punya masalah data.

Ketiga pertanyaannya memetakan ke tiga kegagalan yang nyata — bergantung pada
pengujian lain, meninggalkan residu yang merusak pelaksanaan keduanya sendiri,
dan bertabrakan dengan worker paralel. Pengujian yang selamat dari ketiganya
selamat di CI.

## Data yang unik mengalahkan data yang dibersihkan

Cara termurah menghentikan dua pengujian bertabrakan adalah menghentikan keduanya
menginginkan baris yang sama:

~~~ts
const suffix = \`\${Date.now()}-\${Math.random().toString(36).slice(2, 8)}\`;
const projectName = \`Checkout regression \${suffix}\`;
~~~

Playwright memberi Anda bahan yang lebih baik daripada \`Date.now()\` untuk kasus
paralel, karena dua worker bisa mulai di milidetik yang sama:

~~~ts
test("creates a project", async ({ page }, testInfo) => {
  const name = \`proj-\${testInfo.workerIndex}-\${testInfo.repeatEachIndex}-\${Date.now()}\`;
});
~~~

Dua aturan yang mencegah ini menjadi masalahnya sendiri:

- **Jaga tetap bisa dikenali.** \`proj-3-0-1723641200\` pada pengujian yang macet
  memberi tahu Anda worker mana yang membuatnya. \`a8f3c1\` tidak memberi tahu apa
  pun pada pukul tiga pagi.
- **Jangan buat unik ketika pengujiannya memang tentang nilainya.** Pengujian
  untuk "nama proyek yang duplikat ditolak" butuh nama yang *sama* dua kali, dan
  mengacaknya menghapus pengujiannya.

## Fixture memiliki persiapan dan pembersihan

Pelajaran sebelumnya memperkenalkan fixture sebagai lebih baik daripada sebuah
base class. Inilah sifat yang menjadikannya alat yang tepat khusus untuk data:
**kode setelah \`use()\` berjalan bahkan ketika pengujiannya gagal.**

~~~ts
// fixtures.ts
const PROJECT = process.env.TF_PROJECT!;   // slug proyek sandbox Anda

export const test = base.extend<{ testCase: { id: string; displayId: string } }>({
  testCase: async ({ request }, use, testInfo) => {
    const title = \`case-\${testInfo.workerIndex}-\${Date.now()}\`;
    const res = await request.post(\`/api/v1/projects/\${PROJECT}/cases\`, {
      data: { title },
    });
    const created = await res.json();

    await use(created);          // pengujiannya berjalan di sini

    await request.delete(\`/api/v1/projects/\${PROJECT}/cases/\${created.id}\`);   // selalu berjalan
  },
});
~~~

~~~ts
test("editing a case does not disturb anyone else's", async ({ page, testCase }) => {
  await page.goto(\`/projects/\${PROJECT}/cases/\${testCase.id}\`);
  // ...
});
~~~

Perhatikan bentuk path-nya: route tulis milik TestForge **dilingkupi proyek**,
jadi setiap satu di antaranya membawa slug — \`/api/v1/projects/<slug>/cases\`,
bukan \`/api/v1/cases\`. Proyeknya sendiri dibuat lewat UI dan tidak ada endpoint
untuk membuatnya, dan justru itulah alasan fixture ini membuat *test case*-nya
dan memperlakukan proyek sandbox sebagai latar yang tetap.

Pengujiannya meminta sebuah test case dengan menyebutkannya di tanda tangannya,
mendapat yang segar, dan pembersihannya dijamin. Bandingkan dengan \`afterEach\`,
yang dilewati ketika pengujiannya kehabisan waktu di sebagian runner dan yang
duduk jauh dari persiapan yang dibatalkannya — dua hal yang membuat data
terlantar menumpuk diam-diam selama berbulan-bulan.

**Beri lingkup ketika pembuatannya mahal.** Fixture per worker dibuat sekali per
proses worker alih-alih sekali per pengujian:

~~~ts
export const test = base.extend<{}, { seededOrg: Org }>({
  seededOrg: [async ({}, use) => {
    const org = await createOrg();
    await use(org);
    await deleteOrg(org.id);
  }, { scope: "worker" }],
});
~~~

Itulah rumah yang tepat untuk hal-hal yang dibaca setiap pengujian dan tidak
diubah satu pun — sebuah organisasi, sekumpulan peran, sebuah lisensi. **Begitu
sebuah pengujian menulis padanya, ia berhenti menjadi data bersama dan kembali
menjadi per pengujian.**

## Siapkan lewat API, bukan lewat UI

Membuat sebuah test case lewat antarmuka memakan delapan aksi, menjalankan kode
yang bukan menjadi pokok pengujiannya, dan gagal karena alasan yang tak
berhubungan dengan apa yang sedang Anda uji.

~~~ts
// lambat, rapuh, dan menguji hal yang keliru
await page.getByRole("link", { name: "New case" }).click();
await page.getByLabel("Title").fill(title);
await page.getByRole("button", { name: "Create" }).click();

// cepat, dan kegagalan di sini memang berarti environment yang rusak
await request.post(\`/api/v1/projects/\${PROJECT}/cases\`, { data: { title } });
~~~

**Uji lewat UI apa yang dikerjakan UI; siapkan segala yang lain di bawahnya.**
Satu-satunya kekecualian adalah pengujian yang pokoknya *adalah* alur
pembuatannya — yang itu mengeklik menembusnya, karena itulah fiturnya.

Itu juga sebabnya kegagalan persiapan sebaiknya berisik. Kalau panggilan API-nya
gagal, pengujiannya sebaiknya langsung error alih-alih lanjut ke asersi UI yang
membingungkan. Fixture memberi Anda ini cuma-cuma: sebuah exception sebelum
\`use()\` menandai pengujiannya gagal di persiapan, dan itu terbaca sangat berbeda
di dalam laporan dibanding asersi yang gagal.

## Empat sumber data, dan kapan masing-masing tepat

| Sumber | Cocok untuk | Biaya |
|---|---|---|
| **Dibuat per pengujian, lewat API** | Apa pun yang diubah sebuah pengujian | Sedikit waktu persiapan; ini bawaannya |
| **Ditanamkan sekali, hanya-baca** | Data rujukan, katalog statis | Rusak begitu sebuah pengujian menulis padanya |
| **Dibangkitkan** (faker atau sejenisnya) | Volume, unicode, string panjang, bentuk tepi | Kegagalan tak deterministik kalau tanpa benih |
| **Berkas fixture** (JSON/CSV) | Payload rumit yang diketahui dan layak disimpan | Basi diam-diam ketika skemanya bergerak |

Soal data yang dibangkitkan, satu aturan menghemat berjam-jam: **pengujian yang
gagal harus bisa direproduksi.** Catat nilai yang dipakai, atau beri benih
pembangkitnya per pengujian sehingga pengujian yang sama menghasilkan data yang
sama saat dijalankan ulang. "Ia gagal sekali dengan nama yang sudah tidak saya
punya" bukan laporan bug yang bisa ditindaklanjuti siapa pun.

## Jangan pernah mengarahkan sebuah suite ke produksi

Pengujian yang merusak tidak tahu ia merusak sampai ia menghapus sesuatu yang
nyata. Tiga batas yang tegas:

- **Jangan ada data pelanggan sungguhan di environment pengujian**, bahkan
  salinannya. Anonimkan atau buat sintetis. Menyalin basis data produksi ke
  staging adalah insiden perlindungan data dengan langkah tambahan.
- **Jangan pakai alamat email sungguhan.** \`user+\${suffix}@example.com\` —
  \`example.com\` dicadangkan persis untuk ini dan tidak bisa menerima surat.
- **Kredensial dari environment, jangan pernah dari repositori.**
  \`process.env\`, sebuah \`.env\` di \`.gitignore\`, dan rahasia di penyimpanan
  rahasia milik CI.

Pelajaran non-fungsional di track manual menetapkan aturan main untuk mencolek
sistem yang hidup; ini prinsip yang sama diterapkan pada data — suite-nya
berjalan di tempat ia diizinkan, terhadap data yang tidak akan dirindukan siapa
pun.

## Ketika pembersihannya toh gagal

Ia akan gagal. Sebuah worker dibunuh, CI dibatalkan, endpoint delete
mengembalikan 500. Rencanakan untuk itu alih-alih menganggapnya tidak ada:

- **Buat suite-nya toleran terhadap residu.** Pengujian yang mengasersikan "ada 3
  case" rusak oleh sisa-sisa; yang mengasersikan "case *saya* muncul di
  daftar" tidak. Lebih baik asersi yang dibatasi pada data yang dibuat
  pengujiannya sendiri.
- **Punyai sebuah penyapu.** Job terjadwal yang menghapus catatan uji yang lebih
  tua dari sehari berbiaya satu jam untuk ditulis dan menyingkirkan satu kelas
  permanen kegagalan misterius.
- **Jangan rangkaikan pembersihan ke asersinya.** Pembersihan tempatnya setelah
  \`use()\` di dalam sebuah fixture, supaya asersi yang gagal tetap membereskan.

## Di mana TestForge berperan

Proyek sandbox Anda adalah tempat yang tepat untuk melatih semua ini, dan karya
penutupnya bergantung padanya: run yang Anda unggah lewat \`/api/v1/junit\`
mendarat di sebuah proyek, dan riwayat case-nya hanya bermakna kalau run-nya bisa
dibandingkan. Dua run terhadap sisa data yang berbeda adalah dua eksperimen yang
berbeda.

Satu detail jujur tentang pembersihan di atas: \`DELETE\` pada sebuah case adalah
penghapusan **lunak**. Case-nya menghilang dari daftar dan dari asersi Anda, lalu
sebuah job pembersih menyingkirkan barisnya belakangan. Itu bentuk yang lazim di
produk sungguhan, dan layak diketahui sebelum Anda menulis pengujian yang
mengharapkan catatannya lenyap dari basis data begitu request-nya kembali.

Ada satu diagnosis yang layak dibawa ke pelajaran tentang pengujian labil. Case
yang gagal hanya ketika suite lengkapnya berjalan, dan lulus sendirian setiap
kali, nyaris tidak pernah merupakan cacat — ia state bersama. Riwayat run membuat
itu terlihat: case yang sama, build yang sama, hijau di satu run dan merah di
run berikutnya, tanpa apa pun berubah di aplikasinya di antara keduanya.

**Selanjutnya:** otomasi API — menguji endpoint-nya secara langsung, yang
sekaligus lapisan yang lebih cepat untuk pengujiannya sendiri dan mekanisme yang
selama ini disandari pelajaran ini untuk persiapan.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Sebuah pengujian lulus ketika dijalankan sendirian tapi gagal ketika seluruh suite berjalan. Apa penyebab yang paling mungkin?",
      choices: [
        {
          id: "a",
          text: "Timeout suite-nya terlalu rendah untuk jumlah pengujiannya",
        },
        {
          id: "b",
          text: "State bersama — pengujian lain mengubah data yang diandalkan yang ini, dan eksekusi paralel membuat urutannya tak bisa diandalkan",
        },
        {
          id: "c",
          text: "Playwright menonaktifkan auto-waiting ketika lebih dari satu berkas berjalan",
        },
        {
          id: "d",
          text: "Cache browser dipakai ulang antarpengujian dalam satu pelaksanaan suite",
        },
      ],
      explanation:
        "Lulus-sendirian-gagal-bersama adalah tanda tangan dua pengujian yang menginginkan catatan yang sama, dengan salah satunya menulis padanya. Karena Playwright menjalankan berkas secara paralel secara bawaan, urutannya bukan milik Anda untuk diandalkan, jadi kegagalannya muncul dan menghilang tergantung penjadwalan — dan justru itulah yang membuatnya terbaca sebagai kelabilan alih-alih sebagai masalah data deterministik sebagaimana adanya. Perbaikannya bukan retry atau timeout yang lebih panjang melainkan kepemilikan: setiap pengujian membuat data yang dibutuhkannya, sebaiknya dengan nama yang unik, dan membersihkan bekasnya di dalam sebuah fixture. Playwright juga memberi tiap pengujian konteks browser yang segar, jadi cache bukan pelakunya.",
    },
    {
      id: "q2",
      stem: "Kenapa pembersihan data lebih baik ditempatkan setelah use() di dalam sebuah fixture daripada di dalam hook afterEach?",
      choices: [
        {
          id: "a",
          text: "afterEach tidak bisa membuat request jaringan",
        },
        {
          id: "b",
          text: "Pembersihan fixture berjalan bahkan ketika pengujiannya gagal, dan ia duduk di sebelah persiapan yang dibatalkannya",
        },
        {
          id: "c",
          text: "Fixture menjalankan pembersihan sebelum asersinya, jadi kegagalan tidak mungkin meninggalkan data",
        },
        {
          id: "d",
          text: "afterEach hanya berjalan untuk pengujian terakhir di sebuah berkas",
        },
      ],
      explanation:
        "Jaminannya itulah intinya: kode setelah use() berjalan entah pengujiannya lulus, gagal, atau kehabisan waktu, jadi asersi yang rusak tetap membereskan. Manfaat keduanya adalah kedekatan — pembuatan dan penghapusannya berada di fungsi yang sama, dan itulah yang mencegah keduanya saling menjauh sampai penghapusannya diam-diam berhenti cocok dengan apa yang dibuat. afterEach bisa membuat request dan memang berjalan untuk setiap pengujian, tapi ia dilewati saat timeout di sebagian runner dan tinggal jauh dari persiapan yang seharusnya ia batalkan, dan begitulah catatan terlantar menumpuk berbulan-bulan tanpa disadari. Pembersihan memang sengaja tidak berjalan sebelum asersinya — pengujiannya membutuhkan datanya.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang merupakan praktik data uji yang sehat?",
      choices: [
        {
          id: "a",
          text: "Buat test case-nya lewat panggilan API di dalam sebuah fixture alih-alih mengeklik menembus formulir pembuatannya",
        },
        {
          id: "b",
          text: "Asersikan \"case saya muncul di daftar\" alih-alih \"ada tepat 3 case\"",
        },
        {
          id: "c",
          text: "Pakai ulang satu akun tertanam di seluruh suite supaya pengujiannya tidak membuang waktu membuat pengguna",
        },
        {
          id: "d",
          text: "Catat atau beri benih data yang dibangkitkan supaya sebuah kegagalan bisa direproduksi dengan nilai yang sama",
        },
      ],
      explanation:
        "Menyiapkan lewat API lebih cepat dan menjaga pengujiannya gagal hanya karena alasan yang menjadi pokoknya — kliklah menembus formulirnya hanya di pengujian yang pokoknya adalah alur pembuatan itu. Membatasi asersi pada data Anda sendiri membuat suite-nya toleran terhadap sisa-sisa yang cepat atau lambat gagal disingkirkan pembersihannya, sementara hitungan global rusak oleh residu apa pun. Dan keterulangan adalah yang memisahkan laporan bug dari anekdot: pembangkit tanpa benih yang gagal sekali dengan nilai yang sudah tidak Anda punya tidak memberi siapa pun apa pun untuk ditindaklanjuti. Akun bersama itulah jebakannya — ia bekerja sampai satu pengujian mengubah sebuah pengaturan atau kata sandi, dan lalu ia menghasilkan persis kegagalan lulus-sendirian-gagal-bersama yang membuka pelajaran ini.",
    },
  ],
};
