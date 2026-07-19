import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { dict, resolveLang, LANG_COOKIE } from "@/lib/i18n";
import { Logo, TFIcon, BackLink } from "@/components/icons";

export const metadata: Metadata = {
  title: "Self-Hosting — TestForge",
  description:
    "Deploy TestForge on your own server with a single Docker Compose command.",
};

export const dynamic = "force-dynamic";

const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO ?? "mansyur007/test-forge";

// HP-003: target CTA "Self-Host in 5 Minutes"
export default function SelfHostingPage() {
  const lang = resolveLang(cookies().get(LANG_COOKIE)?.value);
  const t = dict[lang].docs.selfHosting;
  const c = t.envComments;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <Logo size="sm" />
        <BackLink href="/">{t.back}</BackLink>
      </div>
      <h1 className="flex items-center gap-3 text-3xl font-bold">
        <TFIcon name="docker-setup" className="h-9 w-9" />
        {t.title}
      </h1>
      <p className="mt-3 text-slate-600">{t.intro}</p>

      <h2 className="mt-10 text-xl font-semibold">{t.step1}</h2>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-sm text-slate-100">
{`git clone https://github.com/${GITHUB_REPO}.git
cd testforge
docker compose up -d`}
      </pre>
      <p className="mt-2 text-sm text-slate-500">{t.step1Note}</p>

      <h2 className="mt-10 text-xl font-semibold">{t.step2}</h2>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-sm text-slate-100">
{`AUTH_SECRET=long-random-secret               # ${c.secret}
DATABASE_URL=file:/data/testforge.db          # ${c.db}
NEXT_PUBLIC_BASE_URL=https://testforge.company.com
SMTP_URL=smtp://user:pass@mail:587            # ${c.smtp}
SMTP_FROM=TestForge <no-reply@company.com>    # sender address
GOOGLE_CLIENT_ID=...                          # ${c.google}
GITHUB_CLIENT_ID=...                          # ${c.github}`}
      </pre>

      <h2 className="mt-10 text-xl font-semibold">{t.step3}</h2>
      <p className="mt-2 text-sm text-slate-600">{t.step3Body}</p>

      <div className="mt-10 rounded-xl border border-indigo-200 bg-indigo-50 p-6 text-center">
        <p className="font-medium">{t.ctaTitle}</p>
        <Link
          href="/signup"
          className="mt-3 inline-block rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {t.cta}
        </Link>
      </div>
    </main>
  );
}
