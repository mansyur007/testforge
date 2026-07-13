import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { db } from "@/lib/db";
import { getSession, authenticateApiKey } from "@/lib/auth";
import {
  MATRIX_BUCKETS,
  latestKindByCase,
  bucketRequirement,
  derivedStatus,
} from "@/lib/requirements";

// F-18: traceability matrix as CSV — one row per requirement, a column per
// latest-result bucket, plus the derived coverage status.
export async function GET(req: NextRequest) {
  const session = (await getSession()) ?? (await authenticateApiKey(req));
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = "userId" in session ? session.userId : session.id;

  const slug = req.nextUrl.searchParams.get("project") ?? "";
  const project = await db.project.findFirst({
    where: { slug, members: { some: { userId } } },
    include: {
      requirements: {
        include: {
          cases: {
            include: {
              testCase: { select: { id: true, status: true, deletedAt: true } },
            },
          },
        },
        orderBy: { refId: "asc" },
      },
    },
  });
  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const allCaseIds = Array.from(
    new Set(project.requirements.flatMap((r) => r.cases.map((c) => c.caseId)))
  );
  const latestKind = await latestKindByCase(project.id, allCaseIds);

  const csv = Papa.unparse(
    project.requirements.map((r) => {
      const counts = bucketRequirement(
        r.cases.map((c) => c.testCase),
        latestKind
      );
      return {
        ref_id: r.refId,
        title: r.title,
        status: derivedStatus(r.status, r.cases.map((c) => c.testCase)),
        source_url: r.sourceUrl ?? "",
        ...Object.fromEntries(
          MATRIX_BUCKETS.map((b) => [b.toLowerCase().replace(/\s/g, "_"), counts[b]])
        ),
      };
    })
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-traceability-matrix.csv"`,
    },
  });
}
