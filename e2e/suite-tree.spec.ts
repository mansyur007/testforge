import { PrismaClient } from "@prisma/client";
import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// Sidebar suite folder tree: rekursif tanpa batas kedalaman (dulu dipaksa 2
// level, jadi cucu hilang diam-diam dari sidebar meski ada di DB).
//
// Isolasi: spec ini punya project sendiri per run — tree-nya harus deterministik,
// dan project e2e bersama diutak-atik spec lain.
const db = new PrismaClient();

type Tree = {
  slug: string;
  root: string;
  level2: string;
  level3: string;
  level4: string;
};

/** Project privat berisi rantai suite sedalam 4 tingkat + satu saudara. */
async function seedTree(): Promise<Tree> {
  const admin = await db.user.findUniqueOrThrow({
    where: { email: E2E.email },
    select: { id: true },
  });
  const slug = `tree-${Date.now()}`;
  const project = await db.project.create({
    data: {
      name: `Suite tree ${slug}`,
      slug,
      createdById: admin.id,
      members: { create: { userId: admin.id, role: "OWNER" } },
    },
    select: { id: true },
  });
  const mk = async (name: string, parentId: string | null, order: number) =>
    (
      await db.testSuite.create({
        data: { projectId: project.id, parentId, name, order },
        select: { id: true },
      })
    ).id;

  const root = await mk("Tree Root", null, 0);
  const level2 = await mk("Tree Onboarding", root, 0);
  const level3 = await mk("Tree Subfolder", level2, 0);
  const level4 = await mk("Tree Deepest Leaf", level3, 0);
  await mk("Tree Sibling", root, 1);

  return { slug, root, level2, level3, level4 };
}

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

/** Buka semua node lalu tunggu daun terdalam benar-benar terpasang. */
async function expandAll(page: Page, t: Tree) {
  await page.getByRole("button", { name: "Expand all" }).click();
  await expect(page.getByTestId(`suite-link-${t.level4}`)).toBeVisible();
}

