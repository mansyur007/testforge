"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ensureSynced } from "@/lib/academy/progress";

// A-05: `/academy/me` is a server component that reads `LessonProgress`
// straight from the DB — it has no reason to know about `localStorage`. But
// that means it has no chance of showing a claim that hasn't landed yet
// either, and `AcademySync` in src/app/(app)/layout.tsx (mounted on every
// *other* authenticated page) is not guaranteed to have finished, or even
// started, by the time someone reaches this one: signing in redirects via
// Next's router rather than a hard navigation, so a user (or a test) who
// moves on quickly can outrun the dashboard's own claim before it fires.
//
// So this page ensures the sync itself and calls `router.refresh()` once it
// resolves — re-fetching this same page's server data without a full reload.
// If the claim already happened elsewhere, `ensureSynced()` still resolves
// (its own promise cache dedupes concurrent callers) and the refresh is a
// harmless no-op; if it hadn't, this is what actually completes it.
export function AcademyMeSync() {
  const router = useRouter();
  useEffect(() => {
    ensureSynced().then(() => router.refresh());
  }, [router]);
  return null;
}
