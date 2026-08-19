import type { LessonTranslation } from "../../../types";

export const assertionsAndWaitingId: LessonTranslation = {
  slug: "assertions-and-waiting",
  title: "Asersi dan menunggu",
  summary:
    "Web-first assertion, auto-waiting, dan kenapa sleep() adalah bug.",
  body: `
## Pengujian yang tidak pernah bisa gagal bukanlah pengujian yang lulus

Dua pengujian, fitur yang sama, keduanya hijau:

~~~ts
// A
await page.getByRole("button", { name: "Create project" }).click();
await page.waitForTimeout(3000);

// B
await page.getByRole("button", { name: "Create project" }).click();
await expect(page.getByRole("heading", { name: "New project" })).toBeVisible();
~~~

Pengujian A tidak mungkin gagal. Ia mengeklik, menunggu tiga detik, dan melapor
berhasil apa pun yang dilakukan aplikasinya — termasuk tidak melakukan apa-apa.
Ia pengujian dalam arti ia berjalan, dan tidak dalam arti yang lain.

Segala isi pelajaran ini kembali ke sana: **asersi adalah satu-satunya bagian
sebuah pengujian yang bisa menemukan bug**, dan menunggu adalah mekanisme yang
menentukan apakah asersi Anda sempat berjalan terhadap momen yang tepat.

## Auto-waiting sudah mengerjakan sebagian besarnya

Pelajaran sebelumnya menyebut locator itu malas — tidak ada yang dicari sampai
Anda bertindak. Paruh yang penting di sini adalah apa yang dilakukan Playwright
sebelum ia bertindak. Setiap aksi menjalankan serangkaian **pemeriksaan
keteraksian (actionability)** lebih dulu dan mencobanya ulang sampai lolos atau
waktunya habis:

| Aksi | Menunggu elemennya |
|---|---|
| \`click()\` | terpasang, terlihat, diam (tidak sedang beranimasi), aktif, tidak tertutup elemen lain |
| \`fill()\` | terpasang, terlihat, aktif, bisa disunting |
| \`check()\` | sama seperti click, plus benar-benar sebuah checkbox atau radio |
| \`selectOption()\` | terpasang, terlihat, aktif |
| \`hover()\` | terpasang, terlihat, diam, menerima peristiwa |

Itulah sebabnya pengujian Playwright yang ditulis dengan baik nyaris tidak butuh
penungguan eksplisit. Klik pada tombol yang muncul setengah detik setelah
halamannya dimuat begitu saja bekerja — bukan karena margin waktu yang beruntung,
melainkan karena klik-nya dicoba ulang sampai tombolnya ada, terlihat, diam, dan
bisa diklik.

**"Tidak tertutup elemen lain" adalah yang paling layak bayarannya.** Banner
cookie, sebuah toast, atau latar modal di atas tombol Anda adalah sumber klasik
klik yang menembak ke kehampaan dan pengujian yang gagal dua langkah kemudian
dengan pesan yang membingungkan. Playwright menolak mengeklik menembusnya dan
memberi tahu Anda apa yang menghalangi.

## Web-first assertion juga mencoba ulang

\`expect()\` di Playwright bukan \`expect()\` dari unit testing. Diberi sebuah
locator, ia **menjajaki berulang sampai kondisinya benar atau waktunya habis**:

~~~ts
await expect(page.getByRole("alert")).toHaveText("Project created");
await expect(page.getByRole("row")).toHaveCount(4);
await expect(page.getByRole("button", { name: "Save" })).toBeEnabled();
await expect(page).toHaveURL(/\/projects\/[a-z0-9]+$/);
await expect(page.getByTestId("status-pill")).toHaveAttribute("data-state", "passed");
~~~

Bandingkan dengan bentuk yang tidak mencoba ulang, dan di situlah kelabilan
ditulis:

~~~ts
// membaca sekali, di momen apa pun ketika baris ini kebetulan berjalan
expect(await page.getByRole("row").count()).toBe(4);
~~~

Versi itu mengambil sampel halamannya pada satu titik waktu. Kalau baris keempat
tiba 50md kemudian, ia gagal — di lokal tidak pernah, di runner CI yang sarat
kadang-kadang. **Aturannya: serahkan locator-nya ke dalam \`expect\`, jangan
\`await\` nilainya keluar lebih dulu.** Di mana pun Anda melihat
\`expect(await …)\` di sebuah pengujian UI, Anda sedang melihat sebuah perlombaan.

Dua lagi yang mengikuti bentuk yang sama:

~~~ts
await expect(locator).toBeVisible();      // mencoba ulang
expect(await locator.isVisible()).toBe(true);   // potret — perlombaan
~~~

\`isVisible()\` dan kawan-kawannya untuk bercabang berdasarkan state yang memang
tidak Anda ketahui ("apakah banner-nya ada? kalau ya tutup"), bukan untuk
mengasersikan.

## Asersi yang layak diketahui

~~~ts
// keberadaan dan state
await expect(l).toBeVisible();
await expect(l).toBeHidden();
await expect(l).toBeEnabled();
await expect(l).toBeChecked();
await expect(l).toBeFocused();

// isi
await expect(l).toHaveText("Exactly this");
await expect(l).toContainText("part of this");
await expect(l).toHaveValue("typed@example.com");
await expect(l).toHaveCount(3);

// atribut dan kelas
await expect(l).toHaveAttribute("aria-expanded", "true");
await expect(l).toHaveClass(/active/);

// tingkat halaman
await expect(page).toHaveTitle(/TestForge/);
await expect(page).toHaveURL("/projects");
~~~

\`toHaveText\` pada locator yang cocok dengan beberapa elemen membandingkan
terhadap **seluruh daftarnya**, dan itu cara yang rapi untuk mengasersikan sebuah
urutan:

~~~ts
await expect(page.getByRole("row")).toHaveText([/TC-10/, /TC-11/, /TC-12/]);
~~~

Dan \`.not\` membalik salah satunya — \`await expect(l).not.toBeVisible()\` —
dengan perilaku coba-ulang yang memang Anda inginkan: ia menunggu benda itu
*menghilang*, alih-alih mengasersikan bahwa ia tidak ada pada satu titik waktu.

## Kenapa sleep() adalah bug dan bukan jalan pintas

\`waitForTimeout()\` keliru di dua arah sekaligus, dan itulah yang membuatnya jadi
kekeliruan yang begitu awet:

- **Terlalu pendek di hari yang buruk.** CI lebih lambat daripada laptop Anda
  ketika sedang sarat. Tiga detik yang bekerja sepanjang minggu gagal di pagi
  ketika semua orang mendorong kodenya.
- **Terlalu panjang di setiap hari yang baik.** Tiga puluh sleep tiga detik
  adalah sembilan puluh detik yang ditambahkan ke setiap pelaksanaan, selamanya,
  untuk apa-apa.

Perbaikannya tidak pernah berupa angka yang lebih besar. Perbaikannya adalah
menyatakan **apa yang sedang Anda tunggu**:

| Alih-alih | Tulislah |
|---|---|
| \`waitForTimeout(2000)\` setelah sebuah klik | \`await expect(page.getByRole("alert")).toBeVisible()\` |
| \`waitForTimeout(1000)\` menunggu daftar dimuat | \`await expect(page.getByRole("row")).toHaveCount(4)\` |
| \`waitForTimeout(500)\` menunggu spinner | \`await expect(page.getByTestId("spinner")).toBeHidden()\` |
| \`waitForTimeout(3000)\` menunggu penyimpanan | \`await page.waitForResponse(r => r.url().includes("/api/cases") && r.ok())\` |

Dokumentasi Playwright sendiri menyebut \`waitForTimeout\` tidak boleh dipakai di
pengujian produksi, dan API-nya ada untuk debugging. Perlakukan sebuah
\`waitForTimeout\` di dalam pull request sebagaimana Anda memperlakukan asersi yang
dikomentari.

**Satu-satunya kekecualian yang jujur adalah jeda tetap yang dipaksakan dari
luar** — sebuah debounce yang tidak bisa Anda amati, widget pihak ketiga tanpa
sinyal apa pun. Bahkan di situ pun, tuliskan alasannya di barisnya, karena kalau
tidak orang berikutnya akan mengira itu ritual tanpa makna lalu menghapusnya atau
menyalinnya.

## Menunggu hal-hal yang bukan elemen

~~~ts
// sebuah response jaringan
const created = page.waitForResponse(r => r.url().endsWith("/api/cases") && r.status() === 201);
await page.getByRole("button", { name: "Save" }).click();
await created;

// navigasi yang dipicu sebuah aksi
await page.getByRole("link", { name: "Projects" }).click();
await expect(page).toHaveURL(/\/projects/);

// sebuah kondisi di dalam halamannya
await page.waitForFunction(() => document.querySelectorAll("[data-row]").length > 0);
~~~

Perhatikan bentuk yang pertama: **mulai menunggu sebelum aksinya, await
sesudahnya**. Mendaftarkan penungguan setelah klik-nya adalah perlombaan —
response-nya bisa jadi sudah tiba.

Sebagian besar waktu Anda tidak butuh satu pun dari ini. Lebih baik asersikan
*konsekuensi yang terlihat pengguna*: kalau penyimpanannya berhasil, ada sesuatu
di layar yang mengatakannya, dan itu sekaligus penungguan yang lebih baik dan
asersi yang lebih baik. Jangkau \`waitForResponse\` ketika konsekuensinya memang
tak terlihat — panggilan analitik latar, penulisan yang dilepas begitu saja —
atau ketika Anda butuh isi response-nya.

\`networkidle\` layak mendapat peringatan khusus: ia menunggu kesunyian jaringan,
yang tidak pernah dicapai aplikasi dengan polling atau koneksi hidup, dan yang
tidak mengatakan apa pun tentang apakah hal yang Anda pedulikan sudah ter-render.
Ia tidak dianjurkan persis karena itu.

## Timeout, dan di mana menyetelnya

~~~ts
// playwright.config.ts
export default defineConfig({
  timeout: 30_000,                    // per pengujian
  expect: { timeout: 5_000 },         // per web-first assertion
  use: { actionTimeout: 10_000 },     // per aksi
});
~~~

Timpa per asersi ketika satu hal memang lambat, alih-alih menaikkan angka
globalnya:

~~~ts
await expect(page.getByText("Import complete")).toBeVisible({ timeout: 60_000 });
~~~

**Menaikkan timeout global untuk membetulkan pengujian yang gagal hampir selalu
langkah yang keliru.** Ia mengubah merah yang cepat menjadi merah yang lambat,
dan pada hari pengujiannya benar-benar rusak Anda menunggu satu menit untuk
mengetahuinya. Penimpaan lokal di sebelah sebuah impor yang lambat adalah fakta
terdokumentasi tentang aplikasinya; timeout global 120 detik adalah catatan yang
berbunyi "kami berhenti memahami suite ini".

## Soft assertion, secukupnya saja

~~~ts
await expect.soft(page.getByTestId("total")).toHaveText("4 cases");
await expect.soft(page.getByTestId("passed")).toHaveText("3 passed");
await expect(page.getByRole("heading", { name: "Run summary" })).toBeVisible();
~~~

Soft assertion mencatat kegagalannya lalu membiarkan pengujiannya lanjut,
sehingga satu pelaksanaan memberi tahu Anda bahwa ketiga angkanya keliru
alih-alih hanya yang pertama. Berguna ketika memeriksa beberapa fakta independen
tentang layar yang sama. Tidak berguna sebagai kebiasaan umum: kegagalan keras di
awal mencegah pengujiannya menghasilkan air terjun error susulan yang menyesatkan,
dan biasanya itulah yang Anda inginkan.

## Asersikan hal yang diterima pengguna

Asersi lemah yang paling umum bukan sebuah perlombaan — melainkan mengasersikan
hal yang keliru. Setelah mengeklik Simpan, memeriksa bahwa tombolnya masih
terlihat tidak membuktikan apa pun. Memeriksa bahwa barisnya kini muncul di
tabel, atau bahwa konfirmasinya menyebutkan catatannya, membuktikan fiturnya
bekerja.

Pelajaran test oracle di track manual adalah gagasan yang sama dalam medium yang
lain: Anda harus sanggup menyatakan *bagaimana Anda akan tahu ia berhasil*,
sebelum Anda menulis barisnya. Kalau Anda tidak bisa menyelesaikan kalimat itu,
asersi yang hendak Anda tulis adalah hiasan.

## Di mana TestForge berperan

Pengujian dengan asersi yang sungguhan menghasilkan hasil yang bisa Anda percaya;
pengujian yang diganjal sleep menghasilkan riwayat hijau yang tidak berarti apa
pun, dan pada hari ia akhirnya memerah tidak ada yang memercayainya. Ketika
pelaksanaan Anda mendarat di TestForge, riwayat case-nya hanya sejujur asersinya.

Ada juga versi terukur dari hal ini. Suite yang digerakkan sleep muncul sebagai
run yang *durasinya* terus tumbuh sementara jumlah case-nya nyaris tidak bergerak
— pelajaran metrik di track manual menyebut angka semacam itu layak diawasi.
Sembilan puluh detik \`waitForTimeout\` per pelaksanaan, empat puluh pelaksanaan
sehari, adalah satu jam CI sehari yang tidak membeli apa pun.

**Selanjutnya:** page object — struktur yang menghentikan lima puluh pengujian
mengulang enam baris yang sama, dan titik di mana struktur itu berubah menjadi
aplikasi kedua yang harus dirawat.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Baris mana di antara ini yang merupakan perlombaan yang menunggu terjadi di runner CI yang sarat?",
      choices: [
        {
          id: "a",
          text: "await expect(page.getByRole(\"row\")).toHaveCount(4)",
        },
        {
          id: "b",
          text: "expect(await page.getByRole(\"row\").count()).toBe(4)",
        },
        {
          id: "c",
          text: "await expect(page.getByRole(\"alert\")).toHaveText(\"Saved\")",
        },
        {
          id: "d",
          text: "await expect(page).toHaveURL(/\/projects/)",
        },
      ],
      explanation:
        "Baris kedua meng-await nilainya keluar dari locator lebih dulu, jadi expect menerima sebuah angka biasa dan membandingkannya sekali, pada titik waktu apa pun ketika baris itu kebetulan berjalan. Kalau baris keempat tiba 50md kemudian pengujiannya gagal — tidak pernah di laptop Anda, kadang-kadang di CI, dan itu profil kegagalan yang paling buruk. Tiga lainnya menyerahkan locator-nya ke dalam expect, dan itu menjadikannya web-first assertion: keduanya menjajaki berulang sampai kondisinya berlaku atau waktunya habis. Aturannya bisa digeneralisasi — di mana pun Anda melihat expect(await …) di pengujian UI, Anda sedang melihat potret di tempat Anda menginginkan coba-ulang.",
    },
    {
      id: "q2",
      stem: "Seorang rekan membetulkan pengujian yang kadang gagal di CI dengan mengubah waitForTimeout(2000) menjadi waitForTimeout(5000). Kenapa itu perbaikan yang keliru meskipun pengujiannya sekarang lulus?",
      choices: [
        {
          id: "a",
          text: "Playwright mengabaikan timeout yang lebih panjang dari 3 detik",
        },
        {
          id: "b",
          text: "Ia tetap tebakan tetap — terlalu pendek di hari yang lebih lambat dan waktu terbuang di setiap hari yang cepat — sementara asersi atas konsekuensi yang sebenarnya justru benar sekaligus lebih cepat",
        },
        {
          id: "c",
          text: "waitForTimeout hanya bekerja di mode headed, jadi CI mengabaikannya sama sekali",
        },
        {
          id: "d",
          text: "Pengujiannya kini akan dilaporkan sebagai dilewati alih-alih lulus",
        },
      ],
      explanation:
        "Sebuah sleep keliru di dua arah sekaligus, dan itulah yang membuatnya jadi kekeliruan yang begitu awet: tidak ada angka tetap yang cukup besar untuk hari CI terburuk, dan setiap angka terbuang di hari-hari biasa — tiga puluh sleep tiga detik adalah sembilan puluh detik yang ditambahkan ke setiap pelaksanaan selamanya. Menaikkannya membeli beberapa minggu sebelum kegagalan kadang-kadang yang sama kembali, dengan suite yang kini lebih lambat. Menyebut apa yang Anda tunggu memperbaiki kedua paruhnya: expect(alert).toBeVisible() kembali begitu alert-nya ada dan gagal dengan benar ketika ia tidak pernah tiba. Satu-satunya kekecualian yang jujur adalah jeda yang memang tidak bisa Anda amati, dan ia layak diberi komentar yang menyatakannya.",
    },
    {
      id: "q3",
      stem: "Pernyataan mana tentang auto-waiting Playwright yang benar?",
      choices: [
        {
          id: "a",
          text: "click() mencoba ulang pemeriksaan keteraksian — terlihat, diam, aktif, tidak tertutup — sampai lolos atau waktunya habis",
        },
        {
          id: "b",
          text: "Auto-waiting menghilangkan kebutuhan mengasersikan apa pun, karena aksinya akan gagal kalau halamannya keliru",
        },
        {
          id: "c",
          text: "expect(locator).toBeVisible() menjajaki berulang, jadi ia menunggu elemen yang lambat alih-alih gagal di pemeriksaan pertama",
        },
        {
          id: "d",
          text: "waitForLoadState(\"networkidle\") adalah cara yang andal untuk tahu sebuah halaman sudah siap",
        },
      ],
      explanation:
        "Aksi mencoba ulang pemeriksaan keteraksiannya, dan web-first assertion menjajaki berulang — bersama-sama keduanya mencakup nyaris seluruh penungguan yang dibutuhkan sebuah pengujian UI, dan itulah sebabnya pengujian Playwright yang ditulis dengan baik tidak memuat penungguan eksplisit. Tapi auto-waiting hanya membawa Anda ke momen yang tepat; ia tidak mengklaim apa pun tentang apakah aplikasinya melakukan hal yang benar, jadi ia bukan pengganti asersi — pengujian yang mengeklik dan tidak mengasersikan apa pun tidak mungkin gagal. Dan networkidle tidak dianjurkan: aplikasi dengan polling atau koneksi hidup tidak pernah mencapai kesunyian jaringan, dan kesunyian itu pun toh tidak memberi tahu Anda bahwa elemen yang Anda pedulikan sudah ter-render.",
    },
  ],
};
