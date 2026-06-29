// Course slug → display label. Mirrors docs/taxonomy.md §1 (the 13 courses).
export const COURSE_LABELS: Record<string, string> = {
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
};

export function courseLabel(slug: string): string {
  return COURSE_LABELS[slug] ?? slug;
}
