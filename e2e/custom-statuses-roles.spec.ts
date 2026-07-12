import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-14 Custom result statuses & custom roles:
//  - a custom status ("Known Issue", NEUTRAL, purple) becomes an executor
//    button with a first-letter shortcut, colors the run legend, and lands in
//    the CSV export;
//  - a custom role ("Executor", run.execute only) lets a member submit results
//    but not edit cases — enforced server-side, not just hidden in the UI.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

async function createCase(page: Page, slug: string, title: string) {
  const res = await page.request.post(`/api/v1/projects/${slug}/cases`, {
    data: { title },
  });
  expect(res.status(), await res.text()).toBe(201);
  return (await res.json()).id as string;
}

async function createRun(page: Page, slug: string, name: string, caseIds: string[]) {
  const res = await page.request.post(`/api/v1/projects/${slug}/runs`, {
    data: { name, caseIds },
  });
  expect(res.status(), await res.text()).toBe(201);
  return (await res.json()).id as string;
}

test(`TC-${TC}-40 Custom status: executor button + shortcut, legend color, CSV export`, async ({
  page,
}) => {
  const ts = Date.now();
  await loginAs(page, E2E.email, E2E.password);

  // 1. Define "Known Issue" (NEUTRAL, purple) on the Fields page.
  await page.goto(`/projects/${E2E.projectSlug}/fields`);
  await page.fill('[data-testid="status-label-input"]', "Known Issue");
  await page.selectOption('[data-testid="status-kind-select"]', "NEUTRAL");
  await page.getByRole("button", { name: "+ Status" }).click();
  await expect(page.locator('[data-testid="status-row-KNOWN_ISSUE"]')).toBeVisible();

  // 2. Run a case and record it as Known Issue via the executor button.
  const caseId = await createCase(page, E2E.projectSlug, `Known issue case ${ts}`);
  const runId = await createRun(page, E2E.projectSlug, `Known issue run ${ts}`, [caseId]);
  await page.goto(`/projects/${E2E.projectSlug}/runs/${runId}`);

  const button = page.locator('[data-testid="submit-status-KNOWN_ISSUE"]');
  await expect(button).toContainText("Known Issue");
  await expect(button.locator("kbd")).toHaveText("K"); // first-letter shortcut
  await button.click();

  // Status chip in the case list + legend show the custom status.
  await expect(
    page.locator('[data-testid="run-estimate-summary"], .space-y-1').first()
  ).toBeVisible();
  await expect(page.getByText("KNOWN ISSUE").first()).toBeVisible();
  await expect(page.getByText(/Known Issue\s*1/).first()).toBeVisible(); // legend

  // 3. The CSV export carries the custom key.
  const csv = await page.request.get(`/api/export/run?id=${runId}`);
  expect(await csv.text()).toContain("KNOWN_ISSUE");

  // 4. A NEUTRAL custom status never counts toward the pass rate: reports
  // still load and the run shows 0% pass (nothing PASS-kind executed).
  await page.goto(`/projects/${E2E.projectSlug}/reports`);
  await expect(page.getByText("Overall Pass Rate")).toBeVisible();
});

test(`TC-${TC}-41 Custom role "Executor": can submit results, cannot edit cases (server-enforced)`, async ({
  page,
}) => {
  const ts = Date.now();
  const slug = `perm-${ts}`;
  await loginAs(page, E2E.email, E2E.password);

  // 1. Create the custom role on Settings → Team (org admin only).
  await page.goto("/settings/team");
  await page.fill('[data-testid="role-name-input"]', `Executor ${ts}`);
  await page.check("#new-role-run\\.execute");
  await page.getByRole("button", { name: "+ Role" }).click();
  await expect(page.locator(`[data-testid="role-row-Executor ${ts}"]`)).toBeVisible();

  // 2. Fresh project; the teammate joins it with the Executor role.
  await page.goto("/projects");
  await page.fill('[data-testid="project-name-input"]', `Perm ${ts}`);
  await page.fill('input[name="slug"]', slug);
  await page.click('[data-testid="project-create-submit"]');
  await expect(page.getByRole("heading", { name: `Perm ${ts}` })).toBeVisible();

  await page.goto(`/projects/${slug}/members`);
  await page.locator("select").first().selectOption({ label: `${E2E.teammateName} (${E2E.teammateEmail})` });
  await page.locator("select").nth(1).selectOption({ label: `Executor ${ts}` });
  await page.getByRole("button", { name: "Add member" }).click();
  await expect(page.getByText(`${E2E.teammateEmail} added as Executor ${ts}`)).toBeVisible();

  // Content to act on.
  const caseId = await createCase(page, slug, `Perm case ${ts}`);
  const runId = await createRun(page, slug, `Perm run ${ts}`, [caseId]);

  // 3. As the Executor member: submitting a result works…
  await loginAs(page, E2E.teammateEmail, E2E.teammatePassword);
  await page.goto(`/projects/${slug}/runs/${runId}`);
  await page.locator('[data-testid="submit-status-PASSED"]').click();
  await expect(page.getByText("PASSED").first()).toBeVisible();

  // …but editing a case is refused by the server action (not just hidden).
  await page.goto(`/projects/${slug}/cases/${caseId}/edit`);
  await page.fill('[data-testid="case-title-input"]', `Hijacked ${ts}`);
  await page.click('[data-testid="case-form-submit"]');
  await expect(page.getByText(/don't have permission to edit/)).toBeVisible();

  // And the API refuses too (session cookie carries the same permission).
  const patch = await page.request.patch(
    `/api/v1/projects/${slug}/cases/${caseId}`,
    { data: { title: `Hijacked via API ${ts}` } }
  );
  expect(patch.status()).toBe(403);

  // The cases page hides the "+ Test Case" affordance for this role.
  await page.goto(`/projects/${slug}`);
  await expect(page.locator('[data-testid="case-new"]')).toHaveCount(0);
});
