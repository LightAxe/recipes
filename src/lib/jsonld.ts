// schema.org JSON-LD builders. Kept deliberately clean for Google Rich Results:
// recipeIngredient = plain ingredient text (no gram provenance); recipeInstructions =
// HowToStep text with no "Step N" prefixes; suitableForDiet only for accurate mappings.
import type { CollectionEntry } from 'astro:content';
import { courseLabel } from './taxonomy';
import { toFraction } from './units';
import { SITE_NAME, abs } from './site';

type Recipe = CollectionEntry<'recipes'>;
type Ingredient = Recipe['data']['ingredients'][number];

// Only mappings that are actually true structured data (no low-sugar→LowCalorie guess).
const DIET: Record<string, string> = {
  vegetarian: 'https://schema.org/VegetarianDiet',
  vegan: 'https://schema.org/VeganDiet',
  'gluten-free': 'https://schema.org/GlutenFreeDiet',
  'dairy-free': 'https://schema.org/LowLactoseDiet',
  kosher: 'https://schema.org/KosherDiet',
  halal: 'https://schema.org/HalalDiet',
};

/** Clean, as-authored ingredient line: "¾ cup granulated sugar, sifted" (no grams). */
function ingredientLine(i: Ingredient): string {
  const qty = i.qty != null ? toFraction(i.qty) : '';
  const amount = [qty, i.unit].filter(Boolean).join(' ');
  const head = [amount, i.item].filter(Boolean).join(' ');
  return i.prep ? `${head}, ${i.prep}` : head;
}

export function recipeJsonLd(recipe: Recipe, imageUrl?: string) {
  const d = recipe.data;
  const diets = (d.tags ?? []).map((t) => DIET[t]).filter(Boolean);

  const json: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: d.title,
    description: d.description,
    recipeCategory: courseLabel(d.course),
    recipeIngredient: d.ingredients.map(ingredientLine),
    recipeInstructions: d.instructions.map((s) => ({
      '@type': 'HowToStep',
      text: typeof s === 'string' ? s : s.text,
    })),
  };
  // contributor & servings are optional (many old cards carry neither).
  if (d.contributor) json.author = { '@type': 'Person', name: d.contributor };
  const recipeYield = d.yield ?? (d.servings ? `${d.servings} servings` : undefined);
  if (recipeYield) json.recipeYield = recipeYield;
  if (imageUrl) json.image = [imageUrl];
  if (d.datePublished) json.datePublished = d.datePublished.toISOString().slice(0, 10);
  if (d.cuisine) json.recipeCuisine = d.cuisine;
  if (d.tags?.length) json.keywords = d.tags.join(', ');
  if (d.prepTime) json.prepTime = d.prepTime;
  if (d.cookTime) json.cookTime = d.cookTime;
  if (d.totalTime) json.totalTime = d.totalTime;
  if (d.nutrition) json.nutrition = { '@type': 'NutritionInformation', ...d.nutrition };
  if (diets.length) json.suitableForDiet = diets.length === 1 ? diets[0] : diets;
  return json;
}

// Google requires `item` (a URL) on every non-last BreadcrumbList entry, so a URL-less
// segment (e.g. the non-linking axis label "Categories", which has no index page) is
// dropped from the structured data — the visible breadcrumb still shows it. Taxonomy
// pages thus emit a valid [Home, Term] list; recipe pages (all items linked) are unchanged.
export function breadcrumbJsonLd(items: { name: string; path?: string }[]) {
  const linked = items.filter((it) => it.path);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: linked.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: abs(it.path!),
    })),
  };
}

export function itemListJsonLd(recipes: Recipe[]) {
  return itemListJsonLdFrom(
    recipes.map((r) => ({ path: `/recipes/${r.id}/`, name: r.data.title })),
  );
}

/** Generic ItemList from {path,name} pairs — for non-recipe lists (e.g. the Tips hub). */
export function itemListJsonLdFrom(items: { path: string; name: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: abs(it.path),
      name: it.name,
    })),
  };
}

export function articleJsonLd(a: {
  headline: string;
  description: string;
  path: string;
  datePublished?: Date;
  dateModified?: Date;
}) {
  const json: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.headline,
    description: a.description,
    url: abs(a.path),
    mainEntityOfPage: abs(a.path),
  };
  if (a.datePublished) json.datePublished = a.datePublished.toISOString().slice(0, 10);
  if (a.dateModified) json.dateModified = a.dateModified.toISOString().slice(0, 10);
  return json;
}

export function aboutPageJsonLd(a: { name: string; description: string; path: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: a.name,
    description: a.description,
    url: abs(a.path),
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    // Trailing slash to match the home page's canonical (abs('/')).
    url: abs('/'),
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: abs('/search/?q={search_term_string}'),
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
