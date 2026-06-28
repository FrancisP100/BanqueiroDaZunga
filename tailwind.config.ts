import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"]
      },
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        bci: {
          magenta: "#e91e8c",
          dark: "#1a3a34",
          pink: "#e91e8c",
          pinkDark: "#c4166e",
          pinkSoft: "#fce8f3",
          blue: "#1a73e8",
          blueSoft: "#eef4fd",
          gold: "#c9974d",
          goldSoft: "#fbf5ea",
          navy: "#0c1830",
          navySoft: "#eef0f5",
          navy2: "#15244a",
          ink: "#0f172a",
          muted: "#64748b",
          line: "#e7e9f0",
          bg: "#f5f6fa"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        soft: "0 8px 32px rgba(12, 24, 48, 0.10)",
        card: "0 2px 14px rgba(12, 24, 48, 0.06)",
        pink: "0 10px 28px rgba(233, 30, 99, 0.24)"
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
