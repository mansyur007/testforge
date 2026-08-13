"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { setCertificateVisibilityAction } from "@/app/actions/academy";
import type { MyCertificate } from "@/lib/academy/types";

// A-07: the holder's own view of their certificates, on /academy/me. Client,
// because hiding one is a toggle that should settle in place rather than
// navigate — the list is read on the server and passed in whole.

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function CertificateRow({ cert }: { cert: MyCertificate }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const path = `/academy/certificate/${cert.serial}`;

  function toggle() {
    setError(null);
    startTransition(async () => {
      const res = await setCertificateVisibilityAction(cert.serial, !cert.hidden);
      if (!res.ok) setError(res.error);
      // Refresh either way: the server list is the source of truth for what
      // this row should now say, and a failed toggle that left the row looking
      // switched would be worse than the failure itself.
      router.refresh();
    });
  }

  return (
    <li
      data-testid={`me-certificate-${cert.serial}`}
      className="rounded-lg border border-hairline bg-surface px-4 py-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-content-strong">
            {cert.heading} — {cert.subject}
          </p>
          <p className="text-xs text-content-muted">
            {formatDate(cert.issuedAt)}
            {cert.scorePct !== null && ` · ${cert.scorePct}%`} ·{" "}
            <span className="font-mono">{cert.serial}</span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {cert.hidden ? (
            <span
              data-testid={`me-certificate-hidden-${cert.serial}`}
              className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-content-muted"
            >
              Link off
            </span>
          ) : (
            <>
              <Link
                href={path}
                data-testid={`me-certificate-view-${cert.serial}`}
                className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-medium text-content hover:bg-surface-muted"
              >
                View
              </Link>
              <CopyLinkButton path={path} />
            </>
          )}
          <button
            type="button"
            onClick={toggle}
            disabled={pending}
            data-testid={`me-certificate-toggle-${cert.serial}`}
            className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-medium text-content hover:bg-surface-muted disabled:opacity-60"
          >
            {pending ? "Saving…" : cert.hidden ? "Turn link on" : "Turn link off"}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-danger-soft-fg" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}

export function CertificateList({ certificates }: { certificates: MyCertificate[] }) {
  return (
    <section className="mt-10" data-testid="me-certificates">
      <h2 className="text-lg font-semibold text-content-strong">Certificates</h2>

      {certificates.length === 0 ? (
        <p className="mt-2 text-sm text-content-muted">
          None yet — finish a track, or pass the{" "}
          <Link
            href="/academy/istqb/practice-exam"
            className="text-accent-text hover:underline"
          >
            full practice exam
          </Link>
          .
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-content-muted">
            Anyone with the link can read a certificate — there is no sign-in on
            it. Turning a link off makes it a 404 straight away; you can turn it
            back on whenever.
          </p>
          <ul className="mt-3 space-y-2">
            {certificates.map((c) => (
              <CertificateRow key={c.serial} cert={c} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
