import { SETTINGS_NAV, type SettingsKey } from "@/lib/settings-nav";
import type { SectionProps } from "@/lib/section-props";
import { ImportSection } from "@/components/settings/ImportSection";
import { FieldsSection } from "@/components/settings/FieldsSection";
import { ApiSection } from "@/components/settings/ApiSection";
import { IntegrationsSection } from "@/components/settings/IntegrationsSection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { SharingSection } from "@/components/settings/SharingSection";
import { MembersSection } from "@/components/settings/MembersSection";

// Server half of the settings registry: maps each nav key to the component
// that renders it. Every section renders in two places — the settings modal
// (/projects/<slug>/settings/<key>) and its own standalone permalink page
// (/projects/<slug>/<key>) — so the body lives in one component and only the
// chrome around it differs.
//
// SERVER ONLY. Client components must import lib/settings-nav instead.

type SectionRenderer = (props: SectionProps) => Promise<JSX.Element> | JSX.Element;

const RENDERERS: Record<SettingsKey, SectionRenderer> = {
  import: ImportSection,
  fields: FieldsSection,
  api: ApiSection,
  integrations: IntegrationsSection,
  notifications: NotificationsSection,
  sharing: SharingSection,
  members: MembersSection,
};

export function findSectionRenderer(key: string): SectionRenderer | undefined {
  return SETTINGS_NAV.some((s) => s.key === key)
    ? RENDERERS[key as SettingsKey]
    : undefined;
}
