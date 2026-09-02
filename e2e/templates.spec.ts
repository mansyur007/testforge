import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-47 Case templates: browse the curated library, apply a partial selection
// into a chosen suite, and prove the two rules the feature rests on — the
// live count agrees with what gets created, and a checked case whose parent
// suite is unchecked still lands somewhere.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page, email = E2E.email, password = E2E.password) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

// Applying a template adds cases to the SHARED e2e project, and this file runs
// three applies. Left behind they would accumulate every run, and the case list
// is shared state other specs assert against — TC-E2E-25 drag-reorder in
// particular looks up a row by position and starts missing it once the list
// paginates. So this spec removes exactly what it created: every case carrying
// a `coverage:` tag, which is the marker only template-applied cases have.
test.afterAll(async ({ request }) => {
  const auth = { Authorization: `Bearer ${E2E.apiKey}` };

  // Must follow the cursor: the list caps `limit` at 200 and orders by `seq`
  // ascending, so in a project that has accumulated cases the ones this spec
  // just created are the LAST page, not the first.
  const doomed: string[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 50; page++) {
    const url =
      `/api/v1/projects/${E2E.projectSlug}/cases?limit=200` +
      (cursor ? `&cursor=${cursor}` : "");
    const res = await request.get(url, { headers: auth });
    if (!res.ok()) return;
    const body = await res.json();
    // `tags` serializes as the raw comma-separated string (src/lib/api.ts).
    for (const c of body.data ?? []) {
      if (String(c.tags ?? "").includes("coverage:")) doomed.push(c.id);
    }
    cursor = body.nextCursor ?? null;
    if (!cursor) break;
  }

  for (const id of doomed) {
    await request.delete(`/api/v1/projects/${E2E.projectSlug}/cases/${id}`, {
      headers: auth,
    });
  }
});

/** Uncheck everything, so each test selects exactly what it means to. */
async function clearSelection(page: Page) {
  await page.click('[data-testid="tpl-clear-all"]');
  await expect(page.locator('[data-testid="tpl-count"]')).toContainText(
    "0 suites",
  );
}

test(`TC-${TC}-145 Templates: gallery lists the built-in packs with their coverage`, async ({
  page,
}) => {
  await login(page);
  await page.goto(`/projects/${E2E.projectSlug}/templates`);

  // The four built-in packs are seeded from src/content/templates by
  // syncBuiltInTemplates(), which the gallery triggers on first render.
  await expect(page.locator('[data-testid="template-gallery"]')).toBeVisible();
  for (const slug of [
    "login-authentication",
    "registration-onboarding",
    "crud-entity",
    "checkout-payment",
  ]) {
    await expect(page.locator(`[data-testid="template-card-${slug}"]`)).toBeVisible();
  }

  // Counts are real, not placeholders.
  await expect(
    page.locator('[data-testid="template-card-login-authentication"]'),
  ).toContainText("34 test cases");

  // The cases toolbar is how a user finds this page at all.
  await page.goto(`/projects/${E2E.projectSlug}`);
  await expect(page.locator('[data-testid="templates-link"]')).toBeVisible();
});

test(`TC-${TC}-146 Templates: apply a partial selection and land on the created suite`, async ({
  page,
}) => {
  await login(page);
  await page.goto(
    `/projects/${E2E.projectSlug}/templates/login-authentication`,
  );

  // Everything is checked by default.
  const count = page.locator('[data-testid="tpl-count"]');
  await expect(count).toContainText("5 suites");
  await expect(count).toContainText("34 test cases");

  // Unchecking one suite must move BOTH numbers — the live count runs the same
  // pruning the server applies with, so a drift here is a real defect.
  await page.click('[data-testid="tpl-suite-password-reset"]');
  await expect(count).toContainText("4 suites");
  await expect(count).toContainText("26 test cases");

  // Apply just the two-factor suite.
  await clearSelection(page);
  await page.click('[data-testid="tpl-suite-two-factor"]');
  await expect(count).toContainText("1 suite ");
  await expect(count).toContainText("5 test cases");

  await page.click('[data-testid="tpl-apply"]');

  // Lands on the cases list, filtered to the suite just created.
  await page.waitForURL("**/projects/**applied=5**");
  await expect(
    page.locator('[data-testid="template-applied-banner"]'),
  ).toContainText("Added 5 test cases");

  // The cases really exist, with their coverage tag carried over.
  await expect(
    page.getByText("Sign in with a valid authenticator code"),
  ).toBeVisible();

  // Re-opening the template now warns that it has been applied here before —
  // the guard against silently duplicating a suite.
  await page.goto(
    `/projects/${E2E.projectSlug}/templates/login-authentication`,
  );
  await expect(
    page.locator('[data-testid="tpl-already-applied"]'),
  ).toContainText("5 test cases");
});

test(`TC-${TC}-147 Templates: a checked case keeps its unchecked ancestor suite`, async ({
  page,
}) => {
  await login(page);
  await page.goto(
    `/projects/${E2E.projectSlug}/templates/registration-onboarding`,
  );

  await clearSelection(page);
  // Apply is refused while nothing is selected.
  await expect(page.locator('[data-testid="tpl-apply"]')).toBeDisabled();

  // Check exactly ONE case and leave its suite checkbox alone. The suite must
  // still be created, or the case would have nowhere to land.
  await page.click('[data-testid="tpl-case-verify-token-single-use"]');
  const count = page.locator('[data-testid="tpl-count"]');
  await expect(count).toContainText("1 suite ");
  await expect(count).toContainText("1 test case");
  await expect(page.locator('[data-testid="tpl-apply"]')).toBeEnabled();

  await page.click('[data-testid="tpl-apply"]');
  await page.waitForURL("**/projects/**applied=1**");
  await expect(
    page.locator('[data-testid="template-applied-banner"]'),
  ).toContainText("Added 1 test case");
  await expect(
    page.getByText("A verification link cannot be used twice"),
  ).toBeVisible();
});

test(`TC-${TC}-148 Templates: variables rename the suite, and a VIEWER cannot apply`, async ({
  page,
}) => {
  await login(page);
  await page.goto(`/projects/${E2E.projectSlug}/templates/crud-entity`);

  // The CRUD pack is written against {{ENTITY}}; typing a name must rewrite
  // the tree live, not only on the server.
  await expect(page.getByText("Create Item with valid values")).toBeVisible();
  await page.fill('[data-testid="tpl-var-ENTITY"]', "Invoice");
  await page.fill('[data-testid="tpl-var-ENTITIES"]', "Invoices");
  await expect(page.getByText("Create Invoice with valid values")).toBeVisible();
  await expect(page.getByText("Read & List Invoices")).toBeVisible();

  await clearSelection(page);
  await page.click('[data-testid="tpl-case-crud-create-valid"]');
  await page.click('[data-testid="tpl-apply"]');
  await page.waitForURL("**/projects/**applied=1**");
  // The substituted name is what was persisted, not the placeholder.
  await expect(page.getByText("Create Invoice with valid values")).toBeVisible();

  // A VIEWER may browse the library but not apply from it — and the button is
  // disabled rather than the page being hidden, so they can still see what
  // exists.
  await page.goto("/api/auth/signout").catch(() => {});
  await page.context().clearCookies();
  await login(page, E2E.teammateEmail, E2E.teammatePassword);
  await page.goto(`/projects/${E2E.projectSlug}/templates`);
  await expect(page.locator('[data-testid="templates-readonly"]')).toBeVisible();
  await page.goto(`/projects/${E2E.projectSlug}/templates/crud-entity`);
  await expect(page.locator('[data-testid="tpl-apply"]')).toBeDisabled();
});
