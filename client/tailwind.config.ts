import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"]
      },
      colors: {
        brand: {
          navy: "#0A1F44",
          blue: "#1E88E5",
          success: "#2ECC71",
          warning: "#FF9800"
        },
        app: {
          text: "#111827",
          muted: "#6B7280",
          card: "#FFFFFF",
          border: "#E5E7EB"
        }
      },
      boxShadow: {
        card: "0 1px 2px rgba(17, 24, 39, 0.08)",
        cardHover: "0 8px 20px rgba(17, 24, 39, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
