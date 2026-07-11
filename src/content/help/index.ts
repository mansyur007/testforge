// F-37: in-app help center content. Each topic is a plain TS module (not a
// file read from disk at request time) so it bundles into .next like any
// other source file — the production Docker image only ships .next/,
// node_modules/, and prisma/, not the raw repo tree.
import { gettingStarted } from "./getting-started";
import { testCases } from "./test-cases";
import { runs } from "./runs";
import { plans } from "./plans";
import { automation } from "./automation";
import { integrations } from "./integrations";
import { notifications } from "./notifications";
import { reports } from "./reports";
import { team } from "./team";
import type { HelpTopic } from "./types";

export type { HelpTopic };

export const HELP_TOPICS: HelpTopic[] = [
  gettingStarted,
  testCases,
  runs,
  plans,
  automation,
  integrations,
  notifications,
  reports,
  team,
];

export function getHelpTopic(slug: string): HelpTopic | undefined {
  return HELP_TOPICS.find((t) => t.slug === slug);
}
