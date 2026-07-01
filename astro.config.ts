import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE } from './src/lib/site';
import { singletonTaxonomyUrls } from './src/lib/recipe-scan';

// https://astro.build/config
// Tailwind v4 is wired via PostCSS (postcss.config.mjs), not @tailwindcss/vite —
// the Vite plugin is incompatible with the rolldown-based Vite that Astro 6 bundles.

// Single-recipe taxonomy pages are noindex (see TaxonomyList.astro); keep them out of
// the sitemap too. `@astrojs/sitemap` passes full absolute URLs to `filter`, so the
// exclusion set is built as absolute URLs from the same termIndex the pages use.
const singletons = singletonTaxonomyUrls(SITE);
// The /search/ utility page is noindex; keep it out of the sitemap too.
const excluded = new Set([...singletons, new URL('/search/', SITE).href]);

export default defineConfig({
  // Real domain (ADR). Pages stay noindex until launch via the SITE_LIVE gate
  // (src/lib/site.ts); sitemap files generate but are only advertised in robots.txt
  // when SITE_LIVE=true.
  site: SITE,
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap({ filter: (url) => !excluded.has(url) })],
});
