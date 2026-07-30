import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { NOINDEX } from "@/lib/seo";

export const metadata = { title: "Get started — TestForge", robots: NOINDEX };

export const dynamic = "force-dynamic";

// PRD §12.4: wizard 3 langkah post-signup, semua bisa di-skip (AU-006).
// Guard: sekali onboarding selesai (onboardedAt terisi), halaman ini tidak bisa
// dibuka lagi — kelola tim lewat Settings → Team, bukan dengan mengulang wizard.
export default async function OnboardingPage() {
  const session = await requireSession();
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { onboardedAt: true },
  });
  if (user?.onboardedAt) redirect("/dashboard");
  return <OnboardingWizard userName={session.name} />;
}
