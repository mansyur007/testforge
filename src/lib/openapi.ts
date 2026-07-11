// OpenAPI 3.1 description of the TestForge REST API v1. Served as JSON at
// /api/v1/openapi and rendered by the /docs/api page. Kept hand-written (no
// generator dependency) but colocated with the routes so it stays in sync.

const err = (desc: string) => ({
  description: desc,
  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
});

const slugParam = {
  name: "slug",
  in: "path",
  required: true,
  schema: { type: "string" },
  description: "Project slug.",
};

export function openApiSpec() {
  return {
    openapi: "3.1.0",
    info: {
      title: "TestForge API",
      version: "1.0.0",
      description:
        "REST API v1 for TestForge. Authenticate with a Bearer API key " +
        "(Settings → API Keys). Read-only keys may call GET endpoints only; " +
        "write keys may mutate. API-key traffic is rate limited per key.",
    },
    servers: [{ url: "/api/v1" }],
    security: [{ bearerAuth: [] }],
    tags: [
      { name: "Cases" },
      { name: "Suites" },
      { name: "Runs" },
      { name: "Results" },
      { name: "Attachments" },
      { name: "Shared Steps" },
      { name: "Custom Fields" },
      { name: "Issues" },
      { name: "Plans" },
    ],
    paths: {
      "/projects/{slug}/cases": {
        get: {
          tags: ["Cases"],
          summary: "List test cases",
          parameters: [
            slugParam,
            { name: "priority", in: "query", schema: { type: "string" } },
            { name: "type", in: "query", schema: { type: "string" } },
            { name: "tag", in: "query", schema: { type: "string" } },
            { name: "q", in: "query", schema: { type: "string" }, description: "Title contains." },
            {
              name: "suiteId",
              in: "query",
              schema: { type: "string" },
              description: "Filter by suite; `none` returns unassigned cases.",
            },
            {
              name: "updatedSince",
              in: "query",
              schema: { type: "string", format: "date-time" },
              description: "Only cases updated at/after this ISO timestamp.",
            },
            { name: "cursor", in: "query", schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "integer", default: 50, maximum: 200 } },
          ],
          responses: {
            "200": {
              description: "Paginated list.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: { $ref: "#/components/schemas/Case" } },
                      total: { type: "integer" },
                      nextCursor: { type: ["string", "null"] },
                    },
                  },
                },
              },
            },
            "401": err("Missing or invalid credentials."),
            "404": err("Project not found."),
            "429": err("Rate limit exceeded."),
          },
        },
        post: {
          tags: ["Cases"],
          summary: "Create a test case",
          parameters: [slugParam],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CaseInput" } },
            },
          },
          responses: {
            "201": {
              description: "Created.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { id: { type: "string" }, displayId: { type: "string" } },
                  },
                },
              },
            },
            "401": err("Unauthorized."),
            "403": err("API key is read-only."),
            "404": err("Project not found."),
            "422": err("Validation failed."),
            "429": err("Rate limited."),
          },
        },
      },
      "/projects/{slug}/cases/batch": {
        post: {
          tags: ["Cases"],
          summary: "Bulk-create cases (all-or-nothing, max 500)",
          parameters: [slugParam],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["cases"],
                  properties: {
                    cases: {
                      type: "array",
                      maxItems: 500,
                      items: { $ref: "#/components/schemas/CaseInput" },
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "All created." },
            "403": err("API key is read-only."),
            "422": err("Any invalid item rejects the whole batch (per-item details)."),
          },
        },
      },
      "/projects/{slug}/cases/{caseId}": {
        parameters: [
          slugParam,
          { name: "caseId", in: "path", required: true, schema: { type: "string" } },
        ],
        get: {
          tags: ["Cases"],
          summary: "Get a test case",
          responses: {
            "200": {
              description: "OK.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Case" } } },
            },
            "404": err("Case not found."),
          },
        },
        patch: {
          tags: ["Cases"],
          summary: "Update a test case (partial)",
          requestBody: {
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CaseInput" } },
            },
          },
          responses: {
            "200": {
              description: "Updated.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Case" } } },
            },
            "403": err("API key is read-only."),
            "404": err("Case not found."),
            "422": err("Validation failed."),
          },
        },
        delete: {
          tags: ["Cases"],
          summary: "Soft-delete a test case",
          responses: {
            "200": { description: "Soft-deleted." },
            "403": err("API key is read-only."),
            "404": err("Case not found."),
          },
        },
      },
      "/projects/{slug}/cases/{caseId}/revisions": {
        get: {
          tags: ["Cases"],
          summary: "List a case's revision history (F-05)",
          description:
            "Numbered snapshots recorded on every meaningful change, newest first. Snapshot steps are stored expanded (shared references resolved at write time).",
          parameters: [
            slugParam,
            { name: "caseId", in: "path", required: true, schema: { type: "string" } },
            { name: "cursor", in: "query", schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "integer", default: 50, maximum: 200 } },
          ],
          responses: {
            "200": {
              description: "OK.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      items: { type: "array", items: { $ref: "#/components/schemas/CaseRevision" } },
                      nextCursor: { type: ["string", "null"] },
                    },
                  },
                },
              },
            },
            "404": err("Case not found."),
          },
        },
      },
      "/projects/{slug}/plans": {
        get: {
          tags: ["Plans"],
          summary: "List test plans (F-06)",
          parameters: [
            slugParam,
            { name: "status", in: "query", schema: { type: "string", enum: ["ACTIVE", "COMPLETED"] } },
            { name: "cursor", in: "query", schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "integer", default: 50, maximum: 200 } },
          ],
          responses: {
            "200": {
              description: "OK.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      items: { type: "array", items: { $ref: "#/components/schemas/TestPlan" } },
                      nextCursor: { type: ["string", "null"] },
                    },
                  },
                },
              },
            },
            "404": err("Project not found."),
          },
        },
        post: {
          tags: ["Plans"],
          summary: "Create a plan (one run per configuration combination)",
          description:
            "Runs are the cartesian product of the selected options across their groups (max 50 combinations). No options → a single run without configuration. Every run is seeded with UNTESTED results for the selected cases.",
          parameters: [slugParam],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "caseIds"],
                  properties: {
                    name: { type: "string" },
                    description: { type: ["string", "null"] },
                    milestoneId: { type: ["string", "null"] },
                    caseIds: { type: "array", items: { type: "string" } },
                    optionIds: {
                      type: "array",
                      items: { type: "string" },
                      description: "ConfigOption ids (see /config-groups).",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Created — includes the generated child runs.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/TestPlan" } } },
            },
            "403": err("API key is read-only."),
            "404": err("Project not found."),
            "422": err("Validation failed, or too many combinations."),
          },
        },
      },
      "/projects/{slug}/plans/{planId}": {
        get: {
          tags: ["Plans"],
          summary: "Get a plan with child runs and aggregate stats",
          parameters: [
            slugParam,
            { name: "planId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "OK.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/TestPlan" } } },
            },
            "404": err("Plan not found."),
          },
        },
      },
      "/projects/{slug}/config-groups": {
        get: {
          tags: ["Plans"],
          summary: "List configuration groups & options",
          parameters: [slugParam],
          responses: {
            "200": {
              description: "OK.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      items: { type: "array", items: { $ref: "#/components/schemas/ConfigGroup" } },
                    },
                  },
                },
              },
            },
            "404": err("Project not found."),
          },
        },
        post: {
          tags: ["Plans"],
          summary: "Create a configuration group (optionally with options)",
          parameters: [slugParam],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string", example: "Browser" },
                    options: {
                      type: "array",
                      items: { type: "string" },
                      example: ["Chrome", "Firefox"],
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Created.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ConfigGroup" } } },
            },
            "403": err("API key is read-only."),
            "404": err("Project not found."),
            "422": err("Validation failed (e.g. duplicate group name)."),
          },
        },
      },
      "/projects/{slug}/issues": {
        get: {
          tags: ["Issues"],
          summary: "List issue links (F-07)",
          description:
            "Issues in Jira/GitHub/GitLab linked to a case or run result. Tracker credentials are never exposed by any endpoint.",
          parameters: [
            slugParam,
            { name: "entityType", in: "query", schema: { type: "string", enum: ["CASE", "RESULT"] } },
            { name: "entityId", in: "query", schema: { type: "string" } },
            { name: "cursor", in: "query", schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "integer", default: 50, maximum: 200 } },
          ],
          responses: {
            "200": {
              description: "OK.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      items: { type: "array", items: { $ref: "#/components/schemas/IssueLink" } },
                      nextCursor: { type: ["string", "null"] },
                    },
                  },
                },
              },
            },
            "400": err("Invalid entityType."),
            "404": err("Project not found."),
          },
        },
        post: {
          tags: ["Issues"],
          summary: "Link an existing issue",
          description:
            "Accepts a bare key (QA-123, #42) or the full issue URL. The key is verified against the tracker before the link is stored.",
          parameters: [slugParam],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["entityType", "entityId", "issueKey"],
                  properties: {
                    entityType: { type: "string", enum: ["CASE", "RESULT"] },
                    entityId: { type: "string" },
                    issueKey: { type: "string", example: "QA-123" },
                    provider: {
                      type: "string",
                      enum: ["JIRA", "GITHUB", "GITLAB"],
                      description: "Required only when several trackers are configured.",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Linked (200 with the existing link when already present).",
              content: { "application/json": { schema: { $ref: "#/components/schemas/IssueLink" } } },
            },
            "403": err("API key is read-only."),
            "404": err("Project not found."),
            "422": err("Unknown entity, unrecognized key, or no active tracker."),
          },
        },
      },
      "/projects/{slug}/issues/{id}": {
        delete: {
          tags: ["Issues"],
          summary: "Unlink an issue (the upstream issue is untouched)",
          parameters: [
            slugParam,
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Unlinked." },
            "403": err("API key is read-only."),
            "404": err("Issue link not found."),
          },
        },
      },
      "/projects/{slug}/suites": {
        get: {
          tags: ["Suites"],
          summary: "List suites",
          parameters: [slugParam],
          responses: {
            "200": {
              description: "OK.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: { $ref: "#/components/schemas/Suite" } },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Suites"],
          summary: "Create a suite or sub-suite",
          parameters: [slugParam],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string" },
                    description: { type: ["string", "null"] },
                    parentId: { type: ["string", "null"], description: "Parent suite (makes a sub-suite)." },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Created." },
            "403": err("API key is read-only."),
            "422": err("Validation failed."),
          },
        },
      },
      "/projects/{slug}/suites/{suiteId}": {
        parameters: [
          slugParam,
          { name: "suiteId", in: "path", required: true, schema: { type: "string" } },
        ],
        patch: {
          tags: ["Suites"],
          summary: "Rename / reorder / reparent a suite",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: ["string", "null"] },
                    order: { type: "integer" },
                    parentId: { type: ["string", "null"] },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Updated." },
            "403": err("API key is read-only."),
            "404": err("Suite not found."),
            "422": err("Validation failed (e.g. reparent cycle)."),
          },
        },
        delete: {
          tags: ["Suites"],
          summary: "Delete a suite and its sub-suites (cases become unassigned)",
          responses: {
            "200": { description: "Deleted." },
            "403": err("API key is read-only."),
            "404": err("Suite not found."),
          },
        },
      },
      "/projects/{slug}/runs": {
        get: {
          tags: ["Runs"],
          summary: "List test runs",
          parameters: [
            slugParam,
            { name: "status", in: "query", schema: { type: "string", enum: ["ACTIVE", "COMPLETED"] } },
            { name: "milestoneId", in: "query", schema: { type: "string" } },
            { name: "cursor", in: "query", schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "integer", default: 50, maximum: 200 } },
          ],
          responses: {
            "200": {
              description: "Paginated list.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: { $ref: "#/components/schemas/Run" } },
                      total: { type: "integer" },
                      nextCursor: { type: ["string", "null"] },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Runs"],
          summary: "Create a test run",
          parameters: [slugParam],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string" },
                    description: { type: ["string", "null"] },
                    source: { type: "string", description: "e.g. MANUAL, PLAYWRIGHT, CYPRESS." },
                    origin: { type: ["string", "null"] },
                    milestoneId: { type: ["string", "null"] },
                    caseIds: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Created." },
            "403": err("API key is read-only."),
            "422": err("Validation failed."),
          },
        },
      },
      "/projects/{slug}/runs/{runId}": {
        parameters: [
          slugParam,
          { name: "runId", in: "path", required: true, schema: { type: "string" } },
        ],
        get: {
          tags: ["Runs"],
          summary: "Get a run with per-status stats",
          responses: {
            "200": {
              description: "OK.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Run" } } },
            },
            "404": err("Run not found."),
          },
        },
        patch: {
          tags: ["Runs"],
          summary: "Update or close a run",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: ["string", "null"] },
                    status: { type: "string", enum: ["ACTIVE", "COMPLETED"] },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Updated." },
            "403": err("API key is read-only."),
            "404": err("Run not found."),
            "422": err("Validation failed."),
          },
        },
      },
      "/projects/{slug}/runs/{runId}/results": {
        parameters: [
          slugParam,
          { name: "runId", in: "path", required: true, schema: { type: "string" } },
        ],
        get: {
          tags: ["Results"],
          summary: "List results for a run",
          responses: {
            "200": {
              description: "OK.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: { $ref: "#/components/schemas/Result" } },
                      total: { type: "integer" },
                    },
                  },
                },
              },
            },
            "404": err("Run not found."),
          },
        },
        post: {
          tags: ["Results"],
          summary: "Record (upsert) a result for a case in the run",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["caseId", "status"],
                  properties: {
                    caseId: { type: "string" },
                    status: {
                      type: "string",
                      enum: ["PASSED", "FAILED", "BLOCKED", "SKIPPED", "IN_PROGRESS", "UNTESTED", "RETEST"],
                    },
                    comment: { type: ["string", "null"] },
                    elapsedSeconds: { type: ["integer", "null"] },
                    defectUrl: { type: ["string", "null"] },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Upserted.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Result" } } },
            },
            "403": err("API key is read-only."),
            "404": err("Run not found."),
            "422": err("Validation failed."),
          },
        },
      },
      "/projects/{slug}/attachments": {
        parameters: [slugParam],
        get: {
          tags: ["Attachments"],
          summary: "List attachments",
          parameters: [
            { name: "entityType", in: "query", schema: { type: "string", enum: ["CASE", "RESULT"] } },
            { name: "entityId", in: "query", schema: { type: "string" } },
            { name: "cursor", in: "query", schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "integer", default: 50, maximum: 200 } },
          ],
          responses: {
            "200": {
              description: "Paginated list.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      items: { type: "array", items: { $ref: "#/components/schemas/Attachment" } },
                      nextCursor: { type: ["string", "null"] },
                    },
                  },
                },
              },
            },
            "404": err("Project not found."),
          },
        },
        post: {
          tags: ["Attachments"],
          summary: "Upload a file onto a case or run result",
          description:
            "multipart/form-data with fields `file`, `entityType` (CASE|RESULT), `entityId`. " +
            "Max size is TF_MAX_UPLOAD_MB (default 10 MB). Identical content is deduplicated per project. " +
            "Download the file via the returned `url` (only PNG/JPEG/GIF/WebP render inline; everything else downloads).",
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["file", "entityType", "entityId"],
                  properties: {
                    file: { type: "string", format: "binary" },
                    entityType: { type: "string", enum: ["CASE", "RESULT"] },
                    entityId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Uploaded.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Attachment" } } },
            },
            "400": err("Missing/invalid fields."),
            "403": err("Read-only key or viewer role."),
            "404": err("Project or target entity not found."),
            "413": err("File exceeds the upload limit."),
          },
        },
      },
      "/projects/{slug}/shared-steps": {
        parameters: [slugParam],
        get: {
          tags: ["Shared Steps"],
          summary: "List shared step groups (with usage counts)",
          responses: {
            "200": {
              description: "All groups.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      items: { type: "array", items: { $ref: "#/components/schemas/SharedStepGroup" } },
                    },
                  },
                },
              },
            },
            "404": err("Project not found."),
          },
        },
        post: {
          tags: ["Shared Steps"],
          summary: "Create a shared step group",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "steps"],
                  properties: {
                    title: { type: "string" },
                    steps: { type: "array", items: { $ref: "#/components/schemas/Step" } },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Created.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/SharedStepGroup" } } },
            },
            "422": err("Validation failed."),
          },
        },
      },
      "/projects/{slug}/shared-steps/{id}": {
        parameters: [
          slugParam,
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        patch: {
          tags: ["Shared Steps"],
          summary: "Update a group (all referencing cases update instantly)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    steps: { type: "array", items: { $ref: "#/components/schemas/Step" } },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Updated.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/SharedStepGroup" } } },
            },
            "404": err("Group not found."),
            "422": err("Validation failed."),
          },
        },
        delete: {
          tags: ["Shared Steps"],
          summary: "Delete a group (409 while any case references it)",
          responses: {
            "204": { description: "Deleted." },
            "404": err("Group not found."),
            "409": err("Still referenced by cases — unlink them first."),
          },
        },
      },
      "/projects/{slug}/fields": {
        parameters: [slugParam],
        get: {
          tags: ["Custom Fields"],
          summary: "List custom field definitions",
          parameters: [
            { name: "entity", in: "query", schema: { type: "string", enum: ["CASE", "RESULT"] } },
          ],
          responses: {
            "200": {
              description: "All definitions, ordered.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      items: { type: "array", items: { $ref: "#/components/schemas/FieldDef" } },
                    },
                  },
                },
              },
            },
            "404": err("Project not found."),
          },
        },
        post: {
          tags: ["Custom Fields"],
          summary: "Create a custom field definition (project admins)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["entity", "key", "label", "type"],
                  properties: {
                    entity: { type: "string", enum: ["CASE", "RESULT"] },
                    key: { type: "string", pattern: "^[a-z][a-z0-9_]{1,30}$" },
                    label: { type: "string" },
                    type: {
                      type: "string",
                      enum: ["TEXT", "TEXTAREA", "NUMBER", "CHECKBOX", "DATE", "URL", "USER", "DROPDOWN", "MULTISELECT"],
                    },
                    options: { type: "array", items: { type: "string" }, description: "Required for DROPDOWN/MULTISELECT." },
                    required: { type: "boolean", default: false },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Created.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/FieldDef" } } },
            },
            "403": err("Not a project admin."),
            "422": err("Validation failed (bad key, type, duplicate…)."),
          },
        },
      },
      "/projects/{slug}/fields/{id}": {
        parameters: [
          slugParam,
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        patch: {
          tags: ["Custom Fields"],
          summary: "Update a definition (label/options/required/order/active)",
          description: "Key, type, and entity are immutable. Set `active: false` to hide a field from forms while keeping stored values.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    label: { type: "string" },
                    options: { type: "array", items: { type: "string" } },
                    required: { type: "boolean" },
                    order: { type: "integer" },
                    active: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Updated.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/FieldDef" } } },
            },
            "403": err("Not a project admin."),
            "404": err("Field not found."),
            "422": err("Validation failed."),
          },
        },
      },
      "/projects/{slug}/attachments/{id}": {
        parameters: [
          slugParam,
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        delete: {
          tags: ["Attachments"],
          summary: "Delete an attachment",
          description: "Allowed for the uploader, a project OWNER/ADMIN, or an org ADMIN.",
          responses: {
            "204": { description: "Deleted." },
            "403": err("Not allowed to delete this attachment."),
            "404": err("Attachment not found."),
          },
        },
      },
      "/results": {
        post: {
          tags: ["Results"],
          summary: "Upload an automation result file, creating a completed run",
          description:
            "Flat upload endpoint for CI, independent of the project-nested resources — " +
            "the project is given as a query param so any framework's plugin can POST " +
            "straight to this URL. Matches each test to a case via a `TC-<SLUG>-<n>` " +
            "annotation in its name, else an exact title match; unmatched tests are " +
            "reported but don't block the run. `POST /api/v1/junit` is a permanent " +
            "alias of `format=junit` kept for existing integrations.",
          parameters: [
            { name: "project", in: "query", required: true, schema: { type: "string" }, description: "Project slug." },
            { name: "name", in: "query", schema: { type: "string" }, description: "Run name. Defaults to a timestamped name." },
            {
              name: "format",
              in: "query",
              schema: { type: "string", enum: ["junit", "trx", "nunit3", "xunit2", "cucumber", "mocha"] },
              description: "Result format. Auto-detected from the body when omitted.",
            },
            { name: "source", in: "query", schema: { type: "string" }, description: "Recorded run source label. Defaults to the format name." },
            { name: "origin", in: "query", schema: { type: "string" }, description: "Free-text origin, e.g. CI/Local/VPS (max 120 chars)." },
          ],
          requestBody: {
            required: true,
            content: {
              "application/xml": { schema: { type: "string" }, examples: { junit: {}, trx: {}, nunit3: {}, xunit2: {} } },
              "application/json": { schema: { type: "string" }, examples: { cucumber: {}, mocha: {} } },
            },
          },
          responses: {
            "201": {
              description: "Run created from the matched results.",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/Run" },
                      {
                        type: "object",
                        properties: {
                          runUrl: { type: "string" },
                          matched: { type: "integer" },
                          automated: { type: "integer" },
                          unmatched: { type: "array", items: { type: "string" } },
                        },
                      },
                    ],
                  },
                },
              },
            },
            "400": err("Missing project param, or the body could not be parsed as the given/detected format."),
            "401": err("Missing or invalid credentials."),
            "403": err("API key is read-only."),
            "404": err("Project not found."),
            "422": err("No test in the file matched any case (details lists each unmatched test name)."),
          },
        },
      },
      "/junit": {
        post: {
          tags: ["Results"],
          summary: "Upload a JUnit XML result file (alias of POST /results?format=junit)",
          description: "Kept forever for backward compatibility. See `/results` for the current, multi-format endpoint.",
          parameters: [
            { name: "project", in: "query", required: true, schema: { type: "string" }, description: "Project slug." },
            { name: "name", in: "query", schema: { type: "string" } },
            { name: "source", in: "query", schema: { type: "string" }, description: "Defaults to JUNIT." },
            { name: "origin", in: "query", schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: { "application/xml": { schema: { type: "string" } } },
          },
          responses: {
            "200": { description: "Run created from the matched results." },
            "400": err("Invalid XML, or no <testcase> elements found."),
            "401": err("Missing or invalid credentials."),
            "404": err("Project not found."),
            "422": err("No test in the file matched any case."),
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", description: "API key: `Authorization: Bearer tf_...`" },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: { type: "string", example: "validation_error" },
                message: { type: "string" },
                details: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { field: { type: "string" }, message: { type: "string" } },
                  },
                },
              },
            },
          },
        },
        Step: {
          type: "object",
          description:
            "Inline step {action, expected} — or a shared reference {shared: <groupId>} inside a case's raw `steps`. `stepsExpanded` always contains inline steps, tagged with `fromShared` when they came from a group.",
          properties: {
            action: { type: "string" },
            expected: { type: "string" },
            shared: { type: "string", description: "SharedStepGroup id (reference item)." },
          },
        },
        CaseInput: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: ["string", "null"] },
            preconditions: { type: ["string", "null"] },
            steps: { type: "array", items: { $ref: "#/components/schemas/Step" } },
            expectedResult: { type: ["string", "null"] },
            priority: { type: "string", enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"] },
            type: { type: "string", enum: ["FUNCTIONAL", "REGRESSION", "SMOKE", "PERFORMANCE", "SECURITY", "E2E"] },
            status: { type: "string", enum: ["DRAFT", "ACTIVE", "DEPRECATED"] },
            automationStatus: {
              type: "string",
              enum: ["NOT_AUTOMATED", "IN_PROGRESS", "AUTOMATED", "TO_BE_UPDATED"],
            },
            suiteId: { type: ["string", "null"] },
            assigneeId: { type: ["string", "null"] },
            tags: { type: "string", description: "Comma-separated." },
            linkedIssues: { type: ["string", "null"] },
            custom: {
              type: "object",
              additionalProperties: true,
              description:
                "Custom field values keyed by field key (see /fields). Validated per definition; unknown keys are rejected with 422.",
            },
            datasets: {
              type: "array",
              description:
                "F-13: parameter rows. A case with N rows seeds N results per run, one per row, {{var}} substituted from `values`.",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Admin user" },
                  values: {
                    type: "object",
                    additionalProperties: { type: "string" },
                    example: { username: "admin", password: "hunter2" },
                  },
                },
              },
            },
          },
        },
        Case: {
          allOf: [
            { $ref: "#/components/schemas/CaseInput" },
            {
              type: "object",
              properties: {
                id: { type: "string" },
                displayId: { type: "string", example: "TC-WEB-001" },
                seq: { type: "integer" },
                rev: { type: "integer", description: "Current revision number (F-05)." },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
              },
            },
          ],
        },
        Suite: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: ["string", "null"] },
            parentId: { type: ["string", "null"] },
            order: { type: "integer" },
          },
        },
        Run: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: ["string", "null"] },
            status: { type: "string", enum: ["ACTIVE", "COMPLETED"] },
            source: { type: "string" },
            origin: { type: ["string", "null"] },
            milestoneId: { type: ["string", "null"] },
            planId: {
              type: ["string", "null"],
              description: "Parent test plan (F-06); null for standalone runs.",
            },
            config: {
              type: ["object", "null"],
              additionalProperties: { type: "string" },
              description: 'Configuration combo, e.g. {"Browser":"Chrome","OS":"Windows"}.',
            },
            createdById: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            completedAt: { type: ["string", "null"], format: "date-time" },
            stats: {
              type: "object",
              additionalProperties: { type: "integer" },
              description: "Result counts per status (detail endpoint only).",
            },
          },
        },
        TestPlan: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: ["string", "null"] },
            status: { type: "string", enum: ["ACTIVE", "COMPLETED"] },
            milestoneId: { type: ["string", "null"] },
            createdById: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            completedAt: { type: ["string", "null"], format: "date-time" },
            runCount: { type: "integer", description: "List endpoint only." },
            runs: {
              type: "array",
              items: { $ref: "#/components/schemas/Run" },
              description: "Child runs (detail & create responses).",
            },
            stats: {
              type: "object",
              additionalProperties: { type: "integer" },
              description: "Aggregate result counts across child runs.",
            },
          },
        },
        ConfigGroup: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string", example: "Browser" },
            order: { type: "integer" },
            options: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string", example: "Chrome" },
                  order: { type: "integer" },
                },
              },
            },
          },
        },
        Result: {
          type: "object",
          properties: {
            id: { type: "string" },
            caseId: { type: "string" },
            status: { type: "string" },
            comment: { type: ["string", "null"] },
            elapsedSeconds: { type: ["integer", "null"] },
            defectUrl: { type: ["string", "null"] },
            assigneeId: { type: ["string", "null"] },
            custom: {
              type: "object",
              additionalProperties: true,
              description: "Custom RESULT field values keyed by field key.",
            },
            caseRev: {
              type: ["integer", "null"],
              description: "Case revision this result executed (F-05); null for pre-F-05 results.",
            },
            datasetName: {
              type: ["string", "null"],
              description: "F-13: which of the case's dataset rows this result executes; null when the case has no parameters.",
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        IssueLink: {
          type: "object",
          properties: {
            id: { type: "string" },
            provider: { type: "string", enum: ["JIRA", "GITHUB", "GITLAB"] },
            issueKey: { type: "string", example: "QA-123" },
            issueUrl: { type: "string" },
            title: { type: ["string", "null"] },
            status: {
              type: ["string", "null"],
              description: "Last synced status text (refreshed by the sync-issues cron).",
            },
            entityType: { type: "string", enum: ["CASE", "RESULT"] },
            entityId: { type: "string" },
            syncedAt: { type: ["string", "null"], format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        CaseRevision: {
          type: "object",
          properties: {
            id: { type: "string" },
            rev: { type: "integer" },
            authorId: { type: ["string", "null"] },
            authorName: { type: ["string", "null"] },
            changeSummary: {
              type: "string",
              description: 'Comma list of changed fields, or "created" / "restored from rev N".',
            },
            snapshot: {
              type: "object",
              additionalProperties: true,
              description:
                "Full case fields at that moment: title, description, preconditions, steps (expanded), expectedResult, priority, type, status, automationStatus, tags, suiteId, assigneeId, linkedIssues, custom.",
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        SharedStepGroup: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            steps: { type: "array", items: { $ref: "#/components/schemas/Step" } },
            usageCount: { type: "integer", description: "Non-deleted cases referencing this group." },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        FieldDef: {
          type: "object",
          properties: {
            id: { type: "string" },
            entity: { type: "string", enum: ["CASE", "RESULT"] },
            key: { type: "string" },
            label: { type: "string" },
            type: { type: "string" },
            options: { type: "array", items: { type: "string" } },
            required: { type: "boolean" },
            order: { type: "integer" },
            active: { type: "boolean" },
          },
        },
        Attachment: {
          type: "object",
          properties: {
            id: { type: "string" },
            filename: { type: "string" },
            mimeType: { type: "string" },
            sizeBytes: { type: "integer" },
            entityType: { type: "string", enum: ["CASE", "RESULT"] },
            entityId: { type: "string" },
            uploaderId: { type: "string" },
            url: { type: "string", description: "Relative download URL (/api/attachments/{id})." },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  } as const;
}
