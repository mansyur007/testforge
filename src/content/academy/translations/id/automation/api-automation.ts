import type { LessonTranslation } from "../../../types";

export const apiAutomationId: LessonTranslation = {
  slug: "api-automation",
  title: "Otomasi API",
  summary:
    "Pengujian yang lebih cepat dan lebih mantap di bawah UI — dan memakai API untuk menyiapkan pengujian UI.",
  body: `
## Lapisan yang paling kurang dimanfaatkan kebanyakan suite

Pengujian UI untuk "membuat case dengan judul kosong ditolak" memakan delapan
detik, mengemudikan sebuah browser, dan bisa gagal karena sebuah tombol pindah.
Aturan yang sama diuji terhadap endpoint-nya memakan 200 milidetik dan gagal
hanya ketika aturannya sendiri rusak.

Itulah pertukaran yang menjadi pokok pelajaran pertama track ini, dibuat konkret:
**dorong setiap pengujian serendah mungkin selagi ia masih menyatakan sesuatu
yang benar tentang apa yang diterima pengguna.** Aturan validasi, hak akses, kode
kesalahan, dan logika bisnis hampir selalu lebih rendah daripada browser.

Anda sebenarnya sudah memakai lapisan ini. Pelajaran sebelumnya menyiapkan data
lewat API karena melakukannya lewat UI itu lambat dan rapuh. Pelajaran ini adalah
alat yang sama, diarahkan ke hal yang sedang diuji alih-alih ke persiapannya.

## Playwright menguji API tanpa browser

Tanpa dependensi baru, tanpa framework kedua:

~~~ts
import { test, expect } from "@playwright/test";

test("rejects a case with a blank title", async ({ request }) => {
  const res = await request.post("/api/v1/cases", {
    data: { title: "", suiteId: "s_123" },
  });

  expect(res.status()).toBe(422);
  const body = await res.json();
  expect(body.error).toContain("title");
});
~~~

Fixture \`request\` adalah klien HTTP dengan \`baseURL\` dari config-nya dan toples
cookie-nya sendiri. Dua hal mengikutinya: ia tidak membuka browser, jadi pengujian
ini berjalan dalam milidetik; dan ia bisa berbagi autentikasi dengan pengujian UI
Anda alih-alih membutuhkan mekanisme login yang terpisah.

**Perhatikan gaya asersinya.** \`expect(res.status())\` adalah perbandingan nilai
biasa, bukan web-first assertion — tidak ada yang perlu dijajaki berulang, karena
sebuah response HTTP entah tiba entah tidak. Aturan coba-ulang dari pelajaran
asersi berlaku untuk locator; di sini bentuk biasanya-lah yang benar.

## Melakukan autentikasi sekali

~~~ts
// playwright.config.ts
use: {
  baseURL: process.env.TF_BASE_URL,
  extraHTTPHeaders: {
    Authorization: \`Bearer \${process.env.TF_API_KEY}\`,
  },
},
~~~

API key dari environment adalah jawaban benar yang paling sederhana, dan itulah
yang diharapkan TestForge sendiri. Ketika sebuah pengujian butuh identitas yang
*berbeda* — memeriksa bahwa seorang viewer tidak bisa menghapus sebuah suite —
bangunlah klien untuknya alih-alih mengubah yang bersama:

~~~ts
test("a viewer cannot delete a suite", async ({ playwright }) => {
  const viewer = await playwright.request.newContext({
    baseURL: process.env.TF_BASE_URL,
    extraHTTPHeaders: { Authorization: \`Bearer \${process.env.TF_VIEWER_KEY}\` },
  });

  const res = await viewer.delete("/api/v1/suites/s_123");
  expect(res.status()).toBe(403);

  await viewer.dispose();
});
~~~

**Pengujian otorisasi adalah hal paling bernilai di lapisan ini**, dan ia nyaris
mustahil lewat UI yang sekadar menyembunyikan tombolnya. Tombol yang
disembunyikan bukan pemeriksaan hak akses — endpoint-nya yang begitu — dan
beginilah cara Anda mengetahui yang mana sebenarnya yang dimiliki aplikasi Anda.
Track manual membuat argumen yang sama tentang memeriksa otorisasi lewat URL
lebih dulu; ini bentuk otomatisnya.

## Apa yang diasersikan pada sebuah response

Lebih dari kode statusnya, dan kurang dari segalanya:

~~~ts
const res = await request.post("/api/v1/cases", { data: { title: "TC-12", suiteId } });

expect(res.status()).toBe(201);                       // 1. status
expect(res.headers()["content-type"]).toContain("application/json");

const body = await res.json();
expect(body).toMatchObject({ title: "TC-12", suiteId });   // 2. kolom yang Anda pedulikan
expect(body.id).toMatch(/^c_/);                            // 3. bentuknya, bukan nilai persisnya
expect(new Date(body.createdAt).getTime()).toBeGreaterThan(0);
~~~

\`toMatchObject\` adalah kuda bebannya: ia memeriksa kolom yang Anda sebutkan dan
mengabaikan sisanya, sehingga kolom baru yang ditambahkan ke response tidak
merusak empat puluh pengujian. Mengasersikan kesetaraan dalam terhadap seluruh
payload adalah padanan API dari rantai selektor CSS — ia gagal karena perubahan
yang bukan cacat.

Asersikan **bentuk** untuk apa pun yang dibangkitkan server. \`body.id\` berupa
string yang diawali \`c_\` adalah kontrak yang nyata; \`body.id === "c_7f3a"\`
adalah urutan basis data hari ini.

## Kode status yang layak dicermati

Pengujian yang menerima "error apa pun" nyaris bukan pengujian. Perbedaan di
antara semua ini biasanya berupa cacat yang nyata:

| Kode | Artinya | Bug lazim yang ditangkapnya |
|---|---|---|
| 400 | Request cacat bentuk | Validasi yang mengembalikan 500 alih-alih ini |
| 401 | Belum terautentikasi | Endpoint yang lupa mewajibkan auth |
| 403 | Terautentikasi, tidak diizinkan | Yang besar — hak akses tidak ditegakkan di sisi server |
| 404 | Tidak ditemukan | Membocorkan keberadaan: mengembalikan 403 vs 404 untuk catatan milik orang lain |
| 409 | Konflik | Penanganan duplikat yang diam-diam menimpa |
| 422 | Dipahami, maknanya tidak valid | Aturan bisnis yang dilewati |

**401 versus 403 dan 403 versus 404 adalah dua pasangan yang layak diuji secara
eksplisit.** Yang kedua lebih halus daripada kelihatannya: mengembalikan 403
untuk catatan yang ada tapi milik orang lain memberi tahu penyerang bahwa ia ada.
Apa pun yang dipilih aplikasi Anda, ia sebaiknya memilih secara konsisten, dan
sebuah pengujian adalah cara itu tetap benar.

## Menguji jalur kesalahan itulah intinya

Happy path biasanya sudah tercakup oleh pengujian UI. Nilai lapisan ini ada pada
segala yang tidak mudah dijangkau UI:

~~~ts
const cases = [
  { data: {}, status: 422, why: "no fields at all" },
  { data: { title: "" }, status: 422, why: "blank title" },
  { data: { title: "x".repeat(5000) }, status: 422, why: "title over the limit" },
  { data: { title: "TC-1", suiteId: "does-not-exist" }, status: 404, why: "unknown suite" },
];

for (const c of cases) {
  test(\`rejects \${c.why}\`, async ({ request }) => {
    const res = await request.post("/api/v1/cases", { data: c.data });
    expect(res.status()).toBe(c.status);
  });
}
~~~

Membangkitkan pengujian dari sebuah tabel itu sah di sini dengan cara yang tidak
sah di UI: setiap case adalah satu request yang cepat, pesan kegagalannya
menyebut baris mana yang gagal, dan menambahkan batas kelima belas berbiaya satu
baris. **Pertahankan sebagai panggilan \`test()\` yang terpisah alih-alih
perulangan di dalam satu pengujian**, supaya sebuah kegagalan melaporkan case
yang spesifik dan satu baris yang gagal tidak menyembunyikan empat sesudahnya.

## Pengujian hibrida adalah tempat ini paling membayar

~~~ts
test("TC-SHOP-31 a case created by API appears in the suite view", async ({ page, request }) => {
  const res = await request.post("/api/v1/cases", {
    data: { title: \`login \${Date.now()}\`, suiteId },
  });
  const created = await res.json();

  await page.goto(\`/suites/\${suiteId}\`);
  await expect(page.getByRole("row", { name: created.title })).toBeVisible();
});
~~~

Siapkan di bawah, bertindak dan asersikan di atas. Inilah bentuk yang akhirnya
ditempati sebagian besar suite yang matang, dan itulah sebabnya pelajaran
sebelumnya dan yang ini berpasangan: API sekaligus hal yang diuji dan alat yang
membuat pengujian UI jadi cepat dan mandiri.

Arah sebaliknya juga layak diketahui — lakukan sebuah aksi di UI, lalu verifikasi
lewat API bahwa state yang *tersimpan* sudah benar. Formulir yang tampak
menyimpan tapi menulis kolom yang keliru adalah bug yang akan dengan senang hati
disembunyikan layar dari Anda.

## Apa yang tidak akan diberitahukan lapisan ini

Bersikap jujur tentang batasnya menjaga argumen piramidanya tetap jujur:

- **Bahwa fiturnya bekerja untuk seorang manusia.** Setiap endpoint bisa benar
  sementara tombol yang memanggilnya nonaktif.
- **Apa pun tentang render, tata letak, atau aksesibilitas.**
- **Bahwa klien-nya mengirim apa yang Anda kira ia kirim.** Pengujian Anda
  membangun request-nya; aplikasi yang sungguhan membangun yang lain. Inilah
  celah yang menjadi alasan contract testing ada, dan tempatnya di track Beyond
  Functional.

Jadi pembagiannya bukan "pengujian API menggantikan pengujian UI". Melainkan:
aturan, hak akses, dan jalur kesalahan di bawah; sejumlah kecil perjalanan yang
benar-benar ditempuh pengguna di atas.

## Di mana TestForge berperan

Karya penutupnya memakai perkakas pelajaran ini sungguh-sungguh:
\`/api/v1/junit\` adalah sebuah endpoint, unggahan Anda adalah sebuah POST dengan
body multipart, dan run yang dihasilkannya adalah sesuatu yang lalu bisa Anda
baca kembali dan asersikan. Berlatih terhadap \`/api/v1/projects\` dan
\`/api/v1/cases\` di proyek sandbox Anda sekarang persis otot yang dibutuhkan karya
penutupnya.

Layak dicoba sekali untuk merasakan bentuknya: buat sebuah case lewat API, unggah
sebuah hasil JUnit yang nama pengujiannya membawa id case itu, lalu baca run-nya
kembali untuk memastikan pencocokannya mendarat. Itu seluruh lingkaran produknya
dalam tiga request, dan itulah yang dirangkai dengan benar oleh dua pelajaran
terakhir track ini.

**Selanjutnya:** menjalankan suite-nya di CI dengan GitHub Actions — workflow,
artifact, dan menjaga pipeline-nya di bawah sepuluh menit supaya orang
sungguh-sungguh mau menunggunya.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Kenapa memeriksa bahwa seorang viewer mendapat 403 dari DELETE /api/v1/suites/s_123 lebih bernilai daripada memeriksa bahwa tombol hapusnya disembunyikan di UI?",
      choices: [
        {
          id: "a",
          text: "Karena pengujian API berjalan lebih cepat, jadi pemeriksaan yang sama berbiaya waktu CI lebih sedikit",
        },
        {
          id: "b",
          text: "Karena tombol yang disembunyikan bukan pemeriksaan hak akses — endpoint-nya yang begitu, dan hanya request-nya yang membuktikan aturannya ditegakkan di sisi server",
        },
        {
          id: "c",
          text: "Karena Playwright tidak bisa dengan andal mengasersikan bahwa sebuah elemen tidak ada",
        },
        {
          id: "d",
          text: "Karena hak akses di UI ditangani browser alih-alih aplikasinya",
        },
      ],
      explanation:
        "Menyembunyikan sebuah kontrol adalah penyajian; penegakannya terjadi di tempat request-nya mendarat. Sebuah aplikasi bisa menyembunyikan tombolnya dengan sempurna dan tetap menghapus suite-nya bagi siapa pun yang mengirim DELETE, dan celah itu tak terlihat oleh setiap pengujian yang hanya mengemudikan antarmukanya. Mengirim request itu sebagai identitas yang dibatasi adalah satu-satunya hal yang memperagakan aturannya berlaku — dan itulah sebabnya otorisasi adalah pekerjaan paling bernilai di lapisan ini. Kecepatan adalah manfaat yang nyata tapi sekunder, dan Playwright mengasersikan ketiadaan dengan baik lewat toBeHidden dan not.toBeVisible.",
    },
    {
      id: "q2",
      stem: "Gaya asersi mana yang tepat untuk id yang dibangkitkan bagi sebuah catatan baru?",
      choices: [
        {
          id: "a",
          text: "expect(body.id).toBe(\"c_7f3a\") — paku nilai persisnya supaya perubahan apa pun tertangkap",
        },
        {
          id: "b",
          text: "expect(body.id).toMatch(/^c_/) — asersikan bentuknya, karena nilainya dibangkitkan",
        },
        {
          id: "c",
          text: "expect(body).toEqual(expectedFullPayload) — bandingkan seluruh response demi kelengkapan",
        },
        {
          id: "d",
          text: "Lewati saja — kolom yang dibangkitkan tidak bisa diasersikan secara bermakna",
        },
      ],
      explanation:
        "Awalannya adalah kontrak yang dijanjikan aplikasinya; karakter tertentu sesudahnya adalah urutan basis data hari ini, jadi memakunya menulis pengujian yang gagal di pelaksanaan berikutnya tanpa alasan. Kesetaraan dalam terhadap seluruh payload punya masalah yang sama satu tingkat di atasnya — ia padanan API dari rantai selektor CSS, rusak setiap kali kolom baru ditambahkan meskipun tidak ada yang teregresi. toMatchObject dengan kolom yang benar-benar Anda pedulikan, plus pemeriksaan bentuk pada yang dibangkitkan, memberi Anda pengujian yang gagal ketika kontraknya rusak dan diam selebihnya. Melewatinya sama sekali menyerahkan pemeriksaan yang nyata: id dengan awalan yang keliru berarti jenis catatan yang keliru yang dibuat.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang benar tentang posisi pengujian API berdampingan dengan pengujian UI?",
      choices: [
        {
          id: "a",
          text: "Aturan validasi dan jalur kesalahan biasanya tempatnya di bawah UI, tempat setiap case adalah satu request yang cepat",
        },
        {
          id: "b",
          text: "Menyiapkan state lewat API dan mengasersikan lewat UI membuat pengujian UI-nya lebih cepat dan mandiri",
        },
        {
          id: "c",
          text: "Suite API yang lulus berarti fiturnya bekerja untuk seorang pengguna, jadi perjalanan UI-nya mubazir",
        },
        {
          id: "d",
          text: "Pengujian API tidak membuktikan bahwa klien yang sungguhan mengirim request yang dibangun pengujian Anda",
        },
      ],
      explanation:
        "Mendorong aturan dan jalur kesalahan ke bawah adalah argumen piramida yang dibuat konkret — lima belas case batas berbiaya lima belas request cepat alih-alih dua menit waktu browser. Bentuk hibrida, menyiapkan di bawah dan mengasersikan di atas, adalah tempat sebagian besar suite yang matang bertemu dan itulah sebabnya pelajaran ini dan pelajaran data uji berpasangan. Tapi lapisannya punya langit-langit yang nyata: setiap endpoint bisa benar sementara tombol yang memanggilnya nonaktif, jadi sejumlah kecil perjalanan pengguna yang sungguhan tetap perlu. Dan celah di pilihan terakhir adalah keterbatasan yang jujur: pengujian Anda membangun request-nya, aplikasinya membangun yang lain, dan persis itulah yang menjadi alasan contract testing ada.",
    },
  ],
};
