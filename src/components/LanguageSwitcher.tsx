"use client";

import { useRouter } from "next/navigation";
// `@/lib/lang`, not `@/lib/i18n`: this is a client component, and the latter
// would pull the whole landing/auth dictionary into the bundle for a cookie
// name. See the header of src/lib/lang.ts.
import { setLangCookie, type Lang } from "@/lib/lang";

// Pilihan bahasa via cookie agar SSR (tanpa flash). Default: English.
export function LanguageSwitcher({ current }: { current: Lang }) {
  const router = useRouter();

  const setLang = (lang: Lang) => {
    if (lang === current) return;
    setLangCookie(lang);
    router.refresh();
  };

  return (
    <div
      className="flex items-center overflow-hidden rounded-lg border border-hairline text-xs font-medium"
      role="group"
      aria-label="Language"
    >
      {(["en", "id"] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => setLang(lang)}
          aria-pressed={current === lang}
          className={`px-2.5 py-1.5 uppercase ${
            current === lang
              ? "bg-accent text-white"
              : "text-content-muted hover:bg-surface-muted"
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
