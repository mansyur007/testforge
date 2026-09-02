import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api";
import { listTemplates } from "@/lib/templates/library";

// F-47 REST API v1: the published template library.
//
// Not project-scoped — the library is global (one per instance), so this sits
// at /api/v1/templates rather than under a project. Read-only: authoring is a
// superadmin action and never reaches the project API.
//
// Deliberately unpaginated. The library is a curated list bounded by what a
// human will author (a handful of packs, capped at 60 suites each), so a cursor
// would be ceremony over a response that never grows past one screen.
export async function GET(req: NextRequest) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const templates = await listTemplates();
  return NextResponse.json({
    data: templates.map((t) => ({
      slug: t.slug,
      name: t.name,
      summary: t.summary,
      category: t.category,
      version: t.version,
      suiteCount: t.suiteCount,
      caseCount: t.caseCount,
      coverage: t.coverage,
    })),
  });
}
