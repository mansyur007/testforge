import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, authenticateApiKey } from "@/lib/auth";
import { serializeRun, serializeResult, serializeCase } from "@/lib/api";
import { isMuted } from "@/lib/mute";
import { loadStepGroups } from "@/lib/steps";

// F-30: full-fidelity JSON export of a run — the run itself, plus every
// result with its full case snapshot (not just the display columns the CSV/
// XLSX exports show).

export async function GET(req: NextRequest) {
  const session = (await getSession()) ?? (await authenticateApiKey(req));
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = "userId" in session ? session.userId : session.id;

  const id = req.nextUrl.searchParams.get("id") ?? "";
  const run = await db.testRun.findFirst({
    where: { id, project: { members: { some: { userId } } } },
    include: {
      project: true,
      results: { include: { testCase: true }, orderBy: { testCase: { seq: "asc" } } },
    },
  });
  if (!run)
    return NextResponse.json({ error: "Run not found" }, { status: 404 });

  const stepGroups = await loadStepGroups(run.projectId);
  const caseById = new Map(run.results.map((r) => [r.testCase.id, r.testCase]));

  const body = JSON.stringify(
    {
      project: run.project.slug,
      exportedAt: new Date().toISOString(),
      run: serializeRun(run),
      results: run.results.map((r) => ({
        ...serializeResult(r, isMuted(r.testCase.mutedAt)),
        case: serializeCase(run.project.slug, caseById.get(r.testCase.id)!, stepGroups),
      })),
    },
    null,
    2
  );

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="run-${run.id}.json"`,
    },
  });
}
