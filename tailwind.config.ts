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
        primary: 'rgb(var(--primary) / <alpha-value>)',
        'primary-fg': 'rgb(var(--primary-fg) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Cinzel Variable"', '"Trajan Pro"', 'Georgia', 'serif'],
        title: ['"EB Garamond Variable"', '"EB Garamond"', 'Garamond', 'Georgia', 'serif'],
        serif: ['"Source Serif 4 Variable"', 'Georgia', 'serif'],
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
      },
      maxWidth: { prose: '68ch', page: '76rem' },
      // Near-square corners, as in printed and institutional layouts.
      borderRadius: { DEFAULT: '2px', sm: '2px', md: '3px', lg: '4px', xl: '4px', '2xl': '6px' },
      letterSpacing: { caps: '0.14em' },
      boxShadow: {
        card: '0 1px 2px rgb(var(--shadow) / 0.06)',
        lift: '0 8px 24px -12px rgb(var(--shadow) / 0.25)',
      },
      transitionTimingFunction: { out: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    },
  },
  plugins: [animate],
} satisfies Config;
