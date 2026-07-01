// The single source of truth for the four browse axes (category/tag/cuisine/from):
// course slugs+labels, slugification (docs/taxonomy.md §6), and the term index that
// groups recipes per axis — including the *singleton* set that drives noindex +
// sitemap exclusion. Pure module: no Astro/Node imports, so both content.config.ts
// (Zod enum) and astro.config.ts (sitemap filter, via a frontmatter scan) can use it.

// Course slug → display label. Mirrors docs/taxonomy.md §1 (the 13 courses), in nav order.
export const COURSE_LABELS = {
  breakfast: 'Breakfast & Brunch',
  appetizer: 'Appetizers & Snacks',
  soup: 'Soups & Stews',
  salad: 'Salads',
  main: 'Main Dishes',
  side: 'Side Dishes',
  bread: 'Breads & Rolls',
  dessert: 'Desserts',
  cookies: 'Cookies & Bars',
  drink: 'Drinks',
  sauce: 'Sauces & Condiments',
  canning: 'Canning & Preserves',
  other: 'Other',
} as const;

export type CourseSlug = keyof typeof COURSE_LABELS;

/** Ordered course slugs — the source of the Zod enum (content.config.ts) and the nav. */
export const COURSE_SLUGS = Object.keys(COURSE_LABELS) as [CourseSlug, ...CourseSlug[]];

export function courseLabel(slug: string): string {
  return (COURSE_LABELS as Record<string, string>)[slug] ?? slug;
}

/**
 * Slugify per docs/taxonomy.md §6. The `&` → ` and ` replacement happens **before**
 * punctuation stripping, so "Cajun & Creole" → "cajun-and-creole" (not "cajun-creole").
 */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Term index ──────────────────────────────────────────────────────────────

export type Axis = 'category' | 'tag' | 'cuisine' | 'from';
export const AXES: Axis[] = ['category', 'tag', 'cuisine', 'from'];

/** URL base + human label per axis (the non-linking breadcrumb segment uses the label). */
export const AXIS_META: Record<Axis, { base: string; label: string }> = {
  category: { base: '/category', label: 'Categories' },
  tag: { base: '/tag', label: 'Tags' },
  cuisine: { base: '/cuisine', label: 'Cuisines' },
  from: { base: '/from', label: 'Contributors' },
};

/** The minimal facet view of a recipe that the index needs — works for a full
 *  CollectionEntry (`entry.data`) and for a config-time frontmatter scan alike. */
export interface RecipeFacets {
  course: string;
  tags?: string[];
  cuisine?: string;
  contributor?: string;
}

export interface Term<T> {
  axis: Axis;
  slug: string;
  /** The display label (course label / raw tag / cuisine / contributor). */
  label: string;
  /** The original frontmatter value that produced the slug (for collision messages). */
  rawValue: string;
  items: T[];
}

/** The per-axis raw values a recipe contributes, with their display labels. */
function axisValues(f: RecipeFacets): Record<Axis, { raw: string; label: string }[]> {
  return {
    category: [{ raw: f.course, label: courseLabel(f.course) }],
    tag: (f.tags ?? []).map((t) => ({ raw: t, label: t })),
    cuisine: f.cuisine ? [{ raw: f.cuisine, label: f.cuisine }] : [],
    from: f.contributor ? [{ raw: f.contributor, label: f.contributor }] : [],
  };
}

/**
 * Group recipes per axis into slug → Term. **Throws** on a within-axis slug collision
 * (two distinct raw values producing the same slug — e.g. a tag/cuisine clash), so a
 * silent merge can never reach production. Order of `items` follows input order.
 */
export function termIndex<T>(
  recipes: T[],
  facets: (r: T) => RecipeFacets,
): Record<Axis, Map<string, Term<T>>> {
  const out: Record<Axis, Map<string, Term<T>>> = {
    category: new Map(),
    tag: new Map(),
    cuisine: new Map(),
    from: new Map(),
  };
  for (const r of recipes) {
    const values = axisValues(facets(r));
    for (const axis of AXES) {
      for (const { raw, label } of values[axis]) {
        const slug = slugify(raw);
        if (!slug) continue;
        const existing = out[axis].get(slug);
        if (existing) {
          if (existing.rawValue !== raw) {
            // Same slug, different source value → ambiguous /axis/<slug>/ page.
            throw new Error(
              `Taxonomy slug collision on /${axis}/${slug}/: ` +
                `"${existing.rawValue}" and "${raw}" slug identically. ` +
                `Disambiguate one of them (docs/taxonomy.md §6).`,
            );
          }
          existing.items.push(r);
        } else {
          out[axis].set(slug, { axis, slug, label, rawValue: raw, items: [r] });
        }
      }
    }
  }
  return out;
}

/** Every term path (e.g. "/category/dessert/") whose page has exactly one recipe. */
export function singletonPaths<T>(index: Record<Axis, Map<string, Term<T>>>): string[] {
  const paths: string[] = [];
  for (const axis of AXES) {
    for (const term of index[axis].values()) {
      if (term.items.length === 1) paths.push(`${AXIS_META[axis].base}/${term.slug}/`);
    }
  }
  return paths;
}
