import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta institucional: azul marino (autoridad) + dorado (sello/togas) + grafito
        marino: {
          950: "#0b1526",
          900: "#101f38",
          800: "#16294a",
          700: "#1f3a63",
          600: "#2c4f82",
        },
        dorado: {
          500: "#b8923f",
          400: "#c9a45c",
          300: "#dabd85",
        },
        hueso: "#f4f1ea",
        grafito: "#2a2a28",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
