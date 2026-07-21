import { ProjectTabs } from "@/components/ProjectTabs";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { loadSettingsProject } from "@/lib/settings-sections";

export const dynamic = "force-dynamic";

// Standalone permalink for the "notifications" settings section. The same section
// also renders inside the settings modal (/projects/<slug>/settings/notifications);
// this route keeps the project tab bar around it so a direct link still lands
// somewhere navigable.
export default async function NotificationsPage({
  params,
}: {
  params: { slug: string };
}) {
  const project = await loadSettingsProject(params.slug);

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="notifications" />
      <NotificationsSection params={params} searchParams={{}} />
    </div>
  );
}
