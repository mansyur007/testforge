import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-35 Print & PDF-friendly views: the /print route group renders auth-gated,
// paginated documents (case catalog + run report). PDF comes from the browser's
// own print dialog, so these tests exercise the rendered HTML + the print
// stylesheet under emulateMedia("print") rather than a generated PDF.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

async function api<T>(page: Page, method: "post", url: string, data: unknown): Promise<T> {
  const res = await page.request[method](url, { data });
  expect(res.ok(), await res.text()).toBeTruthy();
  return res.json();
}

test(`TC-${TC}-72 Print case catalog: auth gate, expanded shared steps, scope, single-case, print media`, async ({
  page,
}) => {
  const ts = Date.now();

  // 1. Logged-out → redirected to login (print pages are never public).
  await page.goto(`/print/projects/${E2E.projectSlug}/cases`);
  await expect(page).toHaveURL(/\/login/);

  await login(page);

  // 2. Non-member project → 404 (private-e2e is owned by another user).
  const forbidden = await page.goto("/print/projects/private-e2e/cases");
  expect(forbidden?.status()).toBe(404);

  // 3. A case that references a shared-step group must print the REAL steps,
  //    tagged with the ⛓ origin marker (F-04 expansion).
  const group = await api<{ id: string; title: string }>(
    page,
    "post",
    `/api/v1/projects/${E2E.projectSlug}/shared-steps`,
    {
      title: `Login preamble ${ts}`,
      steps: [
        { action: `Open the login page ${ts}`, expected: "Form visible" },
        { action: "Enter valid credentials", expected: "Fields accept input" },
      ],
    }
  );
  const suite = await api<{ id: string }>(
    page,
    "post",
    `/api/v1/projects/${E2E.projectSlug}/suites`,
    { name: `Auth suite ${ts}` }
  );
  const withShared = await api<{ id: string; displayId: string }>(
    page,
    "post",
    `/api/v1/projects/${E2E.projectSlug}/cases`,
    {
      title: `Case with shared steps ${ts}`,
      suiteId: suite.id,
      preconditions: "User is logged out.\n\n```\nENV=staging\n```",
      steps: [{ shared: group.id }, { action: `Click submit ${ts}`, expected: "Redirect" }],
    }
  );

  await page.goto(`/print/projects/${E2E.projectSlug}/cases`);
  const section = page.locator(`[data-testid="print-case-${withShared.displayId}"]`);
  await expect(section).toBeVisible();
  // Shared-step origin marker + the group's real (expanded) step text.
  await expect(section.locator('[data-testid="print-shared-origin"]').first()).toContainText(
    `Login preamble ${ts}`
  );
  await expect(section).toContainText(`Open the login page ${ts}`);
  await expect(section).toContainText(`Click submit ${ts}`);
  // TOC lists the suite; document title is the PDF filename.
  await expect(page.locator('[data-testid="print-toc"]')).toContainText(`Auth suite ${ts}`);
  await expect(page).toHaveTitle(/case-catalog — TestForge/);

  // 4. ?suite= scopes the document and states the filter in the Scope box.
  await page.goto(`/print/projects/${E2E.projectSlug}/cases?suite=${suite.id}`);
  await expect(page.locator('[data-testid="print-scope"]')).toContainText(`Auth suite ${ts}`);
  await expect(page.locator(`[data-testid="print-case-${withShared.displayId}"]`)).toBeVisible();

  // 5. ?case= is a one-case document: slim header, no TOC.
  await page.goto(`/print/projects/${E2E.projectSlug}/cases?case=${withShared.id}`);
  await expect(page.locator('[data-testid="print-cover"]')).toBeVisible();
  await expect(page.locator('[data-testid="print-toc"]')).toHaveCount(0);
  await expect(page.locator(`[data-testid="print-case-${withShared.displayId}"]`)).toBeVisible();

  // 6. Under print media: toolbar hidden, cover breaks to its own page, and the
  //    markdown code block is flattened to a light background (never a black
  //    slab on paper).
  await page.emulateMedia({ media: "print" });
  await page.goto(`/print/projects/${E2E.projectSlug}/cases`);
  await expect(page.locator('[data-testid="print-toolbar"]')).toBeHidden();
  const coverBreak = await page
    .locator('[data-testid="print-cover"]')
    .evaluate((el) => getComputedStyle(el).breakAfter);
  expect(coverBreak).toBe("page");
  const preBg = await page
    .locator(`[data-testid="print-case-${withShared.displayId}"] .tf-markdown pre`)
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  // #f8fafc — a light slate, not the dark screen `pre`.
  expect(preBg).toBe("rgb(248, 250, 252)");
});

test(`TC-${TC}-73 Print run report: summary totals exclude muted, stacked bar, steps collapse/expand`, async ({
  page,
}) => {
  const ts = Date.now();
  await login(page);

  const c1 = await api<{ id: string; displayId: string }>(
    page,
    "post",
    `/api/v1/projects/${E2E.projectSlug}/cases`,
    { title: `Run report pass ${ts}`, steps: [{ action: `Do the thing ${ts}`, expected: "OK" }] }
  );
  const c2 = await api<{ id: string; displayId: string }>(
    page,
    "post",
    `/api/v1/projects/${E2E.projectSlug}/cases`,
    { title: `Run report fail ${ts}`, steps: [{ action: "Break it", expected: "Boom" }] }
  );
  const run = await api<{ id: string }>(
    page,
    "post",
    `/api/v1/projects/${E2E.projectSlug}/runs`,
    { name: `Print report run ${ts}`, caseIds: [c1.id, c2.id] }
  );
  await api(page, "post", `/api/v1/projects/${E2E.projectSlug}/runs/${run.id}/results`, {
    caseId: c1.id,
    status: "PASSED",
  });
  await api(page, "post", `/api/v1/projects/${E2E.projectSlug}/runs/${run.id}/results`, {
    caseId: c2.id,
    status: "FAILED",
  });

  // Summary: 1 pass / 1 fail → 50% pass rate; both status rows present.
  await page.goto(`/print/projects/${E2E.projectSlug}/runs/${run.id}`);
  const summary = page.locator('[data-testid="print-summary"]');
  await expect(summary).toContainText("Pass rate: 50%");
  await expect(page.locator('[data-testid="print-summary-row-PASSED"]')).toBeVisible();
  await expect(page.locator('[data-testid="print-summary-row-FAILED"]')).toBeVisible();
  // Stacked bar has one segment per present status (pass + fail = 2).
  const segments = page.locator('[data-testid="print-stacked-bar"] > span');
  await expect(segments).toHaveCount(2);

  // Steps collapsed by default; ?steps=1 expands the procedure.
  const passRow = page.locator(`[data-testid="print-result-${c1.displayId}"]`);
  await expect(passRow).toContainText("step");
  await expect(passRow).not.toContainText(`Do the thing ${ts}`);
  await page.goto(`/print/projects/${E2E.projectSlug}/runs/${run.id}?steps=1`);
  await expect(
    page.locator(`[data-testid="print-result-${c1.displayId}"]`)
  ).toContainText(`Do the thing ${ts}`);
  await expect(page).toHaveTitle(/run-report — TestForge/);
});
