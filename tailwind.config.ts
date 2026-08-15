import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nightcap: {
          DEFAULT: "#1e1b24",
          card: "#2a2635",
          muted: "#9ca3af",
          accent: "#ff6b9d",
          pink: "#ff8c42",
          blue: "#4ecdc4",
          yellow: "#ffd93d",
          glow: "rgba(255, 107, 157, 0.4)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
