import { ProjectTabs } from "@/components/ProjectTabs";
import { SessionsSection } from "@/components/tracking/SessionsSection";
import { loadProjectChrome } from "@/lib/project-chrome";

export const dynamic = "force-dynamic";

// Standalone permalink for the "sessions" tracking section. The same section
// also renders inside the tracking modal (/projects/<slug>/tracking/sessions);
// this route keeps the project tab bar around it so a direct link still lands
// somewhere navigable.
export default async function SessionsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: Record<string, string | undefined>;
}) {
  const project = await loadProjectChrome(params.slug);

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="sessions" />
      <SessionsSection
        params={params}
        searchParams={searchParams}
        basePath={`/projects/${project.slug}/sessions`}
      />
    </div>
  );
}
