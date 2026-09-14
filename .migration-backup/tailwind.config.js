/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: '#0f1117',
        surface: '#1e2130',
        's2': '#161824',
        's3': '#1a1d27',
        border: '#2d3147',
        'border-2': '#3d4260',
        accent: '#6366f1',
        'accent-2': '#4f46e5',
        dim: '#9ca3af',
        muted: '#6b7280',
        ok: '#4ade80',
        bad: '#f87171',
        warn: '#fbbf24',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
