import type { TrackTranslation } from "../../../types";
import { whatToAutomateId } from "./what-to-automate";
import { programmingFoundationsId } from "./programming-foundations";
import { firstPlaywrightTestId } from "./first-playwright-test";
import { locatorsId } from "./locators";
import { assertionsAndWaitingId } from "./assertions-and-waiting";
import { pageObjectsId } from "./page-objects";
import { testDataId } from "./test-data";
import { apiAutomationId } from "./api-automation";
import { ciGithubActionsId } from "./ci-github-actions";
import { junitToTestforgeId } from "./junit-to-testforge";
import { flakyTestsId } from "./flaky-tests";
import { frameworkDesignId } from "./framework-design";

// T3 in Indonesian. Same rule as the other indexes: lesson order is not restated
// here, because `localiseTrack` walks the English track and matches by slug.
// This array is the *set* of what has been translated.
export const automationId: TrackTranslation = {
  slug: "automation",
  title: "Otomasi QA",
  tagline:
    "Dari skrip pertama Anda sampai suite yang bisa dirawat sebuah tim — dan hasil yang mendarat kembali di TestForge.",
  level: "Menengah → automation engineer",
  outcomes: [
    "Memutuskan apa yang layak diotomasi, dan menyatakan kenapa sisanya tidak",
    "Menulis pengujian Playwright dengan locator yang selamat dari sebuah refactor",
    "Menyusun suite yang bisa diperluas orang lain tanpa bertanya kepada Anda",
    "Menjalankannya di GitHub Actions pada setiap pull request",
    "Menerbitkan hasil ke TestForge dan menindaklanjuti data kelabilan",
  ],
  lessons: [
    whatToAutomateId,
    programmingFoundationsId,
    firstPlaywrightTestId,
    locatorsId,
    assertionsAndWaitingId,
    pageObjectsId,
    testDataId,
    apiAutomationId,
    ciGithubActionsId,
    junitToTestforgeId,
    flakyTestsId,
    frameworkDesignId,
  ],
};
