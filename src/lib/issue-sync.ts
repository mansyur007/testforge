import { db } from "@/lib/db";
import { providerFor } from "@/lib/issue-providers";

// F-07: refresh the cached status of issue links. Called by the sync-issues
// cron. Deliberately small and polite: only stale links, a hard cap per run,
// sequential with a gap so we never hammer a tracker's rate limit.

export const ISSUE_STALE_MINUTES = 15;
export const ISSUE_SYNC_BATCH = 50;
const GAP_MS = 200;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type SyncReport = { checked: number; updated: number; failed: number };

export async function syncIssueStatuses(
  batch = ISSUE_SYNC_BATCH
): Promise<SyncReport> {
  const staleBefore = new Date(Date.now() - ISSUE_STALE_MINUTES * 60_000);

  const links = await db.issueLink.findMany({
    where: {
      OR: [{ syncedAt: null }, { syncedAt: { lt: staleBefore } }],
      // A link whose integration was disconnected can't be refreshed — leave
      // it alone rather than churn on it every invocation.
      project: { integrations: { some: { active: true } } },
    },
    orderBy: [{ syncedAt: "asc" }],
    take: batch,
  });

  const report: SyncReport = { checked: 0, updated: 0, failed: 0 };
  // Cache one client per project+provider across the batch.
  const clients = new Map<string, ReturnType<typeof providerFor>>();

  for (const link of links) {
    report.checked++;
    const cacheKey = `${link.projectId}:${link.provider}`;
    try {
      let client = clients.get(cacheKey);
      if (!client) {
        const integration = await db.integration.findFirst({
          where: { projectId: link.projectId, provider: link.provider, active: true },
        });
        if (!integration) {
          report.failed++;
          continue;
        }
        client = providerFor(integration);
        clients.set(cacheKey, client);
      }

      const issue = await client.getIssue(link.issueKey);
      const changed =
        issue.status !== link.status || (issue.title ?? null) !== link.title;
      await db.issueLink.update({
        where: { id: link.id },
        data: {
          status: issue.status ?? link.status,
          title: issue.title ?? link.title,
          issueUrl: issue.url || link.issueUrl,
          syncedAt: new Date(),
        },
      });
      if (changed) report.updated++;
    } catch (err) {
      report.failed++;
      // Stamp syncedAt anyway so one permanently broken link (deleted issue,
      // revoked token) can't monopolise every future batch.
      await db.issueLink.update({
        where: { id: link.id },
        data: { syncedAt: new Date() },
      });
      console.warn(
        `[issue-sync] ${link.provider} ${link.issueKey}: ${(err as Error).message}`
      );
    }
    await sleep(GAP_MS);
  }

  return report;
}
