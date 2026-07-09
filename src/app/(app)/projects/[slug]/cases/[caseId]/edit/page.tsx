import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { CaseForm } from "@/components/CaseForm";
import { ProjectTabs } from "@/components/ProjectTabs";
import { caseDisplayId } from "@/lib/constants";

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
    include: { project: { include: { suites: { orderBy: { order: "asc" } } } } },
  });
  if (!testCase || testCase.project.slug !== params.slug) notFound();

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
        }}
      />
    </div>
  );
}
