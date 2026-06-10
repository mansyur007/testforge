import Link from "next/link";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";

// HP-008: SEO metadata + OG
export const metadata: Metadata = {
  title: "TestForge — Test Management That Doesn't Cost a Thing",
  description:
    "Kelola test case manual dan automation dalam satu platform. Open source, self-hosted, 100% gratis selamanya. Alternatif gratis TestRail, Qase.io, dan Zephyr.",
  openGraph: {
    title: "TestForge — Open Source Test Case Management",
    description:
      "Manual + automation testing dalam satu platform. Gratis selamanya, unlimited users.",
    type: "website",
  },
};

const GITHUB_REPO = process.env.NEXT_PUBLIC_GITHUB_REPO ?? "testforge/testforge";

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
    { id: "TC-WEB-001", title: "Valid login dengan email terdaftar", p: "CRITICAL", s: "PASSED" },
    { id: "TC-WEB-002", title: "Login gagal dengan password salah", p: "HIGH", s: "PASSED" },
    { id: "TC-WEB-003", title: "Lockout setelah 5 kali gagal login", p: "HIGH", s: "FAILED" },
    { id: "TC-WEB-004", title: "Checkout dengan kartu kredit valid", p: "CRITICAL", s: "RETEST" },
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
      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
        {kicker}
      </p>
      <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
        {title}
      </h2>
    </div>
  );
}

