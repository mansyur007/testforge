"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createApiKey } from "@/app/actions/apikeys";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {pending ? "Membuat..." : "+ Buat API Key"}
    </button>
  );
}

export function ApiKeyCreator() {
  const [state, formAction] = useFormState(createApiKey, undefined);

  return (
    <div className="space-y-3">
      <form
        action={formAction}
        className="flex items-end gap-3 rounded-xl border border-slate-200 bg-white p-5"
      >
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Nama key (contoh: github-actions)
          </label>
          <input
            name="name"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <SubmitButton />
      </form>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.createdKey && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <p className="text-sm font-medium text-green-800">
            ✅ API key dibuat — salin sekarang, tidak akan ditampilkan lagi:
          </p>
          <code className="mt-2 block select-all break-all rounded-lg bg-white p-3 font-mono text-sm">
            {state.createdKey}
          </code>
        </div>
      )}
    </div>
  );
}
