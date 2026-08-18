import type { TrackTranslation } from "../../../types";
import { whatQaDoesId } from "./what-qa-does";
import { sdlcAndStlcId } from "./sdlc-and-stlc";
import { testLevelsId } from "./test-levels";

// T1 in Indonesian. Lesson order is not restated — `localiseTrack` walks the
// English track and matches by slug, so this array is a *set* of what has been
// translated, and the reading order stays the one place it was decided.
export const fundamentalsId: TrackTranslation = {
  slug: "fundamentals",
  title: "Dasar-Dasar QA",
  tagline:
    "Semua yang Anda butuhkan untuk menguji fitur sungguhan dan dipercaya atas hasilnya.",
  level: "Nol → siap kerja",
  outcomes: [
    "Menjelaskan apa yang bisa dan tidak bisa dibuktikan pengujian — tanpa terdengar defensif",
    "Mengubah sebuah kebutuhan menjadi kumpulan pengujian yang bisa dipertanggungjawabkan dengan empat teknik perancangan",
    "Menulis test case yang bisa dijalankan orang lain dan menghasilkan kesimpulan yang sama",
    "Membuat laporan cacat yang berujung diperbaiki, bukan ditutup sebagai “tidak bisa direproduksi”",
    "Membedakan severity dari priority, dan tahu siapa yang memutuskan masing-masing",
  ],
  lessons: [whatQaDoesId, sdlcAndStlcId, testLevelsId],
};