test.describe("suite folder tree", () => {
  let t: Tree;

  test.beforeAll(async () => {
    t = await seedTree();
  });

  test.afterAll(async () => {
    await db.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`/projects/${t.slug}`);
  });

  test("renders suites at depth 4 (regresi: dulu berhenti di level 2)", async ({
    page,
  }) => {
    // Default kunjungan pertama: semua node bercabang tertutup.
    await expect(page.getByTestId(`suite-link-${t.root}`)).toBeVisible();
    await expect(page.getByTestId(`suite-link-${t.level2}`)).toBeHidden();

    await expandAll(page, t);
    await expect(page.getByTestId(`suite-link-${t.level3}`)).toBeVisible();
    await expect(page.getByTestId(`suite-link-${t.level4}`)).toHaveText(
      /Tree Deepest Leaf/
    );

    // Daun tidak punya toggle; leluhurnya punya — bukti tree benar-benar
    // rekursif, bukan cuma dua tingkat yang di-hardcode.
    await expect(page.getByTestId(`suite-toggle-${t.level3}`)).toBeVisible();
    await expect(page.getByTestId(`suite-toggle-${t.level4}`)).toHaveCount(0);
  });

  test("collapse di node tengah menyembunyikan seluruh keturunannya", async ({
    page,
  }) => {
    await expandAll(page, t);
    await page.getByTestId(`suite-toggle-${t.level2}`).click();

    await expect(page.getByTestId(`suite-link-${t.level3}`)).toBeHidden();
    await expect(page.getByTestId(`suite-link-${t.level4}`)).toBeHidden();
    // Node yang dikolaps sendiri tetap ada, begitu juga saudaranya.
    await expect(page.getByTestId(`suite-link-${t.level2}`)).toBeVisible();
    await expect(page.getByTestId(`suite-toggle-${t.level2}`)).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  test("search menemukan node terdalam beserta jalur leluhurnya", async ({
    page,
  }) => {
    // Tanpa expand lebih dulu: search harus membuka sendiri hasilnya.
    await expect(page.getByTestId(`suite-link-${t.level4}`)).toBeHidden();
    await page.getByTestId("suite-search").fill("Deepest");

    await expect(page.getByTestId(`suite-link-${t.level4}`)).toBeVisible();
    await expect(page.getByTestId(`suite-link-${t.root}`)).toBeVisible();
    await expect(page.getByTestId(`suite-link-${t.level3}`)).toBeVisible();
    // Cabang yang tidak cocok tersaring keluar (dibatasi ke tree — dropdown
    // parent di form memang menyebut setiap suite).
    await expect(
      page.getByRole("tree").getByText("Tree Sibling")
    ).toHaveCount(0);
  });

  test("state collapse bertahan setelah reload", async ({ page }) => {
    await expandAll(page, t);
    await page.getByTestId(`suite-toggle-${t.level2}`).click();
    await expect(page.getByTestId(`suite-link-${t.level3}`)).toBeHidden();

    await page.reload();

    // Cabang yang dibuka tetap terbuka, yang ditutup tetap tertutup.
    await expect(page.getByTestId(`suite-link-${t.level2}`)).toBeVisible();
    await expect(page.getByTestId(`suite-link-${t.level3}`)).toBeHidden();
  });

  test("cabang menuju suite aktif terbuka otomatis saat mount", async ({
    page,
  }) => {
    // Semua tertutup dulu (state awal + Collapse all untuk memastikan).
    await page.getByRole("button", { name: "Collapse all" }).click();
    await expect(page.getByTestId(`suite-link-${t.level2}`)).toBeHidden();

    await page.goto(`/projects/${t.slug}?suite=${t.level4}`);

    await expect(page.getByTestId(`suite-link-${t.level4}`)).toBeVisible();
    await expect(page.getByTestId(`suite-link-${t.level3}`)).toBeVisible();
  });

  test("grid folder menampilkan isi folder yang sedang dibuka", async ({
    page,
  }) => {
    const grid = page.getByTestId("suite-folder-grid");

    // Tanpa suite aktif: grid berisi suite root.
    await expect(grid.getByTestId(`suite-folder-card-${t.root}`)).toBeVisible();
    await expect(
      grid.getByTestId(`suite-folder-card-${t.level2}`)
    ).toHaveCount(0);

    // Di dalam suite: grid berisi anak langsungnya, bukan cucunya.
    await page.goto(`/projects/${t.slug}?suite=${t.root}`);
    await expect(grid.getByTestId(`suite-folder-card-${t.level2}`)).toBeVisible();
    await expect(
      grid.getByTestId(`suite-folder-card-${t.level3}`)
    ).toHaveCount(0);

    // Suite daun tidak punya folder — grid tidak dirender sama sekali.
    await page.goto(`/projects/${t.slug}?suite=${t.level4}`);
    await expect(grid).toHaveCount(0);
  });

  test("klik kartu folder drill-in dan ikut membuka sidebar", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Collapse all" }).click();
    await expect(page.getByTestId(`suite-link-${t.level2}`)).toBeHidden();

    await page.getByTestId(`suite-folder-card-${t.root}`).click();
    await page.getByTestId(`suite-folder-card-${t.level2}`).click();

    // Grid turun satu tingkat…
    await expect(
      page.getByTestId("suite-folder-grid").getByTestId(
        `suite-folder-card-${t.level3}`
      )
    ).toBeVisible();
    // …dan sidebar membuka jalur ke folder itu berikut isinya.
    await expect(page.getByTestId(`suite-link-${t.level3}`)).toBeVisible();
    await expect(page.getByTestId(`suite-toggle-${t.level2}`)).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  test("klik suite di sidebar ikut meng-expand suite itu", async ({ page }) => {
    await page.getByRole("button", { name: "Collapse all" }).click();
    await expect(page.getByTestId(`suite-link-${t.level2}`)).toBeHidden();

    await page.getByTestId(`suite-link-${t.root}`).click();

    await expect(page.getByTestId(`suite-toggle-${t.root}`)).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    await expect(page.getByTestId(`suite-link-${t.level2}`)).toBeVisible();
  });

  test("dropdown parent menawarkan suite di semua kedalaman", async ({
    page,
  }) => {
    const options = page.locator('select[name="parentId"] option');
    // Guard non-vacuous: root + 4 turunan + "(root suite)".
    await expect(options).toHaveCount(6);
    await expect(options.filter({ hasText: "Tree Deepest Leaf" })).toHaveCount(1);
    await expect(options.filter({ hasText: "Tree Subfolder" })).toHaveCount(1);
  });
});
