import { db } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { notifyBaseUrl } from "@/lib/notifications";
import { statusMeta } from "@/lib/result-statuses";
import { loadStatusDefs } from "@/lib/result-status-defs";
import { bucketStatus, NON_EXECUTED_BUCKETS } from "@/lib/mute";

// F-17: scheduled email report summaries. A schedule is "due" when its
// cadence says today is a send day and it hasn't been sent yet today —
// so the cron route can be polled hourly without double-sending.

export const SCHEDULE_CRONS = [
  { key: "DAILY", label: "Daily" },
  { key: "WEEKLY_MON", label: "Weekly (Monday)" },
] as const;

export function parseRecipients(json: string): string[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function isDue(
  cron: string,
  lastSentAt: Date | null,
  now = new Date()
): boolean {
  if (cron === "WEEKLY_MON" && now.getDay() !== 1) return false;
  if (!lastSentAt) return true;
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  return lastSentAt < startOfToday;
}

/** KPIs + top failures over the schedule's look-back window. */
async function buildSummary(projectId: string, days: number) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [runs, mutedCases, statusDefs] = await Promise.all([
    db.testRun.findMany({
      where: { projectId, createdAt: { gte: since } },
      select: {
        results: {
          select: {
            caseId: true,
            status: true,
            testCase: { select: { seq: true, title: true, mutedAt: true } },
          },
        },
      },
    }),
    db.testCase.findMany({
      where: { projectId, mutedAt: { not: null } },
      select: { id: true },
    }),
    loadStatusDefs(projectId),
  ]);
  const muted = new Set(mutedCases.map((c) => c.id));
  const { kindOf } = statusMeta(statusDefs);

  const all = runs.flatMap((r) => r.results);
  const executed = all.filter(
    (r) => !NON_EXECUTED_BUCKETS.includes(bucketStatus(r.status, muted.has(r.caseId)))
  );
  const passed = executed.filter((r) => kindOf(r.status) === "PASS").length;
  const failures = executed.filter((r) =>
    ["FAIL", "BLOCKED"].includes(kindOf(r.status))
  );

  const byCase = new Map<string, { title: string; seq: number; count: number }>();
  for (const f of failures) {
    const e = byCase.get(f.caseId) ?? {
      title: f.testCase.title,
      seq: f.testCase.seq,
      count: 0,
    };
    e.count++;
    byCase.set(f.caseId, e);
  }
  const topFailures = Array.from(byCase.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    runs: runs.length,
    executed: executed.length,
    passed,
    failed: failures.length,
    passRate: executed.length
      ? Math.round((passed / executed.length) * 100)
      : 0,
    topFailures,
  };
}

type Summary = Awaited<ReturnType<typeof buildSummary>>;

function reportEmailHtml(opts: {
  projectName: string;
  periodLabel: string;
  summary: Summary;
  reportsUrl: string;
}) {
  const { summary: s } = opts;
  const kpiCell = (label: string, value: string) =>
    `<td style="padding:12px 16px;border:1px solid #e2e8f0;"><p style="margin:0;font-size:11px;color:#94a3b8;">${label}</p><p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#0f172a;">${value}</p></td>`;
  const failureRows = s.topFailures.length
    ? s.topFailures
        .map(
          (f) =>
            `<tr><td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#334155;">${f.title}</td><td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#dc2626;text-align:right;">${f.count}×</td></tr>`
        )
        .join("")
    : `<tr><td style="padding:6px 12px;font-size:13px;color:#94a3b8;">No failures in this period 🎉</td></tr>`;
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>TestForge report</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <tr><td style="background:#4f46e5;padding:20px 28px;">
          <span style="font-size:16px;font-weight:700;color:#ffffff;">TestForge</span>
        </td></tr>
        <tr><td style="padding:28px 28px 8px;">
          <h1 style="margin:0 0 4px;font-size:20px;color:#0f172a;">${opts.projectName} — test summary</h1>
          <p style="margin:0 0 20px;font-size:13px;color:#64748b;">${opts.periodLabel}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              ${kpiCell("Pass rate", `${s.passRate}%`)}
              ${kpiCell("Executed", String(s.executed))}
              ${kpiCell("Failed", String(s.failed))}
              ${kpiCell("Runs", String(s.runs))}
            </tr>
          </table>
          <h2 style="margin:24px 0 8px;font-size:14px;color:#0f172a;">Top failures</h2>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;border-collapse:separate;">${failureRows}</table>
          <p style="margin:24px 0 28px;"><a href="${opts.reportsUrl}" target="_blank" style="display:inline-block;padding:11px 24px;font-size:14px;font-weight:600;color:#ffffff;background:#4f46e5;text-decoration:none;border-radius:10px;">Open full report</a></p>
        </td></tr>
        <tr><td style="border-top:1px solid #e2e8f0;padding:16px 28px;">
          <p style="margin:0;font-size:11px;color:#94a3b8;">Sent automatically by TestForge on a schedule configured in project notifications.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Process every due schedule; returns a per-schedule report for the cron
 * route's JSON response. lastSentAt advances even when SMTP is unconfigured
 * (sendMail logs + returns sent:false) so cadence holds either way. */
export async function sendDueReports(now = new Date()) {
  const schedules = await db.reportSchedule.findMany({
    include: { project: { select: { name: true, slug: true } } },
  });
  const results: {
    scheduleId: string;
    project: string;
    due: boolean;
    recipients: number;
    sent: number;
  }[] = [];

  for (const s of schedules) {
    const due = isDue(s.cron, s.lastSentAt, now);
    const recipients = parseRecipients(s.recipientsJson);
    if (!due || recipients.length === 0) {
      results.push({
        scheduleId: s.id,
        project: s.project.slug,
        due,
        recipients: recipients.length,
        sent: 0,
      });
      continue;
    }

    const days = s.cron === "WEEKLY_MON" ? 7 : 1;
    const summary = await buildSummary(s.projectId, days);
    const periodLabel =
      s.cron === "WEEKLY_MON" ? "Last 7 days" : "Last 24 hours";
    const reportsUrl = `${notifyBaseUrl()}/projects/${s.project.slug}/reports`;
    const html = reportEmailHtml({
      projectName: s.project.name,
      periodLabel,
      summary,
      reportsUrl,
    });
    const text = [
      `${s.project.name} — test summary (${periodLabel})`,
      `Pass rate: ${summary.passRate}% · Executed: ${summary.executed} · Failed: ${summary.failed} · Runs: ${summary.runs}`,
      ...summary.topFailures.map((f) => `  ${f.count}× ${f.title}`),
      reportsUrl,
    ].join("\n");

    let sent = 0;
    for (const to of recipients) {
      const r = await sendMail({
        to,
        subject: `[TestForge] ${s.project.name} — ${periodLabel} summary`,
        html,
        text,
      });
      if (r.sent) sent++;
    }
    await db.reportSchedule.update({
      where: { id: s.id },
      data: { lastSentAt: now },
    });
    results.push({
      scheduleId: s.id,
      project: s.project.slug,
      due,
      recipients: recipients.length,
      sent,
    });
  }
  return results;
}
