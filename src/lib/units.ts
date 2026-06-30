// Pure unit/quantity logic for the recipe scaler + unit toggles.
// No DOM imports — fully unit-tested (see units.test.ts). Spec: docs/scaling-and-units.md.

export type System = 'us' | 'metric';
export type Measure = 'volume' | 'weight';

/** Canonical volume units → milliliters. */
const ML: Record<string, number> = {
  tsp: 4.92892,
  tbsp: 14.7868,
  floz: 29.5735,
  cup: 236.588,
  pint: 473.176,
  quart: 946.353,
  gallon: 3785.41,
  ml: 1,
  l: 1000,
};
/** Canonical weight units → grams. */
const G: Record<string, number> = { oz: 28.3495, lb: 453.592, g: 1, kg: 1000 };

const VOLUME = new Set(Object.keys(ML));
const WEIGHT = new Set(Object.keys(G));

/** Synonyms/plurals/abbreviations → canonical unit. Lookup is lowercased + de-dotted. */
const SYNONYMS: Record<string, string> = {
  tsp: 'tsp',
  t: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tbsp: 'tbsp',
  tbs: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  floz: 'floz',
  'fl oz': 'floz',
  'fluid ounce': 'floz',
  'fluid ounces': 'floz',
  cup: 'cup',
  cups: 'cup',
  c: 'cup',
  pint: 'pint',
  pints: 'pint',
  pt: 'pint',
  quart: 'quart',
  quarts: 'quart',
  qt: 'quart',
  gallon: 'gallon',
  gallons: 'gallon',
  gal: 'gallon',
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  l: 'l',
  liter: 'l',
  liters: 'l',
  litre: 'l',
  litres: 'l',
  oz: 'oz',
  ounce: 'oz',
  ounces: 'oz',
  lb: 'lb',
  lbs: 'lb',
  pound: 'lb',
  pounds: 'lb',
  g: 'g',
  gram: 'g',
  grams: 'g',
  gramme: 'g',
  grammes: 'g',
  kg: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
};

/** Raw unit string → canonical, or undefined if unrecognized. */
export function normalizeUnit(raw?: string): string | undefined {
  if (!raw) return undefined;
  const key = raw.trim().toLowerCase().replace(/\.$/, '');
  return SYNONYMS[key];
}

export const KNOWN_UNITS: ReadonlySet<string> = new Set(Object.keys(SYNONYMS));

export function unitKind(canon: string): 'volume' | 'weight' | undefined {
  if (VOLUME.has(canon)) return 'volume';
  if (WEIGHT.has(canon)) return 'weight';
  return undefined;
}

// ── Fractions ──────────────────────────────────────────────────────────────
const VULGAR: Record<string, string> = {
  '1/8': '⅛',
  '1/4': '¼',
  '1/3': '⅓',
  '3/8': '⅜',
  '1/2': '½',
  '5/8': '⅝',
  '2/3': '⅔',
  '3/4': '¾',
  '7/8': '⅞',
};

/** Snap to the nearest "nice" kitchen fraction (eighths or thirds) and render. */
export function toFraction(n: number): string {
  if (!isFinite(n)) return '0';
  const sign = n < 0 ? '-' : '';
  n = Math.abs(n);
  const whole = Math.floor(n);
  let frac = n - whole;

  // candidate denominators: eighths and thirds
  const cands = [0, 1 / 8, 1 / 4, 1 / 3, 3 / 8, 1 / 2, 5 / 8, 2 / 3, 3 / 4, 7 / 8, 1];
  let best = cands[0];
  for (const c of cands) if (Math.abs(c - frac) < Math.abs(best - frac)) best = c;

  let w = whole;
  if (best === 1) {
    w += 1;
    best = 0;
  }
  const map: Record<string, string> = {
    [String(1 / 8)]: '1/8',
    [String(1 / 4)]: '1/4',
    [String(1 / 3)]: '1/3',
    [String(3 / 8)]: '3/8',
    [String(1 / 2)]: '1/2',
    [String(5 / 8)]: '5/8',
    [String(2 / 3)]: '2/3',
    [String(3 / 4)]: '3/4',
    [String(7 / 8)]: '7/8',
  };
  const glyph = best === 0 ? '' : (VULGAR[map[String(best)]] ?? '');
  if (w === 0 && glyph === '') return '0';
  if (glyph === '') return `${sign}${w}`;
  return w > 0 ? `${sign}${w}${glyph}` : `${sign}${glyph}`;
}

