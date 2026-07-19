import { BackLink } from "@/components/icons";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { ProjectTabs } from "@/components/ProjectTabs";
import { SharedStepsManager } from "@/components/SharedStepsManager";
import { parseGroupSteps, findReferencingCases } from "@/lib/steps";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";

// F-04: the project's shared-steps library.
export default async function SharedStepsPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
  });
  if (!project) notFound();

  const groups = await db.sharedStepGroup.findMany({
    where: { projectId: project.id },
    orderBy: { title: "asc" },
  });
  const usage = await Promise.all(
    groups.map(async (g) => (await findReferencingCases(project.id, g.id)).length)
  );

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="cases" />
      <BackLink href={`/projects/${project.slug}`}>Back to test cases</BackLink>
      <div>
        <h2 className="text-lg font-semibold">Shared Steps</h2>
        <p className="text-sm text-slate-400">
          Reusable step blocks. Edit one here and every test case that inserts
          it updates instantly; a block can only be deleted when no case uses it.
        </p>
      </div>
      <SharedStepsManager
        projectId={project.id}
        canWrite={await can(session.userId, project.id, "case.write")} // F-14
        groups={groups.map((g, i) => ({
          id: g.id,
          title: g.title,
          steps: parseGroupSteps(g.stepsJson),
          usageCount: usage[i],
          updatedAt: g.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
