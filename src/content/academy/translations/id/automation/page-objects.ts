import type { LessonTranslation } from "../../../types";

export const pageObjectsId: LessonTranslation = {
  slug: "page-objects",
  title: "Page object, dan kapan ia menyakitkan",
  summary:
    "Struktur yang balik modal, struktur yang berubah menjadi aplikasi kedua.",
  body: `
## Masalahnya nyata sebelum polanya nyata

Empat pengujian ke dalam sebuah suite, hal ini sudah terjadi:

~~~ts
test("creates a case", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.TF_EMAIL!);
  await page.getByLabel("Password").fill(process.env.TF_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  // ... empat baris pengujian yang sebenarnya
});
~~~

Lima baris pertama itu kini ada di setiap berkas pengujian yang Anda miliki. Pada
hari form login mendapat kolom "Workspace", Anda menyunting empat puluh
berkas. Itulah biaya yang menjadi alasan page object ada, dan layak dicermati apa
biayanya sebenarnya: **bukan duplikasi demi duplikasi, melainkan jumlah tempat
yang terpaksa Anda sentuh oleh satu perubahan UI.**

## Polanya, seminimal mungkin

Page object adalah sebuah class yang memiliki locator dan aksi untuk satu layar.
Tidak lebih:

~~~ts
// pages/login.page.ts
import { type Page, type Locator } from "@playwright/test";

export class LoginPage {
  private readonly email: Locator;
  private readonly password: Locator;
  private readonly submit: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByLabel("Email");
    this.password = page.getByLabel("Password");
    this.submit = page.getByRole("button", { name: "Sign in" });
  }

  async goto() {
    await this.page.goto("/login");
  }

  async signIn(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
~~~

~~~ts
test("creates a case", async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.signIn(process.env.TF_EMAIL!, process.env.TF_PASSWORD!);
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  // ... pengujian yang sebenarnya
});
~~~

Locator-nya ditugaskan di konstruktor, dan itu aman karena alasan yang diberikan
pelajaran locator: **locator adalah deskripsi, bukan elemen yang sudah
ditemukan.** Tidak ada yang dicari pada saat konstruksi, jadi page object yang
dibangun sebelum halamannya ada bekerja baik-baik saja, dan yang dipegang
melintasi sebuah re-render tidak pernah basi.

## Aturan yang menjaga page object tetap berguna

**Page object memaparkan apa yang bisa dilakukan pengguna. Ia tidak
mengasersikan.**

~~~ts
// jangan
async assertLoginSucceeded() {
  await expect(this.page.getByRole("heading", { name: "Projects" })).toBeVisible();
}
~~~

Pindahkan asersi ke dalam page object dan dua hal jadi keliru. Pengujiannya
berhenti menyatakan apa yang diverifikasinya — \`await
login.assertLoginSucceeded()\` tidak memberi tahu pembacanya apa pun tentang arti
"berhasil" — dan Anda berakhir dengan menu metode \`assertX\` yang terus tumbuh,
sebagian besar dipakai sekali, karena setiap pengujian menginginkan pemeriksaan
yang sedikit berbeda.

Simpan *harapannya* di dalam pengujiannya, di tempat pembaca bisa melihat seluruh
klaimnya:

~~~ts
await login.signIn(email, password);
await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
~~~

Kompromi yang layak diizinkan adalah sebuah **getter**, bukan sebuah asersi:

~~~ts
get errorMessage() {
  return this.page.getByRole("alert");
}
~~~

~~~ts
await expect(login.errorMessage).toHaveText("Incorrect email or password");
~~~

Page object memiliki *di mana error-nya tinggal*; pengujian memiliki *apa yang
seharusnya ia katakan*. Pembagian itulah seluruh disiplinnya, dan hampir semua
kekacauan page object berasal dari melanggarnya.

## Di mana ia menyakitkan

Page object punya mode kegagalan, dan itu tidak jarang terjadi. Suite-nya berubah
menjadi aplikasi kedua — yang tidak punya pengujian sendiri, tidak punya
pengguna, dan punya tagihan perawatan yang tidak dianggarkan siapa pun.

**Gejala 1: metode satu baris dengan nama yang lebih buruk.**

~~~ts
async clickSaveButton() {
  await this.saveButton.click();
}
~~~

Ini kelokan tanpa abstraksi. Pembacanya kini harus membuka berkas lain untuk tahu
apa yang dilakukan \`clickSaveButton\`, lalu tahu bahwa ia mengeklik tombol save.
Paparkan locator-nya dan biarkan pengujiannya yang mengeklik.

**Gejala 2: metode dengan parameter boolean.**

~~~ts
await casePage.save(true, false, "TC-12");
~~~

Tidak ada yang bisa membacanya di tempat pemanggilan. Dua dari tiga argumennya
ada karena satu metode berusaha melayani tiga pengujian berbeda. Tulis tiga
metode bernama, atau lebih sedikit.

**Gejala 3: page object yang mencerminkan komponen alih-alih layar.**
\`ButtonComponent\`, \`InputComponent\`, \`TableCellComponent\` — lapisan pembungkus
di atas API yang sudah bagus. Locator Playwright adalah abstraksinya; satu lagi
di atasnya tidak membayar apa pun.

**Gejala 4: pewarisan.** \`BasePage\` → \`AuthenticatedPage\` → \`ProjectPage\` →
\`CasePage\`, dan menemukan di mana sebuah locator didefinisikan berarti memanjat
empat berkas. Komposisi — sebuah page object yang memegang objek \`Nav\` — tetap
terbaca pada ukuran sepuluh kali lipat.

**Gejala 5: perangkaian yang berbohong.**
\`login.signIn().goToProjects().openCase()\` tampak rapi dan menyembunyikan fakta
bahwa setiap langkahnya bisa gagal, dan pada saat itu stack trace-nya menunjuk ke
sebuah rantai alih-alih ke sebuah langkah.

Ujinya: **akankah anggota tim baru yang membaca berkas pengujiannya saja paham
apa yang sedang diverifikasi?** Kalau memahami satu pengujian berarti membuka
tiga page object, strukturnya berbiaya lebih besar daripada duplikasinya dulu.

## Fixture biasanya alat yang lebih baik

Playwright punya jawabannya sendiri untuk persiapan, dan ia berkomposisi lebih
baik daripada sebuah base class:

~~~ts
// fixtures.ts
import { test as base, type Page } from "@playwright/test";
import { LoginPage } from "./pages/login.page";

export const test = base.extend<{ loginPage: LoginPage; signedInPage: Page }>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  signedInPage: async ({ page }, use) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn(process.env.TF_EMAIL!, process.env.TF_PASSWORD!);
    await use(page);
  },
});

export { expect } from "@playwright/test";
~~~

~~~ts
import { test, expect } from "../fixtures";

test("creates a case", async ({ signedInPage }) => {
  // sudah dalam keadaan masuk
});
~~~

Persiapannya kini dideklarasikan dengan cara *memintanya di tanda tangan
pengujian*, ia berjalan hanya untuk pengujian yang memintanya, dan pembersihan
setelah \`use()\` dijamin terjadi bahkan ketika pengujiannya gagal. Sifat terakhir
itulah yang membuat fixture lebih baik daripada \`beforeEach\` untuk apa pun yang
membuat data — dan di situlah pelajaran berikutnya melanjutkan.

**Masuk lewat UI di setiap pengujian tetap lambat.** Perbaikan bakunya adalah
\`storageState\`: masuk sekali di sebuah setup project, simpan cookie-nya ke
sebuah berkas, dan buat setiap pengujian dimulai dalam keadaan terautentikasi.
Alur login-nya sendiri tetap mendapat satu pengujian sungguhan — yang benar-benar
menjalankan form-nya.

## Seberapa banyak struktur, dan kapan

Bawaan yang masuk akal, berurutan:

1. **Berkas pengujian saja.** Di bawah sekitar lima pengujian, locator inline
   lebih jernih daripada struktur apa pun. Jangan membangun framework untuk tiga
   pengujian.
2. **Ekstrak alur yang berulang** — biasanya login — ke dalam sebuah fixture,
   begitu ia berada di tiga berkas.
3. **Tambahkan satu page object per layar** ketika locator sebuah layar muncul di
   beberapa berkas, atau ketika satu layar punya cukup banyak elemen sehingga
   locator inline mengubur pengujiannya.
4. **Pecah lebih jauh hanya berdasarkan bukti**: sebuah component object untuk
   widget yang memang dipakai ulang (date picker, tabel data), bukan karena
   sebuah folder terasa kosong.

Struktur yang diperoleh dari pengulangan yang nyata hampir selalu tepat. Struktur
yang ditambahkan di depan, karena sebuah tutorial menyuruhnya, itulah yang
berubah menjadi aplikasi kedua.

## Penamaan, supaya suite-nya hidup lebih lama dari Anda

Dua konvensi yang sekarang tidak berbiaya apa pun dan nanti berbiaya satu sprint:

- \`pages/login.page.ts\`, satu class per layar, nama metode dalam bahasa
  penggunanya — \`signIn\`, \`createCase\`, \`filterByStatus\` — bukan bahasa DOM-nya.
- **Nama pengujian tetap membawa id case-nya**, apa pun struktur yang duduk di
  bawahnya: \`test("TC-SHOP-12 a valid login lands on the dashboard")\`. Pelajaran
  pemrograman menanamkan ini dan karya penutupnya bergantung padanya; melakukan
  refactor menjadi page object justru momen ketika orang tak sengaja menulis ulang
  judul pengujian dan merusak pencocokannya.

## Di mana TestForge berperan

Page object mengubah cara sebuah kegagalan terbaca. Tanpa page object, empat
puluh pengujian merah setelah sebuah perubahan login memberi tahu Anda empat
puluh hal rusak; dengan page object, perubahan yang sama merusak satu berkas dan
riwayat run-nya menunjukkan satu perbaikan locator alih-alih sebuah tebing.

Perbedaan itu penting ketika run Anda mendarat di TestForge, karena run
yang separuh case-nya memerah sekaligus itu entah regresi sungguhan entah
peristiwa perawatan suite, dan keduanya menuntut tanggapan yang sama sekali
berbeda. Struktur yang memusatkan sebuah perubahan UI ke satu tempat adalah yang
menjaga sinyal itu tetap terbaca — dan itu argumen yang sama dengan yang dibuat
pelajaran locator tentang tidak mencatat perbaikan locator sebagai cacat yang
ditemukan.

**Selanjutnya:** data uji dan fixture — pengujian yang saling bebas, state yang
ditanamkan, dan membersihkan bekas Anda sendiri supaya suite-nya lulus dalam
urutan apa pun.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Kenapa page object sebaiknya memaparkan locator pesan kesalahan alih-alih sebuah metode assertLoginFailed()?",
      choices: [
        {
          id: "a",
          text: "Asersi tidak bisa dipanggil dari luar berkas pengujian di Playwright",
        },
        {
          id: "b",
          text: "Pengujiannya seharusnya menyatakan apa yang diverifikasinya; menyembunyikan klaimnya di balik nama metode membuat pengujiannya tak terbaca dan menumbuhkan menu metode assert yang nyaris serupa",
        },
        {
          id: "c",
          text: "Locator lebih cepat daripada asersi karena ia tidak menjajaki berulang",
        },
        {
          id: "d",
          text: "expect() hanya mencoba ulang ketika ia dipanggil di tingkat teratas sebuah pengujian",
        },
      ],
      explanation:
        "Pembagiannya adalah page object memiliki di mana sesuatu tinggal dan pengujian memiliki apa yang seharusnya ia katakan. assertLoginFailed() tidak memberi tahu pembacanya seperti apa rupa kegagalannya, dan karena setiap pengujian menginginkan pemeriksaan yang sedikit berbeda Anda menumpuk assertLoginFailedWithBadPassword, assertLoginFailedWithLockedAccount, dan seterusnya — sebagian besar dipakai sekali. Memaparkan locator-nya menjaga seluruh klaimnya terlihat di tempat pemanggilan: expect(login.errorMessage).toHaveText(\"Incorrect email or password\"). Tidak ada halangan teknis untuk mengasersikan di dalam page object; expect bekerja dan mencoba ulang dengan baik di sana, dan justru karena itulah disiplinnya harus berupa pilihan yang disengaja.",
    },
    {
      id: "q2",
      stem: "Sebuah suite masuk lewat form login di awal seluruh 60 pengujiannya, menambah sekitar empat detik masing-masing. Apa perbaikan bakunya?",
      choices: [
        {
          id: "a",
          text: "Perbanyak worker paralel supaya total waktu jam dindingnya turun",
        },
        {
          id: "b",
          text: "Masuk sekali di sebuah setup project, simpan storageState, dan mulai setiap pengujian dalam keadaan terautentikasi — sambil mempertahankan satu pengujian sungguhan untuk form login-nya sendiri",
        },
        {
          id: "c",
          text: "Pindahkan proses masuknya ke sebuah class BasePage yang diwarisi setiap page object",
        },
        {
          id: "d",
          text: "Ganti proses masuknya dengan waitForTimeout supaya pengujiannya tidak bergantung pada form-nya",
        },
      ],
      explanation:
        "storageState menyingkirkan pekerjaan berulangnya alih-alih menyembunyikannya: autentikasi sekali, simpan cookie-nya, dan setiap pengujian dimulai dalam keadaan masuk — sementara alur login-nya tetap memegang satu pengujian yang sungguh-sungguh menjalankan form-nya, karena itu fitur yang tetap perlu diverifikasi seseorang. Lebih banyak worker mengurangi waktu jam dinding tapi tetap membayar empat detik waktu mesin yang sama per pengujian dan menambah beban yang memperburuk pengujian yang peka waktu. BasePage memindahkan alur lambat yang sama ke dalam rantai pewarisan, dan itu gejala kelima di pelajaran ini alih-alih sebuah perbaikan. Dan pilihan terakhir menghapus proses masuknya tanpa menggantinya, meninggalkan pengujian di halaman yang tidak terautentikasi.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang merupakan tanda page object sudah berubah menjadi aplikasi kedua yang harus dirawat?",
      choices: [
        {
          id: "a",
          text: "Metode seperti clickSaveButton() yang membungkus satu klik",
        },
        {
          id: "b",
          text: "Rantai pewarisan empat tingkat: BasePage → AuthenticatedPage → ProjectPage → CasePage",
        },
        {
          id: "c",
          text: "Sebuah page object yang memaparkan locator yang dipakai beberapa berkas pengujian",
        },
        {
          id: "d",
          text: "Metode dengan parameter boolean, dipanggil sebagai save(true, false, \"TC-12\")",
        },
      ],
      explanation:
        "Pembungkus satu baris adalah kelokan tanpa abstraksi — pembacanya membuka berkas lain untuk tahu bahwa clickSaveButton mengeklik tombol save. Pewarisan yang dalam berarti menemukan di mana sebuah locator didefinisikan menuntut memanjat beberapa berkas, sementara komposisi tetap terbaca pada ukuran sepuluh kali lipat. Parameter boolean tak terbaca di tempat pemanggilan dan biasanya berarti satu metode sedang melayani tiga pengujian yang menginginkan tiga metode bernama. Locator bersama itu adalah polanya bekerja sebagaimana dimaksudkan: itu persis pengulangan yang menjadi alasan page object ada, supaya sebuah perubahan UI menyentuh satu berkas alih-alih empat puluh.",
    },
  ],
};
