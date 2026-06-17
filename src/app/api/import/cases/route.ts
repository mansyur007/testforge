import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { PRIORITIES, CASE_TYPES } from "@/lib/constants";

type CsvRow = Record<string, string>;

function validateRow(row: CsvRow) {
  if (!row.title?.trim()) return "title wajib diisi";
  if (
    row.priority &&
    !(PRIORITIES as readonly string[]).includes(row.priority.toUpperCase())
  )
    return `priority tidak valid: ${row.priority}`;
  if (
    row.type &&
    !(CASE_TYPES as readonly string[]).includes(row.type.toUpperCase())
  )
    return `type tidak valid: ${row.type}`;
  return null;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectSlug = req.nextUrl.searchParams.get("project");
  const dryRun = req.nextUrl.searchParams.get("dryRun") === "true";
  const project = await db.project.findFirst({
    where: {
      slug: projectSlug ?? "",
      members: { some: { userId: session.userId } },
    },
  });
  if (!project)
    return NextResponse.json({ error: "Proyek tidak ditemukan" }, { status: 404 });

  // Optional target suite — must belong to this project.
  const suiteIdParam = req.nextUrl.searchParams.get("suite");
  let targetSuiteId: string | null = null;
  if (suiteIdParam) {
    const suite = await db.testSuite.findFirst({
      where: { id: suiteIdParam, projectId: project.id },
      select: { id: true },
    });
    if (!suite)
      return NextResponse.json(
        { error: "Suite tidak ditemukan di proyek ini" },
        { status: 400 }
      );
    targetSuiteId = suite.id;
  }

  const csv = await req.text();
  const parsed = Papa.parse<CsvRow>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (!parsed.data.length)
    return NextResponse.json({ error: "CSV kosong atau tidak valid" }, { status: 400 });

  const rows = parsed.data.map((row) => {
    const error = validateRow(row);
    return { title: row.title ?? "", valid: !error, error: error ?? undefined, row };
  });

  if (dryRun) {
    return NextResponse.json({
      rows: rows.map(({ title, valid, error }) => ({ title, valid, error })),
    });
  }

  const validRows = rows.filter((r) => r.valid);
  let imported = 0;
  for (const { row } of validRows) {
    const updated = await db.project.update({
      where: { id: project.id },
      data: { caseCounter: { increment: 1 } },
    });
    // Steps are pipe-separated; within a step, an optional "::" splits the
    // action from its per-step expected result (e.g. "Click Login :: Dashboard").
    const steps = (row.steps ?? "")
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((segment) => {
        const [action, ...rest] = segment.split("::");
        return { action: action.trim(), expected: rest.join("::").trim() };
      });
    await db.testCase.create({
      data: {
        projectId: project.id,
        suiteId: targetSuiteId,
        seq: updated.caseCounter,
        title: row.title.trim(),
        description: row.description?.trim() || null,
        preconditions: row.preconditions?.trim() || null,
        stepsJson: JSON.stringify(steps),
        expectedResult: row.expected_result?.trim() || null,
        priority: row.priority?.toUpperCase() || "MEDIUM",
        type: row.type?.toUpperCase() || "FUNCTIONAL",
        tags: row.tags?.trim() || "",
      },
    });
    imported++;
  }

  await logAudit({
    userId: session.userId,
    action: "case.import_csv",
    detail: `${imported} case → ${project.name}`,
  });
  return NextResponse.json({ imported });
}
