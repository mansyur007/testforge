import "server-only";
import { db } from "@/lib/db";
import { getBlueprint } from "@/content/academy/exams";
import { getTrack, publishedLessons } from "@/content/academy";
import type { MyCertificate, PublicCertificate } from "./types";
import {
  deriveSerial as deriveSerialCore,
  normalizeSerial as normalizeSerialCore,
} from "./certificates-core.mjs";

// A-07: certificates. `server-only` for the same reason as the rest of this
// directory — it imports the exam blueprints and the track registry, both of
// which are themselves server-only (§2.2).
//
// A certificate is a *record*, not a document: there is no PDF, no signature to
// verify offline, and nothing to trust in a screenshot. What makes it checkable
// is that the serial resolves on this instance, which is why the whole design
// reduces to "the URL is the credential" — the same shape as the F-17 share
// links and the L-01 badge tokens already in this codebase.
//
// Serial derivation itself lives in `certificates-core.mjs` so `prebuild` can
// unit-test it with no database and no Next runtime; this file is the DB layer
// over it. Same split as `exam-core.mjs` / `exam.ts`, and since the `.mjs` half
// carries no types of its own, the casts below pin the two shapes rather than
// letting them degrade to `any` — identical reasoning to the cast at the top of
// `exam.ts`.

export const CERTIFICATE_KINDS = ["TRACK", "EXAM"] as const;
export type CertificateKind = (typeof CERTIFICATE_KINDS)[number];

/**
 * Which exams are worth a certificate. Deliberately only the full paper: a
 * chapter quiz is 8 untimed questions drawn from one chapter, and minting six
 * more certificates per learner for those would say nothing an attempt history
 * doesn't already say — while making the one that means something harder to
 * pick out (§7.4: "certificates say what they are").
 */
const CERTIFIABLE_EXAM_SLUGS = ["ctfl-v4-full"];

/**
 * The serial's whole security property is that `AUTH_SECRET` is secret: the
 * other three inputs (kind, refSlug, and the derivation itself) are public
 * source, and userIds are not secrets either. Falling back to the shared dev
 * default in production would therefore make every serial on the instance
 * derivable by anyone who can read this repository — so production refuses.
 *
 * Resolved per call rather than at module load on purpose. `next build`
 * imports this module, and a build box legitimately has no `AUTH_SECRET`;
 * throwing at import time would turn a runtime misconfiguration into a broken
 * build. Nothing derives a serial at build time, so the check lands exactly
 * where the secret is actually about to be used. (Audit OBS-2.)
 */
function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production")
    throw new Error(
      "AUTH_SECRET is not set. Certificate serials derive from it, and the " +
        "dev fallback is public — refusing to issue or resolve a certificate."
    );
  return "testforge-dev-secret";
}

const deriveSerialFn = deriveSerialCore as (input: {
  secret: string;
  userId: string;
  kind: CertificateKind;
  refSlug: string;
}) => string;

/** The serial for one achievement — see `certificates-core.mjs` for why it is
 *  derived rather than random, and what the 80 bits are actually protecting. */
export function deriveSerial(input: {
  userId: string;
  kind: CertificateKind;
  refSlug: string;
}): string {
  return deriveSerialFn({ secret: secret(), ...input });
}

export const normalizeSerial = normalizeSerialCore as (raw: string) => string;

export type IssuedCertificate = {
  id: string;
  kind: CertificateKind;
  refSlug: string;
  serial: string;
  scorePct: number | null;
  issuedAt: Date;
  revokedAt: Date | null;
};

/**
 * Issue (or return the existing) certificate for one achievement.
 *
 * `scorePct` is the *best* passing score, not the score of whichever attempt
 * happened to be first: a learner who scrapes a pass and then retakes at 90%
 * would otherwise be stuck showing the 68% forever, and there is nothing
 * dishonest about a record that says "their best passing score is 90%".
 * `issuedAt` never moves, so "first earned" and "best so far" are two separate
 * true statements rather than one averaged-out half-truth.
 *
 * A revoked certificate is left exactly as it is — see `setCertificateHidden`
 * for why re-earning must not quietly republish a link its holder took down.
 */
async function issueCertificate(input: {
  userId: string;
  kind: CertificateKind;
  refSlug: string;
  scorePct?: number | null;
}): Promise<IssuedCertificate> {
  const { userId, kind, refSlug } = input;
  const scorePct = input.scorePct ?? null;
  const where = { userId_kind_refSlug: { userId, kind, refSlug } };

  const existing = await db.certificate.findUnique({ where });
  if (existing) {
    if (!existing.revokedAt && scorePct !== null && (existing.scorePct ?? -1) < scorePct) {
      return (await db.certificate.update({
        where: { id: existing.id },
        data: { scorePct },
      })) as IssuedCertificate;
    }
    return existing as IssuedCertificate;
  }

  try {
    return (await db.certificate.create({
      data: { userId, kind, refSlug, serial: deriveSerial({ userId, kind, refSlug }), scorePct },
    })) as IssuedCertificate;
  } catch {
    // Two tabs finishing the same track at once, or an exam auto-submit racing
    // a manual one (A-10c) — the constraint is doing its job, so read back the
    // row that won rather than reporting a failure the learner can't act on.
    const raced = await db.certificate.findUnique({ where });
    if (!raced) throw new Error("Certificate could not be issued.");
    return raced as IssuedCertificate;
  }
}

/**
 * Called from `submitExamAction` on every graded, persisted attempt. Returns
 * `null` for anything that doesn't earn one, so the caller has no rules of its
 * own to keep in sync.
 */
