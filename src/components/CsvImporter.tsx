"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PreviewRow = { title: string; valid: boolean; error?: string };

// Import CSV dengan preview + validasi sebelum commit (US-004)
export function CsvImporter({ projectSlug }: { projectSlug: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const upload = async (dryRun: boolean) => {
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/import/cases?project=${projectSlug}&dryRun=${dryRun}`,
        { method: "POST", body: await file.text(), headers: { "Content-Type": "text/csv" } }
      );
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Gagal memproses CSV.");
        return;
      }
      if (dryRun) {
        setPreview(data.rows);
      } else {
        setPreview(null);
        setMessage(`✅ ${data.imported} test case berhasil diimport.`);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="mb-3 font-semibold">📥 Import Test Case dari CSV</h3>
      <p className="mb-3 text-sm text-slate-500">
        Kolom: <code className="rounded bg-slate-100 px-1">title</code> (wajib),{" "}
        <code className="rounded bg-slate-100 px-1">description</code>,{" "}
        <code className="rounded bg-slate-100 px-1">preconditions</code>,{" "}
        <code className="rounded bg-slate-100 px-1">steps</code> (pisahkan baris
        dengan <code className="rounded bg-slate-100 px-1">|</code>),{" "}
        <code className="rounded bg-slate-100 px-1">expected_result</code>,{" "}
        <code className="rounded bg-slate-100 px-1">priority</code>,{" "}
        <code className="rounded bg-slate-100 px-1">type</code>,{" "}
        <code className="rounded bg-slate-100 px-1">tags</code>.
      </p>
      <a
        href="/api/templates/cases-csv"
        className="text-sm text-indigo-600 hover:underline"
      >
        ↓ Unduh template CSV
      </a>
      <div className="mt-4 space-y-3">
        <input
          type="file"
          accept=".csv"
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
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-50"
          >
            {busy ? "Memproses..." : "Preview & Validasi"}
          </button>
          {preview && preview.some((r) => r.valid) && (
            <button
              onClick={() => upload(false)}
              disabled={busy}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Import {preview.filter((r) => r.valid).length} baris valid
            </button>
          )}
        </div>
        {message && <p className="text-sm">{message}</p>}
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
                    <td className="px-3 py-1.5">{row.title || <i>(kosong)</i>}</td>
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
