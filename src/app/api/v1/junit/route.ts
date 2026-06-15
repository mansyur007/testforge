import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import { db } from "@/lib/db";
import { authenticateApiKey } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type JUnitCase = {
  name: string;
  classname?: string;
  time?: string;
  failure?: unknown;
  error?: unknown;
  skipped?: unknown;
};

function toArray<T>(x: T | T[] | undefined): T[] {
  if (x === undefined) return [];
  return Array.isArray(x) ? x : [x];
}

// Upload hasil automation framework-agnostic via JUnit XML (PRD §7.1 P1, US-010).
// Matching ke test case: anotasi TC-[SLUG]-[NUM] di nama test, atau exact title.
export async function POST(req: NextRequest) {
  const user = await authenticateApiKey(req);
  if (!user)
    return NextResponse.json(
      { error: "Unauthorized — sertakan header Authorization: Bearer <API_KEY>" },
      { status: 401 }
    );

  const slug = req.nextUrl.searchParams.get("project") ?? "";
  const runName =
    req.nextUrl.searchParams.get("name") ??
    `Automation Run ${new Date().toISOString()}`;
  const source = (req.nextUrl.searchParams.get("source") ?? "JUNIT").toUpperCase();

  const project = await db.project.findFirst({
    where: { slug, members: { some: { userId: user.id } } },
    include: { cases: { where: { deletedAt: null } } },
  });
  if (!project)
    return NextResponse.json(
      { error: `Proyek dengan slug "${slug}" tidak ditemukan` },
      { status: 404 }
    );

  type JUnitSuite = { testcase?: JUnitCase | JUnitCase[] };
  type JUnitDoc = {
    testsuites?: { testsuite?: JUnitSuite | JUnitSuite[] };
    testsuite?: JUnitSuite | JUnitSuite[];
  };

  const xml = await req.text();
  let parsed: JUnitDoc;
  try {
    parsed = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
    }).parse(xml) as JUnitDoc;
  } catch {
    return NextResponse.json({ error: "XML tidak valid" }, { status: 400 });
  }

  const suites = toArray(
    parsed.testsuites ? parsed.testsuites.testsuite : parsed.testsuite
  );
  const testcases: JUnitCase[] = suites.flatMap((s) => toArray(s?.testcase));
  if (!testcases.length)
    return NextResponse.json(
      { error: "Tidak ada <testcase> ditemukan di JUnit XML" },
      { status: 400 }
    );

  const idPattern = new RegExp(
    `TC-${project.slug.toUpperCase()}-(\\d+)`,
    "i"
  );

  const matched: { caseId: string; status: string; comment: string; time: number }[] = [];
  const unmatched: string[] = [];

  for (const tc of testcases) {
    const name = String(tc.name ?? "");
    const status =
      tc.failure !== undefined || tc.error !== undefined
        ? "FAILED"
        : tc.skipped !== undefined
          ? "SKIPPED"
          : "PASSED";
    const time = Math.round(parseFloat(String(tc.time ?? "0")) || 0);

    // 1) match via anotasi TC-SLUG-NUM di nama test
    const idMatch = name.match(idPattern);
    let testCase = idMatch
      ? project.cases.find((c) => c.seq === parseInt(idMatch[1], 10))
      : undefined;
    // 2) fallback: exact title match (auto-matching, PRD §4.4.2)
    if (!testCase) {
      const cleanName = name.replace(idPattern, "").trim();
      testCase = project.cases.find(
        (c) => c.title.toLowerCase() === cleanName.toLowerCase()
      );
    }

    if (testCase) {
      matched.push({
        caseId: testCase.id,
        status,
        comment: `[${source}] ${name}`,
        time,
      });
    } else {
      unmatched.push(name);
    }
  }

  if (!matched.length)
    return NextResponse.json(
      {
        error:
          "Tidak ada test yang ter-match ke test case. Tambahkan anotasi TC-ID di nama test atau samakan judul.",
        unmatched,
      },
      { status: 422 }
    );

  // dedupe: satu result per case per run (ambil status terakhir)
  const byCase = new Map<string, (typeof matched)[number]>();
  matched.forEach((m) => byCase.set(m.caseId, m));

  const run = await db.testRun.create({
    data: {
      projectId: project.id,
      name: runName,
      source,
      status: "COMPLETED",
      completedAt: new Date(),
      createdById: user.id,
      results: {
        create: Array.from(byCase.values()).map((m) => ({
          caseId: m.caseId,
          status: m.status,
          comment: m.comment,
          elapsedSeconds: m.time,
        })),
      },
    },
    include: { results: true },
  });

  await logAudit({
    userId: user.id,
    action: "automation.upload",
    entityType: "run",
    entityId: run.id,
    detail: `${source}: ${byCase.size} matched, ${unmatched.length} unmatched`,
  });

  return NextResponse.json({
    runId: run.id,
    runUrl: `/projects/${project.slug}/runs/${run.id}`,
    matched: byCase.size,
    unmatched,
    summary: {
      passed: run.results.filter((r) => r.status === "PASSED").length,
      failed: run.results.filter((r) => r.status === "FAILED").length,
      skipped: run.results.filter((r) => r.status === "SKIPPED").length,
    },
  });
}
