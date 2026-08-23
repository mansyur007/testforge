import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { PaletteSwitcher } from "@/components/PaletteSwitcher";

// F-46. Appearance was a five-line section at the top of /settings/account —
// fine while the only choice was light/dark, wrong once there are seven
// palettes and a colour picker: it would have been the largest thing on a page
// about passwords and 2FA. It moves here whole, so the two axes of the same
// decision (how bright, which hue) sit next to each other.
//
// No requireSession(): the (app) route group layout already blocks anonymous
// visitors, and unlike its neighbours this page reads nothing from the
// database — the preference lives in cookies (see src/lib/theme.ts).
export const metadata = { title: "Appearance" };

export default function AppearancePage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Appearance</h1>
        <p className="text-sm text-content-muted">
          How TestForge looks on this device. Both settings apply immediately and are remembered
          in this browser — including when you are signed out.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-hairline bg-surface p-6">
        <div>
          <h2 className="text-lg font-semibold">Mode</h2>
          <p className="text-sm text-content-muted">
            Light, dark, or follow your device setting.
          </p>
        </div>
        <ThemeSwitcher size="md" />
      </section>

      <section className="space-y-4 rounded-xl border border-hairline bg-surface p-6">
        <div>
          <h2 className="text-lg font-semibold">Colour palette</h2>
          <p className="text-sm text-content-muted">
            The accent, the sidebar and the tint of every surface. Each palette has its own light
            and dark version, so this choice is independent of the mode above.
          </p>
        </div>
        <PaletteSwitcher />
      </section>
    </div>
  );
}
