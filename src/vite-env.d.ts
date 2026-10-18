/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_CONTENT_MODE?: 'excerpt' | 'full';
  readonly VITE_ARTIFACT?: '1';
}
