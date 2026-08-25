"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import {
  renameCertificateHolderAction,
  setCertificateVisibilityAction,
} from "@/app/actions/academy";
import type { MyCertificate } from "@/lib/academy/types";

/** Mirrors `HOLDER_NAME_MAX` in `@/lib/academy/certificates`, which is
 *  `server-only` and so cannot be imported here. The server re-checks it — this
 *  copy is the input's own `maxLength`, not the rule. */
const NAME_MAX = 70;

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
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(cert.holderName);
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

  function saveName(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await renameCertificateHolderAction(cert.serial, draftName);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Only leave the editor on success, so a rejected name stays in the box
      // for the holder to fix rather than vanishing with the error.
      setEditing(false);
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
          {/* The printed name, shown here because this is the only page where
              its owner can see what a reader of the link will see. */}
          <p className="mt-1 text-xs text-content-muted">
            Issued to{" "}
            <span
              data-testid={`me-certificate-holder-${cert.serial}`}
              className="font-medium text-content"
            >
              {cert.holderName}
            </span>
            {!editing && (
              <>
                {" · "}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setDraftName(cert.holderName);
                    setEditing(true);
                  }}
                  data-testid={`me-certificate-rename-${cert.serial}`}
                  className="text-accent-text hover:underline"
                >
                  Change name
                </button>
              </>
            )}
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

      {editing && (
        <form onSubmit={saveName} className="mt-3 flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`holder-${cert.serial}`}>
            Name on this certificate
          </label>
          {/* Full width on a phone, sharing the row with Save/Cancel only once
              there is room: at 375px the three-across layout left 177px for a
              field whose whole job is to show a name in full (F-43). */}
          <input
            id={`holder-${cert.serial}`}
            name="holderName"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            maxLength={NAME_MAX}
            autoFocus
            data-testid={`me-certificate-name-input-${cert.serial}`}
            className="w-full min-w-0 rounded-lg border border-hairline bg-canvas px-3 py-1.5 text-sm text-content-strong sm:w-auto sm:flex-1"
          />
          <button
            type="submit"
            disabled={pending}
            data-testid={`me-certificate-name-save-${cert.serial}`}
            className="rounded-lg border border-hairline bg-surface-muted px-3 py-1.5 text-xs font-medium text-content-strong hover:bg-surface disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setError(null);
            }}
            className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-medium text-content hover:bg-surface-muted"
          >
            Cancel
          </button>
          <p className="w-full text-xs text-content-muted">
            This is the name a reader sees. Changing it does not change the
            link — the serial stays the same, so anywhere you have already
            shared it keeps working.
          </p>
        </form>
      )}

      {error && (
        <p
          className="mt-2 text-xs text-danger-soft-fg"
          role="alert"
          data-testid={`me-certificate-error-${cert.serial}`}
        >
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
            back on whenever. The name printed on each one was taken from your
            account when you earned it and stays put after that, so renaming
            your account never rewrites a certificate you have already shared.
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
