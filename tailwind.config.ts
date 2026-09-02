import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        bg: '#16121F',
        panel: '#241B34',
        panel2: '#2E2244',
        line: 'rgba(247,243,234,0.10)',
        gold: '#F2B705',
        coral: '#FF4F5E',
        text: '#F7F3EA',
        muted: '#A79BC2'
      },
      fontFamily: {
        display: ['var(--font-anton)', 'sans-serif'],
        body: ['var(--font-noto)', 'sans-serif']
      },
      borderRadius: {
        card: '14px'
      }
    }
  },
  plugins: []
};

export default config;
