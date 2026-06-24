import Link from "next/link";

export const metadata = { title: "Terms of Service — TestForge" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">
        ← Back to home
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Terms of Service</h1>
      <div className="mt-6 space-y-4 text-sm text-slate-600">
        <p>
          TestForge is open source software licensed under MIT. By using this
          service, you agree that the software is provided &ldquo;as is&rdquo;
          without warranty of any kind.
        </p>
        <p>
          You are responsible for the data you store and the security of your
          account credentials. Do not use the service for illegal activity.
        </p>
        <p className="text-slate-400">
          This document is an MVP placeholder — complete it with legal review
          before public launch.
        </p>
      </div>
    </main>
  );
}
