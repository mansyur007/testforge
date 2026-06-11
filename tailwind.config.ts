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
    },
  },
  plugins: [],
};
export default config;
