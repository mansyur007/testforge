import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Logo } from "@/components/icons";
import { ISTQB_DISCLAIMER } from "@/content/academy";
import { getPublicCertificate } from "@/lib/academy/certificates";
import { NOINDEX, absoluteUrl } from "@/lib/seo";

// A-07: the public face of a certificate. No session — the serial is the
// credential, exactly as the L-01 badge token and the F-17 share link are
// (80 bits of HMAC output, so there is nothing to enumerate).
//
// Dynamic by construction: a DB read on a per-request param. Nothing here is
// cached, because a holder who hides a certificate expects the link to stop
// working now rather than at the end of a revalidation window.
export const dynamic = "force-dynamic";

/**
 * `NOINDEX`, and deliberately *not* added to robots.txt's disallow list.
 *
 * The two do different jobs and only one of them is safe here. The meta tag
 * keeps a page carrying somebody's name out of search results, which is the
 * privacy default a credential page should have — distribution is the holder's
 * to control, and they already control it by choosing who gets the link. A
 * robots.txt entry would go further and tell every well-behaved fetcher not to
 * request the URL at all, which is what LinkedIn, Slack and WhatsApp do before
 * rendering a link preview — so it would break the share card this page exists
 * to produce. See `/share/` in src/app/robots.ts for the other case, where
 * killing the preview is the point.
 */
export async function generateMetadata({
  params,
}: {
  params: { serial: string };
}): Promise<Metadata> {
  const cert = await getPublicCertificate(params.serial);
  if (!cert) return { title: "Certificate — TestForge QA Academy", robots: NOINDEX };

  const title = `${cert.holderName} — ${cert.heading}`;
  const description =
    cert.scorePct !== null
      ? `${cert.subject} · ${cert.scorePct}% · TestForge QA Academy`
      : `${cert.subject} · TestForge QA Academy`;
  return {
    title: `${title} — TestForge QA Academy`,
    description,
    robots: NOINDEX,
    openGraph: {
      type: "website",
      siteName: "TestForge",
      url: absoluteUrl(`/academy/certificate/${cert.serial}`),
      title,
      description,
    },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function CertificatePage({
  params,
}: {
  params: { serial: string };
}) {
  // A hidden certificate resolves to `null` and lands here — the same 404 an
  // invented serial gets. That is the intended behaviour, not an oversight:
  // "withdrawn by its holder" is precisely the sentence someone withdrawing a
  // link does not want published. See `setCertificateHidden`.
  const cert = await getPublicCertificate(params.serial);
  if (!cert) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <Logo size="sm" />
        <Link href="/academy" className="text-sm text-accent-text hover:underline">
          QA Academy
        </Link>
      </div>

      <article
        data-testid="certificate-card"
        className="rounded-2xl border border-hairline bg-surface p-8 text-center shadow-sm sm:p-12"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-content-muted">
          TestForge QA Academy
        </p>
        <h1 className="mt-2 text-2xl font-bold text-content-strong sm:text-3xl">
          {cert.heading}
        </h1>

        <p className="mt-8 text-sm text-content-muted">This certifies that</p>
        <p
          data-testid="certificate-holder"
          className="mt-1 text-2xl font-semibold text-content-strong sm:text-3xl"
        >
          {cert.holderName}
        </p>
        <p className="mt-4 text-sm text-content-muted">
          {cert.kind === "EXAM" ? "passed the" : "completed the"}
        </p>
        <p data-testid="certificate-subject" className="mt-1 text-lg text-content">
          {cert.subject}
        </p>

        {cert.scorePct !== null && (
          <p
            data-testid="certificate-score"
            className="mt-6 inline-flex rounded-full bg-accent-soft px-4 py-1.5 text-sm font-semibold text-accent-text"
          >
            Best passing score {cert.scorePct}%
          </p>
        )}

        <dl className="mt-8 flex flex-col items-center gap-3 border-t border-hairline pt-6 text-sm sm:flex-row sm:justify-center sm:gap-10">
          <div>
            <dt className="text-xs uppercase tracking-wide text-content-muted">
              First earned
            </dt>
            <dd className="mt-0.5 text-content-strong">{formatDate(cert.issuedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-content-muted">Serial</dt>
            <dd
              data-testid="certificate-serial"
              className="mt-0.5 font-mono text-content-strong"
            >
              {cert.serial}
            </dd>
          </div>
        </dl>
      </article>

      {/* §7.4: a certificate has to say what it is, on the certificate — not in
          a footnote a reader can miss. Two separate claims are being disclaimed
          here: that this is a professional qualification (it is not, for either
          kind), and that it has anything to do with the ISTQB (it does not,
          even for the exam). */}
      <section
        data-testid="certificate-disclaimer"
        className="mt-6 rounded-xl border border-hairline bg-surface-muted p-5 text-sm text-content-muted"
      >
        <p className="font-medium text-content">
          This is a record of practice on TestForge, not a professional
          certification.
        </p>
        <p className="mt-2">
          It confers no ISTQB® credential and no accredited qualification of any
          kind. Its only claim is that the holder did the work named above on
          this instance of TestForge, on the date shown.
        </p>
        {cert.kind === "EXAM" && (
          <p className="mt-3 text-xs leading-relaxed">{ISTQB_DISCLAIMER}</p>
        )}
      </section>

      <p className="mt-8 text-center text-sm text-content-muted">
        Want one?{" "}
        <Link href="/academy" className="text-accent-text hover:underline">
          Start a track
        </Link>{" "}
        — the whole Academy is free.
      </p>
    </main>
  );
}
