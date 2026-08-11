import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { dict, resolveLang, LANG_COOKIE } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Logo, TFIcon, BrandIcon } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import {
  canonical,
  faqLd,
  ldGraph,
  organizationLd,
  softwareApplicationLd,
  websiteLd,
} from "@/lib/seo";

// HP-008: SEO metadata + OG (default English)
export const metadata: Metadata = {
  title: "TestForge — Test Management That Doesn't Cost a Thing",
  description:
    "Manage manual and automation test cases in one platform. Open source, self-hosted, 100% free forever. The free alternative to TestRail, Qase.io, and Zephyr.",
  // Next merges metadata shallowly: this object REPLACES the root layout's
  // openGraph, so siteName/locale/url are repeated here rather than inherited.
  openGraph: {
    title: "TestForge — Open Source Test Case Management",
    description:
      "Manual + automation testing in one platform. Free forever, unlimited users.",
    type: "website",
    siteName: "TestForge",
    locale: "en_US",
    url: "/",
  },
  // Gambarnya datang dari src/app/opengraph-image.tsx (konvensi file Next);
  // X/Twitter memakai og:image itu selama card-nya besar.
  twitter: {
    card: "summary_large_image",
    title: "TestForge — Open Source Test Case Management",
    description:
      "Manual + automation testing in one platform. Free forever, unlimited users.",
  },
  alternates: canonical("/"),
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
    PASSED: "bg-success-soft text-success-soft-fg",
    FAILED: "bg-danger-soft text-danger-soft-fg",
    RETEST: "bg-accent-soft text-accent-soft-fg",
  };
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface shadow-2xl">
      <div className="flex items-center gap-1.5 border-b border-hairline-subtle bg-surface-muted px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-danger" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning" />
        <span className="h-2.5 w-2.5 rounded-full bg-success" />
        <span className="ml-3 rounded bg-surface px-3 py-0.5 text-xs text-content-subtle">
          testforge.io/web — Test Cases
        </span>
      </div>
      <div className="p-4">
        {/* Bar mengisi saat load: satu-satunya gerak "menjelaskan" di halaman —
            memperagakan hasil test yang menggulung jadi pass rate. */}
        <div className="mb-3 flex h-2 overflow-hidden rounded-full bg-surface-muted">
          <div className="tf-bar-grow w-3/5 bg-success" />
          <div className="tf-bar-grow w-1/5 bg-danger" style={{ animationDelay: "80ms" }} />
          <div className="tf-bar-grow w-1/5 bg-accent" style={{ animationDelay: "160ms" }} />
        </div>
        <div className="space-y-1.5">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-lg border border-hairline-subtle px-3 py-2 text-xs"
            >
              <span className="font-mono text-content-subtle">{r.id}</span>
              <span className="flex-1 truncate font-medium text-content-strong">
                {r.title}
              </span>
              <span className="hidden text-content-subtle sm:inline">{r.p}</span>
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
      <p className="font-mono text-xs font-medium uppercase tracking-[.16em] text-accent-text">
        {kicker}
      </p>
      <h2 className="mt-2 text-2xl font-bold text-content-strong sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}

const integrationNames = [
  "Cypress", "Playwright", "Jest", "K6", "Selenium", "Pytest",
  "GitHub", "GitLab", "Jira", "Slack", "Jenkins", "Robot Framework",
];

// Motion untuk CTA (§7.4: 150–200 ms ease-out, motion-safe). Tailwind's bare
// `transition` covers colour AND transform, so hover and press ride one curve.
// §7.4 says "translate/opacity only"; `scale` is used here because it is
// GPU-composited exactly like translate — the rule exists to keep motion off
// layout-triggering properties (cf. the amber flash in RunExecutor.tsx).
// The scale effect is motion-safe too, avoiding a one-frame jump when reduced.
const CTA_MOTION =
  "transition-colors duration-fast ease-tf-out motion-safe:transition-[color,background-color,transform] motion-safe:active:scale-[0.98]";

