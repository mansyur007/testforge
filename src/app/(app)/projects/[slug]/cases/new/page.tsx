import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { CaseForm } from "@/components/CaseForm";
import { ProjectTabs } from "@/components/ProjectTabs";

export const dynamic = "force-dynamic";

export default async function NewCasePage({
  params,
}: {
  params: { slug: string };
}) {
  await requireSession();
  const project = await db.project.findUnique({
    where: { slug: params.slug },
    include: { suites: { orderBy: { order: "asc" } } },
  });
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="cases" />
      <h2 className="text-lg font-semibold">Buat Test Case Baru</h2>
      <CaseForm projectId={project.id} suites={project.suites} />
    </div>
  );
}
