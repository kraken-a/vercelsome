import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/features/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    screens: {
      sm: '480px',
      md: '768px',
      lg: '1024px',
    },
    borderRadius: {
      none: '0',
      sm: '4px',
    },
    extend: {
      colors: {
        'vert-persan': '#0C524E',
        mint: '#BEECCC',
        creme: '#F6F5F0',
        beige: '#EEEDE7',
        'beige-fonce': '#696761',
        'bleu-promo': '#158AFF',
        'bleu-fonce': '#086DD3',
        'vert-neon': '#C1FD48',
        'jaune-pale': '#EDFFC1',
        noir: '#000000',
        swatch: {
          line: '#E0E0E0',
          satori: '#D4B896',
          vista: '#4A7C59',
          lys: '#C8AD7F',
        },
      },
      fontFamily: {
        body: ['Yet Grotesk', 'system-ui', 'sans-serif'],
        heading: ['Yet Grotesk', 'system-ui', 'sans-serif'],
        mono: ['PP Air Mono', 'monospace'],
      },
      transitionProperty: {
        premium: 'all',
      },
      transitionDuration: {
        premium: '500ms',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}

export default config
