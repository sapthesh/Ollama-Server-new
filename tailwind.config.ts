import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        'neon-pulse': {
          '0%, 100%': { boxShadow: '0 0 15px rgba(34, 197, 94, 0.4)', opacity: '1' },
          '50%': { boxShadow: '0 0 25px rgba(34, 197, 94, 0.6)', opacity: '0.8' },
        }
      },
      animation: {
        'heartbeat-pulse': 'neon-pulse 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
} satisfies Config;
