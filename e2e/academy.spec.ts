import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

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
