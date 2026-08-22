import { SettingsTabs } from "@/components/SettingsTabs";

// One nav for the six settings pages, which until now were only reachable as
// six separate sidebar entries. Collapsing them to a single "Settings" item
// means the pages need a way to reach each other, and this layout is it.
//
// No <h1> here on purpose: every page under /settings already has its own, and
// a layout-level heading would either duplicate it or demote it.
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <SettingsTabs />
      {children}
    </div>
  );
}
