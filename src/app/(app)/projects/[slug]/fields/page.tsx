import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { memberScope } from "@/lib/projects";
import { ProjectTabs } from "@/components/ProjectTabs";
import { CustomFieldsManager } from "@/components/CustomFieldsManager";
import { ConfigurationsManager } from "@/components/ConfigurationsManager";
import { EnvironmentsManager } from "@/components/EnvironmentsManager";
import { ResultStatusesManager } from "@/components/ResultStatusesManager";
import { parseOptions } from "@/lib/custom-fields";
import { loadConfigGroups } from "@/lib/plans";
import { loadEnvironments } from "@/lib/environments";
import { loadStatusDefs } from "@/lib/result-status-defs";
import { loadPerms } from "@/lib/permissions";
import { evaluateGate, parseGatePolicy, type GatePolicy, type GateVerdict } from "@/lib/gate";
import { saveGatePolicy } from "@/app/actions/gate";

export const dynamic = "force-dynamic";

// F-03: per-project custom field definitions.
export default async function FieldsPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await requireSession();
  const project = await db.project.findFirst({
    where: { slug: params.slug, ...memberScope(session.userId) },
    include: { members: { where: { userId: session.userId } } },
  });
  if (!project) notFound();

  const defs = await db.customFieldDef.findMany({
    where: { projectId: project.id },
    orderBy: [{ entity: "asc" }, { order: "asc" }],
  });

  // F-06: configuration groups managed alongside fields.
  const configGroups = await loadConfigGroups(project.id);
  // F-19: environments managed alongside fields.
  const environments = await loadEnvironments(project.id);
  // F-14: result-status definitions managed alongside fields.
  const statusDefs = await loadStatusDefs(project.id);

  // F-14: central permission check (covers custom roles too).
  const perms = await loadPerms(session.userId, project.id);
  const canManage = perms.has("fields.manage");

  // L-02: gate policy + a live preview of the latest run's verdict.
  const canAdmin = perms.has("project.admin");
  let gatePolicy: GatePolicy | null = null;
  try {
    gatePolicy = project.gatePolicyJson
      ? parseGatePolicy(project.gatePolicyJson)
      : null;
  } catch {
    gatePolicy = null;
  }
  let gatePreview: GateVerdict | null = null;
  if (gatePolicy) {
    const latest = await db.testRun.findFirst({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (latest)
      gatePreview = await evaluateGate(project.id, latest.id, gatePolicy);
  }

  return (
    <div className="space-y-6">
      <ProjectTabs slug={project.slug} name={project.name} active="fields" />
      <div>
        <h2 className="text-lg font-semibold">Custom Fields</h2>
        <p className="text-sm text-slate-400">
          Project-specific fields for test cases and run results. Keys and
          types are fixed after creation; disable a field to hide it from
          forms while keeping existing values visible.
        </p>
      </div>
      <CustomFieldsManager
        projectId={project.id}
        canManage={canManage}
        defs={defs.map((d) => ({
          id: d.id,
          entity: d.entity,
          key: d.key,
          label: d.label,
          type: d.type,
          options: parseOptions(d),
          required: d.required,
          active: d.active,
        }))}
      />

      {/* F-06: matrix axes for test plans (Browser × OS × …). */}
      <div className="pt-2">
        <h2 className="text-lg font-semibold">Configurations</h2>
        <p className="text-sm text-slate-400">
          Axes for test plans — a plan picks options across groups and creates
          one run per combination (e.g. Browser × OS).
        </p>
      </div>
      <ConfigurationsManager
        projectId={project.id}
        canManage={canManage}
        groups={configGroups.map((g) => ({
          id: g.id,
          name: g.name,
          options: g.options.map((o) => ({ id: o.id, name: o.name })),
        }))}
      />

      {/* F-14: result-status definitions. */}
      <div className="pt-2">
        <h2 className="text-lg font-semibold">Result Statuses</h2>
        <p className="text-sm text-slate-400">
          The outcomes an executor can record. Built-in statuses keep their key
          and kind; add your own (e.g. &quot;Known Issue&quot;) with a kind that
          tells the reports how to count it.
        </p>
      </div>
      <ResultStatusesManager
        projectId={project.id}
        canManage={canManage}
        defs={statusDefs}
      />

      {/* F-19: environments a run can be tagged against. */}
      <div className="pt-2">
        <h2 className="text-lg font-semibold">Environments</h2>
        <p className="text-sm text-slate-400">
          Tag runs with where they executed (Staging, Prod, …); filter runs
          and reports by environment.
        </p>
      </div>
      <EnvironmentsManager
        projectId={project.id}
        canManage={canManage}
        autoCreateEnvs={project.autoCreateEnvs}
        environments={environments.map((e) => ({
          id: e.id,
          name: e.name,
          url: e.url,
          active: e.active,
        }))}
      />

      {/* L-02: CI quality gate policy + latest-run verdict preview. */}
      <div className="pt-2">
        <h2 className="text-lg font-semibold">Quality Gate</h2>
        <p className="text-sm text-slate-400">
          Rules CI can check with one call —{" "}
          <code className="rounded bg-slate-100 px-1 text-xs">
            npx testforge-cli gate
          </code>{" "}
          exits non-zero when the latest run breaks them. Leave every field
          empty to remove the gate.
        </p>
      </div>
      <form
        action={saveGatePolicy}
        className="rounded-xl border border-slate-200 bg-white p-6"
      >
        <input type="hidden" name="projectId" value={project.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Minimum pass rate (%)</span>
            <input
              name="minPassRate"
              type="number"
              min={0}
              max={100}
              step="any"
              defaultValue={gatePolicy?.minPassRate ?? ""}
              disabled={!canAdmin}
              data-testid="gate-min-pass-rate"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:bg-slate-50"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Max new failures vs previous run</span>
            <input
              name="maxNewFailures"
              type="number"
              min={0}
              defaultValue={gatePolicy?.maxNewFailures ?? ""}
              disabled={!canAdmin}
              data-testid="gate-max-new-failures"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:bg-slate-50"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Required tags (comma-separated)</span>
            <input
              name="requiredTags"
              defaultValue={gatePolicy?.requiredTags?.join(", ") ?? ""}
              placeholder="smoke, critical"
              disabled={!canAdmin}
              data-testid="gate-required-tags"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:bg-slate-50"
            />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input
              name="blockOnUntested"
              type="checkbox"
              defaultChecked={gatePolicy?.blockOnUntested ?? false}
              disabled={!canAdmin}
              data-testid="gate-block-untested"
              className="h-4 w-4 rounded border-slate-300"
            />
            <span className="font-medium text-slate-700">
              Block when any result is still untested
            </span>
          </label>
        </div>
        {canAdmin && (
          <button
            data-testid="gate-save"
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Save gate
          </button>
        )}
        {gatePreview && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
              Latest run: {gatePreview.run.name}
            </p>
            <table className="w-full text-sm">
              <tbody>
                {gatePreview.checks.map((c) => (
                  <tr key={c.name} className="border-b border-slate-50">
                    <td className="py-1.5 font-mono text-xs text-slate-500">{c.name}</td>
                    <td className="py-1.5 text-slate-500">{c.expected}</td>
                    <td className="py-1.5">{c.actual}</td>
                    <td className="py-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          c.pass
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {c.pass ? "OK" : "FAIL"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-sm font-semibold" data-testid="gate-preview-verdict">
              gate: {gatePreview.pass ? "PASS" : "FAIL"}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
