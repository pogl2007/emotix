import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#080808",
        surface: "#111111",
        surface2: "#1a1a1a",
        surface3: "#222222",
        line: "#2a2a2a",
        lineAccent: "#dc2626",
        text: "#f5f5f5",
        muted: "#a1a1aa",
        dim: "#52525b",
        accent: "#dc2626",
        accentHover: "#ef4444",
        accentSubtle: "#1c0a0a",
        ok: "#22c55e",
        warn: "#f59e0b",
        emotion: {
          angry: "#dc2626",
          disgust: "#84cc16",
          fear: "#8b5cf6",
          happy: "#22c55e",
          neutral: "#94a3b8",
          sad: "#3b82f6",
          surprise: "#f59e0b",
        },
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        base: "14px",
      },
      boxShadow: {
        glow: "0 0 24px rgba(220, 38, 38, 0.15)",
        glowStrong: "0 0 40px rgba(220, 38, 38, 0.28)",
      },
      transitionDuration: {
        DEFAULT: "150ms",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-8%)", opacity: "0" },
          "12%": { opacity: "1" },
          "88%": { opacity: "1" },
          "100%": { transform: "translateY(100%)", opacity: "0" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 rgba(220, 38, 38, 0)" },
          "50%": { boxShadow: "0 0 28px rgba(220, 38, 38, 0.35)" },
        },
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        heroIn: {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        scan: "scan 2.4s ease-in-out infinite",
        pulseGlow: "pulseGlow 2s ease-in-out infinite",
        blink: "blink 1s step-end infinite",
        heroIn: "heroIn 600ms ease-out 150ms both",
      },
    },
  },
  plugins: [],
};

export default config;
