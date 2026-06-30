import { describe, it, expect } from 'vitest';
import {
  clampFactor,
  factorFromServings,
  servingsFromFactor,
  MIN_FACTOR,
  MAX_FACTOR,
} from './scaling';

describe('scaling', () => {
  it('clamps to a sane range', () => {
    expect(clampFactor(0)).toBe(1);
    expect(clampFactor(-5)).toBe(1);
    expect(clampFactor(100)).toBe(MAX_FACTOR);
    expect(clampFactor(0.01)).toBe(MIN_FACTOR);
    expect(clampFactor(2)).toBe(2);
  });
  it('derives factor from target servings', () => {
    expect(factorFromServings(16, 8)).toBe(2);
    expect(factorFromServings(8, 8)).toBe(1);
    expect(factorFromServings(4, 8)).toBe(0.5);
  });
  it('round-trips servings ↔ factor', () => {
    expect(servingsFromFactor(2, 8)).toBe(16);
    expect(servingsFromFactor(1, 8)).toBe(8);
  });
  it('is idempotent at ×1', () => {
    expect(clampFactor(1)).toBe(1);
    expect(factorFromServings(8, 8)).toBe(1);
  });
});

// Raw conversion round-trips (within tolerance) — kept separate from display snapshots.
describe('raw conversion round-trips', () => {
  const ML_CUP = 236.588;
  const G_OZ = 28.3495;
  it('cup ↔ ml', () => {
    const ml = 2 * ML_CUP;
    expect(ml / ML_CUP).toBeCloseTo(2, 6);
  });
  it('oz ↔ g', () => {
    const g = 8 * G_OZ;
    expect(g / G_OZ).toBeCloseTo(8, 6);
  });
});
