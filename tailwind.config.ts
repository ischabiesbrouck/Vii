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
        violet: 'rgb(var(--violet) / <alpha-value>)',
        'violet-fg': 'rgb(var(--violet-fg) / <alpha-value>)',
        rose: 'rgb(var(--rose) / <alpha-value>)',
        'rose-fg': 'rgb(var(--rose-fg) / <alpha-value>)',
        sage: 'rgb(var(--sage) / <alpha-value>)',
        'sage-fg': 'rgb(var(--sage-fg) / <alpha-value>)',
        sand: 'rgb(var(--sand) / <alpha-value>)',
        'sand-fg': 'rgb(var(--sand-fg) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Cinzel Variable"', '"Trajan Pro"', 'Georgia', 'serif'],
        serif: ['"Source Serif 4 Variable"', 'Georgia', 'serif'],
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
      },
      maxWidth: { prose: '68ch', page: '76rem' },
      // Soft, generous radii (cards 20–28 px, chips and buttons fully round).
      borderRadius: { DEFAULT: '0.5rem', md: '0.875rem', lg: '1.25rem', xl: '1.75rem', '2xl': '2rem' },
      letterSpacing: { caps: '0.14em' },
      boxShadow: {
        card: '0 1px 2px rgb(var(--shadow) / 0.04), 0 6px 20px -6px rgb(var(--shadow) / 0.10)',
        lift: '0 2px 6px rgb(var(--shadow) / 0.05), 0 18px 40px -10px rgb(var(--shadow) / 0.22)',
        float: '0 10px 30px -6px rgb(0 0 0 / 0.35), 0 2px 6px rgb(0 0 0 / 0.15)',
      },
      transitionTimingFunction: { out: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    },
  },
  plugins: [animate],
} satisfies Config;
