import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { db } from "@/lib/db";
import { getSession, authenticateApiKey } from "@/lib/auth";
import { caseDisplayId } from "@/lib/constants";

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
      results: {
        include: { testCase: true, assignee: true },
        orderBy: { testCase: { seq: "asc" } },
      },
    },
  });
  if (!run)
    return NextResponse.json({ error: "Run not found" }, { status: 404 });

  const csv = Papa.unparse(
    run.results.map((r) => ({
      case_id: caseDisplayId(run.project.slug, r.testCase.seq),
      title: r.testCase.title,
      case_rev: r.caseRev ?? "",
      status: r.status,
      assignee: r.assignee?.name ?? "",
      comment: r.comment ?? "",
      defect_url: r.defectUrl ?? "",
      elapsed_seconds: r.elapsedSeconds ?? "",
      updated_at: r.updatedAt.toISOString(),
    }))
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="run-${run.id}.csv"`,
    },
  });
}
