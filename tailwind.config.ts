import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Iris greyscale palette
        paper: '#F7F4EE',
        paperLight: '#FAF8F3',
        paperDeep: '#EFEAE0',
        whisper: '#F2EFE8',
        ink: '#1A1A1A',
        inkSoft: '#2A2A2A',
        inkFaint: '#403C36',
        stone: '#8B8680',
        stoneLight: '#B5B0A8',
        stoneFaint: '#D8D3CB',
        hair: 'rgba(26,26,26,0.10)',
        hairSoft: 'rgba(26,26,26,0.06)',
        hairBold: 'rgba(26,26,26,0.18)',
        // The single chromatic tone
        discovery: '#1F4A3A',
        discoveryDeep: '#143E2E',
        discoveryLight: '#2C5949',
        // Quiet status only — never red
        pending: '#a8945a',
        // Aliases the existing code uses
        cream: '#F7F4EE',
        sand: '#EFEAE0',
        sandlight: '#F2EFE8',
        muted: '#8B8680',
        mist: 'rgba(26,26,26,0.10)',
        gold: '#a8945a',
      },
      fontFamily: {
        serif: ['"EB Garamond"', '"Iowan Old Style"', 'Garamond', 'serif'],
        sans: ['"Inter"', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SF Mono', 'monospace'],
      },
      letterSpacing: {
        smallcaps: '0.18em',
        smallcapsWide: '0.30em',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'iris-glide': {
          '0%': { opacity: '0', transform: 'translateY(-24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'cursor-blink': {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.45s ease-out',
        'iris-glide': 'iris-glide 480ms cubic-bezier(.2,.7,.3,1)',
        shimmer: 'shimmer 2s linear infinite',
        'cursor-blink': 'cursor-blink 1s steps(2) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
