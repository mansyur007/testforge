import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope, getProjectRole, canManageMembers } from "@/lib/projects";
import { ProjectTabs } from "@/components/ProjectTabs";
import {
  IntegrationsManager,
  type IntegrationView,
} from "@/components/IntegrationsManager";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
  });
  if (!project) notFound();

  const role = await getProjectRole(session.userId, project.id);
  const isAdmin = canManageMembers(role);

  // `authEnc` is deliberately absent from the select — it must never reach a
  // page prop, let alone the serialized RSC payload sent to the browser.
  const integrations: IntegrationView[] = isAdmin
    ? await db.integration.findMany({
        where: { projectId: project.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          provider: true,
          baseUrl: true,
          targetKey: true,
          active: true,
        },
      })
    : [];

  return (
    <div className="space-y-6">
      <ProjectTabs
        slug={project.slug}
        name={project.name}
        active="integrations"
      />

      <div>
        <h2 className="text-lg font-bold">Issue tracker</h2>
        <p className="text-sm text-slate-500">
          Connect Jira, GitHub or GitLab to file issues straight from a failed
          test and see their live status.
        </p>
      </div>

      {isAdmin ? (
        <IntegrationsManager
          projectId={project.id}
          integrations={integrations}
        />
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
          Only project owners and admins can manage integrations.
        </p>
      )}
    </div>
  );
}
