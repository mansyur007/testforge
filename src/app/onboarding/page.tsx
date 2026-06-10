import { requireSession } from "@/lib/auth";
import { OnboardingWizard } from "@/components/OnboardingWizard";

export const dynamic = "force-dynamic";

// PRD §12.4: wizard 3 langkah post-signup, semua bisa di-skip (AU-006)
export default async function OnboardingPage() {
  const session = await requireSession();
  return <OnboardingWizard userName={session.name} />;
}
