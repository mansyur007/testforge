import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { db } from "@/lib/db";
import { getSession, authenticateApiKey } from "@/lib/auth";
import { caseDisplayId, type TestStep } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const session = (await getSession()) ?? (await authenticateApiKey(req));
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slug = req.nextUrl.searchParams.get("project") ?? "";
  const project = await db.project.findUnique({
    where: { slug },
    include: {
      cases: {
        where: { deletedAt: null },
        orderBy: { seq: "asc" },
        include: { suite: true },
      },
    },
  });
  if (!project)
    return NextResponse.json({ error: "Proyek tidak ditemukan" }, { status: 404 });

  const csv = Papa.unparse(
    project.cases.map((c) => ({
      id: caseDisplayId(project.slug, c.seq),
      title: c.title,
      suite: c.suite?.name ?? "",
      description: c.description ?? "",
      preconditions: c.preconditions ?? "",
      steps: (JSON.parse(c.stepsJson || "[]") as TestStep[])
        .map((s) => s.action)
        .join(" | "),
      expected_result: c.expectedResult ?? "",
      priority: c.priority,
      type: c.type,
      status: c.status,
      automation_status: c.automationStatus,
      tags: c.tags,
    }))
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${project.slug}-cases.csv"`,
    },
  });
}
