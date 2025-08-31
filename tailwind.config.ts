import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        gold: {
          DEFAULT: "#D4AF37",
          light: "#E6C757",
          dark: "#B89830",
        },
        burgundy: {
          DEFAULT: "#722F37",
          light: "#8B3A42",
          dark: "#5A252B",
        },
        speakeasy: {
          green: "#2E5F45",
          charcoal: "#1A1A1A",
          cream: "#F5F5DC",
        },
      },
      fontFamily: {
        'art-deco': ['var(--font-poiret)', 'cursive'],
        'bebas': ['var(--font-bebas)', 'sans-serif'],
        'playfair': ['var(--font-playfair)', 'serif'],
        'crimson': ['var(--font-crimson)', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;