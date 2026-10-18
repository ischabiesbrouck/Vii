import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// Deploy path: '/' by default; BASE_PATH=/Vii/ for GitHub Pages (project site).
const BASE = (process.env.BASE_PATH ?? '/').replace(/\/?$/, '/');

export default defineConfig(({ mode }) => ({
  // `vite build --mode artifact`: self-contained preview with relative asset paths.
  base: mode === 'artifact' ? './' : BASE,
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rollupOptions: {
      output: {
        // Stable vendor chunks: better long-term caching across content/app updates.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', 'lucide-react'],
          search: ['minisearch', 'dexie'],
          i18n: ['i18next', 'react-i18next', 'zustand'],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Concilium',
        short_name: 'Concilium',
        description: 'Vaticanum II in context — de 16 conciliedocumenten, met paragraafnummers.',
        lang: 'nl-NL',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#7A1F1F',
        background_color: '#FAF8F3',
        icons: [
          { src: `${BASE}icons/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: `${BASE}icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: `${BASE}icons/icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the entire app shell, fonts and ALL content JSON.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json,webmanifest}'],
        // Only Latin / Latin-ext font subsets are ever needed for NL, EN and LA text.
        globIgnores: ['**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-wght-*.woff2'],
        navigateFallback: `${BASE}index.html`,
        navigateFallbackDenylist: [new RegExp(`^${BASE}content/`)],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // No runtimeCaching: nothing external is ever fetched at runtime.
      },
      devOptions: { enabled: false },
      disable: mode === 'artifact',
    }),
  ],
}));
