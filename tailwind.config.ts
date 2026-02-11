import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', "monospace"],
      },
      colors: {
        mc: {
          dirt: "#8B6914",
          grass: "#5D8C00",
          stone: "#7F7F7F",
          sky: "#87CEEB",
          gold: "#FFD700",
          diamond: "#00CED1",
          emerald: "#50C878",
          redstone: "#FF0000",
          wood: "#BA8C63",
        },
      },
      keyframes: {
        "bounce-in": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "50%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        sparkle: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.5)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-6px)" },
          "40%": { transform: "translateX(6px)" },
          "60%": { transform: "translateX(-4px)" },
          "80%": { transform: "translateX(4px)" },
        },
        "roll-up": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "40%": { transform: "translateY(-80%)", opacity: "0" },
          "60%": { transform: "translateY(80%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "roll-down": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "40%": { transform: "translateY(80%)", opacity: "0" },
          "60%": { transform: "translateY(-80%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "carry-fly": {
          "0%": { transform: "translateX(0) scale(1)", opacity: "1" },
          "50%": { transform: "translateX(-60px) scale(1.3)", opacity: "1" },
          "100%": { transform: "translateX(-120px) scale(0.5)", opacity: "0" },
        },
        "borrow-fly": {
          "0%": { transform: "translateX(0) scale(1)", opacity: "1" },
          "50%": { transform: "translateX(60px) scale(1.3)", opacity: "1" },
          "100%": { transform: "translateX(120px) scale(0.5)", opacity: "0" },
        },
        "pop-in": {
          "0%": { transform: "scale(0)" },
          "70%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
        "gather-dots": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(0.5)", opacity: "0.7" },
          "100%": { transform: "scale(0)", opacity: "0" },
        },
        "scatter-dots": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "50%": { transform: "scale(0.5)", opacity: "0.7" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "bounce-in": "bounce-in 0.5s ease-out",
        sparkle: "sparkle 1s ease-in-out infinite",
        "slide-up": "slide-up 0.3s ease-out",
        float: "float 3s ease-in-out infinite",
        shake: "shake 0.4s ease-out",
        "roll-up": "roll-up 0.35s ease-in-out",
        "roll-down": "roll-down 0.35s ease-in-out",
        "carry-fly": "carry-fly 0.6s ease-in-out forwards",
        "borrow-fly": "borrow-fly 0.6s ease-in-out forwards",
        "pop-in": "pop-in 0.3s ease-out",
        "gather-dots": "gather-dots 0.4s ease-in forwards",
        "scatter-dots": "scatter-dots 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
