import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Logo } from "@/components/icons";
import { NOINDEX } from "@/lib/seo";
import { SuperadminLoginForm } from "@/components/SuperadminLoginForm";
import { getSuperadminSession, superadminEnabled } from "@/lib/superadmin";

export const metadata: Metadata = {
  title: "Instance Console — TestForge",
  robots: NOINDEX,
};

export const dynamic = "force-dynamic";

export default async function SuperadminLoginPage() {
  // F-41: dormant instances must be indistinguishable from ones that never
  // shipped the feature — 404, not a login form.
  if (!superadminEnabled()) notFound();
  if (await getSuperadminSession()) redirect("/superadmin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Logo size="lg" />
          <p className="mt-2 text-sm text-content-muted">Instance console</p>
        </div>
        <SuperadminLoginForm />
        <p className="mt-6 text-center text-xs text-content-subtle">
          Operator access only. Ordinary accounts sign in at{" "}
          <a href="/login" className="text-accent-text hover:underline">
            /login
          </a>
          .
        </p>
      </div>
    </main>
  );
}
