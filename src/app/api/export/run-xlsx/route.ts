import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, authenticateApiKey } from "@/lib/auth";
import { caseDisplayId } from "@/lib/constants";
import { formatDuration } from "@/lib/duration";
import { buildXlsx } from "@/lib/xlsx";

// F-30: same rows as /api/export/run (CSV), as a .xlsx workbook.

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
      environment: true,
      results: {
        include: { testCase: true, assignee: true },
        orderBy: { testCase: { seq: "asc" } },
      },
    },
  });
  if (!run)
    return NextResponse.json({ error: "Run not found" }, { status: 404 });

  const rows = run.results.map((r) => ({
    case_id: caseDisplayId(run.project.slug, r.testCase.seq),
    title: r.testCase.title,
    case_rev: r.caseRev ?? "",
    dataset: r.datasetName ?? "",
    environment: run.environment?.name ?? "",
    status: r.status,
    assignee: r.assignee?.name ?? "",
    comment: r.comment ?? "",
    defect_url: r.defectUrl ?? "",
    elapsed_seconds: r.elapsedSeconds ?? "",
    estimate: formatDuration(r.testCase.estimateSeconds),
    updated_at: r.updatedAt.toISOString(),
  }));

  const columns = [
    { header: "Case ID", key: "case_id", width: 14 },
    { header: "Title", key: "title", width: 40 },
    { header: "Case Rev", key: "case_rev", width: 10 },
    { header: "Dataset", key: "dataset", width: 16 },
    { header: "Environment", key: "environment", width: 14 },
    { header: "Status", key: "status", width: 14 },
    { header: "Assignee", key: "assignee", width: 18 },
    { header: "Comment", key: "comment", width: 30 },
    { header: "Defect URL", key: "defect_url", width: 30 },
    { header: "Elapsed (s)", key: "elapsed_seconds", width: 12 },
    { header: "Estimate", key: "estimate", width: 12 },
    { header: "Updated At", key: "updated_at", width: 22 },
  ];

  const buffer = await buildXlsx("Run Results", columns, rows);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="run-${run.id}.xlsx"`,
    },
  });
}
