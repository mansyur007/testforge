import { db } from "@/lib/db";
import { requireSession, hasUsablePassword } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { TwoFactorSettings } from "@/components/TwoFactorSettings";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireSession();
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.userId },
    select: {
      name: true,
      email: true,
      role: true,
      emailVerifiedAt: true,
      passwordHash: true,
      totpEnabledAt: true,
    },
  });
  const hasPassword = hasUsablePassword(user.passwordHash);
  const twoFactorOn = !!user.totpEnabledAt;
  // Prompt a refresh when few unused recovery codes remain.
  const unusedRecovery = twoFactorOn
    ? await db.twoFactorRecoveryCode.count({
        where: { userId: session.userId, usedAt: null },
      })
    : 0;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-sm text-content-muted">
          Your account information and login security.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-hairline bg-surface p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <dl className="grid grid-cols-3 gap-y-3 text-sm">
          <dt className="text-content-muted">Name</dt>
          <dd className="col-span-2 font-medium text-content-strong">{user.name}</dd>

          <dt className="text-content-muted">Email</dt>
          <dd className="col-span-2 flex items-center gap-2 font-medium text-content-strong">
            {user.email}
            {user.emailVerifiedAt ? (
              <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success-soft-fg">
                Verified
              </span>
            ) : (
              <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning-soft-fg">
                Not verified
              </span>
            )}
          </dd>

          <dt className="text-content-muted">Role</dt>
          <dd className="col-span-2 font-medium text-content-strong">{user.role}</dd>

          <dt className="text-content-muted">Login method</dt>
          <dd className="col-span-2 font-medium text-content-strong">
            {hasPassword ? "Email & password" : "OAuth (Google/GitHub)"}
          </dd>
        </dl>
      </section>

      <section className="space-y-4 rounded-xl border border-hairline bg-surface p-6">
        <div>
          <h2 className="text-lg font-semibold">
            {hasPassword ? "Change password" : "Set password"}
          </h2>
          <p className="text-sm text-content-muted">
            {hasPassword
              ? "Enter your current password, then a new one."
              : "Your account signs in via OAuth and has no password yet. Set one to also sign in with email."}
          </p>
        </div>
        <ChangePasswordForm mode={hasPassword ? "change" : "set"} />
      </section>

      <section className="space-y-4 rounded-xl border border-hairline bg-surface p-6">
        <div>
          <h2 className="text-lg font-semibold">Two-factor authentication</h2>
          <p className="text-sm text-content-muted">
            Add a one-time code from an authenticator app as a second step at login.
          </p>
        </div>
        <TwoFactorSettings enabled={twoFactorOn} lowRecovery={twoFactorOn && unusedRecovery <= 2} />
      </section>
    </div>
  );
}
