import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-43 Mobile responsiveness audit. F-36 covered the shell and the run executor
// (see pwa-mobile.spec.ts); this locks the *rest* of the app at 375×812 — nine
// routes used to push the page wider than the viewport, forcing a phone user to
// pan sideways to reach half the UI.
//
// The assertion is deliberately the same one F-36 used: documentElement's
// scrollWidth must not exceed its clientWidth. It is the one check that cannot
// be satisfied by accident, and it fails loudly the moment someone adds a fixed
// width, a nowrap row, or an unwrapped table.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();
const PHONE = { width: 375, height: 812 };

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

const overflowOf = (page: Page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
  );

test(`TC-${TC}-83 Responsive: no horizontal overflow on any core route at 375px`, async ({
  page,
}) => {
  await page.setViewportSize(PHONE);
  await login(page);

  const slug = E2E.projectSlug;
  const routes = [
    "/dashboard",
    "/my-work",
    "/projects",
    `/projects/${slug}`, // suite rail + cases table
    `/projects/${slug}/runs`, // milestone form
    `/projects/${slug}/reports`, // trend chart + flaky list
    `/projects/${slug}/requirements`, // add-requirement form
    `/projects/${slug}/fields`, // environments form
    `/projects/${slug}/import`, // importer tab strip
    `/projects/${slug}/api`, // curl samples
    "/settings/account",
    "/",
  ];

  for (const route of routes) {
    await page.goto(route, { waitUntil: "networkidle" });
    expect(await overflowOf(page), `horizontal overflow on ${route}`).toBeLessThanOrEqual(1);
  }
});

