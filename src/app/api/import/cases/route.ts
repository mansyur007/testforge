import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import type { CustomFieldDef } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { PRIORITIES, CASE_TYPES } from "@/lib/constants";
import { validateCustomValues } from "@/lib/custom-fields";
import { recordRevision } from "@/lib/case-revisions";
import { parseDuration } from "@/lib/duration";

type CsvRow = Record<string, string>;

// F-03: cf_<key> columns map onto the project's CASE custom fields. A cell is
// parsed per the def's type (multi-select splits on ";", checkbox accepts
// true/yes/1); the shared validator produces the row error or the values.
function readCustomCells(
  row: CsvRow,
  defs: CustomFieldDef[]
): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const def of defs) {
    const cell = row[`cf_${def.key}`]?.trim();
    if (!cell) continue;
    if (def.type === "MULTISELECT")
      input[def.key] = cell.split(";").map((s) => s.trim()).filter(Boolean);
    else if (def.type === "CHECKBOX")
      input[def.key] = ["true", "yes", "1"].includes(cell.toLowerCase());
    else input[def.key] = cell;
  }
  return input;
}

function validateRow(
  row: CsvRow,
  defs: CustomFieldDef[],
  memberIds: Set<string>
): { error: string | null; customJson: string } {
  if (!row.title?.trim()) return { error: "title is required", customJson: "{}" };
  if (
    row.priority &&
    !(PRIORITIES as readonly string[]).includes(row.priority.toUpperCase())
  )
    return { error: `Invalid priority: ${row.priority}`, customJson: "{}" };
  if (
    row.type &&
    !(CASE_TYPES as readonly string[]).includes(row.type.toUpperCase())
  )
    return { error: `Invalid type: ${row.type}`, customJson: "{}" };

  const check = validateCustomValues(defs, readCustomCells(row, defs), memberIds);
  if (!check.ok)
    return {
      error: check.errors.map((e) => e.message).join("; "),
      customJson: "{}",
    };
  return { error: null, customJson: JSON.stringify(check.values) };
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
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

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
        { error: "Suite not found in this project" },
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
    return NextResponse.json({ error: "CSV is empty or invalid" }, { status: 400 });

  const defs = await db.customFieldDef.findMany({
    where: { projectId: project.id, entity: "CASE", active: true },
    orderBy: { order: "asc" },
  });
  const memberIds = new Set(
    (
      await db.projectMember.findMany({
        where: { projectId: project.id },
        select: { userId: true },
      })
    ).map((m) => m.userId)
  );

  const rows = parsed.data.map((row) => {
    const { error, customJson } = validateRow(row, defs, memberIds);
    return {
      title: row.title ?? "",
      valid: !error,
      error: error ?? undefined,
      row,
      customJson,
    };
  });

  if (dryRun) {
    return NextResponse.json({
      rows: rows.map(({ title, valid, error }) => ({ title, valid, error })),
    });
  }

  const validRows = rows.filter((r) => r.valid);
  let imported = 0;
  for (const { row, customJson } of validRows) {
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
    const created = await db.testCase.create({
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
        estimateSeconds: row.estimate?.trim()
          ? parseDuration(row.estimate.trim())
          : null,
        customJson,
      },
    });
    await recordRevision(created.id, session.userId); // F-05: rev 1 "created"
    imported++;
  }

  await logAudit({
    userId: session.userId,
    action: "case.import_csv",
    detail: `${imported} case → ${project.name}`,
  });
  return NextResponse.json({ imported });
}
