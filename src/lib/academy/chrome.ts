import type { Lang } from "@/lib/i18n";

// A-08: the Academy's own chrome, in both languages.
//
// Kept out of `src/lib/i18n.ts` deliberately. That module is the *public
// marketing* dictionary — landing, auth, docs — and it is imported by the
// landing page, so everything in it ships to every visitor. These strings are
// only ever needed on `/academy/**` and `/id/academy/**`, and there are enough
// of them to be worth not carrying elsewhere. It is also the boundary A-03
// drew: the landing's Academy *entry points* are translated in `i18n.ts`, and
// the Academy pages themselves are this module's problem.
//
// Kept out of `src/content/academy/**` for the opposite reason: that tree is
// `server-only` because it carries answer keys (§2.2), and these strings are
// needed by client components (`SelfCheck`, the progress toggle).
//
// **Register: `Anda`.** The rest of the product's Indonesian copy says `kamu`,
// and this subsystem deliberately does not. Academy lessons are long-form
// instructional prose read by working adults, many of them preparing for a
// certification exam or a job interview, and `Anda` is the register Indonesian
// technical and professional writing uses for exactly that. Owner's decision,
// 2026-08-18. It applies to the lesson bodies too — see the conventions note in
// `src/content/academy/translations/id/index.ts`.

/** Where a language's Academy lives. Every internal Academy link is built from
 *  this rather than hard-coding `/academy`, which is what keeps a reader inside
 *  their language once they are in it. */
export function academyBase(lang: Lang): string {
  return lang === "id" ? "/id/academy" : "/academy";
}

/** The `/academy/**` path for `path` in `lang`. `path` is the part after
 *  `/academy`, e.g. `/fundamentals/bug-reports` or `""`. */
export function academyPath(lang: Lang, path = ""): string {
  return `${academyBase(lang)}${path}`;
}

const en = {
  brand: "QA Academy",
  allTracks: "All tracks",
  logIn: "Log in",
  signUp: "Sign up",
  handsOn: "Hands-on",
  handsOnTitle: "Includes a hands-on exercise in a real TestForge project",
  lessons: "lessons",
  lessonsNav: "Lessons",
  minutesShort: (n: number) => `${n} min`,
  roadmap: {
    metaTitle: "QA Academy — learn software testing from scratch | TestForge",
    metaDescription:
      "A free roadmap from zero to professional QA: testing fundamentals, manual QA at work, automation, and Foundation Level exam prep — practised in a real test management tool.",
    intro:
      "A roadmap from zero to professional QA — and then to automation. Free, open source, and practised where the work actually happens: in a real test management tool, on a real project.",
    // A-08 published the fifth and last track on 2026-08-15, so "more tracks in
    // progress" and "one track is finished" both went false and stayed false.
    // Neither clause is replaced with a new count: copy that asserts how many
    // tracks exist goes stale the next time one is added, and the per-track
    // status badges already say it from `status`, where it cannot drift. The
    // beta framing is deliberately kept — that is a product claim, not a fact
    // about the track list.
    availableNow: (n: number) => `${n} lessons available now`,
    betaTitle: "QA Academy is in beta.",
    betaBody:
      "Published lessons may still change. Nothing here needs an account — if something is wrong or missing,",
    betaLink: "tell us on GitHub",
    inProgress: "In progress",
    planned: " planned",
    whatsComing: "What’s coming",
    notTranslated: "Not translated yet",
    readInEnglish: "Read it in English",
    howToTitle: "How to use this",
    howTo1: "Work through a track in order — each lesson assumes the one before it.",
    howTo2Pre: "Lessons marked",
    howTo2Post:
      "come with an exercise you do in a real TestForge project, not a quiz.",
    howTo3Pre:
      "You don’t need an account to read anything. Create one when you want your work and your progress saved —",
    howTo3Link: "it’s free",
  },
  track: {
    outcomesTitle: "By the end you’ll be able to",
    startFirst: "Start the first lesson",
    contents: "Contents",
    position: (a: number, b: number) => `Track ${a} of ${b}`,
    factLessons: "Lessons",
    factTime: "Time",
    factHandsOn: "Exercises",
    factYou: "Your place",
  },
  selfCheck: {
    title: "Check your understanding",
    intro: (n: number) =>
      `${n} questions. No account needed, nothing is sent anywhere but the grader.`,
    chooseAll: "(choose all that apply)",
    correct: "Correct.",
    notQuite: "Not quite.",
    check: "Check answers",
    checking: "Checking…",
    retry: "Try again",
    answerAll: "Answer every question first.",
    unreachable: "Couldn’t reach the server. Try again.",
    score: (a: number, b: number) => `${a} / ${b} correct`,
    allCorrect: " — lesson marked done",
  },
  progress: {
    label: "Track progress",
    doneOf: (a: number, b: number) => `${a} of ${b} lessons done`,
    savedAccount: "Saved to your account.",
    savedLocal: "Saved in this browser only — sign in to keep it.",
    done: "Done",
    markDone: "Mark as done",
    // Written, not drawn: the lesson rail states a lesson's state in words so
    // it survives a screen reader and a colour-blind reader alike.
    reading: "Reading now",
    upNext: "Up next",
    notStarted: "Not started",
  },
  lesson: {
    exerciseTitle: "This lesson has an exercise.",
    exerciseBody:
      "It runs in your Academy sandbox — a real TestForge project seeded with ShopMini, kept out of your dashboard and projects list.",
    startExercise: "Start this exercise",
    openSandbox: "Open your sandbox",
    orSignUp: "or create a free account first",
    prev: "← Previous",
    next: "Next →",
    nav: "Lesson navigation",
    position: (a: number, b: number) => `Lesson ${a} of ${b}`,
    nextUp: "Next lesson",
    prevUp: "Previous lesson",
  },
};

