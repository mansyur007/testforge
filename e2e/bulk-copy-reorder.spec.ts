import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-24 remainder: bulk move-to-suite already existed (drag onto the sidebar,
// see SuiteDropZone). This covers the two pieces that didn't: drag-reorder
// cases within the table (persisted TestCase.order) and "Copy to project…".
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

type ApiCase = { id: string; seq: number; order: number; title: string; status: string };

async function getCases(page: Page, slug: string) {
  const res = await page.request.get(`/api/v1/projects/${slug}/cases?limit=200`);
  expect(res.status()).toBe(200);
  return (await res.json()).data as ApiCase[];
}

// The API's own list order is cursor-stable (always seq) and deliberately
// untouched by drag-reorder — mirror the UI's default sort (order, seq)
// client-side to check what a page load would actually render.
function byOrderThenSeq(cases: ApiCase[]) {
  return [...cases].sort((a, b) => a.order - b.order || a.seq - b.seq);
}

// Native HTML5 drag-and-drop (draggable + dragstart/dragover/drop) doesn't
// fire from Playwright's locator.dragTo() — it drives plain mouse events,
// which Chromium's real DnD subsystem ignores. Dispatch the DragEvents by
// hand instead, same approach used to verify this manually in the browser.
async function dragRowOnto(page: Page, sourceId: string, targetId: string) {
  await page.evaluate(
    ([sourceSel, targetSel]) => {
      const source = document.querySelector(sourceSel);
      const target = document.querySelector(targetSel);
      if (!source || !target) throw new Error("row not found");
      const dt = new DataTransfer();
      const rect = target.getBoundingClientRect();
      source.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: dt }));
      target.dispatchEvent(
        new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt, clientY: rect.top + 2, clientX: rect.left + 10 })
      );
      target.dispatchEvent(
        new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt, clientY: rect.top + 2, clientX: rect.left + 10 })
      );
    },
    [`[data-testid="case-row-${sourceId}"]`, `[data-testid="case-row-${targetId}"]`]
  );
}

test(`TC-${TC}-25 Drag-reorder persists via the order,seq default sort`, async ({
  page,
}) => {
  await login(page);
  // ?v=all bypasses any leftover default saved view from other specs.
  await page.goto(`/projects/${E2E.projectSlug}?v=all`);
  await page.selectOption('[data-testid="cases-page-size"]', "100");

  const cases = await getCases(page, E2E.projectSlug);
  const dashboardCase = cases.find((c) => c.title === "Dashboard renders in English");
  const loginCase = cases.find((c) => c.title === "Valid login redirects to dashboard");
  expect(dashboardCase).toBeTruthy();
  expect(loginCase).toBeTruthy();

  // "Dashboard renders in English" (seq 4) starts after "Valid login…" (seq
  // 1) under the default order,seq sort. Drag it above to reorder.
  await dragRowOnto(page, dashboardCase!.id, loginCase!.id);

  await expect(async () => {
    const after = await getCases(page, E2E.projectSlug);
    expect(byOrderThenSeq(after)[0].id).toBe(dashboardCase!.id);
  }).toPass({ timeout: 10_000 });
});

test(`TC-${TC}-26 Copy to project duplicates as drafts in the target project`, async ({
  page,
}) => {
  await login(page);
  await page.goto(`/projects/${E2E.projectSlug}?v=all`);
  await page.selectOption('[data-testid="cases-page-size"]', "100");

  const before = await getCases(page, E2E.targetProjectSlug);
  const beforeCount = before.length;

  const cases = await getCases(page, E2E.projectSlug);
  const toCopy = cases.filter((c) =>
    ["Valid login redirects to dashboard", "Change password succeeds"].includes(c.title)
  );
  expect(toCopy.length).toBe(2);

  for (const c of toCopy) {
    await page.check(`[data-testid="case-checkbox-${c.id}"]`);
  }
  await page.click('[data-testid="cases-bulk-copy"]');
  await page.selectOption('[data-testid="cases-copy-target"]', { label: "E2E Target" });
  await page.click('[data-testid="cases-copy-confirm"]');

  await expect(page.getByText(/Copied 2 test cases? to/)).toBeVisible();

  const after = await getCases(page, E2E.targetProjectSlug);
  expect(after.length).toBe(beforeCount + 2);
  const copied = after.slice(-2);
  expect(copied.every((c) => c.status === "DRAFT")).toBe(true);
  expect(copied.map((c) => c.title).sort()).toEqual(
    ["Change password succeeds", "Valid login redirects to dashboard"].sort()
  );
});
