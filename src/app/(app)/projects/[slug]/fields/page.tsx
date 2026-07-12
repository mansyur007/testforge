import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { ProjectTabs } from "@/components/ProjectTabs";
import { CustomFieldsManager } from "@/components/CustomFieldsManager";
import { ConfigurationsManager } from "@/components/ConfigurationsManager";
import { EnvironmentsManager } from "@/components/EnvironmentsManager";
import { ResultStatusesManager } from "@/components/ResultStatusesManager";
import { parseOptions } from "@/lib/custom-fields";
import { loadConfigGroups } from "@/lib/plans";
import { loadEnvironments } from "@/lib/environments";
import { loadStatusDefs } from "@/lib/result-status-defs";
import { loadPerms } from "@/lib/permissions";

export const dynamic = "force-dynamic";

// F-03: per-project custom field definitions.
export default async function FieldsPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    include: { members: { where: { userId: session.userId } } },
  });
  if (!project) notFound();

  const defs = await db.customFieldDef.findMany({
    where: { projectId: project.id },
    orderBy: [{ entity: "asc" }, { order: "asc" }],
  });

  // F-06: configuration groups managed alongside fields.
  const configGroups = await loadConfigGroups(project.id);
  // F-19: environments managed alongside fields.
  const environments = await loadEnvironments(project.id);
  // F-14: result-status definitions managed alongside fields.
  const statusDefs = await loadStatusDefs(project.id);

  // F-14: central permission check (covers custom roles too).
  const perms = await loadPerms(session.userId, project.id);
  const canManage = perms.has("fields.manage");

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="fields" />
      <div>
        <h2 className="text-lg font-semibold">Custom Fields</h2>
        <p className="text-sm text-slate-400">
          Project-specific fields for test cases and run results. Keys and
          types are fixed after creation; disable a field to hide it from
          forms while keeping existing values visible.
        </p>
      </div>
      <CustomFieldsManager
        projectId={project.id}
        canManage={canManage}
        defs={defs.map((d) => ({
          id: d.id,
          entity: d.entity,
          key: d.key,
          label: d.label,
          type: d.type,
          options: parseOptions(d),
          required: d.required,
          active: d.active,
        }))}
      />

      {/* F-06: matrix axes for test plans (Browser × OS × …). */}
      <div className="pt-2">
        <h2 className="text-lg font-semibold">Configurations</h2>
        <p className="text-sm text-slate-400">
          Axes for test plans — a plan picks options across groups and creates
          one run per combination (e.g. Browser × OS).
        </p>
      </div>
      <ConfigurationsManager
        projectId={project.id}
        canManage={canManage}
        groups={configGroups.map((g) => ({
          id: g.id,
          name: g.name,
          options: g.options.map((o) => ({ id: o.id, name: o.name })),
        }))}
      />

      {/* F-14: result-status definitions. */}
      <div className="pt-2">
        <h2 className="text-lg font-semibold">Result Statuses</h2>
        <p className="text-sm text-slate-400">
          The outcomes an executor can record. Built-in statuses keep their key
          and kind; add your own (e.g. &quot;Known Issue&quot;) with a kind that
          tells the reports how to count it.
        </p>
      </div>
      <ResultStatusesManager
        projectId={project.id}
        canManage={canManage}
        defs={statusDefs}
      />

      {/* F-19: environments a run can be tagged against. */}
      <div className="pt-2">
        <h2 className="text-lg font-semibold">Environments</h2>
        <p className="text-sm text-slate-400">
          Tag runs with where they executed (Staging, Prod, …); filter runs
          and reports by environment.
        </p>
      </div>
      <EnvironmentsManager
        projectId={project.id}
        canManage={canManage}
        autoCreateEnvs={project.autoCreateEnvs}
        environments={environments.map((e) => ({
          id: e.id,
          name: e.name,
          url: e.url,
          active: e.active,
        }))}
      />
    </div>
  );
}
