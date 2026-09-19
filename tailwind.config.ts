import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          navy: '#1a2340',
          light: '#F8F9FA',
          dark: '#222222',
          gray: '#666666',
          lightgray: '#999999',
        },
        kpi: {
          purple: '#7c3aed',
          blue: '#2563eb',
          green: '#059669',
          orange: '#ea580c',
        },
        status: {
          active: '#2563eb',
          high: '#ef4444',
          medium: '#f59e0b',
          low: '#10b981',
          onhold: '#9ca3af',
        },
        brand: {
          baytide: '#14b8a6',
          bloom: '#ec4899',
          despachante: '#ea580c',
          masseur: '#a855f7',
          rankflow: '#3b82f6',
          tps: '#06b6d4',
          voxmation: '#0d9488',
        },
      },
      fontSize: {
        xs: '11px',
        sm: '12px',
        base: '14px',
        lg: '16px',
        xl: '18px',
        '2xl': '22px',
        '3xl': '24px',
        '4xl': '28px',
        '5xl': '48px',
      },
      spacing: {
        sidebar: '230px',
      },
    },
  },
  plugins: [],
}

export default config
