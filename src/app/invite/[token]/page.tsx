import Link from "next/link";
import { Logo } from "@/components/icons";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { AcceptInvite } from "@/components/AcceptInvite";

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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <Logo size="lg" />
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          {children}
        </div>
      </div>
    </main>
  );

  if (!inv) {
    return (
      <Shell>
        <h1 className="text-xl font-bold">Undangan tidak valid</h1>
        <p className="mt-2 text-sm text-slate-500">
          Link undangan tidak ditemukan atau sudah kedaluwarsa.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
        >
          Ke halaman masuk →
        </Link>
      </Shell>
    );
  }

  const orgName = inv.organization?.name ?? "TestForge";

  if (inv.status === "ACCEPTED") {
    return (
      <Shell>
        <h1 className="text-xl font-bold">Undangan sudah diterima</h1>
        <p className="mt-2 text-sm text-slate-500">
          Undangan ke <span className="font-medium">{orgName}</span> ini sudah
          pernah diterima.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
        >
          Ke dashboard →
        </Link>
      </Shell>
    );
  }

  if (!session) {
    return (
      <Shell>
        <h1 className="text-xl font-bold">Kamu diundang ke {orgName}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {inv.invitedBy?.name ?? "Seseorang"} mengundang{" "}
          <span className="font-medium">{inv.email}</span>. Masuk atau daftar
          dengan email tersebut untuk menerima undangan.
        </p>
        <div className="mt-5 space-y-2">
          <Link
            href={`/login?next=${next}`}
            className="block w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700"
          >
            Masuk
          </Link>
          <Link
            href={`/signup?next=${next}`}
            className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Daftar
          </Link>
        </div>
      </Shell>
    );
  }

  if (inv.email.toLowerCase() !== session.email.toLowerCase()) {
    return (
      <Shell>
        <h1 className="text-xl font-bold">Email tidak cocok</h1>
        <p className="mt-2 text-sm text-slate-500">
          Undangan ini untuk <span className="font-medium">{inv.email}</span>,
          tapi kamu masuk sebagai{" "}
          <span className="font-medium">{session.email}</span>. Keluar lalu masuk
          dengan email yang diundang.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-xl font-bold">Bergabung ke {orgName}</h1>
      <p className="mb-5 mt-2 text-sm text-slate-500">
        {inv.invitedBy?.name ?? "Seseorang"} mengundangmu sebagai{" "}
        <span className="font-medium">{inv.role}</span>.
      </p>
      <AcceptInvite token={token} />
    </Shell>
  );
}
