import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-26 Built-in defects: report a defect from the board, move it across
// status columns, then link/report defects straight from a failed run
// result (the "linkable from results" requirement) and confirm the detail
// page's linked-items list picks it up.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-65 Defects: board create/status-move, link + report from a failed result`, async ({
  page,
}) => {
  const ts = Date.now();
  await login(page);

  // 1. Report a defect from the board.
  const title = `Login button misaligned on Safari ${ts}`;
  await page.goto(`/projects/${E2E.projectSlug}/defects`);
  await page.fill('[data-testid="defect-title-input"]', title);
  await page.selectOption('[data-testid="defect-severity-input"]', "HIGH");
  await page.click('[data-testid="defect-create-button"]');
  await page.waitForURL("**/defects/**");
  const defectUrl = page.url();
  const defectId = defectUrl.split("/defects/")[1];

  // 2. It shows up under OPEN on the board.
  await page.goto(`/projects/${E2E.projectSlug}/defects`);
  await expect(page.locator('[data-testid="defect-column-OPEN"]')).toContainText(title);

  // 3. Move it to CONFIRMED via the inline status select.
  await page.selectOption(`[data-testid="defect-status-select-${defectId}"]`, "CONFIRMED");
  await expect(page.locator('[data-testid="defect-column-CONFIRMED"]')).toContainText(title, {
    timeout: 10_000,
  });
  await expect(page.locator('[data-testid="defect-column-OPEN"]')).not.toContainText(title);

  // 4. Create a run with a single case and record a FAILED result via the API.
  const casesRes = await page.request.get(`/api/v1/projects/${E2E.projectSlug}/cases`);
  const cases = (await casesRes.json()).data as { id: string; title: string }[];
  const targetCase = cases[0];
  const runRes = await page.request.post(`/api/v1/projects/${E2E.projectSlug}/runs`, {
    data: { name: `Defect-link run ${ts}`, caseIds: [targetCase.id] },
  });
  const run = await runRes.json();
  await page.request.post(`/api/v1/projects/${E2E.projectSlug}/runs/${run.id}/results`, {
    data: { caseId: targetCase.id, status: "FAILED" },
  });

  // 5. Report a NEW defect straight from the failed result.
  await page.goto(`/projects/${E2E.projectSlug}/runs/${run.id}`);
  await page.click('[data-testid="defect-new-open"]');
  const resultDefectTitle = `Assertion failure in ${targetCase.title} ${ts}`;
  await page.fill('[data-testid="defect-new-title"]', resultDefectTitle);
  await page.click('[data-testid="defect-new-submit"]');
  await expect(page.locator('[data-testid="defect-badges"] a')).toHaveCount(1);

  // 6. Link the EARLIER (CONFIRMED) defect to the same result too.
  await page.click('[data-testid="defect-link-open"]');
  await page.selectOption('[data-testid="defect-link-select"]', defectId);
  await page.click('[data-testid="defect-link-submit"]');
  await expect(page.locator('[data-testid="defect-badges"] a')).toHaveCount(2);

  // 7. The CONFIRMED defect's detail page now lists this run in its links.
  await page.goto(defectUrl);
  await expect(page.locator('[data-testid="defect-links-list"]')).toContainText(run.name);

  // 8. Delete the CONFIRMED defect from its detail page; board no longer shows it.
  await page.click('[data-testid="defect-delete-button"]');
  await page.waitForURL("**/defects");
  await expect(page.getByText(title)).toHaveCount(0);
});
