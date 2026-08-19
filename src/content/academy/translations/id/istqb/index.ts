import type { TrackTranslation } from "../../../types";
import { ch1FundamentalsId } from "./ch1-fundamentals";
import { ch2SdlcId } from "./ch2-sdlc";
import { ch3StaticTestingId } from "./ch3-static-testing";
import { ch4TestAnalysisDesignId } from "./ch4-test-analysis-design";
import { ch5ManagingTestActivitiesId } from "./ch5-managing-test-activities";
import { ch6TestToolsId } from "./ch6-test-tools";
import { examStrategyId } from "./exam-strategy";

// T5 in Indonesian. Same rule as the other indexes: lesson order is not restated
// here, because `localiseTrack` walks the English track and matches by slug.
//
// `trademarkNotice` is not restated either — it is structure, not text, and it
// lives on the English track, so the Indonesian pages render the notice from
// the same flag. What they render is `ISTQB_DISCLAIMER_ID` (docs/QA-ACADEMY.md
// §7.1), which is why that constant exists and why `academy-i18n-check` asserts
// it differs from the English one.
export const istqbId: TrackTranslation = {
  slug: "istqb",
  title: "Persiapan Ujian Foundation Level",
  tagline:
    "Enam bab yang selaras dengan silabus CTFL v4.0, drill per bab, dan satu paket latihan ujian berbatas waktu lengkap dengan rincian nilai per bab.",
  level: "Persiapan sertifikasi",
  outcomes: [
    "Mencakup setiap bab silabus dengan bobot ujiannya dalam pertimbangan",
    "Melatih satu bab dalam satu waktu dengan jawaban yang dijelaskan",
    "Menjalani latihan ujian berbatas waktu berisi 40 pertanyaan dalam kondisi sungguhan",
    "Melihat bab mana yang menggerus nilai kelulusan Anda, lalu kembali ke sana",
  ],
  lessons: [
    ch1FundamentalsId,
    ch2SdlcId,
    ch3StaticTestingId,
    ch4TestAnalysisDesignId,
    ch5ManagingTestActivitiesId,
    ch6TestToolsId,
    examStrategyId,
  ],
};
