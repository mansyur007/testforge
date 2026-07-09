import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { ProjectTabs } from "@/components/ProjectTabs";
import { CustomFieldsManager } from "@/components/CustomFieldsManager";
import { parseOptions } from "@/lib/custom-fields";

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
    </div>
  );
}
