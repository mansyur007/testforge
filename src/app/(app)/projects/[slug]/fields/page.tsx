import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { ProjectTabs } from "@/components/ProjectTabs";
import { CustomFieldsManager } from "@/components/CustomFieldsManager";
import { ConfigurationsManager } from "@/components/ConfigurationsManager";
import { parseOptions } from "@/lib/custom-fields";
import { loadConfigGroups } from "@/lib/plans";

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

  const canManage =
    session.role === "ADMIN" ||
    ["OWNER", "ADMIN"].includes(project.members[0]?.role ?? "");

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
    </div>
  );
}
