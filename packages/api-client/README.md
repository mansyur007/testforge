# @testforge/api-client

Typed TypeScript/JavaScript client for the **TestForge REST API v2**, generated
from the API's own OpenAPI document.

Zero runtime dependencies. Node 18+ (uses the built-in `fetch`).

## Install

```bash
npm install @testforge/api-client
```

## Usage

```ts
import { TestForgeClient, TestForgeApiError } from "@testforge/api-client";

const tf = new TestForgeClient({
  baseUrl: "https://testforge.example.com",
  apiKey: process.env.TESTFORGE_API_KEY!, // Settings → API Keys
});

// One method per API operation, fully typed.
const milestone = await tf.createMilestone("my-project", {
  name: "Release 3.0",
  dueDate: "2026-09-01T00:00:00.000Z",
});

const page = await tf.listMilestones("my-project", { query: { perPage: 20 } });
console.log(page.items, page.meta.totalPages);
```

### Pagination

Every collection returns `{ items, meta }`. To walk all pages, use `paginate`:

```ts
for await (const milestone of tf.paginate(tf.listMilestones, "my-project")) {
  console.log(milestone.name);
}
```

### Errors

Non-2xx responses throw `TestForgeApiError`, carrying the API's stable machine
code so you can branch without parsing prose:

```ts
try {
  await tf.createMilestone("my-project", { name: "" });
} catch (e) {
  if (e instanceof TestForgeApiError && e.isValidation) {
    // e.code === "validation_error"
    for (const d of e.details) console.error(`${d.field}: ${d.message}`);
  }
}
```

### Rate limits

Each API key has its own per-minute budget. The client tracks the headers from
the most recent response and retries a `429` automatically (up to `maxRetries`,
default 2, honouring `Retry-After`):

```ts
console.log(tf.rateLimit); // { limit, remaining, reset } | null
```

### Project-scoped keys

A key can be bound to a single project in the TestForge UI. Such a key returns
`403 forbidden` for every other project, even one its owning user belongs to —
useful for handing CI a token that cannot reach beyond the repo it builds.

## Regenerating

`generated/` is checked in, so consumers never run the generator. Re-run it
whenever `src/lib/openapi-v2.ts` changes in the main app, and commit the diff:

```bash
# against a running dev server
npm run generate -- --url http://localhost:3000

# or from a saved spec
npm run generate -- --file ./openapi-v2.json
```

It emits `generated/types.d.ts` (one interface per schema),
`generated/client.js` (the operation methods) and `generated/client.d.ts`
(their signatures). Everything else in `src/` is hand-written.

## API versions

This package targets **v2** (`/api/v2`). API **v1** remains frozen and
supported at `/api/v1` — it is not deprecated, and existing v1 integrations
keep working unchanged. v2 adds resources v1 never exposed (milestones,
members, webhooks), uniform pagination, and project-scoped keys.

## License

MIT
