import Link from "next/link";

export const metadata = { title: "Privacy Policy — TestForge" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">
        ← Back to home
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Privacy Policy</h1>
      <div className="mt-6 space-y-4 text-sm text-slate-600">
        <p>
          Account data (name, email) is used only for authentication and
          team collaboration. Passwords are hashed with bcrypt and are never
          stored in plaintext.
        </p>
        <p>
          On self-hosted deployments, all data stays on your own server —
          no data is sent to third parties. Telemetry is opt-in and anonymous.
        </p>
        <p className="text-slate-400">
          This document is an MVP placeholder — complete it with legal review
          before public launch.
        </p>
      </div>
    </main>
  );
}