export async function issueExamCertificate(
  userId: string,
  templateSlug: string,
  graded: { passed: boolean; score: number; total: number },
): Promise<IssuedCertificate | null> {
  if (!graded.passed) return null;
  if (!CERTIFIABLE_EXAM_SLUGS.includes(templateSlug)) return null;
  if (graded.total <= 0) return null;

  return issueCertificate({
    userId,
    kind: "EXAM",
    refSlug: templateSlug,
    scorePct: Math.round((graded.score / graded.total) * 100),
  });
}

/**
 * Issue a track certificate if — and only if — every published lesson of the
 * track is done. Safe to call after any progress write; it is a read plus an
 * idempotent upsert, and returns `null` when the track isn't finished.
 *
 * Lesson rows are counted without filtering `status`, matching what
 * `/academy/me` calls complete. Nothing in the app ever writes `STARTED`, so
 * the two rules are identical today — and a certificate that disagreed with
 * the progress bar next to it would be the worse of the two bugs.
 */
export async function issueTrackCertificateIfComplete(
  userId: string,
  trackSlug: string,
): Promise<IssuedCertificate | null> {
  const track = getTrack(trackSlug);
  if (!track) return null;

  const lessons = publishedLessons(track);
  if (lessons.length === 0) return null;

  const done = await db.lessonProgress.count({
    where: { userId, lessonSlug: { in: lessons.map((l) => l.slug) } },
  });
  if (done < lessons.length) return null;

  return issueCertificate({ userId, kind: "TRACK", refSlug: trackSlug });
}

/** What a certificate is *for*, in the words §7.4 requires. Falls back to the
 *  slug for a track or blueprint that has since been renamed — a certificate
 *  outlives the content it was issued against, and a dead link in the registry
 *  must not take the whole page down with it. */
export function certificateSubject(kind: string, refSlug: string): {
  heading: string;
  subject: string;
} {
  if (kind === "EXAM") {
    const blueprint = getBlueprint(refSlug);
    return {
      heading: "Practice Exam Pass",
      subject: blueprint?.title ?? refSlug,
    };
  }
  const track = getTrack(refSlug);
  return {
    heading: "Track Completion",
    subject: track ? `${track.title} track` : refSlug,
  };
}

/**
 * The public page's only data source. A revoked certificate resolves to `null`
 * — see `setCertificateHidden`.
 *
 * Note what is *not* returned: no user id, no email, no attempt id, nothing
 * that would let a holder's other work be found from a link they shared. The
 * name is on it because that is the entire point of a credential; everything
 * else is the achievement.
 */
export async function getPublicCertificate(
  rawSerial: string,
): Promise<PublicCertificate | null> {
  const serial = normalizeSerial(rawSerial);
  const cert = await db.certificate.findUnique({
    where: { serial },
    select: {
      serial: true,
      kind: true,
      refSlug: true,
      scorePct: true,
      issuedAt: true,
      revokedAt: true,
      user: { select: { name: true } },
    },
  });
  if (!cert || cert.revokedAt) return null;

  const { heading, subject } = certificateSubject(cert.kind, cert.refSlug);
  return {
    serial: cert.serial,
    kind: cert.kind,
    refSlug: cert.refSlug,
    heading,
    subject,
    holderName: cert.user.name,
    scorePct: cert.scorePct,
    issuedAt: cert.issuedAt.toISOString(),
  };
}

/**
 * The live serial for one achievement, or `null` if it was never earned or its
 * link is currently off. Used by the exam result page to offer the certificate
 * next to the attempt that earned it.
 */
export async function findCertificateSerial(
  userId: string,
  kind: CertificateKind,
  refSlug: string,
): Promise<string | null> {
  const cert = await db.certificate.findUnique({
    where: { userId_kind_refSlug: { userId, kind, refSlug } },
    select: { serial: true, revokedAt: true },
  });
  return cert && !cert.revokedAt ? cert.serial : null;
}

/** Every certificate the viewer holds, revoked ones included — /academy/me is
 *  where they go to put one back. */
export async function listMyCertificates(
  userId: string,
  holderName: string,
): Promise<MyCertificate[]> {
  const rows = await db.certificate.findMany({
    where: { userId },
    orderBy: { issuedAt: "desc" },
  });
  return rows.map((c) => {
    const { heading, subject } = certificateSubject(c.kind, c.refSlug);
    return {
      serial: c.serial,
      kind: c.kind,
      refSlug: c.refSlug,
      heading,
      subject,
      holderName,
      scorePct: c.scorePct,
      issuedAt: c.issuedAt.toISOString(),
      hidden: c.revokedAt !== null,
    };
  });
}

/**
 * Take a certificate's public page down, or put it back. Scoped to the caller's
 * own rows — `updateMany` with `userId` in the filter is the tenant guard, so a
 * serial belonging to someone else matches nothing rather than erroring in a
 * way that would confirm it exists.
 *
 * A hidden certificate 404s rather than rendering "revoked", because in this
 * work order the switch belongs to the holder and "withdrawn by its holder" is
 * exactly the sentence someone withdrawing a link does not want published. An
 * *administrative* revocation means the opposite thing — a reader who follows a
 * stale link deserves to be told the credential was pulled — so it needs its
 * own reason field and its own page state, not this boolean read backwards.
 */
export async function setCertificateHidden(
  userId: string,
  rawSerial: string,
  hidden: boolean,
): Promise<boolean> {
  const serial = normalizeSerial(rawSerial);
  const { count } = await db.certificate.updateMany({
    where: { userId, serial },
    data: { revokedAt: hidden ? new Date() : null },
  });
  return count > 0;
}
