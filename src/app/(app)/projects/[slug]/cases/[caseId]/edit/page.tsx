import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { CaseForm } from "@/components/CaseForm";
import { ProjectTabs } from "@/components/ProjectTabs";
import { caseDisplayId } from "@/lib/constants";
import { parseDatasets } from "@/lib/datasets";

export const dynamic = "force-dynamic";

export default async function EditCasePage({
  params,
}: {
  params: { slug: string; caseId: string };
}) {
  const session = await requireSession();
  const testCase = await db.testCase.findFirst({
    where: {
      id: params.caseId,
      project: { members: { some: { userId: session.userId } } },
    },
    include: {
      project: {
        include: {
          suites: { orderBy: { order: "asc" } },
          members: { include: { user: { select: { id: true, name: true } } } },
        },
      },
    },
  });
  if (!testCase || testCase.project.slug !== params.slug) notFound();

  const customDefs = await db.customFieldDef.findMany({
    where: { projectId: testCase.projectId, entity: "CASE", active: true },
    orderBy: { order: "asc" },
  });
  const sharedGroups = await db.sharedStepGroup.findMany({
    where: { projectId: testCase.projectId },
    orderBy: { title: "asc" },
  });

  return (
    <div className="space-y-6">
      <ProjectTabs
        slug={testCase.project.slug}
        name={testCase.project.name}
        active="cases"
      />
      <h2 className="text-lg font-semibold">
        Edit {caseDisplayId(testCase.project.slug, testCase.seq)}
      </h2>
      <CaseForm
        projectId={testCase.projectId}
        projectSlug={testCase.project.slug}
        suites={testCase.project.suites}
        initial={{
          caseId: testCase.id,
          title: testCase.title,
          description: testCase.description ?? "",
          preconditions: testCase.preconditions ?? "",
          expectedResult: testCase.expectedResult ?? "",
          priority: testCase.priority,
          type: testCase.type,
          status: testCase.status,
          automationStatus: testCase.automationStatus,
          tags: testCase.tags,
          linkedIssues: testCase.linkedIssues ?? "",
          suiteId: testCase.suiteId ?? "",
          steps: JSON.parse(testCase.stepsJson || "[]"),
          custom: JSON.parse(testCase.customJson || "{}"),
          datasets: parseDatasets(testCase.datasetJson),
        }}
        customDefs={customDefs.map((d) => ({
          key: d.key,
          label: d.label,
          type: d.type,
          options: JSON.parse(d.optionsJson || "[]"),
          required: d.required,
        }))}
        members={testCase.project.members.map((m) => m.user)}
        sharedGroups={sharedGroups.map((g) => {
          const steps = JSON.parse(g.stepsJson || "[]");
          return { id: g.id, title: g.title, stepCount: steps.length, steps };
        })}
      />
    </div>
  );
}
