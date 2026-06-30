import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
// Tailwind v4 is wired via PostCSS (postcss.config.mjs), not @tailwindcss/vite —
// the Vite plugin is incompatible with the rolldown-based Vite that Astro 6 bundles.
export default defineConfig({
  // Real domain (ADR). Pages stay noindex until launch via the SITE_LIVE gate
  // (src/lib/site.ts); sitemap files generate but are only advertised in robots.txt
  // when SITE_LIVE=true.
  site: 'https://recipes.axpr.net',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap()],
});
