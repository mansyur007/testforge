import { redirect } from "next/navigation";
import { Logo } from "@/components/icons";
import { readPending2fa } from "@/lib/auth";
import { TwoFactorLoginForm } from "@/components/TwoFactorLoginForm";

export const dynamic = "force-dynamic";

export default async function TwoFactorLoginPage() {
  // Reachable only mid-login: the password step set the tf_2fa pending token.
  const pending = await readPending2fa();
  if (!pending) redirect("/login");

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Logo size="lg" />
          <p className="mt-2 text-sm text-content-muted">Two-step verification</p>
        </div>
        <div className="rounded-xl border border-hairline bg-surface p-8 shadow-sm">
          <TwoFactorLoginForm />
        </div>
      </div>
    </main>
  );
}
