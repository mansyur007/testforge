"use client";

import { useEffect, useRef, useState } from "react";
import { FOCUS_RING } from "@/components/focus";
import {
  CertificateCard,
  CertificateDisclaimer,
} from "@/components/academy/CertificateCard";
import type { PublicCertificate } from "@/lib/academy/types";
import type { Lang } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/seo";

// The roadmap's "what do I get at the end" answer, shown rather than described.
//
// A specimen, not a record: every field below is a placeholder, the serial is
// spelled to be unmistakable, and the card carries a SAMPLE mark that survives
// a screenshot. Nothing here touches the database — a real certificate only
// exists once somebody has actually earned one, and this component must never
// be the thing that makes one look issued.
//
// Both kinds are offered because both exist and they are not interchangeable:
// a track certificate has no score and an exam pass does, which is exactly the
// difference a reader deciding what to aim for wants to see.

/**
 * Crockford's base32 — the alphabet `certificates-core.mjs` derives real
 * serials over. Copied rather than imported: that module opens with
 * `import crypto from "crypto"`, and this one runs in the browser.
 */
const SERIAL_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** The last group of a sample serial. Four symbols of `Math.random()` — which
 *  would be indefensible for a real serial and is exactly right for a fake one:
 *  the specimen should not look like a fixed asset somebody could quote back as
 *  *the* certificate id. The three groups before it stay hand-written. */
function randomTail(): string {
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += SERIAL_ALPHABET[Math.floor(Math.random() * SERIAL_ALPHABET.length)];
  }
  return out;
}

/**
 * Serials on a real certificate are 80 bits of HMAC over Crockford's base32
 * (see `certificates-core.mjs`). These two prefixes are hand-written inside
 * that same alphabet so they *look* like the real shape while reading as
 * English — `5AMP1E`, `TRAC`, `EXAM` — and the tail is drawn per opening.
 * Deliberately not `TF-0000-0000-0000-0000`, which the e2e suite uses as its
 * known-bad serial.
 */
const SAMPLES: Record<
  "TRACK" | "EXAM",
  Omit<PublicCertificate, "holderName" | "serial"> & { serialPrefix: string }
> = {
  TRACK: {
    serialPrefix: "TF-5AMP-1E00-TRAC-",
    kind: "TRACK",
    refSlug: "fundamentals",
    heading: "Track Completion",
    subject: "QA Fundamentals track",
    scorePct: null,
    // Fixed, never `new Date()`: a specimen dated today would quietly claim to
    // be a fresh issue, and a server-rendered "today" is a hydration mismatch
    // waiting to happen the moment the clock crosses midnight mid-render.
    issuedAt: "2026-03-14T00:00:00.000Z",
  },
  EXAM: {
    serialPrefix: "TF-5AMP-1E00-EXAM-",
    kind: "EXAM",
    refSlug: "ctfl-v4-full",
    heading: "Practice Exam Pass",
    subject: "Foundation Level Practice Exam (aligned to the CTFL v4.0 syllabus)",
    scorePct: 85,
    issuedAt: "2026-04-02T00:00:00.000Z",
  },
};

const copy = {
  en: {
    sectionTitle: "What you get at the end",
    blurb:
      "Finish a track, or pass the full practice exam, and the Academy issues a certificate with its own link — yours to share, or to switch off again.",
    open: "See a sample certificate",
    close: "Close",
    dialogLabel: "Sample certificate",
    watermark: "Sample",
    holder: "Your Name Here",
    tabTrack: "Track completion",
    tabExam: "Practice exam pass",
    note: "This is a specimen, not a credential. The name, date and serial are made up — a real one carries yours, and resolves at its own link.",
  },
  id: {
    sectionTitle: "Apa yang Anda dapat di akhir",
    blurb:
      "Selesaikan satu track, atau lulus ujian latihan lengkapnya, dan Academy menerbitkan sertifikat dengan tautannya sendiri — milik Anda untuk dibagikan, atau dimatikan lagi.",
    open: "Lihat contoh sertifikat",
    close: "Tutup",
    dialogLabel: "Contoh sertifikat",
    watermark: "Contoh",
    holder: "Nama Anda",
    tabTrack: "Penyelesaian track",
    tabExam: "Kelulusan ujian latihan",
    note: "Ini contoh, bukan kredensial. Nama, tanggal, dan nomor serinya karangan — yang sungguhan memuat nama Anda dan bisa dibuka di tautannya sendiri. Sertifikatnya sendiri berbahasa Inggris, seperti yang terlihat di sini.",
  },
} satisfies Record<Lang, Record<string, string>>;

