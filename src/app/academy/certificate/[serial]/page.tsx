import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Logo } from "@/components/icons";
import {
  CertificateCard,
  CertificateDisclaimer,
} from "@/components/academy/CertificateCard";
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

      <CertificateCard cert={cert} headingLevel="h1" />

      {/* The §7.4 disclaimer travels with the card in `CertificateCard`, for
          the reason given there: it is part of what the certificate says, not
          part of what this page says about it. */}
      <CertificateDisclaimer kind={cert.kind} istqbDisclaimer={ISTQB_DISCLAIMER} />

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
