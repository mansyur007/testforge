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
        <h1 className="text-2xl font-bold">Akun</h1>
        <p className="text-sm text-slate-500">
          Informasi akun dan keamanan login kamu.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Profil</h2>
        <dl className="grid grid-cols-3 gap-y-3 text-sm">
          <dt className="text-slate-500">Nama</dt>
          <dd className="col-span-2 font-medium text-slate-800">{user.name}</dd>

          <dt className="text-slate-500">Email</dt>
          <dd className="col-span-2 flex items-center gap-2 font-medium text-slate-800">
            {user.email}
            {user.emailVerifiedAt ? (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Terverifikasi
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Belum verifikasi
              </span>
            )}
          </dd>

          <dt className="text-slate-500">Role</dt>
          <dd className="col-span-2 font-medium text-slate-800">{user.role}</dd>

          <dt className="text-slate-500">Metode login</dt>
          <dd className="col-span-2 font-medium text-slate-800">
            {hasPassword ? "Email & password" : "OAuth (Google/GitHub)"}
          </dd>
        </dl>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold">
            {hasPassword ? "Ganti password" : "Set password"}
          </h2>
          <p className="text-sm text-slate-500">
            {hasPassword
              ? "Masukkan password lama lalu password baru."
              : "Akunmu login lewat OAuth dan belum punya password. Buat password agar bisa login dengan email juga."}
          </p>
        </div>
        <ChangePasswordForm mode={hasPassword ? "change" : "set"} />
      </section>
    </div>
  );
}
