import type { Config } from "tailwindcss";

// Token dari "testforge design system" (brand-data.js / Icon System.html)
// Every colour resolves from the token block in globals.css (F-39). The
// channel-triplet + <alpha-value> form is what keeps `bg-surface/80` working.
const token = (name: string) => `rgb(var(--tf-${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        ink: "#1b1a22", // print + onColorOf() only — never themed
        canvas: token("canvas"),
        surface: {
          DEFAULT: token("surface"),
          muted: token("surface-muted"),
          raised: token("surface-raised"),
        },
        content: {
          DEFAULT: token("text"),
          strong: token("text-strong"),
          muted: token("text-muted"),
          subtle: token("text-subtle"),
        },
        hairline: {
          DEFAULT: token("border"),
          subtle: token("border-subtle"),
          strong: token("border-strong"),
        },
        accent: {
          DEFAULT: token("accent"),
          hover: token("accent-hover"),
          fg: token("accent-fg"),
          text: token("accent-text"),
          soft: token("accent-soft"),
          "soft-fg": token("accent-soft-fg"),
          ring: token("accent-ring"),
        },
        sidebar: {
          DEFAULT: token("sidebar"),
          fg: token("sidebar-fg"),
          hover: token("sidebar-hover"),
          border: token("sidebar-border"),
        },
        danger: { DEFAULT: token("danger"), soft: token("danger-soft"), "soft-fg": token("danger-soft-fg"), border: token("danger-border") },
        warning: { DEFAULT: token("warning"), soft: token("warning-soft"), "soft-fg": token("warning-soft-fg"), border: token("warning-border") },
        success: { DEFAULT: token("success"), soft: token("success-soft"), "soft-fg": token("success-soft-fg"), border: token("success-border") },
        info: { DEFAULT: token("info"), soft: token("info-soft"), "soft-fg": token("info-soft-fg"), border: token("info-border") },
      },
      // F-39: ring-offset must be the surface the element sits on, otherwise
      // every focus ring in dark mode is haloed in white. Setting the default
      // here means focus.ts and its call sites need no per-site change.
      ringOffsetColor: {
        DEFAULT: "rgb(var(--tf-surface))",
      },
      transitionTimingFunction: {
        // Kurva ease-out tegas untuk seluruh UI in-app. Mengencangkan §7.4.5
        // ("ease-out") — arah kurvanya sama, hanya lebih tegas dari keyword bawaan.
        "tf-out": "cubic-bezier(0.23, 1, 0.32, 1)",
        // Untuk elemen yang BERGERAK di layar (bukan masuk/keluar).
        "tf-in-out": "cubic-bezier(0.77, 0, 0.175, 1)",
        // Kurva drawer ala iOS — dipakai AppShell sidebar.
        "tf-drawer": "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      transitionDuration: {
        // §7.4.5 mengikat semua motion in-app ke 150–200 ms. Hanya dua nilai.
        fast: "150ms", // hover, warna, press feedback, dropdown
        panel: "200ms", // toast, modal, drawer, disclosure
      },
      keyframes: {
        // Entrance dropdown/popover. Origin ditentukan di call site.
        "tf-pop-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "tf-sheet-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "tf-fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "tf-pop-in": "tf-pop-in 150ms cubic-bezier(0.23, 1, 0.32, 1) both",
        "tf-sheet-up": "tf-sheet-up 200ms cubic-bezier(0.32, 0.72, 0, 1) both",
        "tf-fade-in": "tf-fade-in 200ms cubic-bezier(0.23, 1, 0.32, 1) both",
      },
    },
  },
  plugins: [],
};
export default config;
