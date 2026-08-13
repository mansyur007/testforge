import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { test, expect, type Browser, type Page } from "@playwright/test";
import { E2E } from "./global-setup";
// A-07 (TC-*-117): the answer key, imported from the same files the server
// grades against. The chapter modules carry a *type-only* import of
// `ExamQuestion` and nothing else, so unlike `src/content/academy/questions`
// (which is `server-only` for the answer key's sake) they are importable here.
// The alternative was hard-coding 40 answers that go stale the next time A-10d
// touches the bank.
import { CH1_FUNDAMENTALS } from "../src/content/academy/questions/ch1-fundamentals";
import { CH2_SDLC } from "../src/content/academy/questions/ch2-sdlc";
import { CH3_STATIC_TESTING } from "../src/content/academy/questions/ch3-static-testing";
import { CH4_TEST_DESIGN } from "../src/content/academy/questions/ch4-test-design";
import { CH5_MANAGING_TESTING } from "../src/content/academy/questions/ch5-managing-testing";
import { CH6_TOOLS } from "../src/content/academy/questions/ch6-tools";
import { fundamentals } from "../src/content/academy/tracks/fundamentals";

// A-01: TestForge QA Academy shell. A-03: its entry points and sitemap.
// Every Academy route is public, so all of this runs unauthenticated except
// TC-E2E-93. That is itself part of what's under test: the point of the hybrid
// placement (docs/QA-ACADEMY.md §1) is that a stranger from a search result can
// read an entire track without an account.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();
const db = new PrismaClient();

// Only TC-E2E-93 needs a session — it checks the in-app entry point.
async function login(page: Page, email = E2E.email, password = E2E.password) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-88 Academy roadmap lists published tracks and marks the rest in progress`, async ({
  page,
}) => {
  await page.goto("/academy");
  await expect(page.getByRole("heading", { name: "QA Academy", level: 1 })).toBeVisible();

  // The published track is a link; a track still being written is not — a card
  // people can click into an empty shell is worse than one that says so.
  const live = page.getByTestId("academy-track-fundamentals");
  await expect(live).toHaveAttribute("href", "/academy/fundamentals");

  const draft = page.getByTestId("academy-track-istqb");
  await expect(draft).toBeVisible();
  await expect(draft).not.toHaveAttribute("href", /./);
  await expect(draft).toContainText("In progress");

  // §7: the disclaimer travels with any surface that names the scheme.
  await expect(page.getByText(/registered trademark of the International/)).toBeVisible();
});

test(`TC-${TC}-89 A track page opens its first lesson and prev/next walk the track`, async ({
  page,
}) => {
  await page.goto("/academy/fundamentals");
  await expect(
    page.getByRole("heading", { name: "QA Fundamentals", level: 1 }),
  ).toBeVisible();

  await page.click('[data-testid="academy-track-start"]');
  await page.waitForURL("**/academy/fundamentals/what-qa-does");
  await expect(
    page.getByRole("heading", { name: "What a tester actually does", level: 1 }),
  ).toBeVisible();
  // Markdown really rendered, rather than the body leaking as raw text.
  await expect(
    page.getByRole("heading", { name: "The job in one sentence" }),
  ).toBeVisible();

  // Forward, then straight back: the first lesson must have no "Previous".
  await page.click('[data-testid="academy-next"]');
  await page.waitForURL("**/academy/fundamentals/sdlc-and-stlc");
  await page.click('[data-testid="academy-prev"]');
  await page.waitForURL("**/academy/fundamentals/what-qa-does");
  await expect(page.getByTestId("academy-prev")).toHaveCount(0);
});

test(`TC-${TC}-90 Hands-on lessons carry the exercise callout; unwritten routes 404`, async ({
  page,
}) => {
  await page.goto("/academy/fundamentals/boundary-value-analysis");
  await expect(page.getByTestId("academy-sandbox-callout")).toBeVisible();

  // A lesson without an exercise must not show it — the badge is a promise.
  await page.goto("/academy/fundamentals/seven-principles");
  await expect(page.getByTestId("academy-sandbox-callout")).toHaveCount(0);

  // `dynamicParams = false` is what keeps drafts out of production: a track
  // that exists in the content module but isn't published has no route at all.
  const draftTrack = await page.goto("/academy/istqb");
  expect(draftTrack?.status()).toBe(404);
  const draftLesson = await page.goto("/academy/fundamentals/not-a-lesson");
  expect(draftLesson?.status()).toBe(404);
});

test(`TC-${TC}-91 Academy routes don't overflow a 375px phone`, async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  // Lesson bodies are author-written markdown, and the widest thing in T1 is the
  // decision table's nine columns — the one place a lesson can push the page
  // sideways. F-43's rule applies to public routes too: wide content scrolls
  // inside its own box, the document never does.
  for (const path of [
    "/academy",
    "/academy/fundamentals",
    "/academy/fundamentals/decision-tables",
  ]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
  }
});

test(`TC-${TC}-92 Academy is reachable from the landing page and listed in the sitemap`, async ({
  page,
}) => {
  // A-01 shipped the routes with no inbound link anywhere; A-03 is what makes
  // them discoverable, so "the link exists and goes somewhere" is the feature.
  await page.goto("/");
  await page.locator("header").getByRole("link", { name: "Academy" }).click();
  await page.waitForURL("**/academy");
  await expect(page.getByRole("heading", { name: "QA Academy", level: 1 })).toBeVisible();

  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/academy");
  expect(sitemap).toContain("/academy/fundamentals");
  expect(sitemap).toContain("/academy/fundamentals/boundary-value-analysis");
  // Drafts have no route, so they must not be advertised to crawlers.
  expect(sitemap).not.toContain("/academy/istqb");

  // The track page carries Course markup with the real lesson workload.
  await page.goto("/academy/fundamentals");
  const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
  const graph = JSON.parse(ld ?? "{}")["@graph"] as Array<Record<string, unknown>>;
  const course = graph.find((n) => n["@type"] === "Course");
  expect(course).toBeTruthy();
  expect(course?.isAccessibleForFree).toBe(true);
  expect(
    (course?.hasCourseInstance as Record<string, string> | undefined)?.courseWorkload,
  ).toMatch(/^PT\d+H(\d+M)?$/);
});

test(`TC-${TC}-93 Academy is reachable from the app sidebar`, async ({ page }) => {
  await login(page);
  await page.click('[data-testid="nav-academy"]');
  await page.waitForURL("**/academy");
  await expect(page.getByRole("heading", { name: "QA Academy", level: 1 })).toBeVisible();
});

test(`TC-${TC}-94 On a phone Academy is reachable without the desktop nav`, async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  // The landing header nav is `hidden md:flex` and the landing has no
  // hamburger, so on a phone it carries nothing. That is exactly why the hero
  // link and the Academy section exist — this test is the guard that removing
  // either one would leave mobile visitors with only the footer.
  await expect(page.locator("header nav")).toBeHidden();

  const section = page.locator("#academy");
  await expect(section).toBeVisible();
  // Five tracks, read from the content module rather than retyped here.
  await expect(section.getByRole("heading", { level: 3 })).toHaveCount(5);
  await expect(section.getByTestId("landing-academy-cta")).toBeVisible();

  await page.click('[data-testid="hero-academy-link"]');
  await page.waitForURL("**/academy");
  await expect(page.getByRole("heading", { name: "QA Academy", level: 1 })).toBeVisible();
});

