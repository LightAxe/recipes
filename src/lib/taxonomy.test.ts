import { describe, it, expect } from 'vitest';
import {
  slugify,
  termIndex,
  singletonPaths,
  COURSE_SLUGS,
  type RecipeFacets,
} from './taxonomy';

describe('slugify (docs/taxonomy.md §6)', () => {
  it('lowercases and kebabs plain words', () => {
    expect(slugify('American')).toBe('american');
    expect(slugify('Grandma Ruth')).toBe('grandma-ruth');
  });
  it('replaces & with "and" BEFORE stripping punctuation', () => {
    // The ordering bug: a naive strip-first yields "cajun-creole".
    expect(slugify('Cajun & Creole')).toBe('cajun-and-creole');
    expect(slugify('Café & Crème')).toBe('cafe-and-creme');
  });
  it('strips diacritics', () => {
    expect(slugify('Café')).toBe('cafe');
    expect(slugify('jalapeño')).toBe('jalapeno');
  });
  it('collapses separators and trims', () => {
    expect(slugify('  Tex - Mex  ')).toBe('tex-mex');
    expect(slugify('Sauces & Condiments')).toBe('sauces-and-condiments');
  });
});

const r = (f: Partial<RecipeFacets> & { course: string }): RecipeFacets => ({
  tags: [],
  ...f,
});

describe('termIndex', () => {
  it('groups recipes per axis, preserving order', () => {
    const idx = termIndex(
      [
        r({ course: 'dessert', tags: ['apple', 'pie'] }),
        r({ course: 'dessert', tags: ['apple'] }),
        r({ course: 'main', cuisine: 'Italian' }),
      ],
      (x) => x,
    );
    expect(idx.category.get('dessert')?.items.length).toBe(2);
    expect(idx.category.get('main')?.items.length).toBe(1);
    expect(idx.tag.get('apple')?.items.length).toBe(2);
    expect(idx.tag.get('pie')?.items.length).toBe(1);
    expect(idx.cuisine.get('italian')?.label).toBe('Italian');
  });

  it('flags single-recipe pages as singletons', () => {
    const idx = termIndex(
      [
        r({ course: 'dessert', tags: ['apple', 'chocolate'] }),
        r({ course: 'dessert', tags: ['apple'] }),
        r({ course: 'drink' }),
      ],
      (x) => x,
    );
    const singles = singletonPaths(idx);
    expect(singles).toContain('/category/drink/'); // 1 recipe
    expect(singles).toContain('/tag/chocolate/'); // 1 recipe
    expect(singles).not.toContain('/category/dessert/'); // 2 recipes
    expect(singles).not.toContain('/tag/apple/'); // 2 recipes
  });

  it('deduplicates a repeated value within one recipe (no double-count)', () => {
    // A single recipe listing the same tag twice must count once, so its card isn't
    // duplicated and a one-recipe tag stays a singleton (keeps its noindex/sitemap exclusion).
    const idx = termIndex([r({ course: 'dessert', tags: ['apple', 'apple'] })], (x) => x);
    expect(idx.tag.get('apple')?.items.length).toBe(1);
    expect(singletonPaths(idx)).toContain('/tag/apple/');
  });

  it('dedups distinct raws that slug identically within one recipe (no throw)', () => {
    // Two different labels on ONE recipe that slug the same map to a single page — dedup
    // (first raw wins), don't throw. The collision guard is only for DISTINCT recipes.
    const idx = termIndex([r({ course: 'dessert', tags: ['Apple', 'apple'] })], (x) => x);
    expect(idx.tag.get('apple')?.items.length).toBe(1);
    expect(singletonPaths(idx)).toContain('/tag/apple/');
  });

  it('throws on a within-axis slug collision', () => {
    expect(() =>
      termIndex(
        [r({ course: 'main', cuisine: 'Tex Mex' }), r({ course: 'main', cuisine: 'Tex-Mex' })],
        (x) => x,
      ),
    ).toThrow(/collision/i);
  });

  it('does NOT treat the same raw value as a collision', () => {
    expect(() =>
      termIndex(
        [r({ course: 'main', cuisine: 'Tex-Mex' }), r({ course: 'main', cuisine: 'Tex-Mex' })],
        (x) => x,
      ),
    ).not.toThrow();
  });
});

describe('COURSE_SLUGS', () => {
  it('is the single source for the content-schema enum', () => {
    expect(COURSE_SLUGS).toContain('dessert');
    expect(COURSE_SLUGS.length).toBe(13);
  });
});
