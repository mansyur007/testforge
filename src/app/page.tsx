import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { dict, resolveLang, LANG_COOKIE } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo, TFIcon, BrandIcon } from "@/components/icons";

// HP-008: SEO metadata + OG (default English)
export const metadata: Metadata = {
  title: "TestForge — Test Management That Doesn't Cost a Thing",
  description:
    "Manage manual and automation test cases in one platform. Open source, self-hosted, 100% free forever. The free alternative to TestRail, Qase.io, and Zephyr.",
  openGraph: {
    title: "TestForge — Open Source Test Case Management",
    description:
      "Manual + automation testing in one platform. Free forever, unlimited users.",
    type: "website",
  },
};

const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO ?? "mansyur007/testforge";

// HP-005: GitHub stars via API, cache 1 jam
async function getGitHubStars(): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()).stargazers_count ?? null;
  } catch {
    return null;
  }
}

// Mockup UI produk untuk hero (PRD §11.3.2) — CSS murni agar ringan & SSR
function ProductMockup() {
  const rows = [
    { id: "TC-WEB-001", title: "Valid login with registered email", p: "CRITICAL", s: "PASSED" },
    { id: "TC-WEB-002", title: "Login fails with wrong password", p: "HIGH", s: "PASSED" },
    { id: "TC-WEB-003", title: "Lockout after 5 failed logins", p: "HIGH", s: "FAILED" },
    { id: "TC-WEB-004", title: "Checkout with valid credit card", p: "CRITICAL", s: "RETEST" },
  ];
  const sColor: Record<string, string> = {
    PASSED: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    FAILED: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    RETEST: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  };
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        <span className="ml-3 rounded bg-white px-3 py-0.5 text-xs text-slate-400 dark:bg-slate-700">
          testforge.io/web — Test Cases
        </span>
      </div>
      <div className="p-4">
        <div className="mb-3 flex h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="w-3/5 bg-green-500" />
          <div className="w-1/5 bg-red-500" />
          <div className="w-1/5 bg-purple-500" />
        </div>
        <div className="space-y-1.5">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 text-xs dark:border-slate-800"
            >
              <span className="font-mono text-slate-400">{r.id}</span>
              <span className="flex-1 truncate font-medium text-slate-700 dark:text-slate-200">
                {r.title}
              </span>
              <span className="hidden text-slate-400 sm:inline">{r.p}</span>
              <span className={`rounded-full px-2 py-0.5 font-medium ${sColor[r.s]}`}>
                {r.s}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <p className="font-mono text-xs font-medium uppercase tracking-[.16em] text-indigo-600 dark:text-indigo-400">
        {kicker}
      </p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}

const integrationNames = [
  "Cypress", "Playwright", "Jest", "K6", "Selenium", "Pytest",
  "GitHub", "GitLab", "Jira", "Slack", "Jenkins", "Robot Framework",
];

