// Simple line-icons for the no-photo card treatment (#14), one per course. Inner SVG markup
// only (the <svg> wrapper — viewBox, stroke, aria-hidden — is supplied by the component).
// Consistent 24×24 grid, single stroke weight, no fills, so they read as one clean set on the
// Counter surface. Decorative: always rendered aria-hidden; the visible course label + title
// carry the meaning. Keyed by the course slugs in taxonomy.ts; `other` is the fallback.
import type { CourseSlug } from './taxonomy';

const ICONS: Record<CourseSlug, string> = {
  // coffee mug
  breakfast:
    '<path d="M4 8h12v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M16 9h2.5a2 2 0 0 1 0 4H16"/><path d="M8 2.5v2M12 2.5v2"/>',
  // bowl of dip + chip
  appetizer: '<path d="M3 12h12a6 6 0 0 1-12 0z"/><path d="M17 4l4 6h-8z"/>',
  // bowl + steam
  soup: '<path d="M4 11h14a7 7 0 0 1-14 0z"/><path d="M9 3c0 1.5 1 1.5 1 3M13 3c0 1.5 1 1.5 1 3"/>',
  // bowl + greens
  salad:
    '<path d="M3 12h16a8 8 0 0 1-16 0z"/><path d="M8 10c-1.5-1.5-1-4 1-4.5M13 10c0-2 2-3.5 4-2.5"/>',
  // fork + knife
  main: '<path d="M7 3v6a2 2 0 0 0 2 2v10M9 3v6M17 3c-1.5.5-2 2.5-2 4.5s.5 3.5 2 4v9.5"/>',
  // small plate
  side: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/>',
  // loaf
  bread:
    '<path d="M4 12a8 5 0 0 1 16 0v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M9 12v5M13 12v5"/>',
  // cupcake
  dessert:
    '<path d="M6 11h12l-1.5 7a1 1 0 0 1-1 1H8.5a1 1 0 0 1-1-1z"/><path d="M6.5 11a5.5 3 0 0 1 11 0"/><path d="M12 4.5v2.5"/>',
  // chocolate-chip cookie
  cookies:
    '<circle cx="12" cy="12" r="8"/><circle cx="9.5" cy="10" r=".8"/><circle cx="14" cy="9.5" r=".8"/><circle cx="13" cy="14" r=".8"/><circle cx="9.5" cy="14.5" r=".8"/>',
  // glass + straw
  drink:
    '<path d="M7 5h10l-1.2 13a1 1 0 0 1-1 .9H9.2a1 1 0 0 1-1-.9z"/><path d="M14 3l-2 7"/>',
  // bottle
  sauce:
    '<path d="M10 3h4v3l1 2.5V19a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V8.5L10 6z"/><path d="M9 12h6"/>',
  // mason jar
  canning:
    '<path d="M7 9h10v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z"/><path d="M8 9V6h8v3"/><path d="M8 6h8"/>',
  // plate + fork
  other: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8"/><path d="M9.5 8v3M14.5 8v3"/>',
};

/** Inner SVG markup for a course's icon (falls back to `other` for unknown slugs). */
export function courseIcon(slug: string): string {
  return ICONS[slug as CourseSlug] ?? ICONS.other;
}

export { ICONS as COURSE_ICONS };
