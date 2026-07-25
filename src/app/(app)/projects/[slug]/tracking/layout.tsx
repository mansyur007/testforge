import { loadProjectChrome } from "@/lib/project-chrome";
import { TRACKING_NAV, trackingHref } from "@/lib/tracking-nav";
import { SectionModalShell } from "@/components/SectionModalShell";

export const dynamic = "force-dynamic";

// The tracking modal is a route, not client-only state: every section is a
// server-rendered child route, so it deep-links, reloads, and gets its data
// the same way the standalone permalink pages do. Same shape as the settings
// hub next to it in the tab bar.
export default async function TrackingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const project = await loadProjectChrome(params.slug);

  return (
    <SectionModalShell
      title={`${project.name} · Tracking`}
      icon="checklist"
      ariaLabel="Project tracking"
      testIdPrefix="project-tracking"
      closeHref={`/projects/${project.slug}`}
      sections={TRACKING_NAV.map((s) => ({
        key: s.key,
        label: s.label,
        icon: s.icon,
        href: trackingHref(project.slug, s.key),
      }))}
    >
      {children}
    </SectionModalShell>
  );
}
