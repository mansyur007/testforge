import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { ProjectTabs } from "@/components/ProjectTabs";
import { NewRunForm } from "@/components/NewRunForm";
import { caseDisplayId } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function NewRunPage({
  params,
}: {
  params: { slug: string };
}) {
  await requireSession();
  const project = await db.project.findUnique({
    where: { slug: params.slug },
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

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="runs" />
      <h2 className="text-lg font-semibold">Buat Test Run Baru</h2>
      <NewRunForm
        projectId={project.id}
        milestones={project.milestones.map((m) => ({ id: m.id, name: m.name }))}
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
