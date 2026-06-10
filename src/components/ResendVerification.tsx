"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { resendVerification } from "@/app/actions/auth";

function ResendButton({ cooldown }: { cooldown: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || cooldown > 0}
      className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      {pending
        ? "Mengirim..."
        : cooldown > 0
          ? `Kirim ulang (${cooldown}s)`
          : "Kirim ulang email verifikasi"}
    </button>
  );
}

// Resend dengan cooldown 60 detik (PRD §12.5 / AU-007)
export function ResendVerification({ email }: { email: string }) {
  const [state, formAction] = useFormState(resendVerification, undefined);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (state?.ok) setCooldown(60);
  }, [state]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  return (
    <form action={formAction}>
      <input type="hidden" name="email" value={email} />
      <ResendButton cooldown={cooldown} />
      {state?.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="mt-2 text-sm text-green-600">{state.ok}</p>}
      {state?.devLink && (
        <div className="mt-3 rounded-lg bg-amber-50 p-3 text-left text-xs text-amber-800">
          <p className="font-medium">Mode dev (SMTP belum dikonfigurasi):</p>
          <a href={state.devLink} className="break-all underline">
            {state.devLink}
          </a>
        </div>
      )}
    </form>
  );
}
