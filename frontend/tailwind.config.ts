import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // PharmaSave AI Brand Colors
        'pharmacy-green': 'rgb(var(--color-pharmacy-green) / <alpha-value>)',
        'trust-blue': 'rgb(var(--color-trust-blue) / <alpha-value>)',
        'alert-orange': 'rgb(var(--color-alert-orange) / <alpha-value>)',
        'light-green': 'rgb(var(--color-light-green) / <alpha-value>)',
        'pale-blue': 'rgb(var(--color-pale-blue) / <alpha-value>)',
        'soft-white': 'rgb(var(--color-soft-white) / <alpha-value>)',
        'charcoal': 'rgb(var(--color-charcoal) / <alpha-value>)',
        'light-gray': 'rgb(var(--color-light-gray) / <alpha-value>)',
        'medium-gray': 'rgb(var(--color-medium-gray) / <alpha-value>)',
        'dark-gray': 'rgb(var(--color-dark-gray) / <alpha-value>)',
        // Better Dark Mode Colors (Neutral Slate)
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9', 
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#172033', // Custom darker shade
          900: '#0f172a',
          950: '#020617'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
