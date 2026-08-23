import type { LessonTranslation } from "../../../types";

export const junitToTestforgeId: LessonTranslation = {
  slug: "junit-to-testforge",
  title: "Karya penutup: terbitkan hasil ke TestForge",
  summary:
    "Hasilkan JUnit XML, unggah lewat /api/v1/junit, dan baca run yang baru saja Anda buat.",
  body: `
## Menutup lingkarannya

Segala yang sejauh ini menghasilkan centang hijau yang lalu lenyap. Pelajaran ini
melekatkan hasil Anda pada case yang dijalankannya, sehingga pertanyaan yang
benar-benar diajukan sebuah tim — *apakah ini memburuk, pengujian mana yang
paling sering gagal, seperti apa bulan lalu* — punya tempat untuk dijawab.

Tiga langkah: hasilkan JUnit XML, POST ia, baca run-nya kembali.

## 1. Hasilkan JUnit XML

~~~ts
// playwright.config.ts
reporter: [
  ["list"],
  ["junit", { outputFile: "results/junit.xml" }],
],
~~~

JUnit XML adalah format yang dipahami setiap alat CI dan sistem manajemen
pengujian. Ia bukan khas Playwright — pytest, JUnit, NUnit, dan Jest semuanya
menghasilkannya, dan itulah sebabnya TestForge menelan ini alih-alih format
milik satu vendor.

Kalau Anda mem-shard ke beberapa job, **gabungkan dulu**. Empat shard
menghasilkan empat berkas XML dan endpoint-nya menginginkan satu run:

~~~bash
npx playwright merge-reports --reporter junit ./blob-report > results/junit.xml
~~~

## 2. Dapatkan dua hal yang dibutuhkan unggahannya

**Slug proyek Anda.** Buka proyek sandbox Anda di TestForge dan baca dari URL-nya
— \`/projects/academy-3f2a9b1c\` berarti slug-nya \`academy-3f2a9b1c\`. Slug
sandbox diturunkan dari akun Anda, jadi milik Anda bukan yang tercetak di sini.
Salin milik Anda sendiri.

**Sebuah API key.** Settings → API Keys → buat satu, lalu salin segera. Taruh di
penyimpanan rahasia CI Anda sebagai \`TF_API_KEY\`, jangan pernah di repositori.

## 3. Unggah

~~~bash
curl -X POST \\
  "$TF_BASE_URL/api/v1/junit?project=$TF_PROJECT&name=CI%20run&source=playwright" \\
  -H "Authorization: Bearer $TF_API_KEY" \\
  -H "Content-Type: application/xml" \\
  --data-binary @results/junit.xml
~~~

Parameter query-nya:

| Parameter | Artinya |
|---|---|
| \`project\` | **Wajib.** Slug proyek Anda |
| \`name\` | Nama run-nya. Bawaannya sebuah timestamp — setel sesuatu yang terbaca |
| \`source\` | Framework-nya, misalnya \`playwright\`. Ditampilkan pada run-nya |
| \`origin\` | Tempat ia berjalan, misalnya \`CI · GitHub Actions\`. Teks bebas, 120 karakter |
| \`env\` | Nama environment opsional, untuk memisahkan run staging dan produksi |

Response yang berhasil memberi tahu Anda apa yang terjadi:

~~~json
{
  "runId": "run_8fd21a",
  "runUrl": "/projects/academy-3f2a9b1c/runs/run_8fd21a",
  "matched": 12,
  "automated": 12,
  "unmatched": ["logs out from the account menu"],
  "summary": { "passed": 11, "failed": 1, "skipped": 0 }
}
~~~

**\`unmatched\` adalah kolom yang harus dibaca.** Pengujian itu berjalan, dan
hasilnya dibuang karena tidak ada apa pun di proyek Anda yang bersesuaian
dengannya.

## 4. Pencocokan: bagian yang sebenarnya menentukan apakah ini bekerja

Endpoint-nya mencocokkan setiap pengujian di XML-nya ke sebuah case di proyek
Anda, dengan urutan ini:

1. **Anotasi \`TC-<SLUG>-<nomor>\` di dalam nama pengujiannya**, dengan \`<SLUG>\`
   adalah slug proyek Anda dan \`<nomor>\` adalah nomor case itu di dalam proyek.
   Dicocokkan tanpa membedakan huruf besar-kecil.
2. **Kalau itu gagal, kecocokan judul yang persis** — nama pengujiannya, dengan
   id TC apa pun dihapus, dibandingkan dengan judul case-nya tanpa membedakan
   huruf besar-kecil.

Jadi untuk proyek dengan slug \`academy-3f2a9b1c\` dan case bernomor 12:

~~~ts
test("TC-ACADEMY-3F2A9B1C-12 a valid login lands on the dashboard", async ({ page }) => {
~~~

~~~ts
// juga bekerja, kalau ada case yang berjudul persis seperti ini
test("a valid login lands on the dashboard", async ({ page }) => {
~~~

**Pelajaran-pelajaran sebelumnya di track ini menulis \`TC-12\` demi keringkasan.
Bentuk itu tidak cocok** — slug-nya bagian dari polanya, karena nomor case hanya
unik di dalam satu proyek. \`TC-12\` telanjang jatuh ke aturan judul, dan aturan
judulnya lalu membandingkan seluruh string *termasuk* "TC-12", jadi ia tidak
cocok dengan apa pun kecuali ada case yang harfiah berjudul begitu.

Lebih baik anotasinya daripada kecocokan judul. Judul disunting demi kejernihan,
dan suite yang mencocokkan pada prosa diam-diam berhenti cocok pada hari
seseorang memperbaiki sebuah judul case. Sebuah id adalah kontrak — argumen yang
sama dengan yang dibuat pelajaran locator tentang \`data-testid\`.

Slug-nya panjang dan Anda sebaiknya tidak mengetikkannya ke dalam 400 nama
pengujian. Taruh di satu tempat:

~~~ts
// tc.ts
const SLUG = process.env.TF_PROJECT!.toUpperCase();
export const tc = (n: number, title: string) => \`TC-\${SLUG}-\${n} \${title}\`;
~~~

~~~ts
test(tc(12, "a valid login lands on the dashboard"), async ({ page }) => {
~~~

## 5. Sambungkan ke workflow-nya

~~~yaml
      - run: npx playwright test

      - name: Publish results to TestForge
        if: \${{ !cancelled() }}
        run: |
          curl -sS -X POST \\
            "$TF_BASE_URL/api/v1/junit?project=$TF_PROJECT&name=$GITHUB_REF_NAME%20%23$GITHUB_RUN_NUMBER&source=playwright&origin=CI%20%C2%B7%20GitHub%20Actions" \\
            -H "Authorization: Bearer $TF_API_KEY" \\
            -H "Content-Type: application/xml" \\
            --data-binary @results/junit.xml
        env:
          TF_BASE_URL: \${{ secrets.TF_BASE_URL }}
          TF_API_KEY: \${{ secrets.TF_API_KEY }}
          TF_PROJECT: \${{ secrets.TF_PROJECT }}
~~~

**\`if: !cancelled()\` lagi, dan di sini ia lebih penting daripada untuk
artifact.** Bawaannya adalah melewati sebuah langkah ketika langkah sebelumnya
gagal — jadi dengan bawaannya, satu-satunya run yang pernah sampai ke TestForge
adalah yang lulus, dan riwayat yang isinya cuma hijau lebih buruk daripada tanpa
riwayat sama sekali.

## Ketika ia tidak bekerja

| Status | Artinya | Perbaikan |
|---|---|---|
| **401** | Key keliru atau hilang | Periksa header \`Authorization: Bearer …\` dan bahwa key-nya tersalin utuh |
| **404** | Proyek tidak ditemukan, *atau Anda bukan anggotanya* | Periksa slug-nya terhadap URL; pastikan key-nya milik akun yang punya akses |
| **400** | XML-nya gagal diurai, atau tidak memuat pengujian | Pastikan berkasnya tidak kosong dan bahwa reporter junit-nya memang berjalan |
| **422** | Terurai dengan baik, **tidak ada yang cocok dengan sebuah case** | Masalah penamaan di atas — response-nya mendaftar nama yang tidak cocok |

404-nya layak dibaca dua kali: **proyek yang tidak bisa Anda lihat dilaporkan
sama dengan yang tidak ada.** Itu disengaja — ia menghindari mengonfirmasi slug
mana yang ada kepada orang yang bukan anggota — dan artinya "key keliru" dan
"slug keliru" tampak identik dari luar. Pelajaran otomasi API membuat poin yang
persis sama tentang 403 versus 404; ini dia di dalam produk yang sedang Anda
integrasikan.

422 adalah kegagalan pertama yang paling umum, dan ia kabar baik: unggahannya
bekerja dari ujung ke ujung, dan hanya penamaannya yang keliru.

## Latihannya

Terhadap **proyek sandbox Anda**, dari ujung ke ujung:

1. Tambahkan reporter \`junit\` dan pastikan \`results/junit.xml\` muncul secara
   lokal.
2. Buka sandbox Anda, catat slug-nya dari URL dan nomor salah satu case yang
   ditanamkan, lalu ganti nama satu pengujian supaya membawa \`TC-<SLUG>-<n>\`.
3. Unggah dengan \`curl\` di atas. Baca \`matched\` dan \`unmatched\` di
   response-nya.
4. **Dapatkan 422 dengan sengaja** — unggah berkas yang tidak satu pun nama
   pengujiannya cocok dengan apa pun — lalu baca error-nya. Setelah itu betulkan
   penamaannya dan unggah lagi.
5. Buka \`runUrl\` di TestForge. Pastikan run-nya ada, case-nya menampilkan
   hasilnya, dan riwayat case-nya kini punya sebuah entri.
6. Tambahkan langkah unggahnya ke workflow dari pelajaran sebelumnya dan biarkan
   CI membuat sebuah run.

Langkah kelima adalah karya penutupnya. Sebuah run yang Anda hasilkan dari
pengujian yang Anda tulis, terlekat pada sebuah case, dengan riwayat yang masih
akan ada di sana bulan depan — itulah lingkaran yang selama ini dibangun seluruh
track ini.

## Apa yang bisa Anda lakukan sekarang yang sebelumnya tidak

Begitu hasilnya menumpuk, riwayat run menjawab hal-hal yang tidak bisa dijawab
centang hijau:

- **Case mana yang paling sering gagal** — daftar kelabilan, dan bahan mentah
  pelajaran berikutnya.
- **Apakah sebuah perbaikan bertahan**, karena case-nya punya sebelum dan
  sesudah.
- **Apakah sebuah run merah itu regresi atau peristiwa perawatan.** Empat puluh
  case merah sekaligus setelah perubahan login adalah masalah suite; satu case
  merah pada build yang menyentuh fiturnya adalah cacat. Pelajaran locator
  meminta Anda mencatat perbedaan itu dengan jujur; di sinilah ia jadi terlihat.
- **Apa yang disampaikan kepada orang.** Pelajaran pelaporan di T2 menginginkan
  rekomendasi rilis dalam bahasa yang bisa ditindaklanjuti product owner.
  "Suite-nya lulus" bukan itu; "case checkout sudah hijau selama sebelas build,
  dua yang merah adalah perbaikan locator yang sudah diketahui" itulah.

## Untuk portofolio Anda

Ini hal yang nyata dan bisa diperagakan: sebuah repositori dengan sebuah suite,
sebuah workflow yang menjalankannya di setiap pull request, dan sebuah proyek
manajemen pengujian dengan riwayat yang menumpuk. Ia lebih meyakinkan daripada
sertifikat apa pun, karena seorang hiring manager bisa membukanya.

Pelajaran portofolio di track Beyond Functional melanjutkan ini secara langsung.

**Selanjutnya:** pengujian labil — cara menemukan penyebab dari yang segera akan
mulai ditunjukkan riwayat run ini kepada Anda, dan cara mengarantina dengan jujur
alih-alih mencoba ulang selamanya.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Sebuah unggahan mengembalikan 422 dengan daftar nama pengujian yang tidak cocok. Apa yang terjadi?",
      choices: [
        {
          id: "a",
          text: "API key-nya tidak punya izin tulis untuk proyeknya",
        },
        {
          id: "b",
          text: "XML-nya terurai dan request-nya diizinkan, tapi tidak ada nama pengujian yang cocok dengan sebuah case — jadi tidak ada run yang dibuat",
        },
        {
          id: "c",
          text: "XML-nya cacat bentuk dan tidak bisa dibaca",
        },
        {
          id: "d",
          text: "Slug proyeknya tidak ada",
        },
      ],
      explanation:
        "422 berarti request-nya sampai melewati autentikasi dan penguraian lalu tidak menemukan apa pun untuk dilekati hasilnya, dan itulah sebabnya response-nya mengembalikan nama-nama yang tidak bisa ia tempatkan. Ia kegagalan pertama yang paling umum dan yang paling menyemangati — pipa-pipanya bekerja dan hanya penamaannya yang keliru. Penyebab lazimnya adalah pengujian bernama TC-12 alih-alih TC-<SLUG>-12, karena nomor case hanya unik di dalam satu proyek. Key yang keliru itu 401, slug yang tidak bisa Anda lihat atau tidak ada itu 404, dan XML yang tak terurai atau kosong itu 400.",
    },
    {
      id: "q2",
      stem: "Kenapa langkah unggahnya sebaiknya berjalan dengan `if: !cancelled()` alih-alih dengan bawaannya?",
      choices: [
        {
          id: "a",
          text: "Karena bawaannya melewati langkah itu ketika langkah sebelumnya gagal, jadi hanya pelaksanaan yang lulus yang akan pernah sampai ke TestForge",
        },
        {
          id: "b",
          text: "Karena unggahan dari pelaksanaan yang dibatalkan merusak riwayat case-nya",
        },
        {
          id: "c",
          text: "Karena endpoint-nya menolak run yang memuat kegagalan kecuali flag-nya disetel",
        },
        {
          id: "d",
          text: "Karena ia membuat unggahannya berjalan sebelum pengujiannya selesai, menghemat waktu pipeline",
        },
      ],
      explanation:
        "GitHub melewati langkah-langkah berikutnya begitu satu gagal, dan langkah pengujiannya gagal justru ketika ada pengujian yang gagal — hasil yang paling layak dicatat. Kalau dibiarkan pada bawaannya, riwayat Anda terisi tak lain dari run hijau, dan itu lebih buruk daripada tanpa riwayat karena ia tampak seperti bukti. !cancelled() mengirim hasil entah suite-nya lulus atau gagal sambil tetap melewati pelaksanaan yang memang dibatalkan. Endpoint-nya dengan senang hati mencatat kegagalan; justru itulah gunanya mencatatnya.",
    },
    {
      id: "q3",
      stem: "Pernyataan mana tentang pencocokan hasil ke case yang benar?",
      choices: [
        {
          id: "a",
          text: "Anotasinya adalah TC-<SLUG>-<nomor>, dengan SLUG adalah slug proyeknya, karena nomor case hanya unik di dalam satu proyek",
        },
        {
          id: "b",
          text: "Tanpa id TC, nama pengujiannya dibandingkan dengan judul case-nya, tanpa membedakan huruf besar-kecil",
        },
        {
          id: "c",
          text: "Mencocokkan lewat judul lebih baik, karena judul lebih terbaca daripada id",
        },
        {
          id: "d",
          text: "404 bisa berarti proyeknya ada tapi akun pemilik key Anda bukan anggotanya",
        },
      ],
      explanation:
        "Slug-nya bagian dari polanya karena nomor case sendirian akan ambigu lintas proyek, dan itulah sebabnya singkatan TC-12 yang dipakai lebih awal di track ini sebenarnya tidak cocok. Cadangan berbasis judulnya nyata dan tidak membedakan huruf besar-kecil, tapi ia yang lebih lemah di antara keduanya: judul disunting demi kejernihan, dan suite yang mencocokkan pada prosa berhenti cocok pada hari seseorang memperbaiki sebuah judul case — sebuah id adalah kontrak, argumen yang sama dengan yang dibuat pelajaran locator untuk data-testid. Dan 404-nya sengaja meleburkan 'tidak ada' dengan 'Anda tidak bisa melihatnya', supaya endpoint-nya tidak mengonfirmasi slug mana yang ada kepada orang yang bukan anggota.",
    },
  ],
};
