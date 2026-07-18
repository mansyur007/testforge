// OpenAPI 3.1 description of the TestForge REST API v2 (F-33). Served as JSON
// at /api/v2/openapi and consumed by (a) the /docs/api viewer and (b) the
// `packages/api-client` generator, which turns this document into a typed
// TypeScript client. Hand-written and colocated with the routes, exactly as the
// v1 spec is — the generator reads this file, it does not write it.
//
// v1 (src/lib/openapi.ts) stays frozen. Both specs are published side by side.

const err = (desc: string) => ({
  description: desc,
  content: {
    "application/json": { schema: { $ref: "#/components/schemas/ApiError" } },
  },
});

const slugParam = {
  name: "slug",
  in: "path",
  required: true,
  schema: { type: "string" },
  description: "Project slug.",
};

const idParam = (name = "id", description = "Resource id.") => ({
  name,
  in: "path",
  required: true,
  schema: { type: "string" },
  description,
});

const pageParams = [
  {
    name: "page",
    in: "query",
    schema: { type: "integer", minimum: 1, default: 1 },
    description: "1-based page number. Out-of-range values clamp.",
  },
  {
    name: "perPage",
    in: "query",
    schema: { type: "integer", minimum: 1, maximum: 200, default: 50 },
    description: "Items per page, capped at 200.",
  },
];

// Every collection returns { items, meta } — this wraps a schema ref as that
// envelope so the shape is declared once.
const listOf = (ref: string) => ({
  type: "object",
  required: ["items", "meta"],
  properties: {
    items: { type: "array", items: { $ref: `#/components/schemas/${ref}` } },
    meta: { $ref: "#/components/schemas/PageMeta" },
  },
});

const ok = (ref: string, description = "Success.") => ({
  description,
  content: {
    "application/json": { schema: { $ref: `#/components/schemas/${ref}` } },
  },
});

const okList = (ref: string, description = "A page of results.") => ({
  description,
  content: { "application/json": { schema: listOf(ref) } },
});

// Responses every authenticated endpoint can produce.
const commonErrors = {
  "401": err("Missing or invalid credentials."),
  "403": err(
    "The key is read-only, scoped to a different project, or the role lacks the permission."
  ),
  "404": err("Project or resource not found."),
  "429": err("Rate limit exceeded for this key."),
};

const writeErrors = {
  ...commonErrors,
  "422": err("Validation failed; `details` lists the offending fields."),
};

const noContent = { description: "Deleted. No body." };

/**
 * Build the CRUD path pair for a project-scoped resource: a collection path
 * (list + create) and an item path (read + update + delete). Nearly every v2
 * resource is shaped this way, so describing them one property at a time would
 * be thousands of lines of copy-paste that drift apart on the first edit.
 */
