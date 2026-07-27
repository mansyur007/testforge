"use client";

import { useRouter } from "next/navigation";
import { LANG_COOKIE, type Lang } from "@/lib/i18n";

// Pilihan bahasa via cookie agar SSR (tanpa flash). Default: English.
export function LanguageSwitcher({ current }: { current: Lang }) {
  const router = useRouter();

  const setLang = (lang: Lang) => {
    if (lang === current) return;
    document.cookie = `${LANG_COOKIE}=${lang};path=/;max-age=31536000;samesite=lax`;
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
