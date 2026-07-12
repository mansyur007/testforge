import http from "node:http";
import type { AddressInfo } from "node:net";
import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-16 Comments & @mentions: flat thread on a case, @mention autocomplete that
// delivers a notification with a deep link, VIEWER may comment, and a stored
// XSS payload is inert.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

async function firstCaseUrl(page: Page): Promise<string> {
  const res = await page.request.get(
    `/api/v1/projects/${E2E.projectSlug}/cases?limit=1`
  );
  const id = (await res.json()).data[0].id;
  return `/projects/${E2E.projectSlug}/cases/${id}`;
}

type Delivery = { path: string; body: Record<string, unknown> };
function startReceiver(): Promise<{
  url: string;
  deliveries: Delivery[];
  close: () => Promise<void>;
}> {
  const deliveries: Delivery[] = [];
  const server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try {
        deliveries.push({ path: req.url ?? "", body: JSON.parse(raw) });
      } catch {
        deliveries.push({ path: req.url ?? "", body: { raw } });
      }
      res.writeHead(200).end("ok");
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        url: `http://127.0.0.1:${port}`,
        deliveries,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}

test(`TC-${TC}-34 Comment lifecycle on a case: post, edit, delete, XSS inert`, async ({
  page,
}) => {
  const ts = Date.now();
  await loginAs(page, E2E.email, E2E.password);
  await page.goto(await firstCaseUrl(page));

  const panel = page.locator('[data-testid="comment-panel"]');
  await expect(panel).toBeVisible();

  // Post a comment with a stored-XSS attempt — it must render inert (the
  // sanitized markdown renderer never emits a live <script> or onerror).
  const body = `First note ${ts} <script>window.__xss=1</script> **bold**`;
  await panel.locator('[data-testid="comment-input"]').last().fill(body);
  await panel.locator('[data-testid="comment-submit"]').last().click();

  const item = page.locator('[data-testid="comment-item"]').first();
  await expect(item).toContainText(`First note ${ts}`);
  await expect(item.locator("strong")).toHaveText("bold"); // markdown rendered
  await expect(item.locator("script")).toHaveCount(0); // script inert
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();

  // Edit it.
  await item.getByRole("button", { name: "Edit" }).click();
  await item.locator('[data-testid="comment-input"]').fill(`Edited ${ts}`);
  await item.getByRole("button", { name: "Save" }).click();
  await expect(item).toContainText(`Edited ${ts}`);
  await expect(item).toContainText("edited");

  // Delete it (soft delete → tombstone text, row stays).
  page.on("dialog", (d) => d.accept());
  await item.locator('[data-testid="comment-delete"]').click();
  await expect(page.locator('[data-testid="comment-item"]').first()).toContainText(
    "This comment was deleted."
  );
});

test(`TC-${TC}-35 @mention renders a chip and delivers a notification with a deep link`, async ({
  page,
}) => {
  const receiver = await startReceiver();
  const ts = Date.now();
  const channelName = `#mentions-${ts}`;
  try {
    await loginAs(page, E2E.email, E2E.password);

    // Channel subscribed ONLY to comment.mentioned.
    await page.goto(`/projects/${E2E.projectSlug}/notifications`);
    await page.fill('[data-testid="channel-name-input"]', channelName);
    await page.fill('[data-testid="channel-url-input"]', `${receiver.url}/slack`);
    for (const ev of [
      "case.created",
      "case.updated",
      "case.deleted",
      "case.assigned",
      "run.created",
      "run.completed",
      "result.failed",
      "issue.created",
      "plan.created",
      "plan.completed",
      "milestone.completed",
      "comment.created",
    ])
      await page.uncheck(`input[name="events"][value="${ev}"]`);
    await page.click('[data-testid="channel-form-submit"]');
    await expect(
      page.locator(`[data-testid="channel-row-${channelName}"]`)
    ).toBeVisible();

    const caseUrl = await firstCaseUrl(page);
    await page.goto(caseUrl);
    const panel = page.locator('[data-testid="comment-panel"]');
    const input = panel.locator('[data-testid="comment-input"]').last();

    // Type a mention: the autocomplete resolves the VIEWER teammate.
    await input.click();
    await input.pressSequentially(`Please review `);
    await input.pressSequentially(`@Teammate`);
    await expect(page.locator('[data-testid="mention-suggestions"]')).toBeVisible();
    await page.locator(`[data-testid="mention-option-${E2E.teammateName}"]`).click();
    await panel.locator('[data-testid="comment-submit"]').last().click();

    // Chip rendered with the member's name.
    await expect(
      page.locator('[data-testid="comment-mention"]').first()
    ).toHaveText(`@${E2E.teammateName}`);

    // Notification delivered, carrying a deep link back to the case.
    await expect
      .poll(() => receiver.deliveries.length, { timeout: 10_000 })
      .toBeGreaterThan(0);
    const payload = JSON.stringify(receiver.deliveries[0].body);
    expect(payload).toContain("mentioned");
    expect(payload).toContain(caseUrl);
  } finally {
    await receiver.close();
  }
});

test(`TC-${TC}-36 A VIEWER may comment`, async ({ page }) => {
  const ts = Date.now();
  await loginAs(page, E2E.teammateEmail, E2E.teammatePassword);
  await page.goto(await firstCaseUrl(page));

  const panel = page.locator('[data-testid="comment-panel"]');
  await expect(panel).toBeVisible();
  await panel.locator('[data-testid="comment-input"]').last().fill(`Viewer note ${ts}`);
  await panel.locator('[data-testid="comment-submit"]').last().click();
  await expect(
    page.locator('[data-testid="comment-item"]').filter({ hasText: `Viewer note ${ts}` })
  ).toBeVisible();
});
