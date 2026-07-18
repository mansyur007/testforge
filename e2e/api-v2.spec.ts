import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { test, expect, request as pwRequest } from "@playwright/test";
import { E2E } from "./global-setup";

// F-33 API v2. Keys are minted directly via Prisma (the UI path is covered by
// its own test below) with a UNIQUE name per run so parallel or repeated runs
// never collide, and are torn down in afterAll.
const db = new PrismaClient();
const RUN = crypto.randomBytes(4).toString("hex");
const keyIds: string[] = [];

type KeyOpts = {
  scope?: "READ" | "WRITE";
  projectSlug?: string;
  rateLimitPerMin?: number;
};

async function mintKey(label: string, opts: KeyOpts = {}) {
  const user = await db.user.findUniqueOrThrow({
    where: { email: E2E.email },
    select: { id: true },
  });
  const projectId = opts.projectSlug
    ? (
        await db.project.findUniqueOrThrow({
          where: { slug: opts.projectSlug },
          select: { id: true },
        })
      ).id
    : null;

  const raw = `tf_${crypto.randomBytes(24).toString("hex")}`;
  const created = await db.apiKey.create({
    data: {
      userId: user.id,
      name: `apiv2-${RUN}-${label}`,
      prefix: raw.slice(0, 11),
      keyHash: crypto.createHash("sha256").update(raw).digest("hex"),
      scope: opts.scope ?? "WRITE",
      projectId,
      rateLimitPerMin: opts.rateLimitPerMin ?? null,
    },
    select: { id: true },
  });
  keyIds.push(created.id);
  return raw;
}

function client(baseURL: string, key: string) {
  return pwRequest.newContext({
    baseURL,
    extraHTTPHeaders: { authorization: `Bearer ${key}` },
  });
}

test.afterAll(async () => {
  await db.apiKey.deleteMany({ where: { id: { in: keyIds } } });
  await db.milestone.deleteMany({ where: { name: { startsWith: `v2-${RUN}` } } });
  await db.environment.deleteMany({ where: { name: { startsWith: `v2-${RUN}` } } });
  await db.webhook.deleteMany({ where: { url: { contains: RUN } } });
  await db.$disconnect();
});

