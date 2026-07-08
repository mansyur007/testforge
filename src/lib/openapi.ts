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
          properties: { action: { type: "string" }, expected: { type: "string" } },
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
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
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
