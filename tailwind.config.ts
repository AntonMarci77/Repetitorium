import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        euba: {
          // Brand book EUBA 2026 paleta
          ink: "#1a3868",        // tmavomodrá (primárna)
          accent: "#00adbd",     // tyrkysová (CTA)
          orange: "#f26539",     // upozornenie
          green: "#28b065",      // úspech
          purple: "#803594",
          indigo: "#6a6eb3",
          red: "#e6251e",        // chyba
          gray: "#96999b",
          cream: "#f0eee9",      // svetlé pozadie
        },
      },
      fontFamily: {
        heading: ["var(--font-kanit)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Inter",
          "sans-serif",
        ],
      },
      keyframes: {
        in: { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: { in: "in 0.18s ease-out both" },
    },
  },
  plugins: [],
};
export default config;
