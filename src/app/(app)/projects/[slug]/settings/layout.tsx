import { loadSettingsProject } from "@/lib/settings-sections";
import { SETTINGS_NAV, settingsHref } from "@/lib/settings-nav";
import { SettingsModalShell } from "@/components/SettingsModalShell";

export const dynamic = "force-dynamic";

// The settings modal is a route, not client-only state: every section is a
// server-rendered child route, so it deep-links, reloads, and gets its data
// the same way the standalone permalink pages do.
export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const project = await loadSettingsProject(params.slug);

  return (
    <SettingsModalShell
      title={`${project.name} · Settings`}
      closeHref={`/projects/${project.slug}`}
      sections={SETTINGS_NAV.map((s) => ({
        key: s.key,
        label: s.label,
        icon: s.icon,
        href: settingsHref(project.slug, s.key),
      }))}
    >
      {children}
    </SettingsModalShell>
  );
}