test.describe("API v2", () => {
  test("rejects unauthenticated and unknown-token requests", async ({
    baseURL,
  }) => {
    const anon = await pwRequest.newContext({ baseURL: baseURL! });
    expect((await anon.get(`/api/v2/projects/${E2E.projectSlug}/milestones`)).status()).toBe(401);

    const bogus = await client(baseURL!, "tf_definitely_not_a_real_key");
    const res = await bogus.get(`/api/v2/projects/${E2E.projectSlug}/milestones`);
    expect(res.status()).toBe(401);
    expect((await res.json()).error.code).toBe("unauthorized");
  });

  test("milestone CRUD round-trips, and null clears the due date", async ({
    baseURL,
  }) => {
    const api = await client(baseURL!, await mintKey("crud"));
    const base = `/api/v2/projects/${E2E.projectSlug}/milestones`;

    const created = await api.post(base, {
      data: { name: `v2-${RUN}-release`, dueDate: "2026-09-01T00:00:00.000Z" },
    });
    expect(created.status()).toBe(201);
    const ms = await created.json();
    expect(ms.name).toBe(`v2-${RUN}-release`);
    expect(ms.status).toBe("OPEN");

    const read = await api.get(`${base}/${ms.id}`);
    expect(read.status()).toBe(200);
    expect((await read.json()).runCount).toBe(0);

    const done = await api.patch(`${base}/${ms.id}`, {
      data: { status: "COMPLETED" },
    });
    expect((await done.json()).status).toBe("COMPLETED");

    // An explicit null clears; omitting the key would leave it untouched.
    const cleared = await api.patch(`${base}/${ms.id}`, {
      data: { dueDate: null },
    });
    expect((await cleared.json()).dueDate).toBeNull();

    expect((await api.delete(`${base}/${ms.id}`)).status()).toBe(204);
    expect((await api.get(`${base}/${ms.id}`)).status()).toBe(404);
  });

  test("returns a 422 with per-field details on invalid input", async ({
    baseURL,
  }) => {
    const api = await client(baseURL!, await mintKey("validation"));
    const res = await api.post(`/api/v2/projects/${E2E.projectSlug}/milestones`, {
      data: { name: "   " },
    });
    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("validation_error");
    expect(body.error.details).toContainEqual({
      field: "name",
      message: "name is required",
    });
  });

  test("read-only keys may read but not write", async ({ baseURL }) => {
    const api = await client(baseURL!, await mintKey("ro", { scope: "READ" }));
    const base = `/api/v2/projects/${E2E.projectSlug}/milestones`;

    expect((await api.get(base)).status()).toBe(200);

    const res = await api.post(base, { data: { name: `v2-${RUN}-nope` } });
    expect(res.status()).toBe(403);
    expect((await res.json()).error.message).toContain("read-only");
  });

  test("project-scoped keys are confined to their project", async ({
    baseURL,
  }) => {
    const api = await client(
      baseURL!,
      await mintKey("scoped", { projectSlug: E2E.projectSlug })
    );

    // Same user owns both projects, so only the key's binding can explain the
    // difference between these two responses.
    expect(
      (await api.get(`/api/v2/projects/${E2E.projectSlug}/milestones`)).status()
    ).toBe(200);

    const blocked = await api.get(
      `/api/v2/projects/${E2E.targetProjectSlug}/milestones`
    );
    expect(blocked.status()).toBe(403);
    expect((await blocked.json()).error.message).toContain(
      "scoped to a different project"
    );
  });

  test("enforces the key's own per-minute rate limit", async ({ baseURL }) => {
    const limit = 3;
    const api = await client(
      baseURL!,
      await mintKey("ratelimit", { rateLimitPerMin: limit })
    );
    const url = `/api/v2/projects/${E2E.projectSlug}/milestones`;

    for (let i = 1; i <= limit; i++) {
      const res = await api.get(url);
      expect(res.status()).toBe(200);
      expect(res.headers()["x-ratelimit-limit"]).toBe(String(limit));
      expect(res.headers()["x-ratelimit-remaining"]).toBe(String(limit - i));
    }

    const throttled = await api.get(url);
    expect(throttled.status()).toBe(429);
    expect((await throttled.json()).error.code).toBe("rate_limited");
    expect(Number(throttled.headers()["retry-after"])).toBeGreaterThan(0);

    // A different key must keep its own budget — buckets are per key, not global.
    const other = await client(baseURL!, await mintKey("ratelimit-other"));
    expect((await other.get(url)).status()).toBe(200);
  });

  test("paginates collections with a consistent envelope", async ({
    baseURL,
  }) => {
    const api = await client(baseURL!, await mintKey("paging"));
    const base = `/api/v2/projects/${E2E.projectSlug}/milestones`;

    const names = [`v2-${RUN}-p1`, `v2-${RUN}-p2`, `v2-${RUN}-p3`];
    const createdIds: string[] = [];
    for (const name of names) {
      const res = await api.post(base, { data: { name } });
      expect(res.status()).toBe(201);
      createdIds.push((await res.json()).id);
    }

    const first = await api.get(`${base}?perPage=2&page=1`);
    const firstBody = await first.json();
    expect(firstBody.items.length).toBe(2);
    expect(firstBody.meta.perPage).toBe(2);
    expect(firstBody.meta.total).toBeGreaterThanOrEqual(names.length);
    expect(firstBody.meta.totalPages).toBe(
      Math.ceil(firstBody.meta.total / 2)
    );

    // Walking every page must surface all three, with no id served twice.
    const seen = new Set<string>();
    for (let page = 1; page <= firstBody.meta.totalPages; page++) {
      const body = await (await api.get(`${base}?perPage=2&page=${page}`)).json();
      for (const item of body.items) {
        expect(seen.has(item.id)).toBe(false);
        seen.add(item.id);
      }
    }
    // Every milestone this test created must appear exactly once across the walk.
    for (const id of createdIds) expect(seen).toContain(id);

    // perPage clamps rather than erroring.
    const clamped = await (await api.get(`${base}?perPage=99999`)).json();
    expect(clamped.meta.perPage).toBe(200);
  });

  test("never echoes a webhook secret after creation", async ({ baseURL }) => {
    const api = await client(baseURL!, await mintKey("webhooks"));
    const base = `/api/v2/projects/${E2E.projectSlug}/webhooks`;

    const created = await api.post(base, {
      data: { url: `https://example.com/${RUN}`, events: ["run.completed"] },
    });
    expect(created.status()).toBe(201);
    const hook = await created.json();
    expect(hook.secret).toBeTruthy();
    expect(hook.events).toEqual(["run.completed"]);

    const read = await (await api.get(`${base}/${hook.id}`)).json();
    expect(read.secret).toBeUndefined();

    // Rotation is the only way back to a usable secret, and it changes.
    const rotated = await (
      await api.patch(`${base}/${hook.id}?rotateSecret=true`, { data: {} })
    ).json();
    expect(rotated.secret).toBeTruthy();
    expect(rotated.secret).not.toBe(hook.secret);

    const unknown = await api.post(base, {
      data: { url: `https://example.com/${RUN}`, events: ["nope.not.real"] },
    });
    expect(unknown.status()).toBe(422);

    expect((await api.delete(`${base}/${hook.id}`)).status()).toBe(204);
  });

  test("409s on a duplicate environment name", async ({ baseURL }) => {
    const api = await client(baseURL!, await mintKey("envs"));
    const base = `/api/v2/projects/${E2E.projectSlug}/environments`;
    const name = `v2-${RUN}-staging`;

    const created = await api.post(base, { data: { name } });
    expect(created.status()).toBe(201);

    const dupe = await api.post(base, { data: { name } });
    expect(dupe.status()).toBe(409);
    expect((await dupe.json()).error.code).toBe("conflict");

    await api.delete(`${base}/${(await created.json()).id}`);
  });

  test("publishes a v2 OpenAPI document without credentials", async ({
    baseURL,
  }) => {
    const anon = await pwRequest.newContext({ baseURL: baseURL! });
    const res = await anon.get("/api/v2/openapi");
    expect(res.status()).toBe(200);

    const spec = await res.json();
    expect(spec.openapi).toBe("3.1.0");
    expect(spec.servers[0].url).toBe("/api/v2");

    // Every $ref must resolve, or the generated client would be broken.
    const defined = new Set(Object.keys(spec.components.schemas));
    const refs = new Set<string>();
    (function walk(node: unknown) {
      if (!node || typeof node !== "object") return;
      const obj = node as Record<string, unknown>;
      if (typeof obj.$ref === "string") refs.add(obj.$ref);
      for (const value of Object.values(obj)) walk(value);
    })(spec);
    expect(refs.size).toBeGreaterThan(0);
    for (const ref of refs)
      expect(defined).toContain(ref.replace("#/components/schemas/", ""));
  });

  test("v1 remains available and keeps its original list shape", async ({
    baseURL,
  }) => {
    const api = await client(baseURL!, await mintKey("v1-compat"));

    // v1 environments returned a bare {items} envelope with no pagination meta;
    // v2 must not have retrofitted itself onto v1.
    const res = await api.get(`/api/v1/projects/${E2E.projectSlug}/environments`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.meta).toBeUndefined();

    expect((await api.get("/api/v1/openapi")).status()).toBe(200);
  });
});

