import { TRACKING_NAV, type TrackingKey } from "@/lib/tracking-nav";
import type { SectionProps } from "@/lib/section-props";
import { RequirementsSection } from "@/components/tracking/RequirementsSection";
import { SessionsSection } from "@/components/tracking/SessionsSection";
import { DefectsSection } from "@/components/tracking/DefectsSection";
import { BaselinesSection } from "@/components/tracking/BaselinesSection";

// Server half of the tracking registry: maps each nav key to the component
// that renders it. Every section renders in two places — the tracking modal
// (/projects/<slug>/tracking/<key>) and its own standalone permalink page
// (/projects/<slug>/<key>) — so the body lives in one component and only the
// chrome around it differs.
//
// SERVER ONLY. Client components must import lib/tracking-nav instead.

type SectionRenderer = (props: SectionProps) => Promise<JSX.Element> | JSX.Element;

const RENDERERS: Record<TrackingKey, SectionRenderer> = {
  requirements: RequirementsSection,
  sessions: SessionsSection,
  defects: DefectsSection,
  baselines: BaselinesSection,
};

export function findTrackingRenderer(key: string): SectionRenderer | undefined {
  return TRACKING_NAV.some((s) => s.key === key)
    ? RENDERERS[key as TrackingKey]
    : undefined;
}
