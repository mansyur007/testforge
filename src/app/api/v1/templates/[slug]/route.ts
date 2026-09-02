import { NextRequest, NextResponse } from "next/server";
import { guard, notFoundError } from "@/lib/api";
import { getTemplate } from "@/lib/templates/library";

// F-47 REST API v1: one published template, with its full suite/case tree —
// what a client needs to render a preview or drive an apply.
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const t = await getTemplate(params.slug);
  if (!t) return notFoundError("Template not found");

  return NextResponse.json({
    slug: t.slug,
    name: t.name,
    summary: t.summary,
    description: t.description,
    category: t.category,
    version: t.version,
    suiteCount: t.suiteCount,
    caseCount: t.caseCount,
    coverage: t.coverage,
    variables: t.content.variables,
    suites: t.content.suites,
  });
}
