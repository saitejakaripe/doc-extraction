import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#EFE7D8",
        "paper-light": "#FAF6EC",
        ink: "#24302B",
        "ink-soft": "#4B5850",
        rule: "#C9BFA0",
        stamp: "#A13D2B",
        brass: "#8A7B4F",
        sage: "#5E6E52",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
