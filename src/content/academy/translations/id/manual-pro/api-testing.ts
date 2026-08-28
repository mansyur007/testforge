import type { LessonTranslation } from "../../../types";

export const apiTestingId: LessonTranslation = {
  slug: "api-testing",
  title: "Pengujian API dengan Postman",
  summary:
    "Request, environment, perangkaian, asersi, dan menguji API yang disembunyikan sebuah UI.",
  body: `
## Kenapa menguji lapisan di bawah layar

UI hanyalah satu klien dari API. Biasanya ada klien lain — aplikasi mobile,
integrasi mitra, skrip CI — dan mereka tidak mendapat validasi milik UI. Jadi
pertanyaan yang menarik bukan "apakah form-nya jalan?" melainkan **"apa yang
terjadi ketika aturannya tidak ditegakkan oleh form?"**

Tiga hal yang hanya bisa Anda kerjakan dengan benar di lapisan ini:

- **Mengirim apa yang tidak bisa dikirim UI.** Kolom kuantitas berhenti di 99
  karena sebuah atribut di HTML-nya. Apa yang dilakukan server dengan 5000?
  Dengan \`-1\`? Dengan \`"abc"\`? Kalau jawabannya "diterima", Anda menemukan
  cacat sungguhan yang tidak akan pernah dihasilkan sebanyak apa pun klik.
- **Menguji otorisasi secara langsung.** Ambil request yang bekerja sebagai
  admin lalu putar ulang dengan token seorang viewer. UI menyembunyikan
  tombolnya; menyembunyikan tombol bukan pemeriksaan hak akses. Ini pengujian API
  bernilai tertinggi yang dijalankan seorang tester manual, dan ia menemukan bug
  sungguhan di sebagian besar produk.
- **Tiba lebih awal dan lebih cepat.** API biasanya sudah ada sebelum layarnya
  ada, jadi pengujian bisa dimulai seminggu lebih cepat — dan satu run berisi 200
  request memakan hitungan detik di tempat mengklik memakan satu pagi.

## Anatomi sebuah request, dalam empat bagian yang Anda isi

Apa pun alat yang Anda pakai, Anda mengisi empat hal yang sama:

| Bagian | Apa itu | Di mana bug-nya |
|---|---|---|
| **Metode + URL** | \`POST /api/v1/projects/demo/cases\` | Verb keliru pada resource keliru |
| **Header** | \`Authorization\`, \`Content-Type\` | Auth yang hilang atau cacat bentuk |
| **Body** | Payload JSON | Tipe, null, kolom wajib yang hilang |
| **Params** | \`?status=OPEN&limit=50\` | Filter yang diam-diam tidak melakukan apa pun |

Baris terakhir itu layak dijeda. **Parameter query yang tidak dikenali server
biasanya diabaikan tanpa suara.** \`?stattus=OPEN\` mengembalikan 200 dan seluruh
baris, dan tampilannya persis seperti filter yang bekerja. Selalu uji sebuah
filter dengan memeriksa bahwa ia *mengecualikan* sesuatu — filter yang
mengembalikan hasil tidak membuktikan apa pun.

## Postman dalam empat fitur yang penting

Semua ini bisa Anda kerjakan dengan \`curl\`, dan pada akhirnya memang akan
begitu. Postman layak tempatnya karena dua fitur di tengah berikut.

**1. Collection.** Sebuah folder berisi request tersimpan, terurut supaya bisa
dijalankan dari atas ke bawah. Inilah artefaknya — ia adalah suite pengujian Anda
untuk API-nya, ia hidup di version control sebagai berkas JSON hasil ekspor, dan
ia bisa dijalankan di CI.

**2. Environment.** Variabel seperti \`{{baseUrl}}\` dan \`{{token}}\`, ditukar
sekaligus sebagai satu set. Satu collection lalu bisa dijalankan terhadap local,
staging, dan production tanpa menyunting satu request pun.

> **Taruh token-nya di environment, jangan pernah di request.** Collection dengan
> kredensial tertanam hanya berjarak satu ekspor dari mendarat di sebuah repo.
> Ini cara paling umum tester membocorkan rahasia, dan itu sepenuhnya bisa
> dihindari — simpan rahasianya di environment, dan jangan commit berkas
> environment-nya.

**3. Perangkaian.** Pengujian yang berarti biasanya butuh lebih dari satu
request: buat sesuatu, lalu perlakukan sesuatu itu. Skrip Postman memungkinkan
satu request menyerahkan sebuah nilai ke request berikutnya.

~~~js
// Di "Create case" → Scripts → Post-response
const body = pm.response.json();
pm.collectionVariables.set("caseId", body.id);
~~~

Request berikutnya memakai \`{{caseId}}\` di URL-nya. Sekarang collection-nya jadi
sebuah *alur*, bukan tumpukan request — dan alurnya-lah yang menemukan bug
sungguhan, karena bug tinggal di state yang menumpuk di antara panggilan.

**4. Asersi.** Request yang hasilnya Anda pelototi adalah demo. Tambahkan
pemeriksaan dan ia menjadi pengujian:

~~~js
pm.test("201 Created", () => pm.response.to.have.status(201));

pm.test("returns the case it created", () => {
  const b = pm.response.json();
  pm.expect(b.title).to.eql("Cart — quantity 100 is rejected");
  pm.expect(b.id).to.be.a("string");
});

pm.test("responds within 1s", () => pm.expect(pm.response.responseTime).to.be.below(1000));
~~~

Beri asersi pada **apa yang dikatakan response**, bukan cuma statusnya. 200 yang
mengembalikan objek yang keliru adalah mode kegagalan yang tidak terlihat oleh
pemeriksaan status semata, dan itu lazim terjadi.

## Apa yang sebenarnya diuji, begitu Anda bisa mengirim apa saja

Kerjakan daftar ini terhadap endpoint mana pun dan cakupan Anda akan melampaui
kebanyakan suite pengujian API:

| Kategori | Request-nya |
|---|---|
| **Happy path** | Input valid; periksa status, bentuk body, dan nilai yang Anda kirim |
| **Validasi** | Kolom wajib hilang, tipe keliru (\`"5"\` vs \`5\`), null, string kosong, string kepanjangan |
| **Batas** | Nilai yang sama dengan yang diajarkan pelajaran BVA — 0, 1, 99, 100 |
| **Auth** | Tanpa token, token kedaluwarsa, token cacat bentuk, **token pengguna lain** |
| **Otorisasi** | Seorang viewer memanggil endpoint milik writer; pengguna A membaca resource pengguna B lewat id |
| **Not found** | Id berbentuk benar yang tidak ada; id sungguhan milik orang lain |
| **Idempotensi** | Kirim POST yang sama dua kali — dua pesanan, atau satu? |
| **Metode** | \`DELETE\` pada rute yang hanya-baca; harapkan 405, bukan 500 |

Dua di antaranya, dalam praktik, menemukan paling banyak.

**Pengguna A membaca resource pengguna B** — ambil request yang bekerja, ubah
id-nya menjadi milik akun lain, lalu kirim dengan token Anda sendiri. Kalau Anda
mendapat 200, itu cacat serius, dan ia punya nama: insecure direct object
reference. Mengujinya butuh lima belas detik dan produk terus-menerus dikirim
dengan cacat ini.

**Mengirim POST yang sama dua kali** — kirim ganda adalah perilaku pengguna yang
nyata (klik tak sabar, retry karena jaringan labil) dan pesanan ganda itu mahal.
API adalah tempat Anda bisa mengujinya secara deterministik alih-alih berusaha
mengklik cukup cepat.

## Jebakannya: menguji API hanya lewat apa yang dikirim UI

Cara paling nyaman membangun sebuah collection adalah membuka dev tools,
menyalin request yang dibuat aplikasinya, lalu menyimpannya. Itu awal yang baik
dan akhir yang buruk, karena request-request itu persis yang sudah dibatasi UI —
Anda baru membangun ulang happy path front end di dalam alat yang lebih lambat.

Nilainya ada pada request yang *tidak bisa* dibuat UI. Setelah Anda menyalin
sebuah request, tiga suntingan pertama Anda sebaiknya: **hapus satu kolom
wajib**, **ganti token-nya**, dan **isikan nilai di luar rentang pada kolom yang
dibatasi form.**

## Di mana TestForge berperan

TestForge punya REST API sungguhan, dan sandbox Anda adalah proyek sungguhan —
jadi Anda bisa berlatih di sistem hidup yang memang boleh Anda rusak. Buat API
key di **Settings → API Keys**, lalu:

~~~
GET  /api/v1/openapi                          skema lengkapnya, terbaca mesin
GET  /api/v1/projects/<slug>/cases            daftar case di sandbox Anda
POST /api/v1/projects/<slug>/cases            buat satu
Header: Authorization: Bearer <API_KEY>
~~~

Mulailah dari \`/api/v1/openapi\` alih-alih menebak-nebak endpoint: ia mendaftar
setiap rute, parameternya, dan bentuk response-nya, dan membaca spesifikasi
sebelum menulis request adalah kebiasaan yang memisahkan satu jam kerja dari satu
sore penuh 404.

Perhatikan kedua scope key-nya — key hanya-baca yang bisa POST adalah cacat, dan
mengujinya sendiri sudah latihan yang bagus.

**Selanjutnya:** paruh lain dari verifikasi — menembus ke belakang API sampai ke
basis data, supaya Anda bisa membuktikan apa yang benar-benar tersimpan alih-alih
apa yang diklaim response-nya.
`,
  selfCheck: [
    {
      id: "q1",
      stem: "Anda mengambil sebuah request API yang bekerja lalu mengirimnya ulang tanpa perubahan kecuali menukar id resource-nya menjadi milik akun pengguna lain, tetap memakai token valid Anda sendiri. Server mengembalikan 200 beserta data pengguna itu. Apa yang Anda temukan?",
      choices: [
        {
          id: "a",
          text: "Tidak ada — token Anda valid, jadi request-nya terautentikasi secara sah",
        },
        {
          id: "b",
          text: "Cacat otorisasi yang serius: endpoint-nya mengautentikasi tapi tidak pernah memeriksa kepemilikan",
        },
        {
          id: "c",
          text: "Cacat UI, karena antarmukanya tidak seharusnya menampakkan id pengguna lain",
        },
        {
          id: "d",
          text: "Masalah data uji — kedua akun itu tidak seharusnya berbagi environment",
        },
      ],
      explanation:
        "Autentikasi dan otorisasi adalah dua pemeriksaan yang terpisah, dan endpoint ini mengerjakan yang pertama lalu melewati yang kedua: ia memastikan Anda siapa lalu tidak pernah menanyakan apakah Anda berhak atas catatan tertentu ini. Id sering bisa ditebak atau terlihat di tempat lain, jadi \"UI-nya tidak menampilkannya\" tidak melindungi apa pun. Pengujian ini sengaja dijalankan dengan dua akun sungguhan — itu persiapannya bekerja, bukan masalah data.",
    },
    {
      id: "q2",
      stem: "Seorang rekan membangun collection API dengan menyalin setiap request yang dibuat aplikasi web dari tab network lalu menyimpannya. Kenapa itu suite pengujian API yang lemah?",
      choices: [
        {
          id: "a",
          text: "Request salinan memuat cookie sesi yang kedaluwarsa, jadi collection-nya rusak",
        },
        {
          id: "b",
          text: "Ia hanya memuat request yang sudah dibatasi UI — nilainya justru ada pada request yang tidak bisa dikirim UI",
        },
        {
          id: "c",
          text: "Request yang disalin dari browser tidak bisa diparameterkan dengan variabel environment",
        },
        {
          id: "d",
          text: "Ia menggandakan cakupan yang sudah diberikan pengujian UI, jadi tidak menambah asersi baru",
        },
      ],
      explanation:
        "Setiap request salinan sudah lolos validasi front end sendiri, jadi collection-nya mereproduksi happy path di dalam alat yang lebih lambat. Keunggulan khas lapisan API justru pada segala yang dicegah form: kolom wajib yang hilang, nilai di luar rentang input, token pengguna lain. Kredensial yang kedaluwarsa dan parameterisasi sama-sama bisa diselesaikan dan bukan masalahnya, dan suite-nya juga bukan sekadar mubazir — dihadapkan pada klien kedua seperti aplikasi mobile atau sebuah integrasi, endpoint yang sama menghadapi input yang tidak akan pernah dihasilkan UI web.",
    },
    {
      id: "q3",
      stem: "Mana di antara ini yang layak berada di environment sebuah collection alih-alih di dalam request-nya sendiri?",
      choices: [
        { id: "a", text: "API key atau bearer token" },
        {
          id: "b",
          text: "Base URL, supaya satu collection bisa dijalankan terhadap local, staging, dan production",
        },
        {
          id: "c",
          text: "Asersi bahwa panggilan create mengembalikan 201",
        },
        {
          id: "d",
          text: "Id akun yang ditanamkan, yang dipakai collection untuk masuk",
        },
      ],
      explanation:
        "Apa pun yang berubah antar-environment — host-nya, kredensialnya, data yang ditanamkan — layak berada di environment, dan itulah yang memungkinkan satu collection dijalankan di mana saja. Menyimpan token di sana khususnya adalah yang mencegah collection hasil ekspor membawa rahasia hidup ke dalam sebuah repositori. Asersi 201 berbeda jenisnya: ia adalah perilaku yang sedang diuji dan seharusnya berlaku di setiap environment, jadi ia milik request-nya.",
    },
  ],
};
