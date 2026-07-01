import { describe, it, expect } from 'vitest';
import { INGREDIENT_WEIGHTS, VOLUME_EQUIVALENTS, OVEN_TEMPS, PAN_SIZES } from './conversions';

describe('conversions data integrity', () => {
  it('every ingredient row has a positive gram weight and a source', () => {
    expect(INGREDIENT_WEIGHTS.length).toBeGreaterThan(5);
    for (const w of INGREDIENT_WEIGHTS) {
      expect(w.item.length).toBeGreaterThan(0);
      expect(w.gramsPerCup).toBeGreaterThan(0);
      expect(w.source.length).toBeGreaterThan(0);
    }
  });
  it('has known-correct values', () => {
    const flour = INGREDIENT_WEIGHTS.find((w) => w.item === 'All-purpose flour');
    expect(flour?.gramsPerCup).toBe(120);
    const butter = INGREDIENT_WEIGHTS.find((w) => w.item === 'Butter');
    expect(butter?.gramsPerCup).toBe(227);
  });
  it('volume equivalents carry positive ml (sourced from units.ts)', () => {
    for (const v of VOLUME_EQUIVALENTS) expect(v.ml).toBeGreaterThan(0);
    const cup = VOLUME_EQUIVALENTS.find((v) => v.unit.startsWith('1 cup'));
    expect(Math.round(cup!.ml)).toBe(237);
  });
  it('oven temps ascend across all three scales', () => {
    for (let i = 1; i < OVEN_TEMPS.length; i++) {
      expect(OVEN_TEMPS[i].f).toBeGreaterThan(OVEN_TEMPS[i - 1].f);
      expect(OVEN_TEMPS[i].c).toBeGreaterThan(OVEN_TEMPS[i - 1].c);
      expect(OVEN_TEMPS[i].gas).toBeGreaterThan(OVEN_TEMPS[i - 1].gas);
    }
  });
  it('pan sizes are non-empty', () => {
    expect(PAN_SIZES.length).toBeGreaterThan(0);
    for (const p of PAN_SIZES) expect(p.name && p.metric).toBeTruthy();
  });
});
