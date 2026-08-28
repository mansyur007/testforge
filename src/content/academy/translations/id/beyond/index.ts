import type { TrackTranslation } from "../../../types";
import { performanceTestingId } from "./performance-testing";
import { securityForTestersId } from "./security-for-testers";
import { contractTestingId } from "./contract-testing";
import { testingInProductionId } from "./testing-in-production";
import { aiInQaId } from "./ai-in-qa";
import { portfolioId } from "./portfolio";
import { interviewPrepId } from "./interview-prep";

// T4 in Indonesian. Same rule as the other indexes: lesson order is not restated
// here, because `localiseTrack` walks the English track and matches by slug.
// This array is the *set* of what has been translated.
export const beyondId: TrackTranslation = {
  slug: "beyond",
  title: "Melampaui Fungsional",
  tagline:
    "Performa, keamanan, produksi, dan percakapan karier yang tidak diajarkan siapa pun.",
  level: "Menengah → senior",
  outcomes: [
    "Menjalankan load test dan menafsirkan angkanya dengan jujur",
    "Menemukan masalah keamanan yang paling mungkin ditemukan seorang tester",
    "Memakai sinyal produksi sebagai input bagi pengujian",
    "Menilai di mana AI membantu di QA dan di mana ia diam-diam berbohong",
    "Membangun portofolio dan menjalani wawancara sebagai orang yang punya pertimbangan",
  ],
  lessons: [
    performanceTestingId,
    securityForTestersId,
    contractTestingId,
    testingInProductionId,
    aiInQaId,
    portfolioId,
    interviewPrepId,
  ],
};
