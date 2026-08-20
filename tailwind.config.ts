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
          500: "#2563eb",
          400: "#3b82f6",
          300: "#93c5fd",
        },
        hueso: "#f5f8fc",
        grafito: "#1e293b",
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