test(`TC-${TC}-95 Every Academy entry point is labelled beta`, async ({ page }) => {
  await page.goto("/");
  // Hero link, header nav, footer and the section CTA all carry the chip; the
  // count is the assertion because a missing one is the failure mode.
  await expect(page.getByTestId("beta-chip")).toHaveCount(4);

  await page.goto("/academy");
  await expect(page.getByTestId("academy-beta-banner")).toBeVisible();
  await expect(page.getByTestId("academy-beta-banner")).toContainText("in beta");

  await login(page);
  await expect(
    page.locator('[data-testid="nav-academy"] [data-testid="beta-chip"]'),
  ).toBeVisible();
});

const LESSON = "/academy/fundamentals/what-qa-does";

test(`TC-${TC}-96 Self-check grades, explains, retries, and records progress`, async ({
  page,
}) => {
  await page.goto(LESSON);
  await expect(page.getByTestId("self-check")).toBeVisible();

  // Nothing is revealed before submitting — the explanation only exists in the
  // grading response.
  await expect(page.getByTestId("self-check-explanation-q1")).toHaveCount(0);
  await expect(page.getByTestId("self-check-submit")).toBeDisabled();

  // Answer everything wrong first: a quiz that only works when you're right is
  // not a quiz, and the explanation has to show up either way.
  await page.click('[data-testid="self-check-choice-q1-a"]');
  await page.click('[data-testid="self-check-choice-q2-a"]');
  await page.click('[data-testid="self-check-choice-q3-c"]');
  await page.click('[data-testid="self-check-submit"]');

  await expect(page.getByTestId("self-check-score")).toContainText("0 / 3");
  await expect(page.getByTestId("self-check-explanation-q1")).toBeVisible();
  await expect(page.getByTestId("lesson-done-toggle")).toHaveAttribute(
    "aria-pressed",
    "false",
  );

  await page.click('[data-testid="self-check-retry"]');
  await expect(page.getByTestId("self-check-explanation-q1")).toHaveCount(0);

  await page.click('[data-testid="self-check-choice-q1-b"]');
  await page.click('[data-testid="self-check-choice-q2-b"]');
  // q3 is multi-select: all three of a, b, d, and set equality is the rule.
  await page.click('[data-testid="self-check-choice-q3-a"]');
  await page.click('[data-testid="self-check-choice-q3-b"]');
  await page.click('[data-testid="self-check-choice-q3-d"]');
  await page.click('[data-testid="self-check-submit"]');

  await expect(page.getByTestId("self-check-score")).toContainText("3 / 3");
  await expect(page.getByTestId("lesson-done-toggle")).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  // Progress is localStorage, so it has to survive a reload and be visible on
  // the track page — that is the whole user-facing point of storing it.
  await page.reload();
  await expect(page.getByTestId("lesson-done-toggle")).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.goto("/academy/fundamentals");
  await expect(page.getByTestId("track-progress")).toContainText(
    "1 of 13 lessons done",
  );
});

test(`TC-${TC}-97 The answer key never reaches the browser`, async ({ page }) => {
  // The served document carries the RSC payload inline, so this covers both the
  // HTML and the flight data the client hydrates from. `scripts/academy-bundle-
  // check.mjs` covers the JS chunks at build time; between them there is nowhere
  // for an answer to hide.
  const html = await (await page.request.get(LESSON)).text();

  // A sentence that exists only in an explanation.
  expect(html).not.toContain("No amount of testing proves the absence of defects");
  expect(html).not.toContain("correctChoiceIds");
  expect(html).not.toContain('"correct":true');

  // The questions themselves are of course present — this is a check on what
  // was stripped, not a check that the quiz failed to render.
  expect(html).toContain("What is the honest answer?");
});

