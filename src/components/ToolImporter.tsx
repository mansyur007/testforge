"use client";

import { useState } from "react";
import { TFIcon } from "@/components/icons";
import { useRouter } from "next/navigation";

type PreviewSample = {
  title: string;
  suitePath: string;
  priority: string;
  type: string;
  stepCount: number;
};
type Preview = {
  totalCases: number;
  totalSuites: number;
  sample: PreviewSample[];
  warnings: string[];
};

// F-22: TestRail/Qase/TestLink import — same dry-run-then-commit shape as
// CsvImporter, but the preview is counts + sample rows + warnings (these
// formats carry a suite hierarchy, not a flat row list).
export function ToolImporter({
  projectSlug,
  tool,
  label,
  accept,
  contentType,
  help,
}: {
  projectSlug: string;
  tool: "testrail" | "qase" | "testlink" | "gherkin";
  label: string;
  accept: string;
  contentType: string;
  help: React.ReactNode;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const upload = async (dryRun: boolean) => {
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/import/tool/${tool}?project=${projectSlug}&dryRun=${dryRun}`,
        { method: "POST", body: await file.text(), headers: { "Content-Type": contentType } }
      );
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Failed to process the file.");
        setPreview(null);
        return;
      }
      if (dryRun) {
        setPreview(data);
      } else {
        setPreview(null);
        setMessage(
          `✅ ${data.imported} test cases imported (${data.suitesCreated} suites created).`
        );
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <TFIcon name="import" className="h-5 w-5" /> Import from {label}
      </h3>
      <p className="mb-3 text-sm text-slate-500">{help}</p>
      <div className="mt-4 space-y-3">
        <input
          type="file"
          accept={accept}
          data-testid={`import-file-${tool}`}
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setPreview(null);
            setMessage(null);
          }}
          className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
        />
        <div className="flex gap-2">
          <button
            onClick={() => upload(true)}
            disabled={!file || busy}
            data-testid={`import-preview-${tool}`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-50"
          >
            {busy ? "Processing..." : "Preview & Validate"}
          </button>
          {preview && preview.totalCases > 0 && (
            <button
              onClick={() => upload(false)}
              disabled={busy}
              data-testid={`import-commit-${tool}`}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Import {preview.totalCases} case{preview.totalCases === 1 ? "" : "s"}
            </button>
          )}
        </div>
        {message && (
          <p className="text-sm" data-testid={`import-message-${tool}`}>
            {message}
          </p>
        )}
        {preview && (
          <div data-testid={`import-preview-result-${tool}`}>
            <p className="text-sm text-slate-600">
              <b>{preview.totalCases}</b> case{preview.totalCases === 1 ? "" : "s"} across{" "}
              <b>{preview.totalSuites}</b> suite{preview.totalSuites === 1 ? "" : "s"}.
            </p>
            {preview.warnings.length > 0 && (
              <ul className="mt-2 max-h-32 overflow-y-auto rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
                {preview.warnings.map((w, i) => (
                  <li key={i}>⚠ {w}</li>
                ))}
              </ul>
            )}
            {preview.sample.length > 0 && (
              <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-left uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Title</th>
                      <th className="px-3 py-2">Suite</th>
                      <th className="px-3 py-2">Priority</th>
                      <th className="px-3 py-2">Steps</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.sample.map((row, i) => (
                      <tr key={i}>
                        <td className="px-3 py-1.5">{row.title}</td>
                        <td className="px-3 py-1.5 text-slate-500">{row.suitePath}</td>
                        <td className="px-3 py-1.5">{row.priority}</td>
                        <td className="px-3 py-1.5">{row.stepCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
