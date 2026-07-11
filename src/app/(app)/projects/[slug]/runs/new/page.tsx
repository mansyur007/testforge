import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { ProjectTabs } from "@/components/ProjectTabs";
import { NewRunForm } from "@/components/NewRunForm";
import { caseDisplayId } from "@/lib/constants";
import { loadEnvironments } from "@/lib/environments";

export const dynamic = "force-dynamic";

export default async function NewRunPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    include: {
      suites: { orderBy: { order: "asc" } },
      milestones: { where: { status: "OPEN" } },
      cases: {
        where: { deletedAt: null, status: { not: "DEPRECATED" } },
        orderBy: { seq: "asc" },
        include: { suite: true },
      },
    },
  });
  if (!project) notFound();

  // F-19: only active environments are offered at run creation.
  const environments = (await loadEnvironments(project.id)).filter((e) => e.active);

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="runs" />
      <h2 className="text-lg font-semibold">Create New Test Run</h2>
      <NewRunForm
        projectId={project.id}
        milestones={project.milestones.map((m) => ({ id: m.id, name: m.name }))}
        environments={environments.map((e) => ({ id: e.id, name: e.name }))}
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
