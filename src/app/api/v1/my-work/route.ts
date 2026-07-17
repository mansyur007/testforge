import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api";
import { caseDisplayId } from "@/lib/constants";
import { loadMyWork } from "@/lib/my-work";

// F-31 "My work": cross-project — results assigned to me in active runs,
// cases assigned to me, and case reviews requested from me (F-15). Not
// project-scoped (an API key is already user-scoped, see ApiKey.userId),
// so this lives at the API root rather than under /projects/{slug}.

export async function GET(req: NextRequest) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const { results, cases, reviews } = await loadMyWork(g.userId);

  return NextResponse.json({
    results: results.map((r) => ({
      id: r.id,
      runId: r.run.id,
      runName: r.run.name,
      projectSlug: r.run.project.slug,
      caseDisplayId: caseDisplayId(r.run.project.slug, r.testCase.seq),
      caseTitle: r.testCase.title,
      status: r.status,
      updatedAt: r.updatedAt.toISOString(),
    })),
    cases: cases.map((c) => ({
      id: c.id,
      projectSlug: c.project.slug,
      displayId: caseDisplayId(c.project.slug, c.seq),
      title: c.title,
      priority: c.priority,
      status: c.status,
      updatedAt: c.updatedAt.toISOString(),
    })),
    reviews: reviews.map((c) => ({
      id: c.id,
      projectSlug: c.project.slug,
      displayId: caseDisplayId(c.project.slug, c.seq),
      title: c.title,
      updatedAt: c.updatedAt.toISOString(),
    })),
  });
}
