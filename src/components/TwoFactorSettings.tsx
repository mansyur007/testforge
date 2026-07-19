"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  startTotpEnroll,
  confirmTotpEnroll,
  disableTotp,
  regenerateRecoveryCodes,
} from "@/app/actions/two-factor";

function SubmitButton({ label, variant = "primary" }: { label: string; variant?: "primary" | "danger" }) {
  const { pending } = useFormStatus();
  const cls =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-indigo-600 hover:bg-indigo-700";
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 ${cls}`}
    >
      {pending ? "Working…" : label}
    </button>
  );
}

function RecoveryCodes({ codes }: { codes: string[] }) {
  return (
    <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-4">
      <p className="text-sm font-medium text-amber-800">
        Save these recovery codes now — you will not see them again.
      </p>
      <p className="text-xs text-amber-700">
        Each code works once if you lose access to your authenticator app.
      </p>
      <ul
        data-testid="recovery-codes"
        className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-sm text-slate-800"
      >
        {codes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(codes.join("\n"))}
        className="rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
      >
        Copy codes
      </button>
    </div>
  );
}

function CodeInput({ name = "code", placeholder = "123456" }: { name?: string; placeholder?: string }) {
  return (
    <input
      name={name}
      inputMode="numeric"
      autoComplete="one-time-code"
      required
      data-testid="totp-code"
      placeholder={placeholder}
      className="w-40 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tracking-widest focus:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    />
  );
}

function EnrollFlow() {
  const [enroll, setEnroll] = useState<{ qrDataUrl: string; secret: string } | null>(null);
  const [startErr, setStartErr] = useState<string | null>(null);
  const [starting, startTransition] = useTransition();
  const [state, formAction] = useFormState(confirmTotpEnroll, undefined);

  if (state?.codes) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">
          Two-factor authentication is now on.
        </p>
        <RecoveryCodes codes={state.codes} />
      </div>
    );
  }

  if (!enroll) {
    return (
      <div className="space-y-3">
        {startErr && (
          <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{startErr}</p>
        )}
        <button
          type="button"
          disabled={starting}
          data-testid="enable-2fa"
          onClick={() =>
            startTransition(async () => {
              setStartErr(null);
              const res = await startTotpEnroll();
              if (res.ok) setEnroll({ qrDataUrl: res.qrDataUrl, secret: res.secret });
              else setStartErr(res.error);
            })
          }
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {starting ? "Preparing…" : "Enable two-factor authentication"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ol className="ml-4 list-decimal space-y-2 text-sm text-slate-600">
        <li>Scan this QR code with an authenticator app (Google Authenticator, Authy, 1Password…).</li>
        <li>Enter the 6-digit code it shows to finish.</li>
      </ol>
      <div className="flex flex-wrap items-start gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={enroll.qrDataUrl} alt="Two-factor QR code" width={200} height={200} className="rounded-lg border border-slate-200" />
        <div className="space-y-1">
          <p className="text-xs text-slate-500">Or enter this key manually:</p>
          <code
            data-testid="totp-secret"
            className="block break-all rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700"
          >
            {enroll.secret}
          </code>
        </div>
      </div>
      <form action={formAction} className="space-y-3">
        {state?.error && (
          <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{state.error}</p>
        )}
        <div className="flex items-center gap-3">
          <CodeInput />
          <SubmitButton label="Verify & turn on" />
        </div>
      </form>
    </div>
  );
}

function DisableFlow({ lowRecovery }: { lowRecovery: boolean }) {
  const [disableState, disableAction] = useFormState(disableTotp, undefined);
  const [regenState, regenAction] = useFormState(regenerateRecoveryCodes, undefined);
  const [showRegen, setShowRegen] = useState(false);

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 text-sm text-slate-700">
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
          On
        </span>
        Two-factor authentication is protecting your account.
      </p>

      {lowRecovery && (
        <p className="rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          You have few recovery codes left. Regenerate a fresh set to be safe.
        </p>
      )}

      {regenState?.codes ? (
        <RecoveryCodes codes={regenState.codes} />
      ) : showRegen ? (
        <form action={regenAction} className="space-y-2 rounded-lg border border-slate-200 p-4">
          <p className="text-sm font-medium text-slate-700">Regenerate recovery codes</p>
          <p className="text-xs text-slate-500">
            Enter a current authenticator code. This invalidates your old recovery codes.
          </p>
          {regenState?.error && (
            <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{regenState.error}</p>
          )}
          <div className="flex items-center gap-3">
            <CodeInput />
            <SubmitButton label="Regenerate" />
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowRegen(true)}
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          Regenerate recovery codes
        </button>
      )}

      <form action={disableAction} className="space-y-2 rounded-lg border border-red-200 p-4">
        <p className="text-sm font-medium text-slate-700">Turn off two-factor authentication</p>
        <p className="text-xs text-slate-500">
          Enter a current authenticator code or an unused recovery code to confirm.
        </p>
        {disableState?.error && (
          <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{disableState.error}</p>
        )}
        <div className="flex items-center gap-3">
          <CodeInput placeholder="123456 or code" />
          <SubmitButton label="Disable" variant="danger" />
        </div>
      </form>
    </div>
  );
}

export function TwoFactorSettings({
  enabled,
  lowRecovery = false,
}: {
  enabled: boolean;
  lowRecovery?: boolean;
}) {
  return enabled ? <DisableFlow lowRecovery={lowRecovery} /> : <EnrollFlow />;
}
