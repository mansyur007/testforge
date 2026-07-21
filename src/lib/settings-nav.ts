import type { IconName } from "@/components/icons";

// Client-safe half of the settings registry: keys, labels, icons and hrefs and
// nothing else. Kept apart from lib/settings-sections.tsx, which pulls in the
// server-only section components (db, next/headers) — a client component like
// ProjectTabs importing that file drags the whole server tree into the browser
// bundle. Same split as result-statuses (pure) vs result-status-defs (loader).

export type SettingsKey =
  | "import"
  | "fields"
  | "api"
  | "integrations"
  | "notifications"
  | "sharing"
  | "members";

export type SettingsNavItem = {
  key: SettingsKey;
  label: string;
  icon: IconName;
};

export const SETTINGS_NAV: SettingsNavItem[] = [
  { key: "import", label: "Import", icon: "import" },
  { key: "fields", label: "Fields", icon: "breakdown" },
  { key: "api", label: "API", icon: "cicd" },
  { key: "integrations", label: "Integrations", icon: "frameworks" },
  { key: "notifications", label: "Notifications", icon: "mailbox" },
  { key: "sharing", label: "Public sharing", icon: "tpl-web" },
  { key: "members", label: "Members", icon: "nav-team" },
];

/** The section the Settings control opens by default. */
export const DEFAULT_SETTINGS_KEY: SettingsKey = "fields";

export function settingsHref(
  slug: string,
  key: SettingsKey = DEFAULT_SETTINGS_KEY
) {
  return `/projects/${slug}/settings/${key}`;
}

export function isSettingsKey(key: string): key is SettingsKey {
  return SETTINGS_NAV.some((s) => s.key === key);
}