export default async function HomePage() {
  const lang = resolveLang(cookies().get(LANG_COOKIE)?.value);
  const t = dict[lang].landing;
  const [session, stars] = await Promise.all([getSession(), getGitHubStars()]);

  return (
    <div className="tf-landing bg-canvas text-content-strong">
      {/* F-40: structured data. The FAQ block is the same copy rendered in the
          #faq section below (same i18n dict), which is what Google's FAQ
          rich-result policy requires — no hidden answers. */}
      <JsonLd
        data={ldGraph(
          organizationLd(),
          websiteLd(),
          softwareApplicationLd({ description: t.hero.subtitle }),
          faqLd(t.faq.items),
        )}
      />

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-hairline-subtle bg-canvas/80 backdrop-blur">
        {/* flex-wrap: logo + language + theme + CTA need ~450px, so on a phone
            the controls drop to a second row instead of widening the page.
            No effect from md up, where they already fit on one line. */}
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-2 px-4 py-3">
          <Logo size="sm" />
          <nav className="hidden items-center gap-6 text-sm text-content md:flex">
            <a href="#features" className="hover:text-content-strong">{t.nav.features}</a>
            <a href="#comparison" className="hover:text-content-strong">{t.nav.comparison}</a>
            <a href="#integrations" className="hover:text-content-strong">{t.nav.integrations}</a>
            {/* A-03: the only real route among the anchors — /academy is the
                organic entry point, so it needs a link from the page crawlers
                actually reach. */}
            <Link href="/academy" className="hover:text-content-strong">{t.nav.academy}</Link>
            <a href="#faq" className="hover:text-content-strong">{t.nav.faq}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher current={lang} />
            <ThemeSwitcher />
            {session ? (
              <Link
                href="/dashboard"
                className={`rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover ${CTA_MOTION}`}
              >
                {t.nav.dashboard}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-lg px-3 py-2 text-sm font-medium text-content hover:text-content-strong sm:inline-block"
                >
                  {t.nav.login}
                </Link>
                <Link
                  href="/signup"
                  className={`rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover sm:px-4 ${CTA_MOTION}`}
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
              <span className="text-accent-text">
                {t.hero.titleHighlight}
              </span>
            </h1>
            <p className="mt-5 text-base text-content sm:text-lg">
              {t.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/signup"
                className={`rounded-lg bg-accent px-6 py-3 text-center font-medium text-white hover:bg-accent-hover ${CTA_MOTION}`}
              >
                {t.hero.ctaPrimary}
              </Link>
              <Link
                href="/docs/self-hosting"
                className={`rounded-lg border border-hairline-strong px-6 py-3 text-center font-medium text-content hover:bg-surface-muted ${CTA_MOTION}`}
              >
                {t.hero.ctaSecondary}
              </Link>
            </div>
            {/* Trust badges (PRD §11.3.1) */}
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-content-muted">
              {t.hero.badges.map((b) => (
                <span key={b}>{b}</span>
              ))}
            </div>
          </div>
          <ProductMockup />
        </div>
      </section>

      {/* 2. Social Proof Bar */}
      <section className="border-y border-hairline-subtle bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4 py-6 text-sm text-content-muted sm:gap-x-12">
          <span className="flex items-center gap-2">
            <TFIcon name="stars" className="h-5 w-5" />
            <b className="text-content-strong">{stars !== null ? stars.toLocaleString(lang === "id" ? "id-ID" : "en-US") : "—"}</b> {t.socialProof.stars}
          </span>
          <span className="flex items-center gap-2">
            <TFIcon name="docker-setup" className="h-5 w-5" />
            <b className="text-content-strong">{t.socialProof.dockerB}</b> {t.socialProof.docker}
          </span>
          <span className="flex items-center gap-2">
            <TFIcon name="frameworks" className="h-5 w-5" />
            <b className="text-content-strong">{t.socialProof.frameworksB}</b> {t.socialProof.frameworks}
          </span>
          <span className="flex items-center gap-2">
            <TFIcon name="geo" className="h-5 w-5" />
            {t.socialProof.region} <b className="text-content-strong">{t.socialProof.regionB}</b>
          </span>
        </div>
      </section>

      {/* 3. Problem Statement */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold md:text-3xl">{t.problem.title}</h2>
        <p className="mt-4 text-content">{t.problem.body}</p>
      </section>

      {/* 4. Fitur Unggulan */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
        <SectionTitle kicker={t.features.kicker} title={t.features.title} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t.features.items.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-hairline p-6"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent-soft">
                <TFIcon name={f.icon} className="h-6 w-6" />
              </div>
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-content-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Perbandingan Kompetitor (PRD §11.4) */}
      <section id="comparison" className="scroll-mt-20 bg-canvas py-16">
        <div className="mx-auto max-w-4xl px-4">
          <SectionTitle kicker={t.comparison.kicker} title={t.comparison.title} />
          <div className="overflow-x-auto rounded-xl border border-hairline bg-surface">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-hairline text-left">
                  <th className="px-5 py-3.5">{t.comparison.headFeature}</th>
                  <th className="px-5 py-3.5 text-content-muted">TestRail</th>
                  <th className="px-5 py-3.5 text-content-muted">Qase.io</th>
                  <th className="bg-accent-soft px-5 py-3.5 text-accent-soft-fg">
                    TestForge
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-subtle">
                {t.comparison.rows.map(([feat, tr, qa, tf]) => (
                  <tr key={feat}>
                    <td className="px-5 py-3 font-medium">{feat}</td>
                    <td className="px-5 py-3 text-content-muted">{tr}</td>
                    <td className="px-5 py-3 text-content-muted">{qa}</td>
                    <td className="bg-accent-soft/50 px-5 py-3 font-semibold text-accent-soft-fg">
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
              className={`rounded-lg bg-accent px-6 py-3 font-medium text-white hover:bg-accent-hover ${CTA_MOTION}`}
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
            <div key={d.title} className="rounded-xl border border-hairline p-6">
              <h3 className="font-semibold">{d.title}</h3>
              <p className="mt-2 text-sm text-content-muted">{d.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/login"
            className={`rounded-lg border border-accent-ring px-6 py-3 font-medium text-accent-soft-fg hover:bg-accent-soft ${CTA_MOTION}`}
          >
            {t.demo.cta}
          </Link>
        </div>
      </section>

      {/* 7. Integrasi */}
      <section id="integrations" className="scroll-mt-20 bg-canvas py-16">
        <div className="mx-auto max-w-4xl px-4">
          <SectionTitle kicker={t.integrations.kicker} title={t.integrations.title} />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {integrationNames.map((name) => {
              const brandId = name.toLowerCase().replace(/\s+/g, "-");
              return (
                <div
                  key={name}
                  className="flex flex-col items-center gap-2 rounded-lg border border-hairline bg-surface px-2 py-4 text-center text-xs font-medium leading-tight text-content sm:px-3 sm:text-sm"
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
              className="rounded-xl border border-hairline p-6"
            >
              <blockquote className="text-sm text-content">
                &ldquo;{tm.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-semibold">{tm.name}</span>
                <span className="block text-xs text-content-subtle">{tm.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* 9. Open Source CTA */}
      <section className="bg-sidebar py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="font-mono text-xs font-medium uppercase tracking-[.16em] text-accent-ring">
            {t.openSource.kicker}
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{t.openSource.title}</h2>
          <p className="mt-4 text-sidebar-fg">{t.openSource.body}</p>
          <a
            href={`https://github.com/${GITHUB_REPO}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-6 inline-flex items-center gap-2 rounded-lg bg-surface px-6 py-3 font-medium text-content-strong hover:bg-surface-muted ${CTA_MOTION}`}
          >
            <TFIcon name="stars" className="h-5 w-5" />
            {t.openSource.cta}
          </a>
        </div>
      </section>

      {/* 10. Pricing Banner */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="rounded-2xl border-2 border-accent-ring bg-accent-soft p-6 sm:p-10">
          <h2 className="text-2xl font-bold sm:text-3xl">{t.pricing.title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-content">
            {t.pricing.body}
          </p>
          <Link
            href="/signup"
            className={`mt-6 inline-block rounded-lg bg-accent px-8 py-3 font-medium text-white hover:bg-accent-hover ${CTA_MOTION}`}
          >
            {t.pricing.cta}
          </Link>
        </div>
      </section>

      {/* 11. FAQ */}
      <section id="faq" className="tf-faq mx-auto max-w-3xl scroll-mt-20 px-4 py-16">
        <SectionTitle kicker={t.faq.kicker} title={t.faq.title} />
        <div className="space-y-3">
          {t.faq.items.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-hairline p-5"
            >
              <summary className="cursor-pointer list-none font-medium">
                {f.q}
                <span className="float-right text-content-subtle motion-safe:group-open:rotate-45 motion-safe:transition-transform motion-safe:duration-panel motion-safe:ease-tf-out">
                  ＋
                </span>
              </summary>
              <p className="mt-3 text-sm text-content-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 12. Footer */}
      <footer className="border-t border-hairline-subtle bg-canvas">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Logo size="sm" />
            <p className="mt-2 text-sm text-content-muted">{t.footer.tagline}</p>
          </div>
          <div className="text-sm">
            <p className="font-semibold">{t.footer.product}</p>
            <ul className="mt-3 space-y-2 text-content-muted">
              <li><a href="#features" className="hover:text-content-strong">{t.footer.features}</a></li>
              <li><a href="#comparison" className="hover:text-content-strong">{t.footer.comparison}</a></li>
              <li><Link href="/docs/self-hosting" className="hover:text-content-strong">{t.footer.selfHosting}</Link></li>
              <li><Link href="/academy" className="hover:text-content-strong">{t.footer.academy}</Link></li>
              <li><Link href="/signup" className="hover:text-content-strong">{t.footer.signup}</Link></li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="font-semibold">{t.footer.community}</p>
            <ul className="mt-3 space-y-2 text-content-muted">
              <li>
                <a href={`https://github.com/${GITHUB_REPO}`} target="_blank" rel="noopener noreferrer" className="hover:text-content-strong">
                  GitHub
                </a>
              </li>
              <li><a href="#" className="hover:text-content-strong">Discord</a></li>
              <li><a href="#" className="hover:text-content-strong">{t.footer.docs}</a></li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="font-semibold">{t.footer.legal}</p>
            <ul className="mt-3 space-y-2 text-content-muted">
              <li><Link href="/terms" className="hover:text-content-strong">{t.footer.terms}</Link></li>
              <li><Link href="/privacy" className="hover:text-content-strong">{t.footer.privacy}</Link></li>
            </ul>
          </div>
        </div>
        <p className="border-t border-hairline-subtle py-5 text-center text-xs text-content-subtle">
          © {new Date().getFullYear()} TestForge. MIT License. · Part of{" "}
          <a href="https://emha.space" target="_blank" rel="noopener noreferrer" className="underline hover:text-content-muted">
            EMHA Universe
          </a>
        </p>
      </footer>
    </div>
  );
}