/** Same keys, Indonesian. Typed against `en` so a missing key is a build
 *  error rather than an English string leaking onto an Indonesian page. */
const id: typeof en = {
  brand: "QA Academy",
  allTracks: "Semua track",
  logIn: "Masuk",
  signUp: "Daftar",
  handsOn: "Praktik",
  handsOnTitle: "Termasuk latihan praktik di proyek TestForge sungguhan",
  lessons: "pelajaran",
  lessonsNav: "Pelajaran",
  minutesShort: (n: number) => `${n} mnt`,
  roadmap: {
    metaTitle: "QA Academy — belajar software testing dari nol | TestForge",
    metaDescription:
      "Peta belajar gratis dari nol sampai QA profesional: dasar-dasar pengujian, QA manual di dunia kerja, otomasi, dan persiapan ujian Foundation Level — dipraktikkan di tool test management sungguhan.",
    intro:
      "Peta belajar dari nol sampai QA profesional — lalu berlanjut ke otomasi. Gratis, open source, dan dipraktikkan di tempat pekerjaannya benar-benar terjadi: di tool test management sungguhan, pada proyek sungguhan.",
    availableNow: (n: number) => `${n} pelajaran tersedia sekarang`,
    betaTitle: "QA Academy masih dalam tahap beta.",
    betaBody:
      "Pelajaran yang sudah terbit masih mungkin berubah. Tidak ada yang memerlukan akun di sini — kalau ada yang keliru atau kurang,",
    betaLink: "beri tahu kami di GitHub",
    inProgress: "Sedang ditulis",
    planned: " direncanakan",
    whatsComing: "Apa yang akan datang",
    notTranslated: "Belum diterjemahkan",
    readInEnglish: "Baca versi bahasa Inggrisnya",
    howToTitle: "Cara memakainya",
    howTo1:
      "Kerjakan satu track secara berurutan — tiap pelajaran mengandaikan pelajaran sebelumnya.",
    howTo2Pre: "Pelajaran bertanda",
    howTo2Post:
      "disertai latihan yang Anda kerjakan di proyek TestForge sungguhan, bukan kuis.",
    howTo3Pre:
      "Anda tidak perlu akun untuk membaca apa pun. Buat akun kalau Anda ingin hasil kerja dan progres Anda tersimpan —",
    howTo3Link: "gratis",
  },
  track: {
    outcomesTitle: "Di akhir track ini Anda akan bisa",
    startFirst: "Mulai pelajaran pertama",
    contents: "Daftar isi",
    position: (a: number, b: number) => `Track ke-${a} dari ${b}`,
    factLessons: "Pelajaran",
    factTime: "Waktu",
    factHandsOn: "Latihan",
    factYou: "Posisi Anda",
  },
  selfCheck: {
    title: "Uji pemahaman Anda",
    intro: (n: number) =>
      `${n} pertanyaan. Tidak perlu akun, dan tidak ada yang dikirim ke mana pun selain ke pemeriksa jawaban.`,
    chooseAll: "(pilih semua yang sesuai)",
    correct: "Benar.",
    notQuite: "Belum tepat.",
    check: "Periksa jawaban",
    checking: "Memeriksa…",
    retry: "Coba lagi",
    answerAll: "Jawab semua pertanyaan dulu.",
    unreachable: "Tidak bisa menghubungi server. Coba lagi.",
    score: (a: number, b: number) => `${a} / ${b} benar`,
    allCorrect: " — pelajaran ditandai selesai",
  },
  progress: {
    label: "Progres track",
    doneOf: (a: number, b: number) => `${a} dari ${b} pelajaran selesai`,
    savedAccount: "Tersimpan di akun Anda.",
    savedLocal: "Tersimpan hanya di browser ini — masuk agar tetap tersimpan.",
    done: "Selesai",
    markDone: "Tandai selesai",
    reading: "Sedang dibaca",
    upNext: "Berikutnya",
    notStarted: "Belum dibaca",
  },
  lesson: {
    exerciseTitle: "Pelajaran ini punya latihan.",
    exerciseBody:
      "Latihannya berjalan di sandbox Academy Anda — proyek TestForge sungguhan berisi ShopMini, yang disimpan terpisah dari dasbor dan daftar proyek Anda.",
    startExercise: "Mulai latihan ini",
    openSandbox: "Buka sandbox Anda",
    orSignUp: "atau buat akun gratis dulu",
    prev: "← Sebelumnya",
    next: "Berikutnya →",
    nav: "Navigasi pelajaran",
    position: (a: number, b: number) => `Pelajaran ${a} dari ${b}`,
    nextUp: "Pelajaran berikutnya",
    prevUp: "Pelajaran sebelumnya",
  },
};

export const academyChrome: Record<Lang, typeof en> = { en, id };

/** "45 min" / "1h 20m", in `lang`. Tracks run to several hours, so bare
 *  minutes stop reading as a commitment somewhere around 90. */
export function formatMinutesIn(lang: Lang, total: number): string {
  if (total < 60) return academyChrome[lang].minutesShort(total);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (lang === "id") return m === 0 ? `${h} jam` : `${h} jam ${m} mnt`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
