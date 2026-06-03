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
          primary: '#0A0A0F',
          secondary: '#111118',
          tertiary: '#1a1a24',
        },
        text: {
          primary: '#E8E8EC',
          secondary: '#888899',
          muted: '#555566',
        },
        accent: {
          DEFAULT: '#3B82F6',
          blue: '#3B82F6',
          cyan: '#22D3EE',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.06)',
          hover: 'rgba(255, 255, 255, 0.14)',
        },
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        display: ['Noto Serif JP', 'Noto Sans JP', 'serif'],
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