import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import type { Plugin } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// Deploy path: '/' by default; BASE_PATH=/Vii/ for GitHub Pages (project site).
const BASE = (process.env.BASE_PATH ?? '/').replace(/\/?$/, '/');

/**
 * Preload the Latin subsets of the four typefaces. Without this the fonts are found
 * only after the CSS has been parsed, and text reflows when they arrive (layout shift).
 */
function preloadFonts(): Plugin {
  let base = '/';
  return {
    name: 'concilium:preload-fonts',
    configResolved(c) {
      base = c.base;
    },
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        if (!ctx.bundle) return [];
        return Object.keys(ctx.bundle)
          .filter((f) => /\/(eb-garamond|source-serif-4|inter|cinzel)-latin-wght-normal-[\w-]+\.woff2$/.test(f))
          .map((f) => ({ tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: base + f, crossorigin: '' }, injectTo: 'head' as const }));
      },
    },
  };
}

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
    preloadFonts(),
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
        // Installed, the app fills the whole screen (no status or navigation bar on Android);
        // where fullscreen is not supported (iOS) the browser falls back to standalone.
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone'],
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
        // Precache the app shell, fonts, ALL content JSON and the 640 px copies of the images.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,woff2,json,webmanifest}'],
        // Only Latin / Latin-ext font subsets are ever needed for NL, EN and LA text.
        // Full-size images are cached when first shown (below); offline, Photo falls back to 640 px.
        globIgnores: ['**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-wght-*.woff2', 'images/*.jpg'],
        navigateFallback: `${BASE}index.html`,
        navigateFallbackDenylist: [new RegExp(`^${BASE}content/`)],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Same-origin only: full-size photographs, kept once they have been viewed.
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && /\/images\/[^/]+\.jpg$/.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'concilium-images', expiration: { maxEntries: 120 } },
          },
        ],
      },
      devOptions: { enabled: false },
      disable: mode === 'artifact',
    }),
  ],
}));
