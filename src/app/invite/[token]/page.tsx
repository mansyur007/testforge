import Link from "next/link";
import { Logo } from "@/components/icons";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { AcceptInvite } from "@/components/AcceptInvite";
import { NOINDEX } from "@/lib/seo";

export const metadata = { title: "Team invitation — TestForge", robots: NOINDEX };

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: { token: string };
}) {
  const token = params.token;
  const inv = await db.invitation.findUnique({
    where: { token },
    include: { organization: true, invitedBy: true },
  });
  const session = await getSession();
  const next = encodeURIComponent(`/invite/${token}`);

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md text-center">
        <Logo size="lg" />
        <div className="mt-6 rounded-xl border border-hairline bg-surface p-8 shadow-sm">
          {children}
        </div>
      </div>
    </main>
  );

  if (!inv) {
    return (
      <Shell>
        <h1 className="text-xl font-bold">Invalid invitation</h1>
        <p className="mt-2 text-sm text-content-muted">
          This invitation link was not found or has expired.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-accent-text hover:underline"
        >
          Go to login →
        </Link>
      </Shell>
    );
  }

  const orgName = inv.organization?.name ?? "TestForge";

  if (inv.status === "ACCEPTED") {
    return (
      <Shell>
        <h1 className="text-xl font-bold">Invitation already accepted</h1>
        <p className="mt-2 text-sm text-content-muted">
          This invitation to <span className="font-medium">{orgName}</span> has
          already been accepted.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block text-sm font-medium text-accent-text hover:underline"
        >
          Go to dashboard →
        </Link>
      </Shell>
    );
  }

  if (!session) {
    return (
      <Shell>
        <h1 className="text-xl font-bold">You&apos;re invited to {orgName}</h1>
        <p className="mt-2 text-sm text-content-muted">
          {inv.invitedBy?.name ?? "Someone"} invited{" "}
          <span className="font-medium">{inv.email}</span>. Log in or sign up
          with that email to accept the invitation.
        </p>
        <div className="mt-5 space-y-2">
          <Link
            href={`/login?next=${next}`}
            className="block w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-hover"
          >
            Log in
          </Link>
          <Link
            href={`/signup?next=${next}`}
            className="block w-full rounded-lg border border-hairline-strong px-4 py-2.5 font-medium text-content hover:bg-canvas"
          >
            Sign up
          </Link>
        </div>
      </Shell>
    );
  }

  if (inv.email.toLowerCase() !== session.email.toLowerCase()) {
    return (
      <Shell>
        <h1 className="text-xl font-bold">Email mismatch</h1>
        <p className="mt-2 text-sm text-content-muted">
          This invitation is for <span className="font-medium">{inv.email}</span>,
          but you&apos;re signed in as{" "}
          <span className="font-medium">{session.email}</span>. Log out and sign in
          with the invited email.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-xl font-bold">Join {orgName}</h1>
      <p className="mb-5 mt-2 text-sm text-content-muted">
        {inv.invitedBy?.name ?? "Someone"} invited you as{" "}
        <span className="font-medium">{inv.role}</span>.
      </p>
      <AcceptInvite token={token} />
    </Shell>
  );
}
