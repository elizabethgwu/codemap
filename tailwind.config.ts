import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          tertiary: "var(--bg-tertiary)",
        },
        fg: {
          primary: "var(--fg-primary)",
          secondary: "var(--fg-secondary)",
          muted: "var(--fg-muted)",
        },
        accent: {
          scope: "var(--accent-scope)",
          process: "var(--accent-process)",
          output: "var(--accent-output)",
          decision: "var(--accent-decision)",
        },
        border: {
          DEFAULT: "var(--border-color)",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "DM Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