test(`TC-${TC}-98 The sandbox is created on demand, seeded, and kept out of the user's work`, async ({
  page,
}) => {
  await login(page);

  // Baseline: how many projects the dashboard counts before a sandbox exists.
  await page.goto("/dashboard");
  const projectsBefore = await page
    .getByTestId("stat-active-projects")
    .textContent()
    .catch(() => null);

  await page.goto("/academy/sandbox");
  const existing = await page.getByTestId("sandbox-open").count();
  if (existing === 0) {
    await page.click('[data-testid="sandbox-create"]');
    // Creation redirects into the project itself.
    await page.waitForURL(/\/projects\/academy-/);
  }

  // Seeded with the ShopMini fixture: four suites and three reference cases.
  await page.goto("/academy/sandbox");
  await expect(page.getByTestId("sandbox-open")).toBeVisible();
  const slug = (await page.getByTestId("sandbox-open").getAttribute("href"))!
    .split("/")
    .pop()!;
  expect(slug).toMatch(/^academy-/);

  await page.goto(`/projects/${slug}`);
  await expect(page.getByText("Cart", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText("Cart — quantity above maximum (100) is rejected"),
  ).toBeVisible();

  // The point of Project.kind: a real project that stays out of the surfaces
  // listing the user's actual work.
  await page.goto("/projects");
  await expect(page.getByRole("link", { name: /academy-/ })).toHaveCount(0);

  await page.goto("/dashboard");
  const projectsAfter = await page
    .getByTestId("stat-active-projects")
    .textContent()
    .catch(() => null);
  expect(projectsAfter).toBe(projectsBefore);
});

test(`TC-${TC}-99 Reset wipes the sandbox back to the fixture without duplicating it`, async ({
  page,
}) => {
  await login(page);
  await page.goto("/academy/sandbox");
  if ((await page.getByTestId("sandbox-open").count()) === 0) {
    await page.click('[data-testid="sandbox-create"]');
    await page.waitForURL(/\/projects\/academy-/);
    await page.goto("/academy/sandbox");
  }
  const slug = (await page.getByTestId("sandbox-open").getAttribute("href"))!
    .split("/")
    .pop()!;

  // Two-step: the first click only arms it, so a stray click cannot wipe work.
  await page.click('[data-testid="sandbox-reset"]');
  await expect(page.getByTestId("sandbox-reset-confirm")).toBeVisible();
  await page.click('[data-testid="sandbox-reset-confirm"]');
  await expect(page.getByTestId("sandbox-reset-done")).toBeVisible();

  // The failure mode worth guarding: re-seeding on top of the old rows instead
  // of replacing them. The fixture case must appear exactly once.
  await page.goto(`/projects/${slug}`);
  await expect(
    page.getByText("Cart — quantity above maximum (100) is rejected"),
  ).toHaveCount(1);
});

test(`TC-${TC}-100 The coach checks sandbox work, gives specific feedback, and survives the save redirect`, async ({
  page,
}) => {
  await login(page);

  await page.goto("/academy/fundamentals/boundary-value-analysis");
  await page.click('[data-testid="lesson-start-exercise"]');
  await page.waitForURL(/\/projects\/academy-[^/]+\/cases\/new\?.*academy=boundary-value-analysis/);
  await expect(page.getByTestId("academy-coach")).toBeVisible();
  await expect(page.getByTestId("academy-coach")).toContainText("Boundary value analysis");

  // A thin case: one step, no boundary values named — should not pass.
  await page.fill('[data-testid="case-title-input"]', "Cart quantity smoke check");
  await page
    .locator('textarea[placeholder^="Action step"]')
    .first()
    .fill("Open the cart and change the quantity");
  await page.click('[data-testid="case-form-submit"]');

  // `createCase` redirects to the case detail page — `?academy=` is gone from
  // the URL, but the coach must still be docked (sessionStorage, not the URL,
  // is what's keeping it up — see AcademyCoach.tsx). Wait for the heading
  // rather than trusting page.url() immediately: "**/cases/**" would also
  // match /cases/new mid-redirect (the same trap e2e/shared-steps.spec.ts
  // documents).
  await expect(page.getByRole("heading", { name: "Cart quantity smoke check" })).toBeVisible();
  await expect(page.url()).not.toContain("academy=");
  await expect(page.getByTestId("academy-coach")).toBeVisible();

  await page.click('[data-testid="academy-coach-check"]');
  await expect(page.getByTestId("academy-coach-result")).toContainText("Not yet");
  await expect(page.getByTestId("academy-coach-result")).toContainText("99");

  // Add a second, real boundary case in the same suite — the checker reads
  // every case created since the exercise was opened, not just the newest.
  await page.goto("/academy/fundamentals/boundary-value-analysis");
  await page.click('[data-testid="lesson-start-exercise"]');
  await page.waitForURL(/\/projects\/academy-[^/]+\/cases\/new\?.*academy=boundary-value-analysis/);

  await page.fill(
    '[data-testid="case-title-input"]',
    "Cart quantity boundaries — 0, 1, 99, 100",
  );
  const actions = page.locator('textarea[placeholder^="Action step"]');
  const expecteds = page.locator('textarea[placeholder^="Expected result"]');
  await actions.nth(0).fill("Set quantity to 0");
  await expecteds.nth(0).fill("Rejected");
  await page.locator("button", { hasText: "+ Add Step" }).click();
  await actions.nth(1).fill("Set quantity to 1");
  await expecteds.nth(1).fill("Accepted");
  await page.locator("button", { hasText: "+ Add Step" }).click();
  await actions.nth(2).fill("Set quantity to 99");
  await expecteds.nth(2).fill("Accepted");
  await page.locator("button", { hasText: "+ Add Step" }).click();
  await actions.nth(3).fill("Set quantity to 100");
  await expecteds.nth(3).fill("Rejected");
  await page.fill('textarea[name="expectedResult"]', "Only 1 to 99 is accepted.");
  await page.click('[data-testid="case-form-submit"]');

  await expect(
    page.getByRole("heading", { name: "Cart quantity boundaries — 0, 1, 99, 100" }),
  ).toBeVisible();
  await expect(page.getByTestId("academy-coach")).toBeVisible();
  await page.click('[data-testid="academy-coach-check"]');
  await expect(page.getByTestId("academy-coach-result")).toContainText("Nice");

  // A pass marks the lesson done — localStorage (A-02), so it shows on the
  // lesson page without needing a session round-trip.
  await page.goto("/academy/fundamentals/boundary-value-analysis");
  await expect(page.getByTestId("lesson-done-toggle")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test(`TC-${TC}-101 The bug-report checker grades a Defect, and "Mark done anyway" always works`, async ({
  page,
}) => {
  await login(page);

  await page.goto("/academy/fundamentals/bug-reports");
  await page.click('[data-testid="lesson-start-exercise"]');
  await page.waitForURL(/\/projects\/academy-[^/]+\/defects\?academy=bug-reports/);
  await expect(page.getByTestId("academy-coach")).toBeVisible();

  // Defect creation doesn't redirect (unlike a case), so `?academy=` survives
  // in the URL on its own — this is the other half of the "stays docked"
  // design (AcademyCoach.tsx), the branch that doesn't need sessionStorage.
  await page.fill(
    '[data-testid="defect-title-input"]',
    "Shipping shows Rp 0 at exactly Rp 500,000 (staging)",
  );
  await page.fill(
    'textarea[name="bodyMd"]',
    `Environment: staging, Chrome 126.

Steps to reproduce:
1. Add items until the subtotal is exactly Rp 500,000.
2. Open checkout.

Actual: Shipping line reads Rp 0.

Expected: "Over Rp 500,000" ships free; exactly 500,000 should be charged Rp 20,000 per the requirement (AC-2 of the shipping rule).`,
  );
  await page.click('[data-testid="defect-create-button"]');
  await expect(page.url()).toContain("academy=bug-reports");

  await page.click('[data-testid="academy-coach-check"]');
  await expect(page.getByTestId("academy-coach-result")).toContainText("Nice");

  // A fresh, unrelated lesson exercise: don't submit anything, use the escape
  // hatch instead. It must always be available — the lesson is the point, not
  // the grader (docs/QA-ACADEMY.md §9).
  await page.goto("/academy/fundamentals/equivalence-partitioning");
  await page.click('[data-testid="lesson-start-exercise"]');
  await page.waitForURL(/\/projects\/academy-[^/]+\/cases\/new\?.*academy=equivalence-partitioning/);
  await page.click('[data-testid="academy-coach-mark-done"]');
  await expect(page.getByTestId("academy-coach-result")).toContainText("Marked done");

  await page.goto("/academy/fundamentals/equivalence-partitioning");
  await expect(page.getByTestId("lesson-done-toggle")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test(`TC-${TC}-102 Progress finished anonymously is claimed on first sign-in, and claiming twice changes nothing`, async ({
  page,
}) => {
  // A dedicated, disposable account — the claim is about "first authenticated
  // load", and signing in triggers exactly the same AcademySync mount signup
  // would (src/components/AcademySync.tsx), without coupling this test to the
  // signup form / email-verification flow, which nothing else in this suite
  // drives either.
  const email = `academy-claim-${Date.now()}@testforge.local`;
  const passwordHash = await bcrypt.hash("AcademyClaim123", 10);
  await db.user.create({
    data: {
      name: "Academy Claim Test",
      email,
      passwordHash,
      emailVerifiedAt: new Date(),
      onboardedAt: new Date(),
    },
  });

  // Finish two lessons signed out — the toggle, not the quiz, so this test
  // doesn't depend on knowing any lesson's correct answers.
  await page.goto("/academy/fundamentals/what-qa-does");
  await page.click('[data-testid="lesson-done-toggle"]');
  await expect(page.getByTestId("lesson-done-toggle")).toHaveAttribute("aria-pressed", "true");

  await page.goto("/academy/fundamentals/sdlc-and-stlc");
  await page.click('[data-testid="lesson-done-toggle"]');
  await expect(page.getByTestId("lesson-done-toggle")).toHaveAttribute("aria-pressed", "true");

  await login(page, email, "AcademyClaim123");

  // login() lands on /dashboard, which also tries to claim (AcademySync in
  // src/app/(app)/layout.tsx) — but signing in redirects via Next's router
  // rather than a hard navigation, so a `goto` straight to /academy/me can
  // outrun that attempt before it even starts. /academy/me doesn't depend on
  // it: AcademyMeSync (src/components/AcademyMeSync.tsx) runs its own
  // ensureSynced() and calls router.refresh() once it resolves, updating this
  // same page in place — so a plain auto-retrying assertion on the live DOM
  // (no further navigation) is enough, and isn't racing anything.
  await page.goto("/academy/me");
  await expect(page.getByTestId("me-total-progress")).toContainText("2 of", {
    timeout: 10_000,
  });

  // Both lessons individually show done, not just the aggregate count.
  await page.goto("/academy/fundamentals/what-qa-does");
  await expect(page.getByTestId("lesson-done-toggle")).toHaveAttribute("aria-pressed", "true");
  await page.goto("/academy/fundamentals/sdlc-and-stlc");
  await expect(page.getByTestId("lesson-done-toggle")).toHaveAttribute("aria-pressed", "true");

  // Claiming again — revisiting /academy/me is a fresh mount of
  // AcademyMeSync, which re-runs ensureSynced() from scratch. localStorage
  // still holds the same (now DB-confirmed) two entries, so this genuinely
  // re-invokes claimAcademyProgress() a second time. Must not duplicate rows
  // or change the count.
  await page.goto("/academy/me");
  await expect(page.getByTestId("me-total-progress")).toContainText("2 of");

  const rows = await db.lessonProgress.count({ where: { user: { email } } });
  expect(rows).toBe(2);

  await db.user.delete({ where: { email } }); // cascades LessonProgress
});

test(`TC-${TC}-103 /academy/me and the dashboard's "Continue learning" widget reflect real DB progress`, async ({
  page,
}) => {
  // Runs after TC-100/101 in this file, which already marked several
  // fundamentals lessons done for the shared E2E user — deliberately not
  // re-deriving an exact count here (that would just re-encode file order);
  // the structure is what's under test.
  await login(page);

  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-academy-widget")).toBeVisible();
  await expect(page.getByTestId("dashboard-academy-resume")).toBeVisible();
  await page.click('[data-testid="dashboard-academy-resume"]');
  await page.waitForURL(/\/academy\/fundamentals\/.+/);

  await page.goto("/academy/me");
  await expect(page.getByTestId("me-total-progress")).toContainText(
    /\d+ of \d+ lessons done/,
  );
  await expect(page.getByTestId("me-track-fundamentals")).toBeVisible();
  await expect(page.getByTestId("me-track-resume-fundamentals")).toBeVisible();

  // The sidebar link reaches the same page.
  await page.goto("/dashboard");
  await page.click('[data-testid="nav-academy-me"]');
  await page.waitForURL("**/academy/me");
  await expect(page.getByRole("heading", { name: "My progress" })).toBeVisible();
});

// ---------------------------------------------------------------------------
// A-06: the ISTQB exam engine — chapter quizzes and the full practice exam
// share it (docs/QA-ACADEMY.md §5.2), so one flow through a chapter quiz
// exercises the same draw/ticket/grade path the 40-question paper uses.
// ---------------------------------------------------------------------------

/** Click the first radio choice for whichever question is on screen. */
async function answerCurrentQuestion(page: Page) {
  await page.locator('[data-testid^="exam-choice-"]').first().click();
}

/** Answer every question in an in-progress attempt, one screen at a time. */
async function answerAllQuestions(page: Page, count: number) {
  for (let i = 0; i < count; i++) {
    await answerCurrentQuestion(page);
    if (i < count - 1) await page.click('[data-testid="exam-next"]');
  }
}

test(`TC-${TC}-105 An anonymous chapter quiz grades inline and writes zero database rows`, async ({
  page,
}) => {
  const before = await db.examAttempt.count();

  await page.goto("/academy/istqb/practice-exam/chapter/1");
  await expect(page.getByTestId("exam-start")).toBeVisible();
  await page.click('[data-testid="exam-begin"]');

  await expect(page.getByTestId("exam-taking")).toBeVisible();
  await answerAllQuestions(page, 8);

  await page.click('[data-testid="exam-review-submit"]');
  await expect(page.getByTestId("exam-confirm-submit")).toBeVisible();
  await page.click('[data-testid="exam-confirm-submit-btn"]');

  // Graded inline, no navigation to a persisted [attemptId] page — see the
  // A-06 entry in docs/QA-ACADEMY.md for why an anonymous submission never
  // gets one.
  await expect(page.getByTestId("exam-result")).toBeVisible();
  await expect(page.getByTestId("exam-result-headline")).toContainText("/ 8");
  await expect(page.getByTestId("exam-chapter-bar-1")).toBeVisible();
  await expect(page).toHaveURL(/\/academy\/istqb\/practice-exam\/chapter\/1$/);

  const after = await db.examAttempt.count();
  expect(after).toBe(before);
});

test(`TC-${TC}-106 A signed-in attempt persists, redirects to its own page, and shows in attempt history`, async ({
  page,
}) => {
  const email = `academy-exam-${Date.now()}@testforge.local`;
  const passwordHash = await bcrypt.hash("AcademyExam123", 10);
  await db.user.create({
    data: {
      name: "Academy Exam Test",
      email,
      passwordHash,
      emailVerifiedAt: new Date(),
      onboardedAt: new Date(),
    },
  });

  await login(page, email, "AcademyExam123");

  await page.goto("/academy/istqb/practice-exam/chapter/2");
  await page.click('[data-testid="exam-begin"]');
  await answerAllQuestions(page, 8);
  await page.click('[data-testid="exam-review-submit"]');
  await page.click('[data-testid="exam-confirm-submit-btn"]');

  await page.waitForURL(/\/academy\/istqb\/practice-exam\/[a-z0-9]+$/);
  await expect(page.getByTestId("exam-attempt-headline")).toContainText("/ 8");
  await expect(page.getByTestId("exam-attempt-chapter-bar-2")).toBeVisible();

  const attempt = await db.examAttempt.findFirst({
    where: { user: { email }, templateSlug: "ctfl-v4-ch2" },
  });
  expect(attempt).not.toBeNull();
  expect(attempt?.total).toBe(8);

  await page.goto("/academy/me");
  await expect(page.getByTestId("me-exam-history")).toContainText("Chapter quiz");
  await expect(page.getByTestId(`me-exam-attempt-${attempt!.id}`)).toBeVisible();

  await db.user.delete({ where: { email } }); // cascades ExamAttempt
});

test(`TC-${TC}-107 The full practice exam start screen shows the real blueprint and an extra-time option`, async ({
  page,
}) => {
  await page.goto("/academy/istqb/practice-exam");
  await expect(page.getByTestId("exam-start")).toBeVisible();
  // 8+6+4+11+9+2 from the CTFL v4.0 blueprint in src/content/academy/exams.ts.
  await expect(page.getByTestId("exam-start")).toContainText("40");
  await expect(page.getByTestId("exam-start")).toContainText("60 min");
  await expect(page.getByTestId("exam-extra-time")).toBeVisible();

  await page.click('[data-testid="chapter-quiz-link-3"]');
  await page.waitForURL("**/academy/istqb/practice-exam/chapter/3");
  await expect(page.getByTestId("exam-start")).toContainText("Untimed");
});

test(`TC-${TC}-108 The exam answer key never reaches the page before submission`, async ({
  page,
}) => {
  await page.goto("/academy/istqb/practice-exam/chapter/1");
  // Nothing about the paper is even fetched yet at this point — the start
  // screen only knows the public blueprint (title, chapter, counts).
  const beforeBegin = await page.content();
  expect(beforeBegin).not.toContain('"correct":true');
  expect(beforeBegin).not.toContain("correctChoiceIds");

  await page.click('[data-testid="exam-begin"]');
  await expect(page.getByTestId("exam-taking")).toBeVisible();

  // Which 8 of chapter 1's 12 questions got drawn is random per attempt
  // (seeded, not fixed), so this checks the property rather than one known
  // question: none of chapter 1's explanations — read straight from the
  // content source, same 40-char canary scripts/academy-bundle-check.mjs
  // uses — may appear anywhere on the page, while at least one of its stems
  // (the sanitized half) must.
  const fs = await import("node:fs");
  const src = fs.readFileSync("src/content/academy/questions/ch1-fundamentals.ts", "utf8");
  const explanationCanaries = Array.from(
    src.matchAll(/explanation:\s*"((?:[^"\\]|\\.)*)"/g),
  ).map((m) => m[1].replace(/\\"/g, '"').slice(0, 40));
  const stems = Array.from(src.matchAll(/stem:\s*"((?:[^"\\]|\\.)*)"/g)).map((m) =>
    m[1].replace(/\\"/g, '"').slice(0, 30),
  );
  expect(explanationCanaries.length).toBeGreaterThan(0);

  const whileTaking = await page.content();
  expect(whileTaking).not.toContain('"correct":true');
  expect(whileTaking).not.toContain("correctChoiceIds");
  for (const canary of explanationCanaries) {
    expect(whileTaking).not.toContain(canary);
  }
  expect(stems.some((s) => whileTaking.includes(s))).toBe(true);
});

// A-09: /academy stays a public route (unauthenticated crawlers and readers
// still need it), but now renders two different shells depending on whether
// the visitor has a session — see docs/QA-ACADEMY.md A-09.
test(`TC-${TC}-109 A signed-in visitor gets the app shell on /academy, not the standalone public chrome`, async ({
  page,
}) => {
  await login(page);
  await page.goto("/academy");
  await expect(page.getByRole("heading", { name: "QA Academy", level: 1 })).toBeVisible();
  await expect(page.getByTestId("app-sidebar")).toBeVisible();
  await expect(page.getByTestId("nav-academy")).toBeVisible();
  // The guest-only "no account needed" pitch and the public header's
  // Log in/Sign up links don't belong in front of someone already signed in.
  await expect(page.getByRole("link", { name: "Sign up", exact: true })).toHaveCount(0);
});

test(`TC-${TC}-110 A guest on /academy sees Log in and Sign up, and no app shell`, async ({
  page,
}) => {
  await page.goto("/academy");
  await expect(page.getByTestId("app-sidebar")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign up", exact: true })).toHaveAttribute(
    "href",
    "/signup",
  );
});

// ---------------------------------------------------------------------------
// A-10b: a start ticket buys exactly one attempt row. This replays the real
// server-action request rather than calling the action from test code — the
// hole was reachable by anyone who could repeat an HTTP request they had just
// made, so that is the thing worth asserting against.
// ---------------------------------------------------------------------------

test(`TC-${TC}-113 Replaying an exam submission cannot mint a second attempt`, async ({
  page,
}) => {
  const email = `academy-replay-${Date.now()}@testforge.local`;
  const passwordHash = await bcrypt.hash("AcademyReplay123", 10);
  await db.user.create({
    data: {
      name: "Academy Replay Test",
      email,
      passwordHash,
      emailVerifiedAt: new Date(),
      onboardedAt: new Date(),
    },
  });
  await login(page, email, "AcademyReplay123");

  // Capture the submit request as the browser actually sends it — a server
  // action POST carries its arguments in the body and its target in the
  // `next-action` header, so replaying it verbatim is exactly the attack:
  // submit blank, read `correctChoiceIds` off the response, re-send with the
  // answers filled in.
  let submitReq: { url: string; headers: Record<string, string>; body: string } | null = null;
  page.on("request", (req) => {
    if (req.method() !== "POST") return;
    const headers = req.headers();
    if (!headers["next-action"]) return;
    const body = req.postData();
    if (body && body.includes("ctfl-v4-ch")) return; // the start call, not the submit
    if (body) submitReq = { url: req.url(), headers, body };
  });

  await page.goto("/academy/istqb/practice-exam/chapter/3");
  await page.click('[data-testid="exam-begin"]');
  await answerAllQuestions(page, 8);
  await page.click('[data-testid="exam-review-submit"]');
  await page.click('[data-testid="exam-confirm-submit-btn"]');
  await page.waitForURL(/\/academy\/istqb\/practice-exam\/[a-z0-9]+$/);

  const first = await db.examAttempt.findMany({ where: { user: { email } } });
  expect(first).toHaveLength(1);
  expect(submitReq).not.toBeNull();

  // Replay it, byte for byte, with the same session cookies.
  const req = submitReq!;
  const replay = await page.request.post(req.url, {
    headers: req.headers,
    data: req.body,
  });
  expect(replay.ok()).toBe(true);

  const after = await db.examAttempt.findMany({ where: { user: { email } } });
  expect(after).toHaveLength(1);
  expect(after[0].id).toBe(first[0].id);
  expect(after[0].score).toBe(first[0].score);
  // The replay resolves to the attempt that already exists rather than
  // erroring, so an honest double-submit still lands on its result page.
  expect(await replay.text()).toContain(first[0].id);

  await db.user.delete({ where: { email } }); // cascades ExamAttempt
});

// ---------------------------------------------------------------------------
// A-10a: choice order is shuffled per attempt. `scripts/academy-bank-check.mjs`
// measures the statistical property against the real bank; this is the part it
// cannot see — that `beginAttempt` actually calls `presentPaper` on the way
// out. Delete the shuffle from the wrapper and the script still passes; this
// fails.
// ---------------------------------------------------------------------------

/**
 * Walk one whole attempt, recording each question's choice order as rendered.
 * `data-testid` is `exam-choice-<questionId>-<choiceId>`, so the question id
 * comes off the first choice on each screen.
 */
async function choiceOrdersInAttempt(
  page: Page,
  questionCount: number,
): Promise<Map<string, string>> {
  const orders = new Map<string, string>();
  for (let i = 0; i < questionCount; i++) {
    const choices = page.locator('[data-testid^="exam-choice-"]');
    const testId = (await choices.first().getAttribute("data-testid")) ?? "";
    const questionId = testId.split("-").slice(2, -1).join("-");
    orders.set(questionId, (await choices.allInnerTexts()).join(" | "));
    if (i < questionCount - 1) await page.click('[data-testid="exam-next"]');
  }
  return orders;
}

test(`TC-${TC}-114 A question's choices are presented in a different order across attempts`, async ({
  page,
}) => {
  // Compare two whole attempts, not just their first screens. Chapter 6 draws
  // 8 of its 12 questions, so any two attempts share at least 8+8-12 = 4
  // questions by pigeonhole — guaranteed, not likely. Keying on the first
  // question of each attempt instead would need one to be drawn first twice,
  // which across six attempts fails on its own ~22% of the time; a guard that
  // cries wolf one run in four is worse than no guard.
  const attempts: Map<string, string>[] = [];
  for (let i = 0; i < 2; i++) {
    await page.goto("/academy/istqb/practice-exam/chapter/6");
    await page.click('[data-testid="exam-begin"]');
    await expect(page.getByTestId("exam-taking")).toBeVisible();
    attempts.push(await choiceOrdersInAttempt(page, 8));
  }

  const shared = Array.from(attempts[0].keys()).filter((id) => attempts[1].has(id));
  expect(shared.length, "two chapter-6 papers must overlap by at least 4").toBeGreaterThanOrEqual(4);

  // An unshuffled build renders each question's choices in bank order every
  // time, so every shared question matches and this fails. With the shuffle,
  // all four-plus agreeing would take (1/24)^4 — about three in a million.
  const differing = shared.filter((id) => attempts[0].get(id) !== attempts[1].get(id));
  expect(
    differing.length,
    `all ${shared.length} shared questions were laid out identically in both attempts`,
  ).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// A-10c: an attempt survives the tab, and the deadline can't lock anyone out.
// ---------------------------------------------------------------------------

/** "59:41" → 3581. The runner renders m:ss, clamped at zero. */
function clockToSeconds(text: string): number {
  const [m, s] = text.trim().split(":");
  return Number(m) * 60 + Number(s);
}

test(`TC-${TC}-115 An exam attempt survives a full page reload with its answers, flags and clock`, async ({
  page,
}) => {
  await page.goto("/academy/istqb/practice-exam");
  await expect(page.getByTestId("exam-start")).toBeVisible();
  await page.click('[data-testid="exam-begin"]');
  await expect(page.getByTestId("exam-taking")).toBeVisible({ timeout: 30_000 });

  // Answer 1 and 3, flag 2 — three distinct bits of state, only one of which
  // (the answer) is what a naive "just save the answers" fix would keep.
  await answerCurrentQuestion(page);
  await page.click('[data-testid="exam-next"]');
  await answerCurrentQuestion(page);
  await page.click('[data-testid="exam-flag"]');
  await page.click('[data-testid="exam-next"]');
  await answerCurrentQuestion(page);

  const stemBefore = await page.getByTestId("exam-stem").innerText();
  const clockBefore = clockToSeconds(await page.getByTestId("exam-timer").innerText());
  expect(clockBefore).toBeGreaterThan(3500); // a 60-minute paper, barely started

  // The mirror is client-visible storage, so the answer-key boundary of §2.2
  // has to hold there too — the runner re-sanitizes on the way back in, and
  // nothing should have been written that needs it.
  const stored = await page.evaluate(() =>
    window.sessionStorage.getItem("tf_academy_exam:ctfl-v4-full"),
  );
  expect(stored).not.toBeNull();
  expect(stored).not.toContain('"correct"');
  expect(stored).not.toContain('"explanation"');
  expect(stored).not.toContain('"chapter"');

  // The whole point: before A-10c this threw the attempt away, ticket included.
  await page.reload();

  await expect(page.getByTestId("exam-start")).toBeVisible();
  await expect(page.getByTestId("exam-resume-banner")).toContainText("3 of 40 questions");
  await page.click('[data-testid="exam-resume"]');

  await expect(page.getByTestId("exam-taking")).toBeVisible();
  // Same paper, same position in it, same answers, same flag.
  await expect(page.getByTestId("exam-taking")).toContainText("Question 3 of 40");
  await expect(page.getByTestId("exam-stem")).toHaveText(stemBefore);
  await expect(page.getByTestId("exam-navigator")).toContainText("3 answered · 1 flagged");
  await expect(page.locator('[data-testid^="exam-choice-"] input:checked')).toHaveCount(1);

  await page.click('[data-testid="exam-nav-2"]');
  await expect(page.getByTestId("exam-flag")).toHaveText("Flagged for review");

  // The clock is the resumed attempt's own, not a fresh 60 minutes — it comes
  // back from the ticket's server-set `startedAt`, so it has kept running.
  const clockAfter = clockToSeconds(await page.getByTestId("exam-timer").innerText());
  expect(clockAfter).toBeLessThanOrEqual(clockBefore);
  expect(clockBefore - clockAfter).toBeLessThan(120);

  // Starting over is still offered, and it really does drop the attempt.
  await page.reload();
  await page.click('[data-testid="exam-resume-discard"]');
  await expect(page.getByTestId("exam-resume-banner")).toBeHidden();
  await page.reload();
  await expect(page.getByTestId("exam-start")).toBeVisible();
  await expect(page.getByTestId("exam-resume-banner")).toBeHidden();
});

test(`TC-${TC}-116 A failing auto-submit backs off instead of burning the rate limit, and manual submit still works`, async ({
  page,
}) => {
  // ~26s of backoff plus a real submit at the end; the suite's 60s default is
  // cutting it close enough to be a flake.
  test.setTimeout(120_000);

  // Skew only the *page's* notion of now, leaving `setInterval` on the real
  // clock — Playwright's `page.clock` would freeze the one-second tick this
  // test is entirely about, and the server's clock (the only one that decides
  // "late", §2.3) is untouched either way.
  await page.addInitScript(() => {
    const realNow = Date.now.bind(Date);
    let skew = 0;
    (window as unknown as { __tfSkewClock: (ms: number) => void }).__tfSkewClock = (ms) => {
      skew += ms;
    };
    Date.now = () => realNow() + skew;
  });

  await page.goto("/academy/istqb/practice-exam");
  await expect(page.getByTestId("exam-start")).toBeVisible();
  await page.click('[data-testid="exam-begin"]');
  await expect(page.getByTestId("exam-taking")).toBeVisible({ timeout: 30_000 });
  await answerCurrentQuestion(page);

  // Only now — `begin` posts to this same URL. Timestamps, not just a count:
  // what separates backoff from hammering is *when* the retries land, and a
  // per-tick loop that happened to stop after four tries would satisfy a count
  // bound while still spending four requests in four seconds.
  const submitAt: number[] = [];
  await page.route("**/academy/istqb/practice-exam", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    submitAt.push(Date.now());
    return route.abort("connectionfailed");
  });

  // Deadline passes while the connection is down: the exact moment A-06 would
  // start hammering a 20/minute endpoint once a second.
  await page.evaluate(() =>
    (window as unknown as { __tfSkewClock: (ms: number) => void }).__tfSkewClock(61 * 60 * 1000),
  );

  await expect(page.getByTestId("exam-autosubmit-failed")).toBeVisible({ timeout: 60_000 });

  // One try plus the three backed-off retries, spread over 2s + 6s + 18s of
  // waiting. A-06's version fired from every one-second tick, which puts the
  // same handful of requests inside four seconds on the way to spending the
  // whole 20/minute budget — so the span is the assertion that discriminates,
  // and the count is what keeps it from creeping back up.
  expect(
    submitAt.length,
    `auto-submit sent ${submitAt.length} requests; it must fire once, then back off`,
  ).toBeLessThanOrEqual(5);
  expect(submitAt.length).toBeGreaterThanOrEqual(2);

  const spanSec = (submitAt[submitAt.length - 1] - submitAt[0]) / 1000;
  expect(
    spanSec,
    `auto-submit's ${submitAt.length} requests spanned only ${spanSec.toFixed(1)}s — it is retrying on the tick, not backing off`,
  ).toBeGreaterThan(20);

  // And the candidate is not stuck: the connection comes back, they press the
  // button, the paper is graded.
  await page.unroute("**/academy/istqb/practice-exam");
  await page.click('[data-testid="exam-manual-submit"]');

  await expect(page.getByTestId("exam-result")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("exam-result-headline")).toContainText("/ 40");

  // Graded and done, so nothing is left to resume back into.
  const stored = await page.evaluate(() =>
    window.sessionStorage.getItem("tf_academy_exam:ctfl-v4-full"),
  );
  expect(stored).toBeNull();
});

// ---------------------------------------------------------------------------
// A-07: certificates. `scripts/academy-certificate-selftest.mjs` covers the
// serial's own properties (determinism, entropy, field separation) with no
// database; these four are the parts it cannot see — that the two triggers fire
// on the real paths, that the public page needs no session, and that the
// holder's switch is the only hand on it.
// ---------------------------------------------------------------------------

/** questionId → the ids of its correct choices, for every question in the bank. */
const ANSWER_KEY = new Map<string, string[]>(
  [
    ...CH1_FUNDAMENTALS,
    ...CH2_SDLC,
    ...CH3_STATIC_TESTING,
    ...CH4_TEST_DESIGN,
    ...CH5_MANAGING_TESTING,
    ...CH6_TOOLS,
  ].map((q) => [q.id, q.choices.filter((c) => c.correct).map((c) => c.id)]),
);

/**
 * Sit a whole paper and get every question right.
 *
 * Choices are clicked by *id*, never by position — A-10a shuffles the order per
 * attempt, so a position-based walk would score at chance and this test would
 * fail for a reason that has nothing to do with certificates.
 */
async function answerEveryQuestionCorrectly(page: Page, count: number) {
  for (let i = 0; i < count; i++) {
    const first = page.locator('[data-testid^="exam-choice-"]').first();
    const testId = (await first.getAttribute("data-testid")) ?? "";
    const questionId = testId.split("-").slice(2, -1).join("-");

    const key = ANSWER_KEY.get(questionId);
    if (!key || key.length === 0) {
      throw new Error(`no answer key for ${questionId} — the bank and this spec disagree`);
    }
    for (const choiceId of key) {
      await page.click(`[data-testid="exam-choice-${questionId}-${choiceId}"]`);
    }
    if (i < count - 1) await page.click('[data-testid="exam-next"]');
  }
}

/**
 * A syntactically valid serial for a fixture row, fresh on every run.
 *
 * Hard-coding one makes the test unrepeatable: a run that fails before its
 * cleanup leaves the row behind, and every later run then dies on `serial`'s
 * unique index instead of on whatever it was actually testing.
 */
function fixtureSerial(): string {
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford's, per certificates-core.mjs
  const symbols = Array.from(
    { length: 16 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");
  return `TF-${symbols.slice(0, 4)}-${symbols.slice(4, 8)}-${symbols.slice(8, 12)}-${symbols.slice(12, 16)}`;
}

/** A fresh, signed-out browser context — a stranger following a shared link. */
async function readAsStranger<T>(browser: Browser, fn: (page: Page) => Promise<T>): Promise<T> {
  const context = await browser.newContext();
  try {
    return await fn(await context.newPage());
  } finally {
    await context.close();
  }
}

async function makeUser(email: string, name: string, password: string) {
  await db.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      emailVerifiedAt: new Date(),
      onboardedAt: new Date(),
    },
  });
}

test(`TC-${TC}-117 Passing the full practice exam issues a certificate, and its page reads with no session`, async ({
  page,
  browser,
}) => {
  // 40 questions on `next dev`, each a click plus a screen — comfortably past
  // the 60s a test gets by default, and slow for reasons that are not failures.
  test.setTimeout(240_000);

  const email = `academy-cert-exam-${Date.now()}@testforge.local`;
  await makeUser(email, "Academy Certificate Test", "AcademyCert123");
  await login(page, email, "AcademyCert123");

  await page.goto("/academy/istqb/practice-exam");
  await expect(page.getByTestId("exam-start")).toBeVisible();
  await page.click('[data-testid="exam-begin"]');
  await expect(page.getByTestId("exam-taking")).toBeVisible();

  await answerEveryQuestionCorrectly(page, 40);
  await page.click('[data-testid="exam-review-submit"]');
  await page.click('[data-testid="exam-confirm-submit-btn"]');
  await page.waitForURL(/\/academy\/istqb\/practice-exam\/[a-z0-9]+$/);

  await expect(page.getByTestId("exam-attempt-headline")).toContainText("Pass — 40 / 40");
  await expect(page.getByTestId("exam-attempt-certificate")).toBeVisible();

  const certs = await db.certificate.findMany({ where: { user: { email } } });
  expect(certs).toHaveLength(1);
  expect(certs[0].kind).toBe("EXAM");
  expect(certs[0].refSlug).toBe("ctfl-v4-full");
  expect(certs[0].scorePct).toBe(100);
  expect(certs[0].revokedAt).toBeNull();
  expect(certs[0].serial).toMatch(/^TF(-[0-9A-HJKMNP-TV-Z]{4}){4}$/);

  // The certificate the page offers is the one that was issued — not a link
  // built from something the result page happened to have to hand.
  await expect(page.getByTestId("exam-attempt-certificate").getByRole("link")).toHaveAttribute(
    "href",
    `/academy/certificate/${certs[0].serial}`,
  );

  // The whole point of the artifact: someone with no account and no cookies can
  // read it. A fresh context, so nothing about this page can be explained by
  // the session that earned it.
  await readAsStranger(browser, async (stranger) => {
    const res = await stranger.goto(`/academy/certificate/${certs[0].serial}`);
    expect(res?.status()).toBe(200);
    await expect(stranger.getByTestId("certificate-card")).toBeVisible();
    await expect(stranger.getByTestId("certificate-holder")).toHaveText("Academy Certificate Test");
    await expect(stranger.getByTestId("certificate-serial")).toHaveText(certs[0].serial);
    await expect(stranger.getByTestId("certificate-score")).toContainText("100%");
    // §7.4: the page has to say what it is not, on the page itself.
    await expect(stranger.getByTestId("certificate-disclaimer")).toContainText(
      "not a professional certification",
    );
    await expect(stranger.getByTestId("certificate-disclaimer")).toContainText("ISTQB");
    // NOINDEX: a page carrying somebody's name stays out of search results,
    // while remaining fetchable so the share card still renders.
    await expect(stranger.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );

    // And the card itself, fetched the way LinkedIn or Slack would fetch it:
    // off the page's own og:image. That decision — NOINDEX but no robots.txt
    // entry — is only worth anything if the image route actually renders, and
    // nothing else in this suite touches it.
    const cardUrl = await stranger.locator('meta[property="og:image"]').getAttribute("content");
    expect(cardUrl, "the certificate page advertises no og:image").toBeTruthy();
    const card = await stranger.request.get(cardUrl!);
    expect(card.status()).toBe(200);
    expect(card.headers()["content-type"]).toContain("image/");
  });

  // Sit a second paper. A new ticket draws a different 40 questions, so this is
  // a genuine second pass — and `issueExamCertificate` runs again for an
  // achievement already held. Deterministic serials are what make that a no-op
  // rather than a second row or a unique-constraint error, and this is the
  // cleanest place in the app to prove it: the exam path has no `localStorage`
  // cache in it, so nothing here can be explained by client-side state.
  await page.goto("/academy/istqb/practice-exam");
  await page.click('[data-testid="exam-begin"]');
  await expect(page.getByTestId("exam-taking")).toBeVisible();
  await answerEveryQuestionCorrectly(page, 40);
  await page.click('[data-testid="exam-review-submit"]');
  await page.click('[data-testid="exam-confirm-submit-btn"]');
  await page.waitForURL(/\/academy\/istqb\/practice-exam\/[a-z0-9]+$/);

  const attempts = await db.examAttempt.count({ where: { user: { email } } });
  expect(attempts).toBe(2);

  const after = await db.certificate.findMany({ where: { user: { email } } });
  expect(after).toHaveLength(1);
  expect(after[0].serial).toBe(certs[0].serial);
  expect(after[0].issuedAt.getTime()).toBe(certs[0].issuedAt.getTime()); // "first earned" doesn't move

  await db.user.delete({ where: { email } }); // cascades ExamAttempt + Certificate
});

test(`TC-${TC}-118 The lesson that completes a track earns its certificate, and nothing earns it early`, async ({
  page,
}) => {
  const email = `academy-cert-track-${Date.now()}@testforge.local`;
  await makeUser(email, "Academy Track Test", "AcademyTrack123");
  const user = await db.user.findUniqueOrThrow({ where: { email } });

  // Every published lesson but the last two, written straight to the database:
  // thirteen lesson pages driven through the UI would test A-05's toggle
  // thirteen times over and this work order's rule once. The last two are the
  // ones that matter, and both go through the real action — the second-to-last
  // is what proves issuance is gated on the track being *finished*. Seeding
  // that one too would assert nothing: with no action in between, an
  // ungated `issueTrackCertificateIfComplete` would have had no chance to run.
  const lessons = fundamentals.lessons.filter((l) => l.status === "published");
  expect(lessons.length).toBeGreaterThan(2);
  const [penultimate, last] = lessons.slice(-2);
  await db.lessonProgress.createMany({
    data: lessons.slice(0, -2).map((l) => ({
      userId: user.id,
      trackSlug: "fundamentals",
      lessonSlug: l.slug,
      status: "DONE",
    })),
  });

  await login(page, email, "AcademyTrack123");

  // One lesson short of the track. Marking it done is polled for on the server
  // rather than waited for on a request: A-05's progress layer has two paths
  // that persist a toggle — `markLessonDoneAction` when `ensureSynced()` has
  // already established a session, and `claimAcademyProgress` folding the local
  // cache in when it hasn't — so *which* request carries the write is a race
  // this test has no business pinning down. The row count is the same fact
  // either way.
  await page.goto(`/academy/fundamentals/${penultimate.slug}`);
  await page.click('[data-testid="lesson-done-toggle"]');
  await expect
    .poll(async () => db.lessonProgress.count({ where: { userId: user.id } }), { timeout: 15_000 })
    .toBe(lessons.length - 1);

  // Now the negative. It is checked after a full navigation and render, which
  // is orders of magnitude longer than the one `count` and `findUnique` an
  // ungated `issueTrackCertificateIfComplete` would need after the row it just
  // waited for — so this is a practical ordering, not a formal one, and the
  // thing that settles it is that the assertion was watched to fail against a
  // build with the gate removed. Asserting immediately after the click instead
  // does not: the first draft of this test passed against exactly that build.
  await page.goto(`/academy/fundamentals/${last.slug}`);
  await expect(page.getByTestId("lesson-done-toggle")).toBeVisible();
  expect(await db.certificate.count({ where: { userId: user.id } })).toBe(0);

  await page.click('[data-testid="lesson-done-toggle"]');
  await expect
    .poll(async () => db.certificate.count({ where: { userId: user.id } }), { timeout: 15_000 })
    .toBe(1);

  const cert = await db.certificate.findFirstOrThrow({ where: { userId: user.id } });
  expect(cert.kind).toBe("TRACK");
  expect(cert.refSlug).toBe("fundamentals");
  expect(cert.scorePct).toBeNull(); // a track is done or not; there is no score
  expect(await db.lessonProgress.count({ where: { userId: user.id } })).toBe(lessons.length);

  await page.goto("/academy/me");
  await expect(page.getByTestId(`me-certificate-${cert.serial}`)).toContainText(
    "Track Completion",
  );
  await expect(page.getByTestId(`me-certificate-view-${cert.serial}`)).toHaveAttribute(
    "href",
    `/academy/certificate/${cert.serial}`,
  );

  await db.user.delete({ where: { email } });
});

test(`TC-${TC}-119 Turning a certificate's link off makes it a 404, and back on restores the same serial`, async ({
  page,
  browser,
}) => {
  const email = `academy-cert-hide-${Date.now()}@testforge.local`;
  await makeUser(email, "Academy Hide Test", "AcademyHide123");
  const user = await db.user.findUniqueOrThrow({ where: { email } });

  // The row is the fixture here — TC-*-117 and TC-*-118 are what prove issuance
  // puts one there. The serial's shape is real; nothing on this path recomputes
  // it, which is the property being relied on.
  const serial = fixtureSerial();
  await db.certificate.create({
    data: { userId: user.id, kind: "TRACK", refSlug: "fundamentals", serial },
  });

  await readAsStranger(browser, async (stranger) => {
    const res = await stranger.goto(`/academy/certificate/${serial}`);
    expect(res?.status()).toBe(200);
  });

  await login(page, email, "AcademyHide123");
  await page.goto("/academy/me");
  await page.click(`[data-testid="me-certificate-toggle-${serial}"]`);
  await expect(page.getByTestId(`me-certificate-hidden-${serial}`)).toBeVisible();

  // A 404, not a "withdrawn by its holder" page: that sentence is precisely
  // what someone taking a link down does not want published. Same answer an
  // invented serial gets, checked here so the two can't drift apart.
  await readAsStranger(browser, async (stranger) => {
    const hidden = await stranger.goto(`/academy/certificate/${serial}`);
    expect(hidden?.status()).toBe(404);
    const invented = await stranger.goto("/academy/certificate/TF-0000-0000-0000-0000");
    expect(invented?.status()).toBe(404);
  });

  await page.click(`[data-testid="me-certificate-toggle-${serial}"]`);
  await expect(page.getByTestId(`me-certificate-view-${serial}`)).toBeVisible();

  // Back on, and it is the same URL that was shared in the first place — a
  // certificate whose link changed every time it was toggled would make the
  // switch unusable for the one thing it is for.
  await readAsStranger(browser, async (stranger) => {
    const back = await stranger.goto(`/academy/certificate/${serial}`);
    expect(back?.status()).toBe(200);
    await expect(stranger.getByTestId("certificate-serial")).toHaveText(serial);
  });

  const row = await db.certificate.findUniqueOrThrow({ where: { serial } });
  expect(row.revokedAt).toBeNull();

  await db.user.delete({ where: { email } });
});

test(`TC-${TC}-120 A signed-in stranger cannot switch off somebody else's certificate`, async ({
  page,
}) => {
  // The tenant guard is a `userId` in an `updateMany` filter, which no UI can
  // reach — the holder's own page only ever renders their own serials. So this
  // replays the real server-action request with one field swapped, the same way
  // TC-*-113 attacks the exam submit rather than calling the action from test
  // code.
  const stamp = Date.now();
  const victimEmail = `academy-cert-victim-${stamp}@testforge.local`;
  const attackerEmail = `academy-cert-attacker-${stamp}@testforge.local`;
  await makeUser(victimEmail, "Academy Victim", "AcademyVictim123");
  await makeUser(attackerEmail, "Academy Attacker", "AcademyAttacker123");
  const victim = await db.user.findUniqueOrThrow({ where: { email: victimEmail } });
  const attacker = await db.user.findUniqueOrThrow({ where: { email: attackerEmail } });

  const victimSerial = fixtureSerial();
  const attackerSerial = fixtureSerial();
  await db.certificate.create({
    data: { userId: victim.id, kind: "TRACK", refSlug: "fundamentals", serial: victimSerial },
  });
  await db.certificate.create({
    data: { userId: attacker.id, kind: "TRACK", refSlug: "fundamentals", serial: attackerSerial },
  });

  await login(page, attackerEmail, "AcademyAttacker123");

  let toggleReq: { url: string; headers: Record<string, string>; body: string } | null = null;
  page.on("request", (req) => {
    if (req.method() !== "POST") return;
    const headers = req.headers();
    if (!headers["next-action"]) return;
    const body = req.postData();
    if (body?.includes(attackerSerial)) toggleReq = { url: req.url(), headers, body };
  });

  // Switch off their own certificate — a legitimate call, captured verbatim.
  await page.goto("/academy/me");
  await page.click(`[data-testid="me-certificate-toggle-${attackerSerial}"]`);
  await expect(page.getByTestId(`me-certificate-hidden-${attackerSerial}`)).toBeVisible();
  expect(toggleReq).not.toBeNull();

  // Same session, same action, someone else's serial.
  const req = toggleReq!;
  const replay = await page.request.post(req.url, {
    headers: req.headers,
    data: req.body.replaceAll(attackerSerial, victimSerial),
  });
  expect(replay.ok()).toBe(true); // the action answers; it just doesn't do anything

  const victimRow = await db.certificate.findUniqueOrThrow({ where: { serial: victimSerial } });
  expect(victimRow.revokedAt).toBeNull();
  const attackerRow = await db.certificate.findUniqueOrThrow({ where: { serial: attackerSerial } });
  expect(attackerRow.revokedAt).not.toBeNull(); // their own toggle did work

  await db.user.delete({ where: { email: victimEmail } });
  await db.user.delete({ where: { email: attackerEmail } });
});
