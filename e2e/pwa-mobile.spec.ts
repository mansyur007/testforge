import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-36 Mobile execution PWA: Part A (installability), Part C (offline result
// queue), Part D (mobile executor layout). Part B (service worker) is a manual
// prod-image check — the SW never registers in dev, so it's noted in the PR,
// not asserted here.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

async function api<T>(page: Page, url: string, data: unknown): Promise<T> {
  const res = await page.request.post(url, { data });
  expect(res.ok(), await res.text()).toBeTruthy();
  return res.json();
}

test(`TC-${TC}-74 PWA Part A: manifest + icons served and installable`, async ({
  page,
}) => {
  const manifest = await page.request.get("/manifest.webmanifest");
  expect(manifest.status()).toBe(200);
  const body = await manifest.json();
  expect(body.name).toBe("TestForge");
  expect(body.display).toBe("standalone");
  expect(body.start_url).toBe("/dashboard");
  // A 192, a 512, and a maskable 512.
  expect(body.icons.length).toBeGreaterThanOrEqual(3);
  expect(body.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(
    true
  );
  for (const icon of body.icons) {
    const res = await page.request.get(icon.src);
    expect(res.status(), icon.src).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  }
});

test(`TC-${TC}-75 PWA Part C: offline result queue — enqueue offline, auto-flush online`, async ({
  page,
  context,
}) => {
  const ts = Date.now();
  await login(page);

  const cases = await Promise.all(
    ["A", "B", "C"].map((n) =>
      api<{ id: string; displayId: string }>(
        page,
        `/api/v1/projects/${E2E.projectSlug}/cases`,
        { title: `Offline case ${n} ${ts}`, steps: [{ action: "do", expected: "ok" }] }
      )
    )
  );
  const run = await api<{ id: string }>(
    page,
    `/api/v1/projects/${E2E.projectSlug}/runs`,
    { name: `Offline run ${ts}`, caseIds: cases.map((c) => c.id) }
  );

  await page.goto(`/projects/${E2E.projectSlug}/runs/${run.id}`);
  await expect(page.locator('[data-testid="submit-status-PASSED"]')).toBeVisible();

  // Go offline and record all three results. Each submit fails the direct POST
  // and is queued — a chip per row and a header pill.
  await context.setOffline(true);
  await page.locator('[data-testid="submit-status-PASSED"]').click(); // case A → advance
  await page.locator('[data-testid="submit-status-PASSED"]').click(); // case B → advance
  await page.locator('[data-testid="submit-status-FAILED"]').click(); // case C

  // All three are queued (chip per row + header pill) — proof nothing was
  // submitted directly while offline.
  await expect(page.locator('[data-testid="queue-pill"]')).toContainText(
    "3 queued"
  );
  await expect(page.locator('[data-testid="queued-chip"]')).toHaveCount(3);

  // Back online + fire the `online` event → the queue drains in order.
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));

  await expect(page.locator('[data-testid="queued-chip"]')).toHaveCount(0, {
    timeout: 10_000,
  });
  await expect(page.locator('[data-testid="queue-pill"]')).toContainText(
    "All changes synced"
  );

  // The run's status tally now reflects the drained queue (2 PASSED, 1 FAILED).
  await expect
    .poll(async () => {
      const res = await page.request.get(
        `/api/v1/projects/${E2E.projectSlug}/runs/${run.id}`
      );
      const stats = (await res.json()).stats ?? {};
      return [stats.PASSED ?? 0, stats.FAILED ?? 0];
    })
    .toEqual([2, 1]);
});

test(`TC-${TC}-76 PWA Part D: mobile executor layout at 375×812`, async ({
  page,
}) => {
  const ts = Date.now();
  await login(page);

  const cases = await Promise.all(
    ["A", "B"].map((n) =>
      api<{ id: string; displayId: string }>(
        page,
        `/api/v1/projects/${E2E.projectSlug}/cases`,
        { title: `Mobile case ${n} ${ts}`, steps: [{ action: "tap", expected: "ok" }] }
      )
    )
  );
  const run = await api<{ id: string }>(
    page,
    `/api/v1/projects/${E2E.projectSlug}/runs`,
    { name: `Mobile run ${ts}`, caseIds: cases.map((c) => c.id) }
  );

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`/projects/${E2E.projectSlug}/runs/${run.id}`);

  // No horizontal scroll on a phone.
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);

  // Desktop rail hidden; mobile chrome present.
  await expect(page.locator('[data-testid="mobile-position"]')).toHaveText("1 / 2");
  await expect(page.locator('[data-testid="mobile-status-bar"]')).toBeVisible();

  // Thumb-zone buttons are ≥ 52 px tall and above the home indicator.
  const box = await page
    .locator('[data-testid="mobile-submit-PASSED"]')
    .boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(52);

  // The bottom sheet opens from the position pill and jumps to a case.
  await page.locator('[data-testid="mobile-position"]').click();
  await expect(page.locator('[data-testid="mobile-sheet"]')).toBeVisible();
  await page
    .locator(`[data-testid="mobile-sheet"]`)
    .getByText(`Mobile case B ${ts}`)
    .click();
  await expect(page.locator('[data-testid="mobile-position"]')).toHaveText("2 / 2");

  // ‹ › fallback navigation.
  await page.locator('[data-testid="mobile-prev"]').click();
  await expect(page.locator('[data-testid="mobile-position"]')).toHaveText("1 / 2");

  // Tapping a thumb-zone status records the result (persists to the server).
  await page.locator('[data-testid="mobile-submit-PASSED"]').click();
  await expect
    .poll(async () => {
      const res = await page.request.get(
        `/api/v1/projects/${E2E.projectSlug}/runs/${run.id}`
      );
      return (await res.json()).stats?.PASSED ?? 0;
    })
    .toBe(1);

  // Desktop ≥768px still shows the keyboard-driven button row.
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.locator('[data-testid="submit-status-PASSED"]')).toBeVisible();
});
