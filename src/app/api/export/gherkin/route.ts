import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, authenticateApiKey } from "@/lib/auth";
import { isGherkinCaseSteps } from "@/lib/steps";
import { serializeCasesToFeature } from "@/lib/gherkin";

// F-27: export every Gherkin-format case in a project as one .feature file
// (one Feature block per suite, one Scenario per case) — the reverse of the
// gherkin tool importer.

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

  const gherkinCases = project.cases
    .map((c) => {
      const steps: unknown = JSON.parse(c.stepsJson || "[]");
      if (!isGherkinCaseSteps(steps)) return null;
      return {
        title: c.title,
        tags: c.tags,
        gherkinBody: steps[0].gherkin,
        suiteName: c.suite?.name ?? null,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  const feature =
    gherkinCases.length > 0
      ? serializeCasesToFeature(gherkinCases, project.name)
      : "# No Gherkin-format cases in this project yet.\n";

  return new NextResponse(feature, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${project.slug}.feature"`,
    },
  });
}
