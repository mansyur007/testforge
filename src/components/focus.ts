// Indikator fokus bersama. Dipakai berdampingan dengan setiap `hover:` pada
// elemen fokusabel — ring 2px + offset memenuhi WCAG 2.4.11.
export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2";

// Varian untuk elemen di atas sidebar gelap (bg-sidebar).
export const FOCUS_RING_DARK =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar";

// Varian untuk field form — tanpa offset, ring menempel di border.
export const FOCUS_RING_FIELD =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring";
