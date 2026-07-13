import { Logo } from "@/components/icons";
import { cookies } from "next/headers";
import { dict, resolveLang, LANG_COOKIE } from "@/lib/i18n";
import { LoginForm } from "@/components/LoginForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { oidcConfig } from "@/lib/oidc";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const lang = resolveLang(cookies().get(LANG_COOKIE)?.value);
  const t = dict[lang].auth.login;
  const oidc = oidcConfig();
  // F-20: an operator can hide the password form entirely (SSO/social only).
  const passwordDisabled = process.env.TF_DISABLE_PASSWORD_LOGIN === "1";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Logo size="lg" />
          <p className="mt-2 text-sm text-slate-500">{t.tagline}</p>
        </div>
        <LoginForm
          lang={lang}
          ssoLabel={oidc ? oidc.buttonLabel : null}
          passwordDisabled={passwordDisabled}
        />
        <div className="mt-6 flex justify-center">
          <LanguageSwitcher current={lang} />
        </div>
      </div>
    </main>
  );
}
