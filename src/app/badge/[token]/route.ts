import { db } from "@/lib/db";
import { loadStatusDefs } from "@/lib/result-status-defs";
import { statusMeta } from "@/lib/result-statuses";
import { bucketStatus, NON_EXECUTED_BUCKETS } from "@/lib/mute";

export const dynamic = "force-dynamic";

// L-01: public quality badge. No auth — the unguessable token IS the auth,
// and the response carries no project data beyond the number. Serves
// /badge/<token>.svg (shields.io-style SVG) and /badge/<token>.json
// (shields.io `endpoint` schema) with ?metric=passrate|automation|cases.

const METRICS = ["passrate", "automation", "cases"] as const;

const DEFAULT_LABELS: Record<string, string> = {
  passrate: "pass rate",
  automation: "automation",
  cases: "test cases",
};

function rampColor(pct: number): string {
  return pct >= 90 ? "#4c1" : pct >= 70 ? "#dfb317" : "#e05d44";
}

type Metric = { value: string; color: string };

async function computeMetric(projectId: string, metric: string): Promise<Metric> {
  if (metric === "cases") {
    const total = await db.testCase.count({
      where: { projectId, deletedAt: null },
    });
    // Count, not a percentage — the ramp doesn't apply; shields "informational" blue.
    return { value: String(total), color: "#007ec6" };
  }

  if (metric === "automation") {
    const [automated, total] = await Promise.all([
      db.testCase.count({
        where: { projectId, deletedAt: null, automationStatus: "AUTOMATED" },
      }),
      db.testCase.count({ where: { projectId, deletedAt: null } }),
    ]);
    const pct = total ? (automated / total) * 100 : 0;
    return { value: `${pct.toFixed(1)}%`, color: rampColor(pct) };
  }

  // passrate: latest COMPLETED run, muted cases excluded per F-21.
  const run = await db.testRun.findFirst({
    where: { projectId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    select: { results: { select: { caseId: true, status: true } } },
  });
  if (!run) return { value: "no runs", color: "#9f9f9f" };

  const [defs, mutedCases] = await Promise.all([
    loadStatusDefs(projectId),
    db.testCase.findMany({
      where: { projectId, mutedAt: { not: null } },
      select: { id: true },
    }),
  ]);
  const muted = new Set(mutedCases.map((c) => c.id));
  const { kindOf } = statusMeta(defs);
  const executed = run.results.filter(
    (r) => !NON_EXECUTED_BUCKETS.includes(bucketStatus(r.status, muted.has(r.caseId)))
  );
  const pass = executed.filter((r) => kindOf(r.status) === "PASS").length;
  const pct = executed.length ? (pass / executed.length) * 100 : 0;
  return { value: `${pct.toFixed(1)}%`, color: rampColor(pct) };
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// The TestForge mark from src/app/icon.svg, rendered white at 13×13
// (viewBox 100 → scale .13). It leads the label cell — that's what
// distinguishes this badge in a README badge row full of CI shields.
const MARK = `<g transform="translate(4,3.5) scale(0.13)" fill="#fff"><rect x="28" y="40" width="44" height="10" rx="3"/><path d="M28 41 19 45.5 28 50Z"/><path d="M44 50h12l7 17H37Z"/><rect x="35" y="65" width="30" height="5" rx="2"/><g stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none"><path d="M68 33 74 28"/><path d="M76 40 82 38"/></g></g>`;

// Flat shields.io idiom (Fable handoff, 2026-07-13): height 20, two cells,
// Verdana 11px white with the classic 1px fill-opacity=".3" embossed shadow,
// rx=3 clip, the shields gloss gradient overlaid. Width math avoids font
// measurement: 6px per char + 10px padding (+13 for the mark in the label cell).
function shield(label: string, value: string, color: string): string {
  const lw = 6 * label.length + 10 + 13;
  const vw = 6 * value.length + 10;
  const w = lw + vw;
  const lx = (lw + 13) / 2;
  const vx = lw + vw / 2;
  const text = (x: number, t: string) =>
    `<text x="${x}" y="15" fill="#010101" fill-opacity=".3" textLength="${
      6 * t.length
    }">${esc(t)}</text><text x="${x}" y="14" textLength="${6 * t.length}">${esc(t)}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${esc(
    label
  )}: ${esc(value)}"><linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><clipPath id="r"><rect width="${w}" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#r)"><rect width="${lw}" height="20" fill="#555"/><rect x="${lw}" width="${vw}" height="20" fill="${color}"/><rect width="${w}" height="20" fill="url(#s)"/></g>${MARK}<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">${text(
    lx,
    label
  )}${text(vx, value)}</g></svg>`;
}

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  const match = /^(.+)\.(svg|json)$/.exec(params.token);
  if (!match) return new Response("Not found", { status: 404 });
  const [, token, format] = match;

  const badge = await db.badgeToken.findUnique({
    where: { token },
    select: { projectId: true, revokedAt: true },
  });
  if (!badge || badge.revokedAt) return new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  const metric = url.searchParams.get("metric") ?? "passrate";
  if (!(METRICS as readonly string[]).includes(metric))
    return new Response("Not found", { status: 404 });
  const label = (url.searchParams.get("label") ?? DEFAULT_LABELS[metric]).slice(0, 40);

  const { value, color } = await computeMetric(badge.projectId, metric);
  const headers = { "Cache-Control": "public, max-age=300" };

  if (format === "json")
    return Response.json(
      { schemaVersion: 1, label, message: value, color: color.replace("#", "") },
      { headers }
    );
  return new Response(shield(label, value, color), {
    headers: { ...headers, "Content-Type": "image/svg+xml" },
  });
}
