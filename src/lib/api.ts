import type { TestCase } from "@prisma/client";
import type { NextRequest } from "next/server";
import { getSession, authenticateApiKey } from "@/lib/auth";
import { caseDisplayId } from "@/lib/constants";

// Resolve the acting user id from either a browser session or a Bearer API key.
// Returns null when neither authenticates the request.
export async function resolveUserId(req: NextRequest): Promise<string | null> {
  const auth = (await getSession()) ?? (await authenticateApiKey(req));
  if (!auth) return null;
  return "userId" in auth ? auth.userId : auth.id;
}

// Single source of truth for the shape of a case in the REST API, so the list
// and detail endpoints never drift apart.
export function serializeCase(slug: string, c: TestCase) {
  return {
    id: c.id,
    displayId: caseDisplayId(slug, c.seq),
    seq: c.seq,
    title: c.title,
    description: c.description,
    preconditions: c.preconditions,
    steps: JSON.parse(c.stepsJson || "[]"),
    expectedResult: c.expectedResult,
    priority: c.priority,
    type: c.type,
    status: c.status,
    automationStatus: c.automationStatus,
    suiteId: c.suiteId,
    tags: c.tags,
    assigneeId: c.assigneeId,
    linkedIssues: c.linkedIssues,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}
