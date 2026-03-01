import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#15803d", // rich green
          foreground: "#f9fafb"
        },
        accent: {
          DEFAULT: "#f97316"
        }
      }
    }
  },
  plugins: []
};

export default config;

