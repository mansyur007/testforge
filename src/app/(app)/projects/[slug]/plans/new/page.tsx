import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { caseDisplayId } from "@/lib/constants";
import { loadConfigGroups } from "@/lib/plans";
import { ProjectTabs } from "@/components/ProjectTabs";
import { NewPlanForm } from "@/components/NewPlanForm";

export const dynamic = "force-dynamic";

// F-06: plan creation — case selection × configuration matrix.
export default async function NewPlanPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    include: {
      milestones: { where: { status: "OPEN" } },
      cases: {
        where: { deletedAt: null, status: { not: "DEPRECATED" } },
        orderBy: { seq: "asc" },
        include: { suite: true },
      },
    },
  });
  if (!project) notFound();

  const configGroups = await loadConfigGroups(project.id);

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="plans" />
      <h2 className="text-lg font-semibold">Create New Test Plan</h2>
      <NewPlanForm
        projectId={project.id}
        milestones={project.milestones.map((m) => ({ id: m.id, name: m.name }))}
        configGroups={configGroups.map((g) => ({
          id: g.id,
          name: g.name,
          options: g.options.map((o) => ({ id: o.id, name: o.name })),
        }))}
        cases={project.cases.map((c) => ({
          id: c.id,
          displayId: caseDisplayId(project.slug, c.seq),
          title: c.title,
          priority: c.priority,
          type: c.type,
          tags: c.tags,
          suiteName: c.suite?.name ?? "(tanpa suite)",
        }))}
      />
    </div>
  );
}
