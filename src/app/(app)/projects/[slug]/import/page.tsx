import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { ProjectTabs } from "@/components/ProjectTabs";
import { CsvImporter } from "@/components/CsvImporter";

export const dynamic = "force-dynamic";

export default async function ImportPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    include: { suites: { orderBy: { order: "asc" } } },
  });
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="import" />

      <div className="max-w-2xl">
        <CsvImporter
          projectSlug={project.slug}
          suites={project.suites.map((s) => ({
            id: s.id,
            name: s.name,
            parentId: s.parentId,
          }))}
        />
      </div>
    </div>
  );
}