export default async function HomePage() {
  const [session, stars] = await Promise.all([getSession(), getGitHubStars()]);

  const features = [
    {
      icon: "📝",
      title: "Manual Testing Terstruktur",
      desc: "Test case dengan steps detail, suite hierarki, bulk edit, dan eksekusi dengan keyboard shortcut.",
    },
    {
      icon: "🤖",
      title: "Automation Integration",
      desc: "Upload JUnit XML dari Cypress, Playwright, Jest, Pytest — auto-match ke test case kamu.",
    },
    {
      icon: "🔁",
      title: "CI/CD Native",
      desc: "REST API + API key untuk pipeline GitHub Actions, GitLab CI, Jenkins. Hasil masuk otomatis.",
    },
    {
      icon: "📊",
      title: "Reporting & Analytics",
      desc: "Pass rate trend, flaky test detection, bug correlation, dan automation coverage real-time.",
    },
  ];

  const competitors = [
    ["Harga", "$36/user/bln", "$20/user/bln", "GRATIS selamanya"],
    ["Unlimited Users", "✕", "✕", "✓"],
    ["Self-hosted", "Berbayar", "✕", "✓ Gratis"],
    ["Open Source", "✕", "✕", "✓ MIT"],
    ["Automation Integration", "Terbatas", "Baik", "Native & Luas"],
    ["CI/CD Native", "Plugin berbayar", "✓", "✓ Built-in"],
  ];

  const integrations = [
    "Cypress", "Playwright", "Jest", "K6", "Selenium", "Pytest",
    "GitHub", "GitLab", "Jira", "Slack", "Jenkins", "Robot Framework",
  ];

  const testimonials = [
    {
      quote:
        "Akhirnya ada test management yang tidak minta kartu kredit. Setup Docker-nya beneran satu perintah.",
      name: "Rian P.",
      role: "QA Engineer — Early Adopter",
    },
    {
      quote:
        "Hasil Cypress kami langsung masuk sebagai test run. Tidak perlu lagi rekap manual di spreadsheet.",
      name: "Sarah K.",
      role: "SDET — Beta Tester",
    },
    {
      quote:
        "Laporan flaky test-nya menghemat berjam-jam debugging. Dan ini gratis. Sulit dipercaya.",
      name: "Andi W.",
      role: "QA Lead — Beta Tester",
    },
  ];

  const faqs = [
    {
      q: "Apakah TestForge benar-benar gratis?",
      a: "Ya, 100% gratis dan open source dengan lisensi MIT. Tidak ada hidden fee, tidak ada batasan user, project, atau test case. Tidak ada model 'open core' — semua fitur tersedia.",
    },
    {
      q: "Bisakah saya self-host di server sendiri?",
      a: "Bisa. Satu perintah `docker compose up` dan TestForge berjalan di infrastruktur kamu. Tersedia juga panduan untuk VPS dan Kubernetes.",
    },
    {
      q: "Apakah data saya aman?",
      a: "Pada mode self-hosted, data 100% di server kamu sendiri. Password di-hash dengan bcrypt, API key di-hash SHA-256, dan semua aksi tercatat di audit log.",
    },
    {
      q: "Framework automation apa saja yang didukung?",
      a: "Semua framework yang menghasilkan JUnit XML: Cypress, Playwright, Jest, Vitest, Pytest, Mocha, Selenium, Robot Framework, dan lainnya.",
    },
    {
      q: "Bagaimana cara migrasi dari TestRail/Qase?",
      a: "Export test case kamu ke CSV dari tools lama, lalu import ke TestForge — tersedia preview dan validasi sebelum data masuk.",
    },
    {
      q: "Bagaimana cara berkontribusi?",
      a: "Repository tersedia di GitHub dengan label good-first-issue untuk kontributor baru. Diskusi berlangsung di Discord community.",
    },
  ];

  return (
    <div className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-xl font-bold">
            ⚒️ Test<span className="text-indigo-600 dark:text-indigo-400">Forge</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 dark:text-slate-300 md:flex">
            <a href="#fitur" className="hover:text-slate-900 dark:hover:text-white">Fitur</a>
            <a href="#perbandingan" className="hover:text-slate-900 dark:hover:text-white">Perbandingan</a>
            <a href="#integrasi" className="hover:text-slate-900 dark:hover:text-white">Integrasi</a>
            <a href="#faq" className="hover:text-slate-900 dark:hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            {session ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Start for Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 1. Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 md:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Test Management That{" "}
              <span className="text-indigo-600 dark:text-indigo-400">
                Doesn&apos;t Cost a Thing
              </span>
            </h1>
            <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
              Kelola test case manual dan automation dalam satu platform. Open
              source, self-hosted, 100% gratis selamanya.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700"
              >
                Start for Free
              </Link>
              <Link
                href="/docs/self-hosting"
                className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Self-Host in 5 Minutes
              </Link>
            </div>
            {/* Trust badges (PRD §11.3.1) */}
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
              <span>✓ Open Source (MIT License)</span>
              <span>✓ No credit card required</span>
              <span>✓ Unlimited users &amp; projects</span>
            </div>
          </div>
          <ProductMockup />
        </div>
      </section>

      {/* 2. Social Proof Bar */}
      <section className="border-y border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-3 px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
          <span>
            ⭐ <b className="text-slate-700 dark:text-slate-200">{stars !== null ? stars.toLocaleString("id-ID") : "—"}</b> GitHub stars
          </span>
          <span>
            🐳 <b className="text-slate-700 dark:text-slate-200">Docker</b> one-command setup
          </span>
          <span>
            🧪 <b className="text-slate-700 dark:text-slate-200">10+</b> framework automation
          </span>
          <span>
            🌏 Dipakai tim QA di <b className="text-slate-700 dark:text-slate-200">Asia Tenggara</b>
          </span>
        </div>
      </section>

      {/* 3. Problem Statement */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold md:text-3xl">
          Tools test management terbaik itu mahal dan rumit
        </h2>
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          TestRail $36/user/bulan. Qase $20/user/bulan. Untuk tim QA berisi 10
          orang, itu ribuan dolar per tahun — hanya untuk mencatat test case.
          Sementara spreadsheet gratis tapi kacau saat regression. TestForge
          memberi fitur setara tools berbayar, tanpa biaya, dan datanya tetap
          milik kamu.
        </p>
      </section>

      {/* 4. Fitur Unggulan */}
      <section id="fitur" className="mx-auto max-w-6xl px-4 py-16">
        <SectionTitle kicker="Fitur Unggulan" title="Satu platform untuk seluruh workflow QA" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-slate-200 p-6 dark:border-slate-800"
            >
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Perbandingan Kompetitor (PRD §11.4) */}
      <section id="perbandingan" className="bg-slate-50 py-16 dark:bg-slate-900">
        <div className="mx-auto max-w-4xl px-4">
          <SectionTitle kicker="Perbandingan" title="Kenapa TestForge, bukan yang lain?" />
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                  <th className="px-5 py-3.5">Fitur</th>
                  <th className="px-5 py-3.5 text-slate-500">TestRail</th>
                  <th className="px-5 py-3.5 text-slate-500">Qase.io</th>
                  <th className="bg-indigo-50 px-5 py-3.5 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    TestForge
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {competitors.map(([feat, tr, qa, tf]) => (
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
              Start for Free
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Demo / Screenshot (HP-006) */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionTitle kicker="Lihat Produknya" title="UI yang dirancang untuk eksekusi cepat" />
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { title: "Test Case View", desc: "Steps detail, preconditions, expected result, riwayat eksekusi per case." },
            { title: "Test Run Execution", desc: "Submit hasil dengan shortcut P/F/B, timer otomatis, progress bar real-time." },
            { title: "Dashboard & CI", desc: "Pass rate trend, flaky test, dan hasil pipeline CI masuk otomatis." },
          ].map((d) => (
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
            View Live Demo →
          </Link>
          <p className="mt-2 text-xs text-slate-400">
            Login demo: admin@testforge.local / admin12345
          </p>
        </div>
      </section>

      {/* 7. Integrasi */}
      <section id="integrasi" className="bg-slate-50 py-16 dark:bg-slate-900">
        <div className="mx-auto max-w-4xl px-4">
          <SectionTitle kicker="Integrasi" title="Terhubung dengan tools yang sudah kamu pakai" />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {integrations.map((name) => (
              <div
                key={name}
                className="rounded-lg border border-slate-200 bg-white px-3 py-4 text-center text-sm font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Testimoni */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionTitle kicker="Testimoni" title="Apa kata pengguna awal" />
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="rounded-xl border border-slate-200 p-6 dark:border-slate-800"
            >
              <blockquote className="text-sm text-slate-600 dark:text-slate-300">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-semibold">{t.name}</span>
                <span className="block text-xs text-slate-400">{t.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* 9. Open Source CTA */}
      <section className="bg-slate-900 py-16 text-white dark:bg-slate-900">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-400">
            Open Source
          </p>
          <h2 className="mt-2 text-3xl font-bold">MIT License. Selamanya.</h2>
          <p className="mt-4 text-slate-300">
            Tidak ada model &ldquo;open core&rdquo; — semua fitur tersedia di
            versi open source. Fork, modifikasi, deploy sesuka kamu. Kontribusi
            selalu terbuka.
          </p>
          <a
            href={`https://github.com/${GITHUB_REPO}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-medium text-slate-900 hover:bg-slate-100"
          >
            ⭐ Star on GitHub
          </a>
        </div>
      </section>

      {/* 10. Pricing Banner */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-10 dark:border-indigo-900 dark:bg-indigo-950">
          <h2 className="text-3xl font-bold">100% Gratis. Titik.</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600 dark:text-slate-300">
            Tidak ada hidden fee, tidak ada batasan user, tidak ada paywall
            fitur. Unlimited users, unlimited projects, unlimited test cases.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-block rounded-lg bg-indigo-600 px-8 py-3 font-medium text-white hover:bg-indigo-700"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* 11. FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-16">
        <SectionTitle kicker="FAQ" title="Pertanyaan yang sering diajukan" />
        <div className="space-y-3">
          {faqs.map((f) => (
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
            <p className="text-lg font-bold">
              ⚒️ Test<span className="text-indigo-600 dark:text-indigo-400">Forge</span>
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Open source test case management. Gratis selamanya.
            </p>
          </div>
          <div className="text-sm">
            <p className="font-semibold">Produk</p>
            <ul className="mt-3 space-y-2 text-slate-500">
              <li><a href="#fitur" className="hover:text-slate-900 dark:hover:text-white">Fitur</a></li>
              <li><a href="#perbandingan" className="hover:text-slate-900 dark:hover:text-white">Perbandingan</a></li>
              <li><Link href="/docs/self-hosting" className="hover:text-slate-900 dark:hover:text-white">Self-Hosting</Link></li>
              <li><Link href="/signup" className="hover:text-slate-900 dark:hover:text-white">Daftar Gratis</Link></li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="font-semibold">Komunitas</p>
            <ul className="mt-3 space-y-2 text-slate-500">
              <li>
                <a href={`https://github.com/${GITHUB_REPO}`} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white">
                  GitHub
                </a>
              </li>
              <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Discord</a></li>
              <li><a href="#" className="hover:text-slate-900 dark:hover:text-white">Dokumentasi</a></li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="font-semibold">Legal</p>
            <ul className="mt-3 space-y-2 text-slate-500">
              <li><Link href="/terms" className="hover:text-slate-900 dark:hover:text-white">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <p className="border-t border-slate-100 py-5 text-center text-xs text-slate-400 dark:border-slate-800">
          © {new Date().getFullYear()} TestForge. MIT License.
        </p>
      </footer>
    </div>
  );
}
