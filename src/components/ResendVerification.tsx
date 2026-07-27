"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { resendVerification } from "@/app/actions/auth";
import { dict, type Lang } from "@/lib/i18n";

function ResendButton({
  cooldown,
  t,
}: {
  cooldown: number;
  t: { resend: string; resendIn: string; sending: string };
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || cooldown > 0}
      className="mt-4 w-full rounded-lg border border-hairline-strong px-4 py-2 text-sm font-medium text-content hover:bg-canvas disabled:opacity-50"
    >
      {pending
        ? t.sending
        : cooldown > 0
          ? `${t.resendIn} ${cooldown}s`
          : t.resend}
    </button>
  );
}

// Resend dengan cooldown 60 detik (PRD §12.5 / AU-007)
export function ResendVerification({
  email,
  lang,
}: {
  email: string;
  lang: Lang;
}) {
  const t = dict[lang].auth.verifyEmail;
  const [state, formAction] = useFormState(resendVerification, undefined);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (state?.ok) setCooldown(60);
  }, [state]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  return (
    <form action={formAction}>
      <input type="hidden" name="email" value={email} />
      <ResendButton cooldown={cooldown} t={t} />
      {state?.error && <p className="mt-2 text-sm text-danger">{state.error}</p>}
      {state?.ok && <p className="mt-2 text-sm text-success">{state.ok}</p>}
      {state?.devLink && (
        <div className="mt-3 rounded-lg bg-warning-soft p-3 text-left text-xs text-warning-soft-fg">
          <p className="font-medium">{t.devMode}</p>
          <a href={state.devLink} className="break-all underline">
            {state.devLink}
          </a>
        </div>
      )}
    </form>
  );
}
