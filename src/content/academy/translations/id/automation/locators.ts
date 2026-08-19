import type { LessonTranslation } from "../../../types";

export const locatorsId: LessonTranslation = {
  slug: "locators",
  title: "Locator yang selamat dari sebuah refactor",
  summary:
    "Role, label, dan test id — dan kenapa rantai CSS rusak setiap sprint.",
  body: `
## Yang merusak suite Anda bukanlah aplikasinya

Tanyakan kepada siapa pun yang merawat suite UI apa yang sebenarnya memerah, dan
nyaris tidak pernah itu cacat sungguhan. Yang terjadi adalah 40 pengujian gagal
karena seorang desainer membungkus sebuah bagian dengan satu \`<div>\` tambahan.

Itu masalah locator, dan ia biaya perawatan terbesar di otomasi browser. Tidak
ada hal lain di track ini yang akan menghemat waktu Anda sebanyak membereskan
yang satu ini di minggu pertama.

## Kenapa selektor yang diserahkan devtools itu jebakan

Klik kanan, Copy selector, dan Chrome memberi Anda sesuatu seperti:

~~~
#root > div:nth-child(2) > div.sc-bdVaJa.kGJgTf > form > div:nth-child(3) > button
~~~

Setiap satu hal dalam string itu adalah detail implementasi tanpa janji apa pun
terlekat padanya. \`sc-bdVaJa\` adalah kelas hasil pembangkitan yang berubah
ketika stylesheet-nya dibangun ulang. \`nth-child(3)\` rusak ketika ada yang
menambahkan kolom di atasnya. Penyarangannya rusak oleh perubahan tata letak apa
pun.

Sebuah locator adalah **kontrak antara pengujian Anda dan aplikasinya**, dan
pertanyaan yang perlu diajukan atas setiap locator yang Anda tulis adalah: *janji
apa yang saya andalkan, dan apakah tim akan menganggap melanggarnya sebagai bug?*
"Tombol sign-in bisa dijangkau dan berlabel Sign in" adalah janji yang akan
ditepati sebuah tim. "Tombolnya adalah anak ketiga sebuah div" bukan janji yang
dibuat siapa pun.

## Urutan yang dijangkau

Locator bawaan Playwright, yang terbaik lebih dulu:

~~~ts
page.getByRole("button", { name: "Sign in" });   // 1. role + nama yang bisa diakses
page.getByLabel("Email");                        // 2. kolom formulir, lewat label
page.getByPlaceholder("Search cases");           // 3. ketika tidak ada label
page.getByText("No results found");              // 4. konten statis
page.getByTestId("case-row");                    // 5. pintu darurat yang eksplisit
page.locator("css=.btn-primary");                // 6. pilihan terakhir
~~~

**\`getByRole\` lebih dulu, dan bukan cuma karena ia stabil.** Ia menemukan
elemennya dengan cara teknologi bantu menemukannya, jadi tombol yang berhenti
bisa dijangkau lewat role punya cacat aksesibilitas — dan pengujian Anda gagal
karenanya. Itu strategi locator yang diam-diam membelikan Anda kelas bug kedua
secara cuma-cuma. Itu juga sebabnya pelajaran aksesibilitas di track manual
berada di hulu pelajaran ini: role dan nama yang bisa diakses adalah konsep yang
sama di sana dan di sini.

Role yang lazim akan Anda pakai: \`button\`, \`link\`, \`textbox\`, \`checkbox\`,
\`combobox\`, \`heading\`, \`dialog\`, \`row\`, \`cell\`, \`alert\`.

~~~ts
page.getByRole("heading", { name: "Dashboard", level: 1 });
page.getByRole("link", { name: "Create project" });
page.getByRole("textbox", { name: "Search" });
page.getByRole("row", { name: /TC-12/ });
~~~

Nama dicocokkan tanpa membedakan huruf besar-kecil, dan sebagai substring hanya
kalau Anda memintanya — \`{ name: "Save", exact: true }\` ketika "Save" dan "Save
and close" sama-sama ada di halaman itu.

## Test id: pintu darurat yang jujur

Sebagian hal tidak punya nama yang bisa diakses yang layak dipakai: sebuah baris
tabel, sebuah grafik, sebuah pil status, sebuah item daftar yang hanya
diidentifikasi oleh datanya. Menjangkau rantai CSS di situ adalah naluri yang
keliru; menambahkan kaitan yang eksplisit adalah yang benar.

~~~tsx
<tr data-testid="case-row" data-case-id="TC-12">
~~~

~~~ts
page.getByTestId("case-row").filter({ hasText: "TC-12" });
~~~

Test id adalah **kontrak yang disengaja dan terlihat**: ia ada semata-mata untuk
pengujian, ia berada di kode sumber tempat developer bisa melihatnya, dan
menghapusnya jelas-jelas perubahan yang merusak. Nama kelas tidak menjanjikan
apa pun dan developer yang mengganti namanya tidak punya cara tahu suite Anda
bergantung padanya.

Dua aturan yang mencegah ini merosot:

- **Mintalah, alih-alih mengakali ketiadaannya.** "Bisakah kita menambahkan
  \`data-testid\` ke komponen barisnya?" adalah pull request dua baris dan hal
  yang normal untuk dibuka seorang tester.
- **Jangan menaruh test id di segala hal.** Test id pada tombol yang sudah punya
  nama yang bisa diakses dengan sempurna tidak membeli apa pun dan justru
  menghilangkan pemeriksaan aksesibilitas yang tadinya Anda dapatkan cuma-cuma.

## Strictness itu fitur, bukan halangan

~~~
Error: strict mode violation: getByRole('button') resolved to 3 elements
~~~

Playwright menolak bertindak ketika sebuah locator ambigu. Nalurinya adalah
menambahkan \`.first()\` lalu lanjut. Tahanlah: error-nya sedang memberi tahu Anda
bahwa locator Anda tidak mengidentifikasi hal yang Anda maksud, dan \`.first()\`
membekukan urutan DOM hari ini ke dalam pengujiannya. Ketika tombol keempat
ditambahkan di atas, Anda kini mengeklik yang keliru dan pengujiannya tetap lulus
— dan itu lebih buruk daripada gagal.

Persempit dengan benar saja:

~~~ts
// batasi ke wilayahnya
page.getByRole("dialog", { name: "Delete suite" })
    .getByRole("button", { name: "Delete" });

// saring berdasarkan isinya
page.getByRole("row").filter({ hasText: "TC-12" })
    .getByRole("button", { name: "Run" });

// saring berdasarkan elemen anaknya
page.getByRole("listitem").filter({ has: page.getByRole("img") });
~~~

\`.nth(2)\` dan \`.first()\` sah ketika posisi **memang** hal yang sedang Anda uji —
"baris pertama adalah run terbaru" — dan berbau busuk di tempat lain mana pun.

## Locator itu malas, dan justru itu yang membuatnya bekerja

~~~ts
const runButton = page.getByRole("button", { name: "Run" });
await page.getByRole("button", { name: "Refresh" }).click();
await runButton.click();     // menemukan ulang elemennya, setelah refresh
~~~

Locator adalah **deskripsi tentang cara menemukan sesuatu, bukan referensi ke
sesuatu yang sudah ditemukan**. Tidak ada yang dicari sampai Anda bertindak atau
mengasersikan, dan ia dicari lagi di setiap percobaan ulang. Itulah sebabnya
pengujian Playwright selamat dari re-render React yang mengganti node DOM-nya,
sementara alat yang lebih tua yang memegang handle elemen akan melempar error
stale-element.

Dua konsekuensi yang layak dihayati: Anda bisa dengan aman mendefinisikan locator
di bagian atas sebuah pengujian bahkan sebelum halamannya ada, dan locator yang
disimpan di dalam sebuah page object tidak pernah basi.

## Tabel yang layak disimpan

| Alih-alih | Tulislah | Karena |
|---|---|---|
| \`.locator("div.sc-bdVaJa > button")\` | \`getByRole("button", { name: "Save" })\` | Kelas hasil pembangkitan berubah di setiap pembangunan ulang |
| \`.locator("#submit-btn-2")\` | \`getByRole("button", { name: "Submit" })\` | Id sering dibangkitkan, dan yang bernomor itu urutan yang menyamar |
| \`.locator("button").first()\` | \`getByRole("dialog").getByRole("button", { name: "Delete" })\` | \`.first()\` diam-diam mengikuti urutan DOM |
| \`.locator("//div[3]/span")\` | \`getByTestId("status-pill")\` | XPath berdasarkan posisi adalah bentuk paling rapuh yang ada |
| \`getByText("Welcome back, Ada")\` | \`getByText("Welcome back")\` atau sebuah test id | Locator yang memuat data uji rusak ketika datanya berubah |

Satu tambahan: **jangan taruh teks yang dimiliki pemasaran di dalam sebuah
locator** kecuali pengujiannya memang tentang teks itu. \`getByRole("button", {
name: "Sign in" })\` itu wajar dan bermakna; mencocokkan satu paragraf prosa
halaman depan adalah pengujian yang gagal karena penyesuaian redaksi lalu
menyebutnya regresi.

## Internasionalisasi, sekilas

Kalau aplikasinya dikirim dalam lebih dari satu bahasa, locator berbasis nama
yang bisa diakses akan terikat bahasa. Jawaban bakunya adalah memaku pelaksanaan
pengujiannya ke satu locale di config lalu menulis locator dalam bahasa itu, dan
menjangkau test id pada segelintir elemen yang teksnya memang berubah-ubah tiap
pelaksanaan. Mengasersikan teks *terjemahan* adalah pekerjaan lain — itu
pemeriksaan konten, dan tempatnya bersama berkas terjemahan alih-alih di suite
E2E.

## Di mana TestForge berperan

Ketika sebuah locator rusak, riwayat run memberi tahu Anda jenis kerusakannya.
Case yang sudah lulus 60 kali lalu gagal pada build yang mengganti nama sebuah
stylesheet adalah kegagalan locator; perbaikannya ada di locator-nya, dan case-nya
bukan sebuah cacat. Case yang berbolak-balik antara lulus dan gagal pada build
yang *sama* adalah hal lain, dan pelajaran tentang pengujian labil yang
menanganinya.

Mencatat perbedaan itu dengan jujur — perbaikan locator sebagai perawatan, bukan
sebagai bug yang ditemukan — adalah yang menjaga metrik cacat Anda tetap berarti
sebagaimana yang ia katakan. Pelajaran metrik di track manual membuat poin yang
sama dari sisi yang lain.

**Selanjutnya:** asersi dan menunggu — web-first assertion, auto-waiting, dan
kenapa \`sleep()\` adalah bug alih-alih jalan pintas.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Sebuah pengujian gagal dengan \"strict mode violation: resolved to 3 elements\". Seorang rekan membetulkannya dengan menambahkan .first(). Apa yang keliru dengan perbaikan itu?",
      choices: [
        {
          id: "a",
          text: "Ia lebih lambat, karena Playwright tetap harus menemukan ketiga elemennya",
        },
        {
          id: "b",
          text: "Ia membekukan urutan DOM hari ini ke dalam pengujiannya, sehingga elemen baru yang ditambahkan di atas membuatnya bertindak pada yang keliru — dan tetap lulus",
        },
        {
          id: "c",
          text: "Strict mode jadi nonaktif untuk sisa berkas itu begitu .first() dipakai",
        },
        {
          id: "d",
          text: "Tidak ada — .first() memang cara yang dimaksudkan untuk mengurai keambiguan",
        },
      ],
      explanation:
        "Pelanggaran itu adalah diagnosis, bukan halangan: locator-nya tidak mengidentifikasi elemen yang Anda maksud, dan .first() menjawabnya dengan mengikatkan diri pada urutan yang kebetulan dimiliki DOM hari ini. Bagian yang berbahaya adalah pengujian hasilnya tetap hijau sambil bertindak pada elemen yang keliru, dan itu lebih buruk daripada yang merah. Mempersempit lewat wilayah atau isi — membatasi ke dialognya, menyaring barisnya lewat teksnya — memperbaiki deskripsinya sendiri. Pemilihan berbasis posisi hanya sah ketika posisi adalah hal yang sedang diuji, misalnya mengasersikan baris pertama adalah run terbaru.",
    },
    {
      id: "q2",
      stem: "Kenapa getByRole(\"button\", { name: \"Sign in\" }) cenderung menangkap kelas bug yang tidak akan pernah ditangkap selektor CSS?",
      choices: [
        {
          id: "a",
          text: "Ia menunggu lebih lama sebelum gagal, jadi bug render yang lambat tersingkap",
        },
        {
          id: "b",
          text: "Ia menanyai pohon aksesibilitas, jadi elemen yang berhenti bisa dijangkau sebagai tombol berlabel akan menggagalkan pengujiannya",
        },
        {
          id: "c",
          text: "Ia menjalankan ulang seluruh pengujian ketika elemennya tidak ditemukan",
        },
        {
          id: "d",
          text: "Ia mencocokkan pada id elemennya, yang lebih jarang diubah developer",
        },
      ],
      explanation:
        "Locator berbasis role menelusuri pohon aksesibilitas, dan itu permukaan yang sama dengan yang dipakai pembaca layar — jadi sebuah div yang kehilangan role-nya, atau kontrol yang labelnya lenyap, merusak locator-nya dan melaporkan cacat aksesibilitas yang sungguhan alih-alih pekerjaan perawatan. Itulah kelas bug kedua gratis yang dibeli strategi ini. Timeout-nya sama untuk locator mana pun, tidak ada locator yang menjalankan ulang sebuah pengujian, dan locator role sama sekali tidak melihat id.",
    },
    {
      id: "q3",
      stem: "Locator mana di antara ini yang kemungkinan butuh perawatan karena alasan yang bukan cacat?",
      choices: [
        {
          id: "a",
          text: "page.locator(\"div.sc-bdVaJa > form > button\")",
        },
        {
          id: "b",
          text: "page.getByText(\"Welcome back, Ada Lovelace\")",
        },
        {
          id: "c",
          text: "page.getByTestId(\"case-row\").filter({ hasText: \"TC-12\" })",
        },
        {
          id: "d",
          text: "page.locator(\"//table/tr[3]/td[2]/span\")",
        },
      ],
      explanation:
        "Rantai CSS-nya bergantung pada kelas hasil pembangkitan dan penyarangan yang persis, dan keduanya berubah pada pembangunan ulang atau penyesuaian tata letak; XPath berbasis posisi adalah kerapuhan yang sama dalam bentuknya yang paling tajam; dan sapaan itu menanamkan data uji, jadi ia rusak pada hari akun yang ditanamkan berganti nama — tidak satu pun dari kegagalan itu adalah cacat. Test id dengan penyaring isi adalah yang tahan lama: kaitannya ada semata-mata untuk pengujian dan terlihat oleh siapa pun yang mungkin menghapusnya, dan penyaringnya mencocokkan pengenal yang memang menjadi inti baris itu alih-alih posisinya.",
    },
  ],
};
