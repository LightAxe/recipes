// Curated, cited conversion data for /tips/conversions/ (Phase 4). Kept small and verified —
// wrong numbers erode trust. Per-ingredient cup weights are from the King Arthur Ingredient
// Weight Chart (one consistent authoritative source); water is physical (1 mL ≈ 1 g). Generic
// volume equivalents reuse the ML constants from src/lib/units.ts so there's one source of
// truth. Oven temps are the conventional baking equivalents (NOT meat-doneness temps — those
// stay as transcribed family lore in the Useful Information tip, not authoritative here).
import { ML } from '../lib/units';

export interface IngredientWeight {
  item: string;
  gramsPerCup: number;
  source: string;
}

/** 1 US cup → grams, common baking ingredients. */
export const INGREDIENT_WEIGHTS: IngredientWeight[] = [
  { item: 'All-purpose flour', gramsPerCup: 120, source: 'King Arthur' },
  { item: 'Granulated sugar', gramsPerCup: 198, source: 'King Arthur' },
  { item: 'Brown sugar (packed)', gramsPerCup: 213, source: 'King Arthur' },
  { item: "Confectioners' sugar", gramsPerCup: 113, source: 'King Arthur' },
  { item: 'Butter', gramsPerCup: 227, source: 'King Arthur' },
  { item: 'Vegetable oil', gramsPerCup: 198, source: 'King Arthur' },
  { item: 'Honey', gramsPerCup: 340, source: 'King Arthur' },
  { item: 'Rolled oats', gramsPerCup: 89, source: 'King Arthur' },
  { item: 'Unsweetened cocoa', gramsPerCup: 85, source: 'King Arthur' },
  { item: 'Chocolate chips', gramsPerCup: 170, source: 'King Arthur' },
  { item: 'Raisins', gramsPerCup: 150, source: 'King Arthur' },
  { item: 'Chopped walnuts', gramsPerCup: 113, source: 'King Arthur' },
  { item: 'Water', gramsPerCup: 237, source: '1 mL ≈ 1 g' },
];

export interface VolumeEquivalent {
  unit: string;
  ml: number;
  note?: string;
}

/** Generic volume equivalents (milliliters from src/lib/units.ts). */
export const VOLUME_EQUIVALENTS: VolumeEquivalent[] = [
  { unit: '1 teaspoon (tsp)', ml: ML.tsp },
  { unit: '1 tablespoon (tbsp)', ml: ML.tbsp, note: '3 tsp' },
  { unit: '1 fluid ounce', ml: ML.floz, note: '2 tbsp' },
  { unit: '1 cup', ml: ML.cup, note: '16 tbsp · 8 fl oz' },
  { unit: '1 pint', ml: ML.pint, note: '2 cups' },
  { unit: '1 quart', ml: ML.quart, note: '4 cups' },
];

export interface OvenTemp {
  f: number;
  c: number;
  gas: number;
}

/** Oven temperatures — conventional baking equivalents. */
export const OVEN_TEMPS: OvenTemp[] = [
  { f: 275, c: 140, gas: 1 },
  { f: 300, c: 150, gas: 2 },
  { f: 325, c: 165, gas: 3 },
  { f: 350, c: 175, gas: 4 },
  { f: 375, c: 190, gas: 5 },
  { f: 400, c: 205, gas: 6 },
  { f: 425, c: 220, gas: 7 },
  { f: 450, c: 230, gas: 8 },
];

export interface PanSize {
  name: string;
  metric: string;
}

/** Common tin / pan sizes. */
export const PAN_SIZES: PanSize[] = [
  { name: '8-inch round', metric: '20 cm round' },
  { name: '9-inch round', metric: '23 cm round' },
  { name: '8-inch square', metric: '20 × 20 cm' },
  { name: '9 × 13-inch', metric: '23 × 33 cm' },
  { name: '9 × 5-inch loaf', metric: '23 × 13 cm' },
  { name: '10-inch tube / bundt', metric: '25 cm' },
];
