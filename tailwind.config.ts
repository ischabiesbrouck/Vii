import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        paper: 'rgb(var(--paper) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-fg': 'rgb(var(--ink-fg) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-fg': 'rgb(var(--accent-fg) / <alpha-value>)',
        gold: 'rgb(var(--gold) / <alpha-value>)',
        'gold-text': 'rgb(var(--gold-text) / <alpha-value>)',
        slate: 'rgb(var(--slate) / <alpha-value>)',
        ok: 'rgb(var(--ok) / <alpha-value>)',
        warn: 'rgb(var(--warn) / <alpha-value>)',
        bad: 'rgb(var(--bad) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Cinzel Variable"', '"Trajan Pro"', 'Georgia', 'serif'],
        serif: ['"Source Serif 4 Variable"', 'Georgia', 'serif'],
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
      },
      maxWidth: { prose: '68ch', page: '76rem' },
      borderRadius: { DEFAULT: '3px', md: '4px', lg: '6px' },
      letterSpacing: { caps: '0.14em' },
    },
  },
  plugins: [animate],
} satisfies Config;