test.describe("API key settings", () => {
  test("creates a project-scoped, rate-limited key through the UI", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', E2E.email);
    await page.fill('input[name="password"]', E2E.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard");

    await page.goto("/settings/api-keys");
    const name = `apiv2-${RUN}-ui`;
    await page.getByTestId("apikey-name-input").fill(name);
    await page.getByTestId("apikey-ratelimit-input").fill("42");
    await page
      .getByTestId("apikey-project-select")
      .selectOption({ label: "E2E Target" });
    await page.getByTestId("apikey-create-submit").click();

    // The full key is shown exactly once, on creation.
    const reveal = page.locator("code", { hasText: /^tf_/ });
    await expect(reveal).toBeVisible();
    const rawKey = (await reveal.textContent())!.trim();

    const row = page.locator("tr", { hasText: name });
    await expect(row).toContainText("E2E Target");
    await expect(row).toContainText("42/min");

    // The settings the UI reported must be the ones the API actually enforces.
    const created = await db.apiKey.findFirstOrThrow({
      where: { name },
      select: { id: true },
    });
    keyIds.push(created.id);

    const api = await pwRequest.newContext({
      baseURL: page.url().replace(/\/settings.*$/, ""),
      extraHTTPHeaders: { authorization: `Bearer ${rawKey}` },
    });
    const allowed = await api.get(
      `/api/v2/projects/${E2E.targetProjectSlug}/milestones`
    );
    expect(allowed.status()).toBe(200);
    expect(allowed.headers()["x-ratelimit-limit"]).toBe("42");

    const blocked = await api.get(
      `/api/v2/projects/${E2E.projectSlug}/milestones`
    );
    expect(blocked.status()).toBe(403);
  });
});
