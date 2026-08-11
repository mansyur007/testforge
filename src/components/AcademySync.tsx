"use client";

import { useEffect } from "react";
import { ensureSynced } from "@/lib/academy/progress";

// A-05: claim-at-signup. Mounted once in src/app/(app)/layout.tsx — every
// authenticated page, not just Academy's own — so the "finish two lessons
// signed out, sign up, and both are already ticked" acceptance criterion
// holds regardless of which page a fresh sign-up lands on first. Renders
// nothing; `ensureSynced()` is the same cached call Academy's own progress
// components (src/components/AcademyProgress.tsx) already make, so visiting
// an Academy page first or the dashboard first both do the same work once.
export function AcademySync() {
  useEffect(() => {
    ensureSynced();
  }, []);
  return null;
}
