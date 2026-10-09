import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0A0A0A',
          secondary: '#111111',
          tertiary: '#1A1A1A',
        },
        text: {
          primary: '#FAFAFA',
          secondary: '#A1A1A1',
          muted: '#6B6B6B',
        },
        accent: {
          DEFAULT: '#FFFFFF',
          blue: '#FFFFFF',
          cyan: '#FFFFFF',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.16)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans JP', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'monospace'],
        display: ['Inter', 'Noto Sans JP', 'sans-serif'],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
      },
    },
  },
  plugins: [],
}

export default config