export function SampleCertificate({
  lang,
  istqbDisclaimer,
}: {
  lang: Lang;
  /** `@/content/academy` is `server-only`, so the disclaimer is handed down
   *  from the server component rather than imported here. */
  istqbDisclaimer: string;
}) {
  const t = copy[lang];
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"TRACK" | "EXAM">("TRACK");
  // Drawn when the dialog is opened, one tail per kind. Doing it here rather
  // than at module scope is what keeps `Math.random()` out of the render path:
  // the dialog does not exist in the server-rendered markup, so there is no
  // server value for a client value to disagree with.
  const [tails, setTails] = useState({ TRACK: "", EXAM: "" });
  const openerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function openDialog() {
    setTails({ TRACK: randomTail(), EXAM: randomTail() });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    // Move focus into the dialog so a keyboard reader is not left tabbing the
    // roadmap behind it, and hand it back to the button on the way out. The
    // opener is read here rather than in the cleanup: by the time cleanup runs
    // the ref may already point somewhere else, and the button that was
    // clicked is the one focus belongs to.
    const opener = openerRef.current;
    panelRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [open]);

  const { serialPrefix, ...sample } = SAMPLES[kind];
  const cert: PublicCertificate = {
    ...sample,
    holderName: t.holder,
    serial: `${serialPrefix}${tails[kind]}`,
  };

  return (
    <section
      data-testid="academy-sample-certificate"
      className="mt-14 border-t border-hairline pt-6"
    >
      <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-content-muted">
        {t.sectionTitle}
      </h2>
      <p className="mt-4 max-w-[64ch] text-[15px] leading-relaxed text-content">
        {t.blurb}
      </p>
      <button
        ref={openerRef}
        type="button"
        onClick={openDialog}
        data-testid="academy-sample-certificate-open"
        className={`mt-4 inline-flex items-center gap-2 rounded-lg border border-hairline-strong px-4 py-2 text-sm font-medium text-content hover:bg-surface-muted ${FOCUS_RING}`}
      >
        <CertificateGlyph />
        {t.open}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 motion-safe:animate-tf-fade-in sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t.dialogLabel}
            tabIndex={-1}
            data-testid="academy-sample-certificate-modal"
            className="my-auto w-full max-w-2xl rounded-2xl bg-canvas p-4 shadow-2xl outline-none motion-safe:animate-tf-pop-in sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div
                role="tablist"
                aria-label={t.dialogLabel}
                className="flex gap-1 rounded-lg bg-surface-muted p-1"
              >
                {(["TRACK", "EXAM"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={kind === k}
                    onClick={() => setKind(k)}
                    data-testid={`academy-sample-certificate-tab-${k.toLowerCase()}`}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium ${FOCUS_RING} ${
                      kind === k
                        ? "bg-surface text-content-strong shadow-sm"
                        : "text-content-muted hover:text-content"
                    }`}
                  >
                    {k === "TRACK" ? t.tabTrack : t.tabExam}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.close}
                data-testid="academy-sample-certificate-close"
                className={`rounded-lg p-1.5 text-content-subtle hover:bg-surface-muted hover:text-content ${FOCUS_RING}`}
              >
                ✕
              </button>
            </div>

            {/* The specimen carries a real verify line too — a made-up serial
                on this instance's real host, which is what the reader will get.
                `absoluteUrl` reads `NEXT_PUBLIC_BASE_URL`, so it is inlined at
                build time and safe on the client. */}
            <CertificateCard
              cert={cert}
              watermark={t.watermark}
              verifyUrl={absoluteUrl(`/academy/certificate/${cert.serial}`)}
            />
            <CertificateDisclaimer
              kind={cert.kind}
              istqbDisclaimer={istqbDisclaimer}
              className="mt-4"
            />

            <p
              data-testid="academy-sample-certificate-note"
              lang={lang}
              className="mt-4 text-xs leading-relaxed text-content-subtle"
            >
              {t.note}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function CertificateGlyph() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="h-4 w-4 text-content-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* A medal, not a document: at 16px a sheet with a ribbon on it reads as
          a speech bubble, and this button has one job — to look like a prize. */}
      <circle cx="8" cy="6" r="4" />
      <path d="M5.5 9.4 4.4 14.2 8 12.4l3.6 1.8-1.1-4.8" />
    </svg>
  );
}
