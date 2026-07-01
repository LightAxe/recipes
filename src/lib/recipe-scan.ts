// Build-time only: a plain-Node frontmatter scan of the recipe files, used by
// astro.config.ts (where `astro:content` is unavailable) to compute which taxonomy
// pages are singletons and must be kept out of the sitemap. It mirrors the content
// loader's include/exclude and feeds the SAME `termIndex` the pages use, so the
// sitemap exclusion and the per-page `noindex` can never disagree.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { termIndex, singletonPaths, type RecipeFacets } from './taxonomy';

const RECIPES_DIR = new URL('../../recipes/', import.meta.url);

function frontmatter(src: string): Record<string, unknown> {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  return (parseYaml(m[1]) as Record<string, unknown>) ?? {};
}

/** RecipeFacets for every recipe file (top-level `*.md`, excluding TEMPLATE.md — the
 *  same rule as the glob loader in content.config.ts). */
export function scanRecipeFacets(): RecipeFacets[] {
  const dir = fileURLToPath(RECIPES_DIR);
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== 'TEMPLATE.md')
    .map((f) => {
      const fm = frontmatter(readFileSync(`${dir}${f}`, 'utf8'));
      return {
        course: String(fm.course ?? ''),
        tags: Array.isArray(fm.tags) ? (fm.tags as unknown[]).map(String) : undefined,
        cuisine: fm.cuisine != null ? String(fm.cuisine) : undefined,
        contributor: fm.contributor != null ? String(fm.contributor) : undefined,
      };
    });
}

/** Canonical absolute URLs (trailing slash) of every single-recipe taxonomy page —
 *  the exact shape `@astrojs/sitemap` hands to its `filter`. */
export function singletonTaxonomyUrls(site: string): Set<string> {
  const idx = termIndex(scanRecipeFacets(), (r) => r);
  return new Set(singletonPaths(idx).map((p) => new URL(p, site).href));
}
