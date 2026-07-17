import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, authenticateApiKey } from "@/lib/auth";
import { caseDisplayId, type TestStep } from "@/lib/constants";
import { formatCustomValue, type CustomValue } from "@/lib/custom-fields";
import { expandSteps, loadStepGroups } from "@/lib/steps";
import { formatDuration } from "@/lib/duration";
import { buildXlsx } from "@/lib/xlsx";

// F-30: same rows as /api/export/cases (CSV), as a .xlsx workbook.

export async function GET(req: NextRequest) {
  const session = (await getSession()) ?? (await authenticateApiKey(req));
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = "userId" in session ? session.userId : session.id;

  const slug = req.nextUrl.searchParams.get("project") ?? "";
  const project = await db.project.findFirst({
    where: { slug, members: { some: { userId } } },
    include: {
      cases: {
        where: { deletedAt: null },
        orderBy: { seq: "asc" },
        include: { suite: true },
      },
    },
  });
  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const stepGroups = await loadStepGroups(project.id);

  const defs = await db.customFieldDef.findMany({
    where: { projectId: project.id, entity: "CASE", active: true },
    orderBy: { order: "asc" },
  });
  const memberNames = new Map(
    (
      await db.projectMember.findMany({
        where: { projectId: project.id },
        include: { user: { select: { id: true, name: true } } },
      })
    ).map((m) => [m.user.id, m.user.name])
  );
  const customCols = (c: { customJson: string }) => {
    const values: Record<string, CustomValue> = JSON.parse(c.customJson || "{}");
    return Object.fromEntries(
      defs.map((d) => [`cf_${d.key}`, formatCustomValue(d, values[d.key], memberNames)])
    );
  };

  const rows = project.cases.map((c) => ({
    id: caseDisplayId(project.slug, c.seq),
    title: c.title,
    suite: c.suite?.name ?? "",
    description: c.description ?? "",
    preconditions: c.preconditions ?? "",
    steps: expandSteps(JSON.parse(c.stepsJson || "[]") as TestStep[], stepGroups)
      .map((s) => {
        const action = s.fromShared ? `[shared: ${s.fromShared.title}] ${s.action}` : s.action;
        return s.expected?.trim() ? `${action} :: ${s.expected}` : action;
      })
      .join(" | "),
    expected_result: c.expectedResult ?? "",
    priority: c.priority,
    type: c.type,
    status: c.status,
    automation_status: c.automationStatus,
    tags: c.tags,
    estimate: formatDuration(c.estimateSeconds),
    ...customCols(c),
  }));

  const columns = [
    { header: "ID", key: "id", width: 14 },
    { header: "Title", key: "title", width: 40 },
    { header: "Suite", key: "suite", width: 18 },
    { header: "Description", key: "description", width: 30 },
    { header: "Preconditions", key: "preconditions", width: 30 },
    { header: "Steps", key: "steps", width: 50 },
    { header: "Expected Result", key: "expected_result", width: 30 },
    { header: "Priority", key: "priority", width: 12 },
    { header: "Type", key: "type", width: 14 },
    { header: "Status", key: "status", width: 14 },
    { header: "Automation Status", key: "automation_status", width: 16 },
    { header: "Tags", key: "tags", width: 20 },
    { header: "Estimate", key: "estimate", width: 12 },
    ...defs.map((d) => ({ header: d.label, key: `cf_${d.key}`, width: 20 })),
  ];

  const buffer = await buildXlsx("Cases", columns, rows);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${project.slug}-cases.xlsx"`,
    },
  });
}
