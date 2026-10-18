import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => ({
  // `vite build --mode artifact`: self-contained preview with relative asset paths.
  base: mode === 'artifact' ? './' : '/',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
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
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#7A1F1F',
        background_color: '#FAF8F3',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the entire app shell, fonts and ALL content JSON.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json,webmanifest}'],
        // Only Latin / Latin-ext font subsets are ever needed for NL, EN and LA text.
        globIgnores: ['**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-wght-*.woff2'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/content\//],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // No runtimeCaching: nothing external is ever fetched at runtime.
      },
      devOptions: { enabled: false },
      disable: mode === 'artifact',
    }),
  ],
}));
