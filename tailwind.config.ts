import type { Config } from "tailwindcss";

// Token dari "testforge design system" (brand-data.js / Icon System.html)
const config: Config = {
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
        ink: "#1b1a22",
        accent: {
          DEFAULT: "#4f46e5",
          tint: "#f3f2fd",
        },
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
