"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TFIcon } from "@/components/icons";
import { APP_SETTINGS_NAV, activeAppSettings } from "@/lib/app-settings-nav";
import { FOCUS_RING } from "@/components/focus";

/**
 * The one nav for /settings/**, rendered by the settings layout above every
 * page's own heading.
 *
 * Deliberately the same underline treatment as `ProjectTabs` — a reader who
 * has learned "a row of underlined labels moves me between sections of this
 * thing" gets the same control here rather than a second idiom. It scrolls
 * horizontally below `sm` instead of wrapping, because wrapped tabs push
 * the page heading off a phone screen.
 */
export function SettingsTabs() {
  const pathname = usePathname();
  const active = activeAppSettings(pathname);

  return (
    <nav
      aria-label="Settings sections"
      data-testid="settings-tabs"
      className="-mx-4 mb-6 overflow-x-auto border-b border-hairline px-4 sm:mx-0 sm:px-0"
    >
      <div className="flex min-w-max gap-1">
        {APP_SETTINGS_NAV.map((item) => {
          const isActive = active?.href === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={`settings-tab-${item.href.split("/").pop()}`}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${FOCUS_RING} ${
                isActive
                  ? "border-accent text-accent-text"
                  : "border-transparent text-content-muted hover:text-content-strong"
              }`}
            >
              <TFIcon name={item.icon} current className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
