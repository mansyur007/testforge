import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// F-01 Attachments: upload via the hidden file input on a case detail page,
// verify inline serving, then delete. Uses a generated 1×1 PNG buffer so no
// fixture file is needed.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

test(`TC-${TC}-5 Attachment upload, view, and delete on case detail`, async ({
  page,
}) => {
  await login(page);

  // Open the first test case of the fixture project. Resolve its id via the
  // API (session cookie authenticates) — clicking the first `/cases/` link on
  // the list page is ambiguous (it can be the "New Test Case" button).
  const list = await page.request.get(
    `/api/v1/projects/${E2E.projectSlug}/cases?limit=1`
  );
  expect(list.status()).toBe(200);
  const caseId = (await list.json()).data[0].id as string;
  await page.goto(`/projects/${E2E.projectSlug}/cases/${caseId}`);

  // Upload a PNG through the dropzone's hidden input.
  await page.setInputFiles('[data-testid="attachment-input"]', {
    name: "evidence.png",
    mimeType: "image/png",
    buffer: PNG_1PX,
  });
  const item = page.locator('[data-testid="attachment-item"]');
  await expect(item).toHaveCount(1);

  // The stored file must be served back inline as an image.
  const src = await item.locator("img").getAttribute("src");
  expect(src).toContain("/api/attachments/");
  const res = await page.request.get(src!);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
  expect(res.headers()["content-disposition"]).toContain("inline");

  // Delete it (native confirm dialog) and verify it is gone — both in the UI
  // and at the download URL.
  page.on("dialog", (d) => d.accept());
  await item.hover();
  await item.getByRole("button", { name: /delete/i }).click();
  await expect(item).toHaveCount(0);
  const gone = await page.request.get(src!);
  expect(gone.status()).toBe(404);
});
