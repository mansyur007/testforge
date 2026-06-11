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
      className="flex items-center overflow-hidden rounded-lg border border-slate-200 text-xs font-medium dark:border-slate-700"
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
              ? "bg-indigo-600 text-white"
              : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
