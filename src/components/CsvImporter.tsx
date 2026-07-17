"use client";

import { useEffect, useState } from "react";
import { TFIcon } from "@/components/icons";
import { useRouter } from "next/navigation";

type PreviewRow = { title: string; valid: boolean; error?: string };
type Suite = { id: string; name: string; parentId: string | null };

const FIXED_TARGETS = [
  { key: "title", label: "Title (required)" },
  { key: "description", label: "Description" },
  { key: "preconditions", label: "Preconditions" },
  { key: "steps", label: "Steps" },
  { key: "expected_result", label: "Expected result" },
  { key: "priority", label: "Priority" },
  { key: "type", label: "Type" },
  { key: "tags", label: "Tags" },
  { key: "estimate", label: "Estimate" },
] as const;

// F-30: import CSV with preview + validation before commit (US-004), plus a
// column-mapping step so a CSV whose headers don't match the expected names
// (e.g. an export from another tool) can still be imported — the mapping
// can be saved per project so the next import from the same source doesn't
// need re-mapping.
export function CsvImporter({
  projectSlug,
  suites,
  customFieldDefs = [],
}: {
  projectSlug: string;
  suites: Suite[];
  customFieldDefs?: { key: string; label: string }[];
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [showMapping, setShowMapping] = useState(false);
  const [saveMapping, setSaveMapping] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [suiteId, setSuiteId] = useState("");

  const targets = [...FIXED_TARGETS, ...customFieldDefs.map((d) => ({ key: `cf_${d.key}`, label: d.label }))];

  // Load this project's saved mapping (if any) as the starting point. Preview
  // stays disabled until this resolves — otherwise a preview fired before the
  // fetch completes would silently run with an empty (unmapped) column set.
  const [mappingLoaded, setMappingLoaded] = useState(false);
  useEffect(() => {
    fetch(`/api/v1/projects/${projectSlug}/import-mapping`)
      .then((r) => (r.ok ? r.json() : { mapping: {} }))
      .then((data) => setMapping(data.mapping ?? {}))
      .catch(() => {})
      .finally(() => setMappingLoaded(true));
  }, [projectSlug]);

  const upload = async (dryRun: boolean) => {
    if (!file || !mappingLoaded) return;
    setBusy(true);
    setMessage(null);
    try {
      const mappingParam = encodeURIComponent(JSON.stringify(mapping));
      const res = await fetch(
        `/api/import/cases?project=${projectSlug}&dryRun=${dryRun}&mapping=${mappingParam}${
          suiteId ? `&suite=${suiteId}` : ""
        }${!dryRun && saveMapping ? "&saveMapping=true" : ""}`,
        { method: "POST", body: await file.text(), headers: { "Content-Type": "text/csv" } }
      );
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Failed to process the CSV.");
        return;
      }
      if (dryRun) {
        setPreview(data.rows);
        setHeaders(data.headers ?? []);
      } else {
        setPreview(null);
        setMessage(`✅ ${data.imported} test cases imported successfully.`);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="mb-3 flex items-center gap-2 font-semibold"><TFIcon name="import" className="h-5 w-5" /> Import Test Cases from CSV</h3>
      <p className="mb-3 text-sm text-slate-500">
        Columns: <code className="rounded bg-slate-100 px-1">title</code> (required),{" "}
        <code className="rounded bg-slate-100 px-1">description</code>,{" "}
        <code className="rounded bg-slate-100 px-1">preconditions</code>,{" "}
        <code className="rounded bg-slate-100 px-1">steps</code> (separate steps
        with <code className="rounded bg-slate-100 px-1">|</code>; optional per-step
        expected after <code className="rounded bg-slate-100 px-1">::</code>),{" "}
        <code className="rounded bg-slate-100 px-1">expected_result</code>,{" "}
        <code className="rounded bg-slate-100 px-1">priority</code>,{" "}
        <code className="rounded bg-slate-100 px-1">type</code>,{" "}
        <code className="rounded bg-slate-100 px-1">tags</code>. If your CSV uses
        different column names, upload it and use &quot;Column mapping&quot; below.
      </p>
      <a
        href="/api/templates/cases-csv"
        className="text-sm text-indigo-600 hover:underline"
      >
        <span className="inline-flex items-center gap-1.5"><TFIcon name="download" className="h-4 w-4" /> Download CSV template</span>
      </a>
      <div className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Import into suite
          </label>
          <select
            value={suiteId}
            onChange={(e) => setSuiteId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">(no suite)</option>
            {suites
              .filter((s) => !s.parentId)
              .map((s) => (
                <optgroup key={s.id} label={s.name}>
                  <option value={s.id}>{s.name}</option>
                  {suites
                    .filter((c) => c.parentId === s.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        — {c.name}
                      </option>
                    ))}
                </optgroup>
              ))}
          </select>
        </div>
        <input
          type="file"
          accept=".csv"
          data-testid="csv-file-input"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setPreview(null);
            setHeaders([]);
            setMessage(null);
          }}
          className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
        />

        {headers.length > 0 && (
          <div className="rounded-lg border border-slate-200 p-3">
            <button
              type="button"
              onClick={() => setShowMapping((s) => !s)}
              data-testid="csv-mapping-toggle"
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              {showMapping ? "Hide" : "Show"} column mapping ({headers.length} columns detected)
            </button>
            {showMapping && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-slate-400">
                  Map each field to a column in your CSV. Left blank, a field reads its
                  own name directly (e.g. a <code className="rounded bg-slate-100 px-1">title</code>{" "}
                  column with no mapping still works).
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {targets.map((t) => (
                    <div key={t.key} className="flex items-center gap-2">
                      <label className="w-32 shrink-0 truncate text-xs text-slate-500" title={t.label}>
                        {t.label}
                      </label>
                      <select
                        value={mapping[t.key] ?? ""}
                        data-testid={`csv-mapping-${t.key}`}
                        onChange={(e) =>
                          setMapping((m) => ({ ...m, [t.key]: e.target.value }))
                        }
                        className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                      >
                        <option value="">({t.key})</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-1.5 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    checked={saveMapping}
                    onChange={(e) => setSaveMapping(e.target.checked)}
                    data-testid="csv-mapping-save-checkbox"
                  />
                  Save this mapping for future imports into this project
                </label>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => upload(true)}
            disabled={!file || busy || !mappingLoaded}
            data-testid="csv-preview-button"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-50"
          >
            {!mappingLoaded ? "Loading…" : busy ? "Processing..." : "Preview & Validate"}
          </button>
          {preview && preview.some((r) => r.valid) && (
            <button
              onClick={() => upload(false)}
              disabled={busy}
              data-testid="csv-import-button"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Import {preview.filter((r) => r.valid).length} valid rows
            </button>
          )}
        </div>
        {message && <p className="text-sm" data-testid="csv-import-message">{message}</p>}
        {preview && (
          <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-left uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview.map((row, i) => (
                  <tr key={i} className={row.valid ? "" : "bg-red-50"}>
                    <td className="px-3 py-1.5 text-slate-400">{i + 1}</td>
                    <td className="px-3 py-1.5">{row.title || <i>(empty)</i>}</td>
                    <td className="px-3 py-1.5">
                      {row.valid ? (
                        <span className="text-green-600">✓ valid</span>
                      ) : (
                        <span className="text-red-600">✕ {row.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