// ── Display formatting ───────────────────────────────────────────────────────
function roundStep(n: number, lo: number, hi: number): number {
  return n < 25 ? Math.round(n / lo) * lo : Math.round(n / hi) * hi;
}

/** ml → US volume, promoting tsp→tbsp→cup by threshold (docs/scaling-and-units.md). */
export function formatUSVolume(ml: number): string {
  if (ml <= 0) return '0';
  const cups = ml / ML.cup;
  if (cups >= 0.25) return `${toFraction(cups)} ${cups <= 1 ? 'cup' : 'cups'}`;
  const tbsp = ml / ML.tbsp;
  if (tbsp >= 1) return `${toFraction(tbsp)} tbsp`;
  const tsp = ml / ML.tsp;
  const t = toFraction(tsp);
  return t === '0' ? 'a pinch' : `${t} tsp`;
}

/** ml → metric volume (ml, promote to l ≥ 1000). */
export function formatMetricVolume(ml: number): string {
  if (ml >= 1000) return `${+(ml / 1000).toFixed(1)} l`;
  return `${roundStep(ml, 1, 5)} ml`;
}

/** g → metric weight (g, promote to kg ≥ 1000). */
export function formatMetricWeight(g: number): string {
  if (g >= 1000) return `${+(g / 1000).toFixed(2)} kg`;
  return `${roundStep(g, 1, 5)} g`;
}

/** g → US weight (oz, promote to lb ≥ 16 oz). Tiny amounts (< ¼ oz) show grams
    instead of rounding to a useless "0 oz". */
export function formatUSWeight(g: number): string {
  const oz = g / G.oz;
  if (oz >= 16) {
    const lb = Math.round((oz / 16) * 4) / 4;
    return `${toFraction(lb)} lb`;
  }
  if (oz < 0.25) return formatMetricWeight(g); // e.g. 3 g cinnamon, not "0 oz"
  return `${toFraction(Math.round(oz * 4) / 4)} oz`;
}

/** Countable amount (eggs, apples): nearest ½. */
export function formatCount(qty: number): string {
  return toFraction(Math.round(qty * 2) / 2);
}

// ── The high-level amount renderer ───────────────────────────────────────────
export interface Ingredient {
  qty?: number;
  unit?: string; // raw; normalized internally
  grams?: number;
  gramsApprox?: boolean;
}

export interface AmountOpts {
  system: System;
  measure: Measure;
  factor: number;
}

export interface Amount {
  text: string; // e.g. "1½ cups", "150 g", "≈ 355 ml", "6"
  approx: boolean; // render a leading ≈
}

/**
 * Render the *amount* (no item name) for an ingredient under the chosen
 * system/measure/scale. Implements the §6 display matrix + weight fallbacks.
 */
export function amountFor(ing: Ingredient, opts: AmountOpts): Amount {
  const { system, measure, factor } = opts;
  const qty = ing.qty != null ? ing.qty * factor : undefined;
  const grams = ing.grams != null ? ing.grams * factor : undefined;
  const canon = normalizeUnit(ing.unit);
  const kind = canon ? unitKind(canon) : undefined;
  const rawUnit = ing.unit?.trim();
  const opaque = !!rawUnit && !canon; // non-convertible unit: clove, can, stick, pinch…

  // "to taste" / no numeric amount
  if (qty == null && grams == null) return { text: '', approx: false };

  const weightText = (g: number) =>
    system === 'us' ? formatUSWeight(g) : formatMetricWeight(g);
  const volumeText = (ml: number) =>
    system === 'us' ? formatUSVolume(ml) : formatMetricVolume(ml);

  if (measure === 'weight') {
    if (grams != null) return { text: weightText(grams), approx: !!ing.gramsApprox };
    if (kind === 'volume' && qty != null && canon)
      return { text: volumeText(qty * ML[canon]), approx: true }; // ≈ fallback
    if (kind === 'weight' && qty != null && canon)
      return { text: weightText(qty * G[canon]), approx: false };
    if (opaque && qty != null) return { text: `${toFraction(qty)} ${rawUnit}`, approx: false };
    // count, no grams → unchanged count
    return { text: formatCount(qty!), approx: false };
  }

  // measure === 'volume'
  if (kind === 'volume' && qty != null && canon)
    return { text: volumeText(qty * ML[canon]), approx: false };
  if (kind === 'weight' && qty != null && canon)
    return { text: weightText(qty * G[canon]), approx: false };
  if (opaque && qty != null) return { text: `${toFraction(qty)} ${rawUnit}`, approx: false };
  return { text: formatCount(qty!), approx: false };
}
