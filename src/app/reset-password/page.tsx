import { Logo } from "@/components/icons";
import { cookies } from "next/headers";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { dict, resolveLang, LANG_COOKIE } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  const lang = resolveLang(cookies().get(LANG_COOKIE)?.value);
  const t = dict[lang].auth.reset;

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Logo size="lg" />
          <p className="mt-2 text-sm text-content-muted">{t.headline}</p>
        </div>
        <ResetPasswordForm lang={lang} />
        <div className="mt-6 flex justify-center">
          <LanguageSwitcher current={lang} />
        </div>
      </div>
    </main>
  );
}
