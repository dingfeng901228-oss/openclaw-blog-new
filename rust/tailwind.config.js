/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    // The Rust generator's templates (class names live in string literals).
    './src/**/*.rs',
    // The original Next.js components, for any shared utility classes.
    // The generator lives inside the blog repository, so the components
    // are one level up from here.
    '../src/**/*.{js,ts,jsx,tsx,mdx}',
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
