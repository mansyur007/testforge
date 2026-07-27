"use client";

import { Suspense } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { login } from "@/app/actions/auth";
import { OAuthButtons } from "@/components/OAuthButtons";
import { dict, type Lang } from "@/lib/i18n";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="login-submit"
      className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-hover disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function FormInner({
  lang,
  ssoLabel,
  passwordDisabled,
  ldap,
}: {
  lang: Lang;
  ssoLabel: string | null;
  passwordDisabled: boolean;
  /** F-34: directory login is on, so this field takes a username too. */
  ldap: boolean;
}) {
  const t = dict[lang].auth.login;
  const [state, formAction] = useFormState(login, undefined);
  const params = useSearchParams();
  const oauthError = params.get("error");
  const verified = params.get("verified");
  const reset = params.get("reset");
  const next = params.get("next") ?? "";

  return (
    <div className="rounded-xl border border-hairline bg-surface p-8 shadow-sm">
      {oauthError && (
        <p className="mb-4 rounded-lg bg-danger-soft px-4 py-2.5 text-sm text-danger-soft-fg">
          {oauthError}
        </p>
      )}
      {ssoLabel && (
        <a
          href="/api/auth/oidc"
          data-testid="sso-login"
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-sidebar px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          {ssoLabel}
        </a>
      )}
      <OAuthButtons mode="login" lang={lang} />
      {!passwordDisabled && (
        <div className="my-5 flex items-center gap-3 text-xs text-content-subtle">
          <span className="h-px flex-1 bg-surface-muted" />
          {t.orEmail}
          <span className="h-px flex-1 bg-surface-muted" />
        </div>
      )}
      {passwordDisabled ? (
        <p className="mt-5 text-center text-xs text-content-subtle">
          Password sign-in is disabled on this instance.
        </p>
      ) : (
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        {verified && (
          <p className="rounded-lg bg-success-soft px-4 py-2.5 text-sm text-success-soft-fg">
            {t.verified}
          </p>
        )}
        {reset && (
          <p className="rounded-lg bg-success-soft px-4 py-2.5 text-sm text-success-soft-fg">
            {t.reset}
          </p>
        )}
        {state?.error && (
          <p className="rounded-lg bg-danger-soft px-4 py-2.5 text-sm text-danger-soft-fg">
            {state.error}
          </p>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-content">
            {ldap ? `${t.email} / username` : t.email}
          </label>
          {/* F-34: with a directory configured the value may be a bare username
              like `jdoe`, which type="email" would reject in the browser. */}
          <input
            name="email"
            type={ldap ? "text" : "email"}
            required
            data-testid="login-email"
            autoComplete={ldap ? "username" : "email"}
            className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
            placeholder={ldap ? "jdoe or you@company.com" : "you@company.com"}
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium text-content">
              {t.password}
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-accent-text hover:underline"
            >
              {t.forgot}
            </Link>
          </div>
          <input
            name="password"
            type="password"
            required
            data-testid="login-password"
            autoComplete="current-password"
            className="bg-surface text-content-strong w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
            placeholder="••••••••"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-content">
          <input type="checkbox" name="rememberMe" />
          {t.remember} <span className="text-xs text-content-subtle">{t.rememberHint}</span>
        </label>
        <SubmitButton label={t.submit} pendingLabel={t.submitting} />
        <p className="text-center text-sm text-content-muted">
          {t.noAccount}{" "}
          <Link href="/signup" className="font-medium text-accent-text hover:underline">
            {t.signupLink}
          </Link>
        </p>
      </form>
      )}
    </div>
  );
}

export function LoginForm({
  lang,
  ssoLabel,
  passwordDisabled,
  ldap = false,
}: {
  lang: Lang;
  ssoLabel: string | null;
  passwordDisabled: boolean;
  ldap?: boolean;
}) {
  return (
    <Suspense>
      <FormInner
        lang={lang}
        ssoLabel={ssoLabel}
        passwordDisabled={passwordDisabled}
        ldap={ldap}
      />
    </Suspense>
  );
}
