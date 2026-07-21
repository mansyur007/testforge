import { ProjectTabs } from "@/components/ProjectTabs";
import { MembersSection } from "@/components/settings/MembersSection";
import { loadSettingsProject } from "@/lib/settings-sections";

export const dynamic = "force-dynamic";

// Standalone permalink for the "members" settings section. The same section
// also renders inside the settings modal (/projects/<slug>/settings/members);
// this route keeps the project tab bar around it so a direct link still lands
// somewhere navigable.
export default async function ProjectMembersPage({
  params,
}: {
  params: { slug: string };
}) {
  const project = await loadSettingsProject(params.slug);

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="members" />
      <MembersSection params={params} searchParams={{}} />
    </div>
  );
}
