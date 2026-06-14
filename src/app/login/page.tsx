import { Logo } from "@/components/icons";
import { cookies } from "next/headers";
import { dict, resolveLang, LANG_COOKIE } from "@/lib/i18n";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const lang = resolveLang(cookies().get(LANG_COOKIE)?.value);
  const t = dict[lang].auth.login;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Logo size="lg" />
          <p className="mt-2 text-sm text-slate-500">{t.tagline}</p>
        </div>
        <LoginForm lang={lang} />
      </div>
    </main>
  );
}
