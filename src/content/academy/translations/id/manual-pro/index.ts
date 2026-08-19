import type { TrackTranslation } from "../../../types";
import { testPlanningId } from "./test-planning";
import { riskBasedTestingId } from "./risk-based-testing";
import { exploratoryTestingId } from "./exploratory-testing";
import { testOraclesId } from "./test-oracles";
import { httpAndDevtoolsId } from "./http-and-devtools";
import { apiTestingId } from "./api-testing";
import { sqlForQaId } from "./sql-for-qa";
import { crossBrowserMobileId } from "./cross-browser-mobile";
import { accessibilityBasicsId } from "./accessibility-basics";
import { nonFunctionalBasicsId } from "./non-functional-basics";
import { metricsThatMeanSomethingId } from "./metrics-that-mean-something";
import { reportingToStakeholdersId } from "./reporting-to-stakeholders";

// T2 in Indonesian. Same rule as T1's index: lesson order is not restated here,
// because `localiseTrack` walks the English track and matches by slug. This
// array is the *set* of what has been translated.
export const manualProId: TrackTranslation = {
  slug: "manual-pro",
  title: "QA Manual Profesional",
  tagline:
    "Bekerja di bawah kendala nyata: merencanakan, menjelajah, API, data, dan melapor kepada orang yang tidak membaca test case.",
  level: "Junior → menengah",
  outcomes: [
    "Menulis test plan yang muat di satu halaman dan selamat ketika bertemu tenggat",
    "Mengurutkan pekerjaan berdasarkan risiko dan menyatakan terbuka apa yang tidak Anda cakup",
    "Menjalankan sesi eksploratori bercharter dan menghasilkan bukti darinya",
    "Menguji sebuah API secara langsung, dan memverifikasi hasilnya di basis data",
    "Melaporkan status dalam bahasa yang bisa ditindaklanjuti seorang product owner",
  ],
  lessons: [
    testPlanningId,
    riskBasedTestingId,
    exploratoryTestingId,
    testOraclesId,
    httpAndDevtoolsId,
    apiTestingId,
    sqlForQaId,
    crossBrowserMobileId,
    accessibilityBasicsId,
    nonFunctionalBasicsId,
    metricsThatMeanSomethingId,
    reportingToStakeholdersId,
  ],
};
