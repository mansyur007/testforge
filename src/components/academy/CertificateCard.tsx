import { AnvilMark } from "@/components/icons";
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
//
// **Light only, and pinned to the brand accent.** `.tf-certificate` in
// globals.css re-declares the light tokens on this subtree, the same move
// `.tf-print-doc` makes for paper (F-39, §7.6). A credential travels as a link
// and as a screenshot, and two readers comparing one serial must not be looking
// at two different documents — so the theme switch and the palette setting both
// stop at this card's edge. Nothing below hardcodes a colour: it all resolves
// from the token layer, which is now simply a *local* token layer.

export function formatCertificateDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** The issuer's mark. Not `<Logo>` — that one is a `Link` to the marketing
 *  home, and a certificate is a document rather than a piece of navigation. */
function IssuerMark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-accent shadow-[0_6px_20px_-8px_rgb(var(--tf-accent)/0.6)]">
        <AnvilMark className="h-6 w-6" />
      </span>
      <span className="font-display text-xl font-bold tracking-tight text-content-strong">
        Test<span className="text-accent-text">Forge</span>
      </span>
    </span>
  );
}

/** A hairline broken by a small rotated square, used once — between the body
 *  and the footer. It was originally used twice, above the heading as well;
 *  that one is gone, because the masthead already has the logo, the wordmark
 *  and a letterspaced label doing the separating, and a rule under all three
 *  was the ornament announcing an ornament. */
function Rule({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden>
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-accent-text/35 sm:w-24" />
      <span className="h-1.5 w-1.5 rotate-45 bg-accent-text/45" />
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-accent-text/35 sm:w-24" />
    </div>
  );
}

/** The seal. Deliberately *not* a signature or a coat of arms: this credential
 *  has no signatory and pretending otherwise is exactly what §7.4 is about. It
 *  is the issuer's mark in a ring, which claims only what the card already
 *  says — TestForge issued this. */
function Seal() {
  return (
    <span
      aria-hidden
      className="relative grid h-[4.5rem] w-[4.5rem] shrink-0 place-items-center rounded-full border border-accent-text/25 bg-surface"
    >
      <span className="absolute inset-[5px] rounded-full border border-dashed border-accent-text/25" />
      <AnvilMark
        className="h-7 w-7"
        ink="rgb(var(--tf-accent))"
        spark="rgb(var(--tf-accent) / 0.45)"
      />
    </span>
  );
}

/**
 * The card. `watermark` is set only by the sample — it is what stops a
 * screenshot of the preview from being passed off as a real credential, so it
 * is rendered *on* the card rather than beside it.
 *
 * `verifyUrl` is the whole trust model in one line: there is no signature to
 * check offline and no PDF to authenticate, so the only thing that makes this
 * document verifiable is that the URL resolves on this instance. Printing it
 * means a reader holding a screenshot knows where to go and what to type.
 */
export function CertificateCard({
  cert,
  watermark,
  verifyUrl,
  headingLevel = "h2",
}: {
  cert: PublicCertificate;
  watermark?: string;
  verifyUrl?: string;
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
      className="tf-certificate tf-certificate-frame tf-certificate-corners relative overflow-hidden rounded-2xl border border-hairline text-center shadow-sm"
    >
      {/* The head band. A document announces itself at the top edge. */}
      <div
        aria-hidden
        className="h-1.5 w-full bg-gradient-to-r from-accent-text/35 via-accent to-accent-text/35"
      />

      {watermark && (
        <span
          data-testid="certificate-sample-mark"
          className="absolute right-[-3.6rem] top-[0.9rem] w-[11rem] rotate-45 bg-accent py-1 text-center font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-accent-fg sm:right-[-3.25rem] sm:top-[1.6rem] sm:w-[12rem] sm:text-[10px] sm:tracking-[0.2em]"
        >
          {watermark}
        </span>
      )}

      <div className="px-6 pb-8 pt-9 sm:px-12 sm:pb-11 sm:pt-11">
        <div className="flex justify-center">
          <IssuerMark />
        </div>
        <p className="mt-4 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-content-muted">
          QA Academy
        </p>

        <Heading className="mt-7 font-display text-[26px] font-bold tracking-tight text-content-strong sm:text-[32px]">
          {cert.heading}
        </Heading>

        <p className="mt-7 text-sm text-content-muted">This certifies that</p>
        <p
          data-testid="certificate-holder"
          className="mt-1.5 font-display text-[26px] font-bold tracking-tight text-content-strong sm:text-[34px]"
        >
          {cert.holderName}
        </p>
        {/* The name is the line a reader stops on, so it gets the one underline
            on the card — short, centred, and the width of the text rather than
            the column. */}
        <span
          aria-hidden
          className="mx-auto mt-2 block h-px w-24 bg-accent-text/40 sm:w-32"
        />

        <p className="mt-5 text-sm text-content-muted">
          {cert.kind === "EXAM" ? "passed the" : "completed the"}
        </p>
        <p
          data-testid="certificate-subject"
          className="mx-auto mt-1.5 max-w-[42ch] text-[17px] leading-snug text-content"
        >
          {cert.subject}
        </p>

        {cert.scorePct !== null && (
          <p
            data-testid="certificate-score"
            className="mt-5 inline-flex items-baseline gap-1.5 rounded-full border border-accent-text/25 bg-accent-soft px-4 py-1.5 text-sm font-semibold text-accent-soft-fg"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent-text/80">
              Best passing score
            </span>
            {cert.scorePct}%
          </p>
        )}

        <Rule className="mt-8" />

        <div className="mt-7 flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-10">
          <Seal />
          <dl className="flex flex-col items-center gap-4 text-sm sm:flex-row sm:gap-10">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-content-muted">
                First earned
              </dt>
              <dd className="mt-1 text-content-strong">
                {formatCertificateDate(cert.issuedAt)}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-content-muted">
                Serial
              </dt>
              <dd
                data-testid="certificate-serial"
                className="mt-1 rounded-md border border-hairline bg-surface-muted px-2.5 py-1 font-mono text-[13px] text-content-strong"
              >
                {cert.serial}
              </dd>
            </div>
          </dl>
        </div>

        {verifyUrl && (
          <p
            data-testid="certificate-verify"
            className="mt-7 break-all font-mono text-[10px] leading-relaxed text-content-subtle"
          >
            {/* Scheme stripped for the line to read as an address rather than
                a link — nothing here is clickable, and a reader typing it back
                in does not type `https://` either. */}
            Verify at {verifyUrl.replace(/^https?:\/\//, "")}
          </p>
        )}
      </div>
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
 *
 * Outside `.tf-certificate` on purpose: this is the page talking *about* the
 * document, so it belongs to the page's theme rather than to the paper.
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
