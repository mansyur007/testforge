import type { PublicCertificate } from "@/lib/academy/types";

// A-07: the certificate itself, as one presentational component.
//
// Extracted from `/academy/certificate/[serial]/page.tsx` so the sample shown
// on the roadmap can be the *same* component rather than a copy of it. That is
// the whole point of the extraction: a preview that has drifted from the real
// certificate is worse than no preview at all, because it makes a promise the
// product then breaks. One component means the two cannot disagree.
//
// Not a client component and not translated, both on purpose. The card carries
// the credential's own wording — §7.4 fixes what it must say — and it reads the
// same on `/id/academy` because that is the document an Indonesian learner will
// actually receive. Everything *around* the specimen is translated; the
// specimen is not.

export function formatCertificateDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * The card. `watermark` is set only by the sample — it is what stops a
 * screenshot of the preview from being passed off as a real credential, so it
 * is rendered *on* the card rather than beside it.
 */
export function CertificateCard({
  cert,
  watermark,
  headingLevel = "h2",
}: {
  cert: PublicCertificate;
  watermark?: string;
  /** `h1` on the certificate's own page, where the heading *is* the page's
   *  subject; `h2` wherever the card is embedded in a page about something
   *  else, so the roadmap keeps exactly one `h1`. */
  headingLevel?: "h1" | "h2";
}) {
  const Heading = headingLevel;
  return (
    <article
      data-testid="certificate-card"
      data-sample={watermark ? "true" : undefined}
      className="relative overflow-hidden rounded-2xl border border-hairline bg-surface p-8 text-center shadow-sm sm:p-12"
    >
      {watermark && (
        <span
          data-testid="certificate-sample-mark"
          className="absolute right-[-3.6rem] top-[0.9rem] w-[11rem] rotate-45 bg-accent-soft py-1 text-center font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-accent-soft-fg sm:right-[-3.25rem] sm:top-[1.6rem] sm:w-[12rem] sm:text-[10px] sm:tracking-[0.2em]"
        >
          {watermark}
        </span>
      )}

      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-content-muted">
        TestForge QA Academy
      </p>
      <Heading className="mt-2 text-2xl font-bold text-content-strong sm:text-3xl">
        {cert.heading}
      </Heading>

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
          <dd className="mt-0.5 text-content-strong">
            {formatCertificateDate(cert.issuedAt)}
          </dd>
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
  );
}

/**
 * §7.4: a certificate has to say what it is, on the certificate — not in a
 * footnote a reader can miss. Two separate claims are being disclaimed here:
 * that this is a professional qualification (it is not, for either kind), and
 * that it has anything to do with the ISTQB (it does not, even for the exam).
 *
 * `istqbDisclaimer` arrives as a prop rather than as an import because
 * `@/content/academy` is `server-only` (the answer-key boundary, §2.2) and the
 * sample's wrapper is a client component. Same move `TrademarkNotice` explains.
 */
export function CertificateDisclaimer({
  kind,
  istqbDisclaimer,
  className = "mt-6",
}: {
  kind: string;
  istqbDisclaimer: string;
  className?: string;
}) {
  return (
    <section
      data-testid="certificate-disclaimer"
      className={`${className} rounded-xl border border-hairline bg-surface-muted p-5 text-sm text-content-muted`}
    >
      <p className="font-medium text-content">
        This is a record of practice on TestForge, not a professional
        certification.
      </p>
      <p className="mt-2">
        It confers no ISTQB® credential and no accredited qualification of any
        kind. Its only claim is that the holder did the work named above on this
        instance of TestForge, on the date shown.
      </p>
      {kind === "EXAM" && (
        <p className="mt-3 text-xs leading-relaxed">{istqbDisclaimer}</p>
      )}
    </section>
  );
}
