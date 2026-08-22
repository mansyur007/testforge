import type { IconName } from "@/components/icons";

// The workspace settings registry: the six pages under /settings/**, in the
// order they appear in the settings tab row.
//
// Before this file the sidebar carried all six as top-level entries, which
// made a nav of eleven items where six of them were the same kind of thing.
// They now sit behind one "Settings" entry, and this list is what both that
// entry (for its destination) and the settings layout (for its tabs) read, so
// adding a settings page means touching one array rather than two files.
//
// Not to be confused with `lib/settings-nav.ts`, which is the *project*
// settings registry (/projects/<slug>/settings/<key>). Same shape of problem,
// different scope: that one is per-project, this one is per-workspace.

export type AppSettingsItem = {
  href: string;
  label: string;
  icon: IconName;
};

export const APP_SETTINGS_NAV: AppSettingsItem[] = [
  { href: "/settings/account", label: "Account", icon: "nav-account" },
  { href: "/settings/team", label: "Team", icon: "nav-team" },
  { href: "/settings/api-keys", label: "API Keys", icon: "nav-keys" },
  { href: "/settings/ai", label: "AI assist", icon: "ai" },
  { href: "/settings/audit-log", label: "Audit Log", icon: "nav-audit" },
  { href: "/settings/backup", label: "Backup", icon: "nav-backup" },
];

/** Where the sidebar's single "Settings" entry lands, and where a bare
 *  `/settings` redirects to — the top of the list, so "what you land on"
 *  always matches "what's highlighted first". Account rather than an
 *  admin-only page: it is the one page every role can act on. */
export const DEFAULT_APP_SETTINGS_HREF = APP_SETTINGS_NAV[0].href;

/** The nav entry owning `pathname`, or undefined off the settings tree.
 *  Prefix-matched so a future nested route (/settings/team/roles) keeps its
 *  parent tab lit rather than lighting none of them. */
export function activeAppSettings(pathname: string): AppSettingsItem | undefined {
  return APP_SETTINGS_NAV.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}
