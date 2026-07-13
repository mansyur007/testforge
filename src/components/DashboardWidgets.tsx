import Link from "next/link";
import { caseDisplayId } from "@/lib/constants";
import { Markdown } from "@/components/Markdown";
import {
  type ReportData,
  passRateTrend,
  statusDistribution,
  automationCoverage,
  flakyList,
  runVelocity,
} from "@/lib/report-data";
import { WIDGET_TYPES, type WidgetType } from "@/lib/dashboards";

// F-17: one self-contained server component per widget type. Each reads the
// shared ReportData snapshot (loaded once per dashboard render) through the
// same metric functions the Reports page math is mirrored in.

type WidgetRow = {
  id: string;
  type: string;
  title: string | null;
  configJson: string;
};

const Empty = ({ children }: { children: string }) => (
  <p className="text-sm text-slate-400">{children}</p>
);

function PassRateTrendWidget({ data }: { data: ReportData }) {
  const trend = passRateTrend(data);
  if (trend.length === 0) return <Empty>No run data yet.</Empty>;
  return (
    <div className="flex h-32 items-end gap-1.5">
      {trend.map((t, i) => (
        <div
          key={i}
          className="flex h-full flex-1 flex-col items-center justify-end gap-0.5"
        >
          <span className="text-[10px] font-medium text-slate-600">
            {t.rate}%
          </span>
          <div
            className={`w-full rounded-t ${t.rate >= 80 ? "bg-green-400" : t.rate >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
            style={{ height: `${Math.max(t.rate, 3)}%` }}
            title={`${t.name}: ${t.rate}% (${t.executed} executed)`}
          />
        </div>
      ))}
    </div>
  );
}

function StatusPieWidget({ data }: { data: ReportData }) {
  const dist = statusDistribution(data);
  const total = dist.reduce((s, d) => s + d.count, 0);
  if (!total) return <Empty>No results yet.</Empty>;
  let acc = 0;
  const stops = dist.map((d) => {
    const from = (acc / total) * 360;
    acc += d.count;
    const to = (acc / total) * 360;
    return `${d.color} ${from}deg ${to}deg`;
  });
  return (
    <div className="flex items-center gap-4">
      <div
        className="h-24 w-24 shrink-0 rounded-full border border-slate-100"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
        role="img"
        aria-label="Status distribution pie"
      />
      <ul className="space-y-1 text-xs">
        {dist.map((d) => (
          <li key={d.key} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            {d.label} <b>{d.count}</b>
            <span className="text-slate-400">
              ({Math.round((d.count / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CoverageBarWidget({ data }: { data: ReportData }) {
  const cov = automationCoverage(data);
  return (
    <div>
      <p className="text-3xl font-bold">{cov.pct}%</p>
      <p className="mt-0.5 text-xs text-slate-400">
        {cov.automated} of {cov.total} cases automated
      </p>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-indigo-500"
          style={{ width: `${cov.pct}%` }}
        />
      </div>
    </div>
  );
}

function FlakyListWidget({
  data,
  slug,
  noLinks,
}: {
  data: ReportData;
  slug: string;
  noLinks?: boolean;
}) {
  const flaky = flakyList(data);
  if (flaky.length === 0) return <Empty>No flaky tests detected. 🎉</Empty>;
  return (
    <ul className="space-y-1.5 text-sm">
      {flaky.map((f) => {
        const label = (
          <>
            <span className="font-mono text-xs text-slate-400">
              {caseDisplayId(slug, f.testCase!.seq)}
            </span>{" "}
            {f.testCase!.title}
          </>
        );
        return (
        <li key={f.testCase!.id} className="flex items-center justify-between gap-2">
          {noLinks ? (
            <span className="min-w-0 truncate text-slate-700">{label}</span>
          ) : (
            <Link
              href={`/projects/${slug}/cases/${f.testCase!.id}`}
              className="min-w-0 truncate text-slate-700 hover:text-indigo-600"
            >
              {label}
            </Link>
          )}
          <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
            {f.flips} flip
          </span>
        </li>
        );
      })}
    </ul>
  );
}

function RunVelocityWidget({ data }: { data: ReportData }) {
  const weeks = runVelocity(data);
  const max = Math.max(...weeks.map((w) => w.count), 1);
  return (
    <div className="flex h-32 items-end gap-1.5">
      {weeks.map((w, i) => (
        <div
          key={i}
          className="flex h-full flex-1 flex-col items-center justify-end gap-0.5"
        >
          <span className="text-[10px] font-medium text-slate-600">
            {w.count}
          </span>
          <div
            className="w-full rounded-t bg-indigo-400"
            style={{ height: `${Math.max((w.count / max) * 100, 3)}%` }}
            title={`Week of ${w.label}: ${w.count} runs`}
          />
          <span className="text-[10px] text-slate-400">{w.label}</span>
        </div>
      ))}
    </div>
  );
}

function TextNoteWidget({ widget }: { widget: WidgetRow }) {
  let text = "";
  try {
    text = String(JSON.parse(widget.configJson || "{}").text ?? "");
  } catch {
    /* malformed config renders as empty */
  }
  if (!text.trim()) return <Empty>Empty note.</Empty>;
  return <Markdown>{text}</Markdown>;
}

export function widgetTypeLabel(type: string): string {
  return WIDGET_TYPES.find((t) => t.key === type)?.label ?? type;
}

export function WidgetBody({
  widget,
  data,
  slug,
  noLinks,
}: {
  widget: WidgetRow;
  data: ReportData;
  slug: string;
  // F-17: the public /share page renders widgets with no links into the app.
  noLinks?: boolean;
}) {
  switch (widget.type as WidgetType) {
    case "passRateTrend":
      return <PassRateTrendWidget data={data} />;
    case "statusPie":
      return <StatusPieWidget data={data} />;
    case "coverageBar":
      return <CoverageBarWidget data={data} />;
    case "flakyList":
      return <FlakyListWidget data={data} slug={slug} noLinks={noLinks} />;
    case "runVelocity":
      return <RunVelocityWidget data={data} />;
    case "textNote":
      return <TextNoteWidget widget={widget} />;
    default:
      return <Empty>Unknown widget type.</Empty>;
  }
}
