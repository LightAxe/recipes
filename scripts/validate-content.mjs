// Content lint for recipes/ (Zod is pass/fail and can't warn).
// HARD-FAILS on unrecognized ingredient units (would break the scaler);
// WARNS on off-list cuisines and single-use tags (possible typos/near-dupes).
// Keep the unit list in sync with src/lib/units.ts SYNONYMS.
import { readdirSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';

const RECIPES_DIR = 'recipes';

// Mirror of src/lib/units.ts SYNONYMS keys (canonical-resolvable unit strings).
const KNOWN_UNITS = new Set([
  'tsp',
  't',
  'teaspoon',
  'teaspoons',
  'tbsp',
  'tbs',
  'tablespoon',
  'tablespoons',
  'floz',
  'fl oz',
  'fluid ounce',
  'fluid ounces',
  'cup',
  'cups',
  'c',
  'pint',
  'pints',
  'pt',
  'quart',
  'quarts',
  'qt',
  'gallon',
  'gallons',
  'gal',
  'ml',
  'milliliter',
  'milliliters',
  'millilitre',
  'millilitres',
  'l',
  'liter',
  'liters',
  'litre',
  'litres',
  'oz',
  'ounce',
  'ounces',
  'lb',
  'lbs',
  'pound',
  'pounds',
  'g',
  'gram',
  'grams',
  'gramme',
  'grammes',
  'kg',
  'kilogram',
  'kilograms',
]);

// Mirror of docs/taxonomy.md §2 starter cuisines (slugified for comparison).
const KNOWN_CUISINES = new Set(
  [
    'American',
    'Southern',
    'Cajun & Creole',
    'Tex-Mex',
    'Mexican',
    'Italian',
    'French',
    'German',
    'Scandinavian',
    'Jewish',
    'Greek & Mediterranean',
    'Chinese',
    'Japanese',
    'Indian',
    'Middle Eastern',
    'Caribbean',
  ].map((c) => c.toLowerCase()),
);

const files = readdirSync(RECIPES_DIR).filter((f) => f.endsWith('.md') && f !== 'TEMPLATE.md');
const errors = [];
const warnings = [];
const tagCounts = new Map();

for (const file of files) {
  const raw = readFileSync(`${RECIPES_DIR}/${file}`, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) {
    errors.push(`${file}: no frontmatter`);
    continue;
  }
  let data;
  try {
    data = parse(m[1]);
  } catch (e) {
    errors.push(`${file}: YAML parse error — ${e.message}`);
    continue;
  }

  for (const ing of data.ingredients ?? []) {
    if (
      ing.unit &&
      !KNOWN_UNITS.has(String(ing.unit).trim().toLowerCase().replace(/\.$/, ''))
    ) {
      errors.push(
        `${file}: unknown unit "${ing.unit}" on "${ing.item}" (add it to units.ts + this list, or fix it)`,
      );
    }
  }
  if (data.cuisine && !KNOWN_CUISINES.has(String(data.cuisine).toLowerCase())) {
    warnings.push(
      `${file}: cuisine "${data.cuisine}" not in the taxonomy starter list (ok if intentional)`,
    );
  }
  for (const tag of data.tags ?? []) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
}

for (const [tag, n] of tagCounts) {
  if (n === 1)
    warnings.push(
      `tag "${tag}" is used by only one recipe (check for typos / near-duplicates)`,
    );
}

for (const w of warnings) console.warn(`⚠️  ${w}`);
for (const e of errors) console.error(`❌ ${e}`);
console.log(
  `\nvalidate-content: ${files.length} recipe(s), ${errors.length} error(s), ${warnings.length} warning(s)`,
);
process.exit(errors.length ? 1 : 0);
