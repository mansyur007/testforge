import Link from "next/link";
import { Logo } from "@/components/icons";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SignupForm } from "@/components/SignupForm";
import { dict, resolveLang, LANG_COOKIE } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Sign Up Free — TestForge",
  description:
    "Create a free TestForge account. No credit card, unlimited users and projects.",
};

export const dynamic = "force-dynamic";

export default function SignupPage() {
  const lang = resolveLang(cookies().get(LANG_COOKIE)?.value);
  const t = dict[lang].auth.signup;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Logo size="lg" />
          <p className="mt-2 text-sm text-slate-500">{t.headline}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <SignupForm lang={lang} />
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          {t.haveAccount}{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:underline">
            {t.loginLink}
          </Link>
        </p>
      </div>
    </main>
  );
}
