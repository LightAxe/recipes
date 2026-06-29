import { defineConfig } from 'astro/config';

// https://astro.build/config
// Tailwind v4 is wired via PostCSS (postcss.config.mjs), not @tailwindcss/vite —
// the Vite plugin is incompatible with the rolldown-based Vite that Astro 6 bundles.
export default defineConfig({
  // IA requires stable, trailing-slash URLs (docs/information-architecture.md §3).
  trailingSlash: 'always',
  build: { format: 'directory' },
  // `site` is intentionally unset in Phase 1 (non-public scaffolding, noindex) — it
  // gets configured at launch when a domain exists (ADR-0004 / ADR-0006).
});
