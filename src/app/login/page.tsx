import type { Metadata } from "next";
import { Logo } from "@/components/icons";
import { cookies } from "next/headers";
import { dict, resolveLang, LANG_COOKIE } from "@/lib/i18n";
import { LoginForm } from "@/components/LoginForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { oidcConfig } from "@/lib/oidc";
import { ldapEnabled } from "@/lib/ldap";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Log In — TestForge",
  description:
    "Log in to TestForge — open source test case management for manual and automated testing.",
  alternates: canonical("/login"),
};

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const lang = resolveLang(cookies().get(LANG_COOKIE)?.value);
  const t = dict[lang].auth.login;
  const oidc = oidcConfig();
  const ldap = ldapEnabled();
  // F-20: an operator can hide the password form entirely (SSO/social only).
  // F-34: except when LDAP is configured — directory credentials go through
  // this same form, so an LDAP-only instance still needs it.
  const passwordDisabled = process.env.TF_DISABLE_PASSWORD_LOGIN === "1" && !ldap;

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Logo size="lg" />
          <p className="mt-2 text-sm text-content-muted">{t.tagline}</p>
        </div>
        <LoginForm
          lang={lang}
          ssoLabel={oidc ? oidc.buttonLabel : null}
          passwordDisabled={passwordDisabled}
          ldap={ldap}
        />
        <div className="mt-6 flex justify-center">
          <LanguageSwitcher current={lang} />
        </div>
      </div>
    </main>
  );
}
