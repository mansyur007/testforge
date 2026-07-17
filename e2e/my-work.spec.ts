import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-31 "My work": cross-project results assigned to me in active runs, cases
// assigned to me, and case reviews requested from me (F-15), plus the
// sidebar nav badge count.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-70 My work: assigned results, assigned cases, and reviews requested`, async ({
  page,
}) => {
  const ts = Date.now();
  await loginAs(page, E2E.email, E2E.password);

  const membersRes = await page.request.get(
    `/api/projects/${E2E.projectSlug}/members`
  );
  const members = (await membersRes.json()).data as { id: string; name: string; email: string }[];
  const me = members.find((m) => m.email === E2E.email)!;

  // 1. A case assigned to me.
  const assignedTitle = `Assigned to me ${ts}`;
  const assignedCaseRes = await page.request.post(
    `/api/v1/projects/${E2E.projectSlug}/cases`,
    { data: { title: assignedTitle } }
  );
  const assignedCase = await assignedCaseRes.json();
  await page.request.patch(
    `/api/v1/projects/${E2E.projectSlug}/cases/${assignedCase.id}`,
    { data: { assigneeId: me.id } }
  );

  // 2. A result assigned to me — submitting through the real executor UI is
  // what stamps assigneeId (the v1 results API does not).
  const execTitle = `Execute for me ${ts}`;
  const execCaseRes = await page.request.post(
    `/api/v1/projects/${E2E.projectSlug}/cases`,
    { data: { title: execTitle } }
  );
  const execCase = await execCaseRes.json();
  const runRes = await page.request.post(`/api/v1/projects/${E2E.projectSlug}/runs`, {
    data: { name: `My work run ${ts}`, caseIds: [execCase.id] },
  });
  const run = await runRes.json();
  await page.goto(`/projects/${E2E.projectSlug}/runs/${run.id}`);
  await page.click('[data-testid="submit-status-PASSED"]');
  // The executor updates optimistically on click (see RunExecutor's `setLive`)
  // — that's client state, not confirmation the server action committed. Poll
  // the actual API (what /my-work reads) instead of trusting the UI text,
  // same lesson as elsewhere: don't assert against an optimistic echo.
  await expect(async () => {
    const res = await page.request.get("/api/v1/my-work");
    const body = await res.json();
    expect(
      body.results.some((r: { caseDisplayId: string }) =>
        r.caseDisplayId === execCase.displayId
      )
    ).toBe(true);
  }).toPass({ timeout: 15000 });

  // 3. A DIFFERENT case, review requested from the OTHER fixture reviewer
  // (not me) — should NOT show up under MY "reviews requested" section.
  const reviewTitle = `Review not for me ${ts}`;
  const reviewCaseRes = await page.request.post(
    `/api/v1/projects/${E2E.projectSlug}/cases`,
    { data: { title: reviewTitle } }
  );
  const reviewCase = await reviewCaseRes.json();
  await page.goto(`/projects/${E2E.projectSlug}/cases/${reviewCase.id}`);
  await page.locator('[data-testid="review-reviewer-select"]').selectOption({
    label: E2E.reviewerName,
  });
  await page.click('[data-testid="review-request"]');
  await expect(page.locator('[data-testid="case-status-badge"]')).toHaveText(
    "IN REVIEW"
  );

  // 4. My "My work" page shows the assigned case + executed result, and the
  // sidebar badge reflects a non-zero count.
  await page.goto("/my-work");
  await expect(page.locator(`[data-testid="my-work-case-${assignedCase.id}"]`)).toContainText(
    assignedTitle
  );
  await expect(page.locator('[data-testid="my-work-results"]')).toContainText(execTitle);
  await expect(page.locator('[data-testid="my-work-reviews"]')).not.toContainText(
    reviewTitle
  );
  const badge = page.locator('[data-testid="nav-my-work"] [data-testid="my-work-nav-badge"]');
  await expect(badge).toBeVisible();
  expect(Number(await badge.textContent())).toBeGreaterThan(0);

  // 5. The REVIEWER's own "My work" page shows that case under reviews.
  await loginAs(page, E2E.reviewerEmail, E2E.reviewerPassword);
  await page.goto("/my-work");
  await expect(page.locator('[data-testid="my-work-reviews"]')).toContainText(reviewTitle);
});
