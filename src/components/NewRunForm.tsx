"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createRun } from "@/app/actions/runs";
import { PRIORITIES, CASE_TYPES, PRIORITY_BADGES } from "@/lib/constants";

type CaseItem = {
  id: string;
  displayId: string;
  title: string;
  priority: string;
  type: string;
  tags: string;
  suiteName: string;
};

function SubmitButton({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || count === 0}
      className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {pending ? "Membuat..." : `Buat Run (${count} test case)`}
    </button>
  );
}

// Pembuatan run dengan seleksi case manual atau via filter (PRD §4.3.1)
export function NewRunForm({
  projectId,
  milestones,
  cases,
}: {
  projectId: string;
  milestones: { id: string; name: string }[];
  cases: CaseItem[];
}) {
  const [state, formAction] = useFormState(createRun, undefined);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fPriority, setFPriority] = useState("");
  const [fType, setFType] = useState("");
  const [fTag, setFTag] = useState("");
  const [fQ, setFQ] = useState("");

  const filtered = useMemo(
    () =>
      cases.filter(
        (c) =>
          (!fPriority || c.priority === fPriority) &&
          (!fType || c.type === fType) &&
          (!fTag || c.tags.toLowerCase().includes(fTag.toLowerCase())) &&
          (!fQ || c.title.toLowerCase().includes(fQ.toLowerCase()))
      ),
    [cases, fPriority, fType, fTag, fQ]
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectAllFiltered = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      filtered.forEach((c) => next.add(c.id));
      return next;
    });

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="projectId" value={projectId} />
      {Array.from(selected).map((id) => (
        <input key={id} type="hidden" name="caseIds" value={id} />
      ))}

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nama Run <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              required
              placeholder="contoh: Regression Sprint 24"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Milestone
            </label>
            <select
              name="milestoneId"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">(tanpa milestone)</option>
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Deskripsi
            </label>
            <input
              name="description"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-3 font-semibold">
          Pilih Test Case{" "}
          <span className="font-normal text-slate-400">
            ({selected.size} dipilih)
          </span>
        </h3>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            value={fQ}
            onChange={(e) => setFQ(e.target.value)}
            placeholder="Cari judul..."
            className="w-44 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <select value={fPriority} onChange={(e) => setFPriority(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">Priority</option>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select value={fType} onChange={(e) => setFType(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">Type</option>
            {CASE_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input
            value={fTag}
            onChange={(e) => setFTag(e.target.value)}
            placeholder="Tag..."
            className="w-28 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <button type="button" onClick={selectAllFiltered}
            className="rounded-lg border border-indigo-300 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50">
            Pilih semua hasil filter ({filtered.length})
          </button>
          <button type="button" onClick={() => setSelected(new Set())}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50">
            Reset
          </button>
        </div>
        <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
          {filtered.map((c) => (
            <label
              key={c.id}
              className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selected.has(c.id)}
                onChange={() => toggle(c.id)}
              />
              <span className="font-mono text-xs text-slate-400">{c.displayId}</span>
              <span className="flex-1">{c.title}</span>
              <span className="text-xs text-slate-400">{c.suiteName}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGES[c.priority]}`}>
                {c.priority}
              </span>
            </label>
          ))}
          {filtered.length === 0 && (
            <p className="p-6 text-center text-sm text-slate-400">
              Tidak ada test case yang cocok dengan filter.
            </p>
          )}
        </div>
      </div>

      <SubmitButton count={selected.size} />
    </form>
  );
}