export default async function HomePage() {
  const lang = resolveLang(cookies().get(LANG_COOKIE)?.value);
  const t = dict[lang].landing;
  const [session, stars] = await Promise.all([getSession(), getGitHubStars()]);

  return (
    <div className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo size="sm" />
          <nav className="hidden items-center gap-6 text-sm text-slate-600 dark:text-slate-300 md:flex">
            <a href="#features" className="hover:text-slate-900 dark:hover:text-white">{t.nav.features}</a>
            <a href="#comparison" className="hover:text-slate-900 dark:hover:text-white">{t.nav.comparison}</a>
            <a href="#integrations" className="hover:text-slate-900 dark:hover:text-white">{t.nav.integrations}</a>
            <a href="#faq" className="hover:text-slate-900 dark:hover:text-white">{t.nav.faq}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher current={lang} />
            {session ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                {t.nav.dashboard}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white sm:inline-block"
                >
                  {t.nav.login}
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 sm:px-4"
                >
                  {t.nav.cta}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 1. Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-12 sm:pb-16 sm:pt-16 md:pt-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
              {t.hero.titlePre}{" "}
              <span className="text-indigo-600 dark:text-indigo-400">
                {t.hero.titleHighlight}
              </span>
            </h1>
            <p className="mt-5 text-base text-slate-600 dark:text-slate-300 sm:text-lg">
              {t.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/signup"
                className="rounded-lg bg-indigo-600 px-6 py-3 text-center font-medium text-white hover:bg-indigo-700"
              >
                {t.hero.ctaPrimary}
              </Link>
              <Link
                href="/docs/self-hosting"
                className="rounded-lg border border-slate-300 px-6 py-3 text-center font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                {t.hero.ctaSecondary}
              </Link>
            </div>
            {/* Trust badges (PRD §11.3.1) */}
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
              {t.hero.badges.map((b) => (
                <span key={b}>{b}</span>
              ))}
            </div>
          </div>
          <ProductMockup />
        </div>
      </section>

      {/* 2. Social Proof Bar */}
      <section className="border-y border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4 py-6 text-sm text-slate-500 dark:text-slate-400 sm:gap-x-12">
          <span className="flex items-center gap-2">
            <TFIcon name="stars" className="h-5 w-5" />
            <b className="text-slate-700 dark:text-slate-200">{stars !== null ? stars.toLocaleString(lang === "id" ? "id-ID" : "en-US") : "—"}</b> {t.socialProof.stars}
          </span>
          <span className="flex items-center gap-2">
            <TFIcon name="docker-setup" className="h-5 w-5" />
            <b className="text-slate-700 dark:text-slate-200">{t.socialProof.dockerB}</b> {t.socialProof.docker}
          </span>
          <span className="flex items-center gap-2">
            <TFIcon name="frameworks" className="h-5 w-5" />
            <b className="text-slate-700 dark:text-slate-200">{t.socialProof.frameworksB}</b> {t.socialProof.frameworks}
          </span>
          <span className="flex items-center gap-2">
            <TFIcon name="geo" className="h-5 w-5" />
            {t.socialProof.region} <b className="text-slate-700 dark:text-slate-200">{t.socialProof.regionB}</b>
          </span>
        </div>
      </section>

      {/* 3. Problem Statement */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold md:text-3xl">{t.problem.title}</h2>
        <p className="mt-4 text-slate-600 dark:text-slate-300">{t.problem.body}</p>
      </section>

      {/* 4. Fitur Unggulan */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
        <SectionTitle kicker={t.features.kicker} title={t.features.title} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t.features.items.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 p-6 dark:border-slate-800"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent-tint dark:bg-indigo-950">
                <TFIcon name={f.icon} className="h-6 w-6" />
              </div>
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Perbandingan Kompetitor (PRD §11.4) */}
      <section id="comparison" className="scroll-mt-20 bg-slate-50 py-16 dark:bg-slate-900">
        <div className="mx-auto max-w-4xl px-4">
          <SectionTitle kicker={t.comparison.kicker} title={t.comparison.title} />
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                  <th className="px-5 py-3.5">{t.comparison.headFeature}</th>
                  <th className="px-5 py-3.5 text-slate-500">TestRail</th>
                  <th className="px-5 py-3.5 text-slate-500">Qase.io</th>
                  <th className="bg-indigo-50 px-5 py-3.5 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    TestForge
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {t.comparison.rows.map(([feat, tr, qa, tf]) => (
                  <tr key={feat}>
                    <td className="px-5 py-3 font-medium">{feat}</td>
                    <td className="px-5 py-3 text-slate-500">{tr}</td>
                    <td className="px-5 py-3 text-slate-500">{qa}</td>
                    <td className="bg-indigo-50/50 px-5 py-3 font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                      {tf}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700"
            >
              {t.comparison.cta}
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Demo / Screenshot (HP-006) */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionTitle kicker={t.demo.kicker} title={t.demo.title} />
        <div className="grid gap-6 md:grid-cols-3">
          {t.demo.items.map((d) => (
            <div key={d.title} className="rounded-xl border border-slate-200 p-6 dark:border-slate-800">
              <h3 className="font-semibold">{d.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{d.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="rounded-lg border border-indigo-300 px-6 py-3 font-medium text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950"
          >
            {t.demo.cta}
          </Link>
        </div>
      </section>

      {/* 7. Integrasi */}
      <section id="integrations" className="scroll-mt-20 bg-slate-50 py-16 dark:bg-slate-900">
        <div className="mx-auto max-w-4xl px-4">
          <SectionTitle kicker={t.integrations.kicker} title={t.integrations.title} />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {integrationNames.map((name) => {
              const brandId = name.toLowerCase().replace(/\s+/g, "-");
              return (
                <div
                  key={name}
                  className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-4 text-center text-xs font-medium leading-tight text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 sm:px-3 sm:text-sm"
                >
                  <BrandIcon name={brandId} className="h-6 w-6" />
                  {name}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. Testimoni */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionTitle kicker={t.testimonials.kicker} title={t.testimonials.title} />
        <div className="grid gap-6 md:grid-cols-3">
          {t.testimonials.items.map((tm) => (
            <figure
              key={tm.name}
              className="rounded-xl border border-slate-200 p-6 dark:border-slate-800"
            >
              <blockquote className="text-sm text-slate-600 dark:text-slate-300">
                &ldquo;{tm.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-semibold">{tm.name}</span>
                <span className="block text-xs text-slate-400">{tm.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* 9. Open Source CTA */}
      <section className="bg-slate-900 py-16 text-white dark:bg-slate-900">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="font-mono text-xs font-medium uppercase tracking-[.16em] text-indigo-400">
            {t.openSource.kicker}
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{t.openSource.title}</h2>
          <p className="mt-4 text-slate-300">{t.openSource.body}</p>
          <a
            href={`https://github.com/${GITHUB_REPO}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-medium text-slate-900 hover:bg-slate-100"
          >
            <TFIcon name="stars" className="h-5 w-5" />
            {t.openSource.cta}
          </a>
        </div>
      </section>

      {/* 10. Pricing Banner */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-6 dark:border-indigo-900 dark:bg-indigo-950 sm:p-10">
          <h2 className="text-2xl font-bold sm:text-3xl">{t.pricing.title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600 dark:text-slate-300">
            {t.pricing.body}
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-block rounded-lg bg-indigo-600 px-8 py-3 font-medium text-white hover:bg-indigo-700"
          >
            {t.pricing.cta}
          </Link>
        </div>
      </section>

      {/* 11. FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16">
        <SectionTitle kicker={t.faq.kicker} title={t.faq.title} />
        <div className="space-y-3">
          {t.faq.items.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-slate-200 p-5 dark:border-slate-800"
            >
              <summary className="cursor-pointer list-none font-medium">
                {f.q}
                <span className="float-right text-slate-400 group-open:rotate-45">＋</span>
              </summary>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 12. Footer */}
      <footer className="border-t border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Logo size="sm" />
            <p className="mt-2 text-sm text-slate-500">{t.footer.tagline}</p>
          </div>
          <div className="text-sm">
            <p className="font-semibold">{t.footer.product}</p>
            <ul className="mt-3 space-y-2 text-slate-500">
              <li><a href="#features" className="hover:text-slate-900 dark:hover:text-white">{t.footer.features}</a></li>
              <li><a href="#comparison" className="hover:text-slate-900 dark:hover:text-white">{t.footer.comparison}</a></li>
              <li><Link href="/docs/self-hosting" className="hover:text-slate-900 dark:hover:text-white">{t.footer.selfHosting}</Link></li>
              <li><Link href="/signup" className="hover:text-slate-900 dark:hover:text-white">{t.footer.signup}</Link></li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="font-semibold">{t.footer.community}</p>
            <ul className="mt-3 space-y-2 text-slate-500">
              <li>
                <a href={`https://github.com/${GITHUB_REPO}`} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white">
                  GitHub
                </a>
              </li>
              <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Discord</a></li>
              <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">{t.footer.docs}</a></li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="font-semibold">{t.footer.legal}</p>
            <ul className="mt-3 space-y-2 text-slate-500">
              <li><Link href="/terms" className="hover:text-slate-900 dark:hover:text-white">{t.footer.terms}</Link></li>
              <li><Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white">{t.footer.privacy}</Link></li>
            </ul>
          </div>
        </div>
        <p className="border-t border-slate-100 py-5 text-center text-xs text-slate-400 dark:border-slate-800">
          © {new Date().getFullYear()} TestForge. MIT License. · Part of{" "}
          <a href="https://emha.space" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600 dark:hover:text-slate-200">
            EMHA Universe
          </a>
        </p>
      </footer>
    </div>
  );
}
