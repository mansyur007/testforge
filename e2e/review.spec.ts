import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-15 Case review workflow: request review → approve / request changes, the
// "Needs my review" filter, the reviewer≠author + no-VIEWER-reviewer guards, and
// the not-approved run warning.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

async function createCase(page: Page, title: string): Promise<string> {
  const res = await page.request.post(
    `/api/v1/projects/${E2E.projectSlug}/cases`,
    { data: { title } }
  );
  expect(res.status(), await res.text()).toBe(201);
  return (await res.json()).id as string;
}

const caseHref = (id: string) => `/projects/${E2E.projectSlug}/cases/${id}`;

test(`TC-${TC}-37 Review loop: request → approve, with author≠reviewer guard and history`, async ({
  page,
}) => {
  const ts = Date.now();
  await loginAs(page, E2E.email, E2E.password);
  const caseId = await createCase(page, `Review approve ${ts}`);
  await page.goto(caseHref(caseId));

  // Guard (UI): the reviewer picker excludes the author (self) and VIEWERs.
  const select = page.locator('[data-testid="review-reviewer-select"]');
  await expect(select).toContainText(E2E.reviewerName);
  await expect(select).not.toContainText("E2E User"); // author not offered
  await expect(select).not.toContainText(E2E.teammateName); // VIEWER not offered

  // Request review, assigning the MEMBER reviewer.
  await select.selectOption({ label: E2E.reviewerName });
  await page.locator('[data-testid="review-request"]').click();
  await expect(page.locator('[data-testid="case-status-badge"]')).toHaveText(
    "IN REVIEW"
  );

  // Reviewer sees it under "Needs my review" and approves.
  await loginAs(page, E2E.reviewerEmail, E2E.reviewerPassword);
  await page.goto(`/projects/${E2E.projectSlug}?review=mine`);
  await expect(page.locator('[data-testid="review-filter-chip"]')).toHaveClass(
    /amber/
  );
  await expect(page.getByText(`Review approve ${ts}`)).toBeVisible();

  await page.goto(caseHref(caseId));
  await page.locator('[data-testid="review-approve"]').click();
  await expect(page.locator('[data-testid="case-status-badge"]')).toHaveText(
    "APPROVED"
  );
  await expect(page.locator('[data-testid="review-approved"]')).toBeVisible();

  // AC: the DRAFT→IN_REVIEW→APPROVED trail is visible in history (F-05).
  await page.goto(`${caseHref(caseId)}?tab=history`);
  await expect(page.locator('[data-testid="case-tab-history"]')).toBeVisible();
  await expect(page.getByText("requested review", { exact: false })).toBeVisible();
  await expect(page.getByText("approved", { exact: false }).first()).toBeVisible();
});

test(`TC-${TC}-38 Request changes sends the case back to DRAFT with a note`, async ({
  page,
}) => {
  const ts = Date.now();
  const note = `Please add an edge case ${ts}`;

  // Author requests review.
  await loginAs(page, E2E.email, E2E.password);
  const caseId = await createCase(page, `Review changes ${ts}`);
  await page.goto(caseHref(caseId));
  await page
    .locator('[data-testid="review-reviewer-select"]')
    .selectOption({ label: E2E.reviewerName });
  await page.locator('[data-testid="review-request"]').click();
  await expect(page.locator('[data-testid="case-status-badge"]')).toHaveText(
    "IN REVIEW"
  );

  // Reviewer requests changes with a required note.
  await loginAs(page, E2E.reviewerEmail, E2E.reviewerPassword);
  await page.goto(caseHref(caseId));
  await page.locator('[data-testid="review-request-changes-open"]').click();
  await page.locator('[data-testid="review-changes-note"]').fill(note);
  await page.locator('[data-testid="review-changes-submit"]').click();
  await expect(page.locator('[data-testid="case-status-badge"]')).toHaveText(
    "DRAFT"
  );

  // Author sees the changes-requested note.
  await loginAs(page, E2E.email, E2E.password);
  await page.goto(caseHref(caseId));
  await expect(page.locator('[data-testid="review-note"]')).toContainText(note);
});

test(`TC-${TC}-39 Creating a run from not-approved cases shows a warning (not a block)`, async ({
  page,
}) => {
  const ts = Date.now();
  const title = `Unapproved run case ${ts}`;

  // Put the case into IN_REVIEW (a non-runnable status).
  await loginAs(page, E2E.email, E2E.password);
  const caseId = await createCase(page, title);
  await page.goto(caseHref(caseId));
  await page
    .locator('[data-testid="review-reviewer-select"]')
    .selectOption({ label: E2E.reviewerName });
  await page.locator('[data-testid="review-request"]').click();
  await expect(page.locator('[data-testid="case-status-badge"]')).toHaveText(
    "IN REVIEW"
  );

  // Selecting it in the new-run form warns but still allows creation.
  await page.goto(`/projects/${E2E.projectSlug}/runs/new`);
  await page.fill('input[name="name"]', `Run w/ unapproved ${ts}`);
  await page
    .locator("div.max-h-96 label", { hasText: title })
    .locator('input[type="checkbox"]')
    .check();
  await expect(
    page.locator('[data-testid="run-unapproved-warning"]')
  ).toContainText("not");
  await page.getByRole("button", { name: /Create Run/ }).click();
  await expect(page.getByRole("heading", { name: `Run w/ unapproved ${ts}` })).toBeVisible();
});
