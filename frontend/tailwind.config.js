/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#0a0a0f',
          1: '#0f0f17',
          2: '#151520',
          3: '#1c1c2a',
          4: '#242435',
        },
        border: {
          DEFAULT: '#1e1e30',
          subtle: '#161625',
          focus: '#22c55e',
        },
        accent: {
          DEFAULT: '#22c55e',
          hover: '#4ade80',
          muted: '#22c55e15',
          dim: '#22c55e40',
        },
        terminal: {
          green: '#22c55e',
          cyan: '#06b6d4',
          yellow: '#eab308',
          red: '#ef4444',
          orange: '#f97316',
          blue: '#3b82f6',
          purple: '#a855f7',
          dim: '#4b5563',
        },
      },
      fontFamily: {
        sans: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
