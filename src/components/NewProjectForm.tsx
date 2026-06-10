"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createProject } from "@/app/actions/projects";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {pending ? "Membuat..." : "+ Buat Proyek"}
    </button>
  );
}

export function NewProjectForm() {
  const [state, formAction] = useFormState(createProject, undefined);

  return (
    <form
      action={formAction}
      className="rounded-xl border border-slate-200 bg-white p-5"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Nama Proyek
          </label>
          <input
            name="name"
            required
            placeholder="contoh: Web Portal"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="w-40">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Slug (untuk ID: TC-SLUG-001)
          </label>
          <input
            name="slug"
            placeholder="web"
            pattern="[a-z0-9-]*"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="min-w-48 flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Deskripsi (opsional)
          </label>
          <input
            name="description"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <SubmitButton />
      </div>
      {state?.error && (
        <p className="mt-2 text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
