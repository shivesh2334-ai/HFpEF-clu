import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#101A24",
        slate: {
          950: "#0B1420",
        },
        pathway: {
          bg: "#F3F6F5",
          panel: "#FFFFFF",
          line: "#D8E2E0",
          teal: "#0E5E5A",
          tealDeep: "#0A4744",
          tealSoft: "#E4F1EF",
          amber: "#B4762A",
          amberSoft: "#FBF0DF",
          crimson: "#9A2F3D",
          crimsonSoft: "#F8E7E9",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
