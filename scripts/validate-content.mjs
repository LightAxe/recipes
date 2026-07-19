// Content lint for recipes/ (Zod is pass/fail and can't warn).
// HARD-FAILS on a unit that's a near-miss (edit distance ≤1) of a *convertible* unit —
//   almost certainly a typo (e.g. "cuo"→"cup") that would silently ship as opaque and
//   never scale or convert. WARNS on genuinely unknown units (shown verbatim) and on
//   off-list cuisines / single-use tags (possible typos/near-dupes).
// Keep the unit list in sync with src/lib/units.ts SYNONYMS.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { parse } from 'yaml';

const RECIPES_DIR = 'recipes';

// Convertible (scalable/inter-convertible) units — mirror of src/lib/units.ts SYNONYMS keys.
// A typo of one of these is dangerous (breaks scaling), so near-misses hard-fail.
const CONVERTIBLE_UNITS = new Set([
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

// Common non-convertible cooking units — displayed verbatim (opaque) by units.ts.
// Unknown units that aren't near-misses of a convertible unit are treated like these.
const OPAQUE_UNITS = new Set([
  'clove',
  'cloves',
  'can',
  'cans',
  'stick',
  'sticks',
  'pinch',
  'pinches',
  'dash',
  'dashes',
  'slice',
  'slices',
  'package',
  'packages',
  'pkg',
  'bunch',
  'bunches',
  'sprig',
  'sprigs',
  'stalk',
  'stalks',
  'ear',
  'ears',
  'head',
  'heads',
  'piece',
  'pieces',
  'drop',
  'drops',
  'handful',
  'scoop',
  'scoops',
  'jar',
  'jars',
  'bottle',
  'bottles',
  'box',
  'boxes',
  'bag',
  'bags',
  'sheet',
  'sheets',
  'strip',
  'strips',
  'fillet',
  'fillets',
  'rib',
  'ribs',
  'knob',
]);

const KNOWN_UNITS = new Set([...CONVERTIBLE_UNITS, ...OPAQUE_UNITS]);

// Levenshtein edit distance (≤ `max` early-exit not needed at this scale).
function editDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

// A unit is a "typo of a scalable unit" if it's edit-distance ≤1 from a convertible unit
// (but not itself a known/opaque unit). Such typos silently break scaling → hard error.
function nearMissConvertible(u) {
  if (KNOWN_UNITS.has(u)) return null;
  for (const k of CONVERTIBLE_UNITS) if (editDistance(u, k) <= 1) return k;
  return null;
}

// Mirror of docs/taxonomy.md §2 starter cuisines (slugified for comparison).
const KNOWN_CUISINES = new Set(
  [
    'American',
    'Southern',
    'Cajun & Creole',
    'Tex-Mex',
    'Mexican',
    'Brazilian',
    'Italian',
    'French',
    'Swiss',
    'German',
    'Scandinavian',
    'Jewish',
    'Greek & Mediterranean',
    'Chinese',
    'Japanese',
    'Thai',
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
    if (!ing.unit) continue;
    const u = String(ing.unit).trim().toLowerCase().replace(/\.$/, '');
    if (KNOWN_UNITS.has(u)) continue;
    const nearMiss = nearMissConvertible(u);
    if (nearMiss) {
      // Almost certainly a typo of a scalable unit — would ship as opaque and never
      // scale/convert. Hard-fail so it's caught before merge.
      errors.push(
        `${file}: unit "${ing.unit}" on "${ing.item}" looks like a typo of "${nearMiss}" (would break scaling) — fix it`,
      );
    } else {
      // Genuinely unknown unit: displayed verbatim (opaque). Warn without blocking.
      warnings.push(
        `${file}: unrecognized unit "${ing.unit}" on "${ing.item}" (shown verbatim; fix if it's a typo)`,
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

// The `conversions` tip slug is reserved for the bespoke /tips/conversions/ page (the tips
// loader excludes conversions.md, so such a file would silently do nothing) — hard-fail so it
// can't slip in as a confusing no-op.
if (existsSync('tips/conversions.md')) {
  errors.push(
    'tips/conversions.md uses the reserved "conversions" slug — the bespoke /tips/conversions/ page owns that route; rename the tip.',
  );
}

for (const w of warnings) console.warn(`⚠️  ${w}`);
for (const e of errors) console.error(`❌ ${e}`);
console.log(
  `\nvalidate-content: ${files.length} recipe(s), ${errors.length} error(s), ${warnings.length} warning(s)`,
);
process.exit(errors.length ? 1 : 0);