function crudPaths(opts: {
  tag: string;
  /** Path segment, e.g. "milestones". */
  segment: string;
  /** Schema name, e.g. "Milestone". */
  schema: string;
  /** Path param name on the item route (defaults to "id"). */
  itemParam?: string;
  singular: string;
  /** PascalCase noun used to build operationIds, e.g. "Milestone" → listMilestones. */
  opNoun: string;
  /** Plural noun for the list operationId, e.g. "Milestones". */
  opPlural: string;
  listParams?: unknown[];
  createBody: string;
  updateBody?: string;
  /** Omit the update operation for resources that have none. */
  noUpdate?: boolean;
  /** Omit the delete operation. */
  noDelete?: boolean;
  /** Response schema for create, when it differs (e.g. webhooks echo a secret). */
  createResponse?: string;
}) {
  const param = opts.itemParam ?? "id";
  const item: Record<string, unknown> = {
    get: {
      operationId: `get${opts.opNoun}`,
      tags: [opts.tag],
      summary: `Get a ${opts.singular}`,
      parameters: [slugParam, idParam(param)],
      responses: { "200": ok(opts.schema), ...commonErrors },
    },
  };

  if (!opts.noUpdate)
    item.patch = {
      operationId: `update${opts.opNoun}`,
      tags: [opts.tag],
      summary: `Update a ${opts.singular}`,
      description: "Only the keys present in the body are changed.",
      parameters: [slugParam, idParam(param)],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: `#/components/schemas/${opts.updateBody ?? opts.createBody}`,
            },
          },
        },
      },
      responses: { "200": ok(opts.schema), ...writeErrors },
    };

  if (!opts.noDelete)
    item.delete = {
      operationId: `delete${opts.opNoun}`,
      tags: [opts.tag],
      summary: `Delete a ${opts.singular}`,
      parameters: [slugParam, idParam(param)],
      responses: { "204": noContent, ...commonErrors, "409": err("Blocked by a constraint.") },
    };

  return {
    [`/projects/{slug}/${opts.segment}`]: {
      get: {
        operationId: `list${opts.opPlural}`,
        tags: [opts.tag],
        summary: `List ${opts.segment}`,
        parameters: [slugParam, ...pageParams, ...((opts.listParams ?? []) as [])],
        responses: { "200": okList(opts.schema), ...commonErrors },
      },
      post: {
        operationId: `create${opts.opNoun}`,
        tags: [opts.tag],
        summary: `Create a ${opts.singular}`,
        parameters: [slugParam],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${opts.createBody}` },
            },
          },
        },
        responses: {
          "201": ok(opts.createResponse ?? opts.schema, "Created."),
          ...writeErrors,
          "409": err("A conflicting resource already exists."),
        },
      },
    },
    [`/projects/{slug}/${opts.segment}/{${param}}`]: item,
  };
}

const str = { type: "string" };
const nullableStr = { type: ["string", "null"] };
const bool = { type: "boolean" };
const int = { type: "integer" };
const dateTime = { type: ["string", "null"], format: "date-time" };

export function openApiV2Spec() {
  return {
    openapi: "3.1.0",
    info: {
      title: "TestForge API v2",
      version: "2.0.0",
      description: [
        "Full-coverage REST API for TestForge.",
        "",
        "**Authentication.** Send a Bearer API key (Settings → API Keys), or call",
        "from a logged-in browser session. Read-only keys may call GET only;",
        "write keys may mutate.",
        "",
        "**Project-scoped keys.** A key may be bound to a single project. Such a",
        "key returns 403 on every other project, even one its owning user belongs",
        "to. Org-wide keys (the v1 default) keep working across all projects.",
        "",
        "**Rate limits.** Each key has its own per-minute budget (`rateLimitPerMin`,",
        "falling back to the server default). Every key-authenticated response",
        "carries `X-RateLimit-Limit`, `X-RateLimit-Remaining` and `X-RateLimit-Reset`;",
        "a 429 additionally carries `Retry-After`.",
        "",
        "**Pagination.** Every collection accepts `page`/`perPage` and returns",
        "`{ items, meta }`. `perPage` is capped at 200.",
        "",
        "**Relationship to v1.** v1 remains frozen and supported at `/api/v1`; it",
        "is not deprecated. v2 adds the resources v1 never exposed (milestones,",
        "members, webhooks), uniform pagination, and key scoping.",
      ].join("\n"),
    },
    servers: [{ url: "/api/v2" }],
    security: [{ bearerAuth: [] }],
    tags: [
      { name: "Milestones", description: "Release/iteration milestones." },
      { name: "Members", description: "Project membership and roles." },
      { name: "Webhooks", description: "Outbound HMAC-signed event delivery." },
      { name: "Custom Fields", description: "Case & result field definitions." },
      { name: "Attachments", description: "Evidence files on cases and results." },
      { name: "Plans", description: "Test plans and their configuration matrix." },
      { name: "Environments", description: "Environments a run executes against." },
    ],
    paths: {
      ...crudPaths({
        tag: "Milestones",
        segment: "milestones",
        opNoun: "Milestone",
        opPlural: "Milestones",
        schema: "Milestone",
        singular: "milestone",
        createBody: "MilestoneInput",
        updateBody: "MilestoneUpdate",
        listParams: [
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["OPEN", "COMPLETED"] },
          },
        ],
      }),
      ...crudPaths({
        tag: "Members",
        segment: "members",
        opNoun: "Member",
        opPlural: "Members",
        schema: "Member",
        singular: "member",
        createBody: "MemberInput",
        updateBody: "MemberUpdate",
      }),
      ...crudPaths({
        tag: "Webhooks",
        segment: "webhooks",
        opNoun: "Webhook",
        opPlural: "Webhooks",
        schema: "Webhook",
        singular: "webhook",
        createBody: "WebhookInput",
        updateBody: "WebhookUpdate",
        createResponse: "WebhookWithSecret",
      }),
      ...crudPaths({
        tag: "Custom Fields",
        segment: "fields",
        opNoun: "Field",
        opPlural: "Fields",
        schema: "Field",
        singular: "field",
        createBody: "FieldInput",
        updateBody: "FieldUpdate",
        listParams: [
          {
            name: "entity",
            in: "query",
            schema: { type: "string", enum: ["CASE", "RESULT"] },
          },
          { name: "active", in: "query", schema: bool },
        ],
      }),
      ...crudPaths({
        tag: "Environments",
        segment: "environments",
        opNoun: "Environment",
        opPlural: "Environments",
        schema: "Environment",
        singular: "environment",
        createBody: "EnvironmentInput",
        updateBody: "EnvironmentUpdate",
        listParams: [{ name: "active", in: "query", schema: bool }],
      }),
      ...crudPaths({
        tag: "Plans",
        segment: "plans",
        opNoun: "Plan",
        opPlural: "Plans",
        schema: "Plan",
        singular: "plan",
        itemParam: "planId",
        createBody: "PlanInput",
        updateBody: "PlanUpdate",
        listParams: [
          { name: "status", in: "query", schema: { type: "string", enum: ["ACTIVE", "COMPLETED"] } },
          { name: "milestoneId", in: "query", schema: str },
          {
            name: "include",
            in: "query",
            schema: str,
            description: "Comma-separated. `runs` embeds child runs and aggregate stats.",
          },
        ],
      }),

      // Attachments are hand-written rather than generated: upload is multipart,
      // and there is no PATCH (file bytes are immutable — re-upload instead).
      "/projects/{slug}/attachments": {
        get: {
          tags: ["Attachments"],
          operationId: "listAttachments",
          summary: "List attachments",
          parameters: [
            slugParam,
            ...pageParams,
            {
              name: "entityType",
              in: "query",
              schema: { type: "string", enum: ["CASE", "RESULT", "SESSION_NOTE"] },
            },
            { name: "entityId", in: "query", schema: str },
          ],
          responses: { "200": okList("Attachment"), ...commonErrors },
        },
        post: {
          tags: ["Attachments"],
          operationId: "uploadAttachment",
          summary: "Upload an attachment",
          parameters: [slugParam],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["file", "entityType", "entityId"],
                  properties: {
                    file: { type: "string", format: "binary" },
                    entityType: {
                      type: "string",
                      enum: ["CASE", "RESULT", "SESSION_NOTE"],
                    },
                    entityId: str,
                  },
                },
              },
            },
          },
          responses: {
            "201": ok("Attachment", "Uploaded."),
            "400": err("Malformed multipart body or missing field."),
            "413": err("File exceeds the upload limit."),
            ...commonErrors,
          },
        },
      },
      "/projects/{slug}/attachments/{id}": {
        get: {
          tags: ["Attachments"],
          operationId: "getAttachment",
          summary: "Get attachment metadata",
          description:
            "Returns metadata only. Download the bytes from the `url` field.",
          parameters: [slugParam, idParam()],
          responses: { "200": ok("Attachment"), ...commonErrors },
        },
        delete: {
          tags: ["Attachments"],
          operationId: "deleteAttachment",
          summary: "Delete an attachment",
          parameters: [slugParam, idParam()],
          responses: { "204": noContent, ...commonErrors },
        },
      },
    },

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "A TestForge API key from Settings → API Keys.",
        },
      },
      schemas: {
        ApiError: {
          type: "object",
          required: ["error"],
          properties: {
            error: {
              type: "object",
              required: ["code", "message"],
              properties: {
                code: {
                  type: "string",
                  description:
                    "Stable machine code: unauthorized, forbidden, not_found, bad_request, validation_error, conflict, rate_limited, payload_too_large.",
                },
                message: str,
                details: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["field", "message"],
                    properties: { field: str, message: str },
                  },
                },
              },
            },
          },
        },
        PageMeta: {
          type: "object",
          required: ["page", "perPage", "total", "totalPages"],
          properties: {
            page: int,
            perPage: int,
            total: { ...int, description: "Total matching rows across all pages." },
            totalPages: { ...int, description: "At least 1, even when empty." },
          },
        },

        Milestone: {
          type: "object",
          required: ["id", "name", "status"],
          properties: {
            id: str,
            name: str,
            status: { type: "string", enum: ["OPEN", "COMPLETED"] },
            dueDate: dateTime,
            runCount: { ...int, description: "Runs attached to this milestone." },
          },
        },
        MilestoneInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: str,
            status: { type: "string", enum: ["OPEN", "COMPLETED"], default: "OPEN" },
            dueDate: {
              ...dateTime,
              description: "ISO date-time, or null to clear.",
            },
          },
        },

        MilestoneUpdate: {
          type: "object",
          properties: {
            name: str,
            status: { type: "string", enum: ["OPEN", "COMPLETED"] },
            dueDate: { ...dateTime, description: "ISO date-time, or null to clear." },
          },
        },

        Member: {
          type: "object",
          required: ["id", "userId", "role", "email"],
          properties: {
            id: { ...str, description: "Membership id (not the user id)." },
            userId: str,
            role: str,
            name: nullableStr,
            email: str,
          },
        },
        MemberInput: {
          type: "object",
          description:
            "Binds an existing user to the project. Supply `userId` or `email`. This never creates or invites a user.",
          properties: {
            userId: str,
            email: str,
            role: { ...str, default: "MEMBER" },
          },
        },
        MemberUpdate: {
          type: "object",
          required: ["role"],
          properties: { role: str },
        },

        Webhook: {
          type: "object",
          required: ["id", "url", "events", "active"],
          properties: {
            id: str,
            url: str,
            events: { type: "array", items: str },
            active: bool,
            createdAt: { type: "string", format: "date-time" },
          },
        },
        WebhookWithSecret: {
          allOf: [
            { $ref: "#/components/schemas/Webhook" },
            {
              type: "object",
              required: ["secret"],
              properties: {
                secret: {
                  ...str,
                  description:
                    "HMAC-SHA256 signing secret. Returned only here and on secret rotation — store it now, it is never echoed again.",
                },
              },
            },
          ],
        },
        WebhookInput: {
          type: "object",
          required: ["url", "events"],
          properties: {
            url: { ...str, description: "Absolute http(s) URL." },
            events: {
              type: "array",
              minItems: 1,
              items: str,
              description: "Event names; unknown names are rejected.",
            },
            active: { ...bool, default: true },
          },
        },
        WebhookUpdate: {
          type: "object",
          description:
            "Pass `?rotateSecret=true` to mint a new signing secret; the response then includes it once.",
          properties: {
            url: str,
            events: { type: "array", minItems: 1, items: str },
            active: bool,
          },
        },

        Field: {
          type: "object",
          required: ["id", "entity", "key", "label", "type"],
          properties: {
            id: str,
            entity: { type: "string", enum: ["CASE", "RESULT"] },
            key: { ...str, description: "Machine key, ^[a-z][a-z0-9_]{1,30}$." },
            label: str,
            type: str,
            options: { type: "array", items: str },
            required: bool,
            order: int,
            active: bool,
          },
        },
        FieldInput: {
          type: "object",
          required: ["key", "label", "type"],
          properties: {
            entity: { type: "string", enum: ["CASE", "RESULT"], default: "CASE" },
            key: str,
            label: str,
            type: str,
            options: {
              type: "array",
              items: str,
              description: "Required and non-empty for DROPDOWN and MULTISELECT.",
            },
            required: { ...bool, default: false },
          },
        },
        FieldUpdate: {
          type: "object",
          description:
            "`entity`, `key` and `type` are immutable — stored values are keyed and typed by them. Sending a differing value is a 422.",
          properties: {
            label: str,
            options: { type: "array", items: str },
            required: bool,
            order: int,
            active: bool,
          },
        },

        Environment: {
          type: "object",
          required: ["id", "name", "order", "active"],
          properties: {
            id: str,
            name: str,
            url: nullableStr,
            order: int,
            active: bool,
          },
        },
        EnvironmentInput: {
          type: "object",
          required: ["name"],
          properties: { name: str, url: nullableStr },
        },
        EnvironmentUpdate: {
          type: "object",
          properties: {
            name: str,
            url: nullableStr,
            order: int,
            active: bool,
          },
        },

        Plan: {
          type: "object",
          required: ["id", "name", "status"],
          properties: {
            id: str,
            name: str,
            description: nullableStr,
            status: { type: "string", enum: ["ACTIVE", "COMPLETED"] },
            milestoneId: nullableStr,
            createdById: str,
            createdAt: { type: "string", format: "date-time" },
            completedAt: dateTime,
            runs: {
              type: "array",
              description: "Child runs; present on item reads and when `include=runs`.",
              items: { type: "object", additionalProperties: true },
            },
            stats: {
              type: "object",
              description: "Aggregate result counts by status bucket.",
              additionalProperties: int,
            },
          },
        },
        PlanInput: {
          type: "object",
          required: ["name", "caseIds"],
          properties: {
            name: str,
            description: nullableStr,
            milestoneId: nullableStr,
            caseIds: {
              type: "array",
              minItems: 1,
              items: str,
              description: "Live cases in this project; each seeds one result per child run.",
            },
            optionIds: {
              type: "array",
              items: str,
              description:
                "ConfigOption ids. Their cross product becomes one child run each, capped at 50 combinations.",
            },
          },
        },
        PlanUpdate: {
          type: "object",
          description:
            "`completedAt` is derived from `status` and cannot be set directly.",
          properties: {
            name: str,
            description: nullableStr,
            status: { type: "string", enum: ["ACTIVE", "COMPLETED"] },
            milestoneId: nullableStr,
          },
        },

        Attachment: {
          type: "object",
          required: ["id", "filename", "mimeType", "sizeBytes", "url"],
          properties: {
            id: str,
            filename: str,
            mimeType: str,
            sizeBytes: int,
            entityType: str,
            entityId: str,
            uploaderId: str,
            url: { ...str, description: "Path the file bytes are served from." },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  };
}
