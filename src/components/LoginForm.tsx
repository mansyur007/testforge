"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OAuthButtons } from "@/components/OAuthButtons";
import { type Lang } from "@/lib/i18n";

function FormInner({ lang }: { lang: Lang }) {
  const params = useSearchParams();
  const oauthError = params.get("error");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      {oauthError && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {oauthError}
        </p>
      )}
      <OAuthButtons mode="login" lang={lang} />
    </div>
  );
}

export function LoginForm({ lang }: { lang: Lang }) {
  return (
    <Suspense>
      <FormInner lang={lang} />
    </Suspense>
  );
}
