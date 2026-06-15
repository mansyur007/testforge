import Link from "next/link";
import { Logo, TFIcon } from "@/components/icons";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyEmailToken } from "@/app/actions/auth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { dict, resolveLang, LANG_COOKIE } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// PRD §12.3 langkah 5: user klik link di email → token divalidasi → akun aktif
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const lang = resolveLang(cookies().get(LANG_COOKIE)?.value);
  const t = dict[lang].auth.verifyFail;
  const token = searchParams.token;
  if (!token) redirect("/login");

  const result = await verifyEmailToken(token);
  if (result.ok && result.next) redirect(result.next);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <Logo size="lg" />
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
            <TFIcon name="invalid" current className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-xl font-bold">{t.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{result.error}</p>
          <Link
            href="/verify-email"
            className="mt-5 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {t.requestNew}
          </Link>
        </div>
        <div className="mt-6 flex justify-center">
          <LanguageSwitcher current={lang} />
        </div>
      </div>
    </main>
  );
}
