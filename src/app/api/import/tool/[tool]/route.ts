import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { parseTestRailXml } from "@/lib/importers/testrail";
import { parseQaseJson } from "@/lib/importers/qase";
import { parseTestLinkXml } from "@/lib/importers/testlink";
import { commitImport } from "@/lib/importers/commit";
import { ImportParseError, type ParsedImport } from "@/lib/importers/types";

// F-22: TestRail XML / Qase JSON / TestLink XML importers, mirroring the CSV
// importer's dry-run-then-commit flow (see /api/import/cases).
const PARSERS: Record<string, (body: string) => ParsedImport> = {
  testrail: parseTestRailXml,
  qase: parseQaseJson,
  testlink: parseTestLinkXml,
};

const SAMPLE_SIZE = 20;

export async function POST(
  req: NextRequest,
  { params }: { params: { tool: string } }
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parse = PARSERS[params.tool];
  if (!parse)
    return NextResponse.json(
      { error: `Unknown import tool "${params.tool}"` },
      { status: 400 }
    );

  const projectSlug = req.nextUrl.searchParams.get("project");
  const dryRun = req.nextUrl.searchParams.get("dryRun") === "true";
  const project = await db.project.findFirst({
    where: { slug: projectSlug ?? "", members: { some: { userId: session.userId } } },
  });
  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const body = await req.text();
  let parsed: ParsedImport;
  try {
    parsed = parse(body);
  } catch (err) {
    const message = err instanceof ImportParseError ? err.message : "Could not parse the uploaded file";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (dryRun) {
    const suitePaths = new Set(
      parsed.cases.map((c) => c.suitePath.join(" > ")).filter(Boolean)
    );
    const warnings = [
      ...parsed.toolWarnings,
      ...parsed.cases.flatMap((c) => c.warnings.map((w) => `"${c.title}": ${w}`)),
    ];
    return NextResponse.json({
      totalCases: parsed.cases.length,
      totalSuites: suitePaths.size,
      sample: parsed.cases.slice(0, SAMPLE_SIZE).map((c) => ({
        title: c.title,
        suitePath: c.suitePath.join(" / ") || "(project root)",
        priority: c.priority,
        type: c.type,
        stepCount: c.steps.length,
      })),
      warnings,
    });
  }

  const { imported, suitesCreated } = await commitImport(
    project.id,
    session.userId,
    parsed.cases
  );
  return NextResponse.json({ imported, suitesCreated });
}