test(`TC-${TC}-84 Responsive: case detail fits a phone and wide tables scroll in place`, async ({
  page,
}) => {
  await page.setViewportSize(PHONE);
  await login(page);

  const slug = E2E.projectSlug;

  // A case whose title is long enough to blow out a truncating flex row, and
  // long enough to make the dependency <select>'s option labels wide.
  const title = `Responsive overflow probe with a deliberately very long title ${Date.now()}`;
  const res = await page.request.post(`/api/v1/projects/${slug}/cases`, {
    data: { title, steps: [{ action: "open", expected: "ok" }] },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  const created = (await res.json()) as { id: string };

  await page.goto(`/projects/${slug}/cases/${created.id}`, {
    waitUntil: "networkidle",
  });
  expect(await overflowOf(page)).toBeLessThanOrEqual(1);

  // The cases table is wider than a phone by design — the requirement is that it
  // scrolls inside its own box rather than widening the page. Before F-43 its
  // wrapper was `overflow-hidden`, which hid the right-hand columns outright.
  await page.goto(`/projects/${slug}`, { waitUntil: "networkidle" });
  expect(await overflowOf(page)).toBeLessThanOrEqual(1);

  const wrapper = page.locator("table").first().locator("..");
  const contained = await wrapper.evaluate((el) => ({
    overflowX: getComputedStyle(el).overflowX,
    fitsViewport: el.getBoundingClientRect().width <= window.innerWidth + 1,
  }));
  expect(contained.overflowX).not.toBe("hidden");
  expect(contained.fitsViewport).toBe(true);
});

test(`TC-${TC}-85 Responsive: desktop layout is unchanged at 1280px`, async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await login(page);

  // The suite rail and the case list stay side by side from md up — F-43 only
  // stacks them below the breakpoint, so this is the no-regression guard.
  await page.goto(`/projects/${E2E.projectSlug}`, { waitUntil: "networkidle" });

  const rail = page.locator("main aside").first();
  const railBox = await rail.boundingBox();
  expect(railBox!.width).toBe(256); // w-64

  const list = await rail.evaluate((el) => {
    const sibling = el.nextElementSibling as HTMLElement;
    return { x: sibling.getBoundingClientRect().x, top: sibling.getBoundingClientRect().y };
  });
  // Side by side: the list starts to the right of the rail, not underneath it.
  expect(list.x).toBeGreaterThan(railBox!.x + railBox!.width);
  expect(Math.abs(list.top - railBox!.y)).toBeLessThan(4);

  // The <md disclosure must not leak upward: no toggle, and the whole rail is
  // open with no interaction. The rail's own default state is "closed", so if
  // the md: overrides ever break, everything below is invisible on desktop.
  await expect(page.locator('[data-testid="suite-rail-toggle"]')).toBeHidden();
  await expect(page.locator("#suite-rail-panel")).toBeVisible();
  // The tree renders even with no suites; the search box above it does not.
  await expect(page.getByRole("tree", { name: "Test suites" })).toBeVisible();
  await expect(page.locator('[data-testid="shared-steps-link"]')).toBeVisible();

  expect(await overflowOf(page)).toBeLessThanOrEqual(1);
});

test(`TC-${TC}-86 Responsive: the suite rail is a collapsed disclosure at 375px`, async ({
  page,
}) => {
  await page.setViewportSize(PHONE);
  await login(page);

  await page.goto(`/projects/${E2E.projectSlug}`, { waitUntil: "networkidle" });

  const toggle = page.locator('[data-testid="suite-rail-toggle"]');
  const panel = page.locator("#suite-rail-panel");
  const sharedSteps = page.locator('[data-testid="shared-steps-link"]');
  const rail = page.locator("main aside").first();
  const table = page.locator("table").first();

  // Collapsed by default — the tree, the new-suite form and the Shared Steps
  // card are all behind the one tap.
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(panel).toBeHidden();
  await expect(sharedSteps).toBeHidden();

  // The reason for the change: F-43's stacked rail was ~630px tall, so it alone
  // pushed the cases table most of a screen down. Closed, it is one header row.
  const closedRail = await rail.boundingBox();
  expect(closedRail!.height).toBeLessThan(120);
  const closedTableTop = (await table.boundingBox())!.y;

  // Tapping opens it, and an open rail still doesn't widen the page.
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(panel).toBeVisible();
  await expect(sharedSteps).toBeVisible();
  expect(await overflowOf(page)).toBeLessThanOrEqual(1);

  // How much vertical space the collapse actually buys. Asserted as a delta,
  // not as "the table is above the fold": what still sits between the rail and
  // the table (toolbar, and mostly SuiteFolderGrid — ~570px with 8 root suites
  // in the e2e fixture) is other components' height, not this one's.
  const openTableTop = (await table.boundingBox())!.y;
  expect(openTableTop - closedTableTop).toBeGreaterThan(400);

  // …and tapping again closes it.
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(panel).toBeHidden();
});

test(`TC-${TC}-87 Responsive: the case toolbar lays out in flush rows at 375px`, async ({
  page,
}) => {
  await page.setViewportSize(PHONE);
  await login(page);
  await page.goto(`/projects/${E2E.projectSlug}?v=all`, {
    waitUntil: "networkidle",
  });

  const search = page.locator('input[name="q"]');
  const priority = page.locator('select[name="priority"]');
  const type = page.locator('select[name="type"]');

  const [searchBox, priorityBox, typeBox] = await Promise.all([
    search.boundingBox(),
    priority.boundingBox(),
    type.boundingBox(),
  ]);

  // The old failure mode: the search input kept its desktop w-48 (192px) and sat
  // stranded mid-row with a select crammed beside it. On a phone it owns its
  // line — measured against the row below it, which spans the toolbar's width.
  const rowWidth = typeBox!.x + typeBox!.width - priorityBox!.x;
  expect(searchBox!.width).toBeGreaterThan(rowWidth * 0.95);

  // The two selects share the next line rather than one wrapping away alone.
  expect(Math.abs(priorityBox!.y - typeBox!.y)).toBeLessThan(2);
  expect(priorityBox!.y).toBeGreaterThan(searchBox!.y);

  expect(await overflowOf(page)).toBeLessThanOrEqual(1);

  // Desktop keeps the original w-48 search — the mobile rules are max-md: only.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/projects/${E2E.projectSlug}?v=all`, {
    waitUntil: "networkidle",
  });
  expect((await search.boundingBox())!.width).toBe(192);
});
