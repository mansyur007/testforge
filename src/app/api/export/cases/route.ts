import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { db } from "@/lib/db";
import { getSession, authenticateApiKey } from "@/lib/auth";
import { caseDisplayId, type TestStep } from "@/lib/constants";
import { formatCustomValue, type CustomValue } from "@/lib/custom-fields";

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

  // F-03: one cf_<key> column per active CASE custom field.
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
      defs.map((d) => [
        `cf_${d.key}`,
        formatCustomValue(d, values[d.key], memberNames),
      ])
    );
  };

  const csv = Papa.unparse(
    project.cases.map((c) => ({
      id: caseDisplayId(project.slug, c.seq),
      title: c.title,
      suite: c.suite?.name ?? "",
      description: c.description ?? "",
      preconditions: c.preconditions ?? "",
      // Match the import/template format: "action :: expected" per step, steps
      // separated by " | ". The ":: expected" part is only added when present,
      // so an exported CSV round-trips cleanly back through import.
      steps: (JSON.parse(c.stepsJson || "[]") as TestStep[])
        .map((s) =>
          s.expected?.trim() ? `${s.action} :: ${s.expected}` : s.action
        )
        .join(" | "),
      expected_result: c.expectedResult ?? "",
      priority: c.priority,
      type: c.type,
      status: c.status,
      automation_status: c.automationStatus,
      tags: c.tags,
      ...customCols(c),
    }))
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${project.slug}-cases.csv"`,
    },
  });
}
