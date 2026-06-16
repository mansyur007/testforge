import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { CaseForm } from "@/components/CaseForm";
import { ProjectTabs } from "@/components/ProjectTabs";

export const dynamic = "force-dynamic";

export default async function NewCasePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { suite?: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    include: { suites: { orderBy: { order: "asc" } } },
  });
  if (!project) notFound();

  // Default the new case to the suite the user was viewing (passed via ?suite=),
  // but only if it's a real suite of this project. Still changeable in the form.
  const defaultSuiteId = project.suites.some((s) => s.id === searchParams.suite)
    ? searchParams.suite
    : undefined;

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="cases" />
      <h2 className="text-lg font-semibold">Create New Test Case</h2>
      <CaseForm
        projectId={project.id}
        suites={project.suites}
        defaultSuiteId={defaultSuiteId}
      />
    </div>
  );
}
