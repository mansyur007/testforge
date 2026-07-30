import { Logo } from "@/components/icons";
import { NOINDEX } from "@/lib/seo";

// F-36 Part B: the one page the service worker precaches. Shown when a
// navigation fails offline. No data fetching (must render with zero network)
// and reassurance-first copy — anything the tester recorded is safe in the
// Part C queue and syncs automatically once they're back in range.
export const metadata = { title: "Offline — TestForge", robots: NOINDEX };

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas px-6 text-center">
      <Logo href="/dashboard" size="lg" />
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-content-strong">
          You&apos;re offline
        </h1>
        <p className="max-w-sm text-sm text-content-muted">
          Anything you recorded is queued and will sync automatically as soon as
          you&apos;re back online.
        </p>
      </div>
      <a
        href="/dashboard"
        className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
      >
        Try again
      </a>
    </div>
  );
}
