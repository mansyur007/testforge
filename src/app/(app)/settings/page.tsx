import { redirect } from "next/navigation";
import { DEFAULT_APP_SETTINGS_HREF } from "@/lib/app-settings-nav";

// `/settings` itself has nothing to show — the tab row in the layout is the
// index, and every section is a real page. Landing here (from the sidebar, a
// bookmark, or a trimmed URL) goes to the first tab rather than 404ing.
export default function SettingsIndexPage() {
  redirect(DEFAULT_APP_SETTINGS_HREF);
}
