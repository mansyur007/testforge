import Link from "next/link";
import { Logo, TFIcon } from "@/components/icons";
import { cookies } from "next/headers";
import { ResendVerification } from "@/components/ResendVerification";
import { dict, resolveLang, LANG_COOKIE } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// PRD §12.3 langkah 4: halaman instruksi cek inbox + tombol resend
export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const lang = resolveLang(cookies().get(LANG_COOKIE)?.value);
  const t = dict[lang].auth.verifyEmail;
  const email = searchParams.email ?? "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <Logo size="lg" />
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
            <TFIcon name="mailbox" className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-xl font-bold">{t.title}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {t.bodyPre}{" "}
            <span className="font-medium text-slate-700">
              {email || t.yourEmail}
            </span>
            {t.bodyPost}
          </p>
          <ResendVerification email={email} lang={lang} />
          <p className="mt-6 text-xs text-slate-400">
            {t.wrongEmail}{" "}
            <Link href="/signup" className="text-indigo-600 hover:underline">
              {t.signupAgain}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
