import { Logo } from "@/components/icons";
import { cookies } from "next/headers";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { dict, resolveLang, LANG_COOKIE } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  const lang = resolveLang(cookies().get(LANG_COOKIE)?.value);
  const t = dict[lang].auth.forgot;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Logo size="lg" />
          <p className="mt-2 text-sm text-slate-500">{t.headline}</p>
        </div>
        <ForgotPasswordForm lang={lang} />
        <div className="mt-6 flex justify-center">
          <LanguageSwitcher current={lang} />
        </div>
      </div>
    </main>
  );
}
