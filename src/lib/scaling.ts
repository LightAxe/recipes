// Serving-scale logic (pure). Spec: docs/scaling-and-units.md §2.

export const MIN_FACTOR = 0.25;
export const MAX_FACTOR = 12;

/** Clamp a multiplier to a sane cooking range. */
export function clampFactor(f: number): number {
  if (!isFinite(f) || f <= 0) return 1;
  return Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, f));
}

/** Multiplier from a target serving count and the recipe's base servings. */
export function factorFromServings(target: number, base: number): number {
  if (!base || base <= 0) return 1;
  return clampFactor(target / base);
}

/** Target servings implied by a factor (for display / URL round-trip). */
export function servingsFromFactor(factor: number, base: number): number {
  return Math.round(clampFactor(factor) * base * 100) / 100;
}
