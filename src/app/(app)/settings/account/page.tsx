import { db } from "@/lib/db";
import { requireSession, hasUsablePassword } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

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
    },
  });
  const hasPassword = hasUsablePassword(user.passwordHash);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-sm text-slate-500">
          Your account information and login security.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <dl className="grid grid-cols-3 gap-y-3 text-sm">
          <dt className="text-slate-500">Name</dt>
          <dd className="col-span-2 font-medium text-slate-800">{user.name}</dd>

          <dt className="text-slate-500">Email</dt>
          <dd className="col-span-2 flex items-center gap-2 font-medium text-slate-800">
            {user.email}
            {user.emailVerifiedAt ? (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Verified
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Not verified
              </span>
            )}
          </dd>

          <dt className="text-slate-500">Role</dt>
          <dd className="col-span-2 font-medium text-slate-800">{user.role}</dd>

          <dt className="text-slate-500">Login method</dt>
          <dd className="col-span-2 font-medium text-slate-800">
            {hasPassword ? "Email & password" : "OAuth (Google/GitHub)"}
          </dd>
        </dl>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold">
            {hasPassword ? "Change password" : "Set password"}
          </h2>
          <p className="text-sm text-slate-500">
            {hasPassword
              ? "Enter your current password, then a new one."
              : "Your account signs in via OAuth and has no password yet. Set one to also sign in with email."}
          </p>
        </div>
        <ChangePasswordForm mode={hasPassword ? "change" : "set"} />
      </section>
    </div>
  );
}
