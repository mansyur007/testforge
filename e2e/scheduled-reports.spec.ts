import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-17 Scheduled email reports: create a DAILY schedule on the Notifications
// page, fire the cron route (shared secret) — first hit sends (due), second
// hit skips (already sent today) — then confirm "last sent" and delete.
// SMTP is unconfigured in e2e, so sendMail logs and reports sent:0; the
// schedule's cadence bookkeeping is what's under test.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();
const CRON_AUTH = { Authorization: "Bearer e2e-cron-secret" };

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-43 Scheduled reports: create, cron sends once per day, delete`, async ({
  page,
}) => {
  await login(page);

  // 1. Create a DAILY schedule.
  await page.goto(`/projects/${E2E.projectSlug}/notifications`);
  await page.selectOption('[data-testid="report-schedule-cron-select"]', "DAILY");
  await page.fill(
    '[data-testid="report-schedule-recipients-input"]',
    "qa-lead@example.com, not-an-email, dev@example.com"
  );
  await page.click('[data-testid="report-schedule-create-button"]');
  const row = page.locator('[data-testid^="report-schedule-row-"]').first();
  await expect(row).toBeVisible();
  await expect(row).toContainText("never sent");
  // Invalid entry filtered out: 2 valid recipients -> "+1" suffix.
  await expect(row).toContainText("qa-lead@example.com +1");
  const scheduleId = (await row.getAttribute("data-testid"))!.replace(
    "report-schedule-row-",
    ""
  );

  // 2. Unauthenticated cron call is rejected.
  const unauth = await page.request.get("/api/cron/send-reports");
  expect(unauth.status()).toBe(401);

  // 3. First authorized hit: due, both recipients processed.
  const first = await page.request.get("/api/cron/send-reports", {
    headers: CRON_AUTH,
  });
  expect(first.status()).toBe(200);
  const firstBody = (await first.json()).schedules as {
    scheduleId: string;
    due: boolean;
    recipients: number;
  }[];
  const mine = firstBody.find((s) => s.scheduleId === scheduleId)!;
  expect(mine.due).toBe(true);
  expect(mine.recipients).toBe(2);

  // 4. Second hit the same day: no longer due.
  const second = await page.request.get("/api/cron/send-reports", {
    headers: CRON_AUTH,
  });
  const secondBody = (await second.json()).schedules as {
    scheduleId: string;
    due: boolean;
  }[];
  expect(secondBody.find((s) => s.scheduleId === scheduleId)!.due).toBe(false);

  // 5. UI now shows last sent; delete the schedule.
  await page.reload();
  await expect(
    page.locator(`[data-testid="report-schedule-row-${scheduleId}"]`)
  ).toContainText("last sent");
  await page.click(`[data-testid="report-schedule-delete-${scheduleId}"]`);
  await expect(
    page.locator(`[data-testid="report-schedule-row-${scheduleId}"]`)
  ).toHaveCount(0);
});
