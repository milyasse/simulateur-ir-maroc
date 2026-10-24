import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

// Chemin de base : "/<nom-du-depot>/" sur https://<utilisateur>.github.io/<nom-du-depot>/
// Défini par le workflow (BASE_PATH). En local : "/".
const base = process.env.BASE_PATH || '/';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };
let sha = (process.env.GITHUB_SHA || '').slice(0, 7);
if (!sha) {
  try { sha = execSync('git rev-parse --short HEAD').toString().trim(); } catch { sha = 'local'; }
}

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_SHA__: JSON.stringify(sha),
  },
  build: { target: 'es2020' },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Simulateur IR Maroc 2027–2031',
        short_name: 'Simulateur IR',
        description: "Impôt sur le revenu au Maroc : barème actuel et réforme 2027 → 2031 du PLF 2027.",
        lang: 'fr',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#082a52',
        theme_color: '#082a52',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
});
