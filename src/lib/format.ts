// Display helpers for Phase 1 (read-only rendering at base amounts).
// The full scaler/unit-conversion logic (docs/scaling-and-units.md) lands in Phase 3.

/** ISO-8601 time duration → short human text, e.g. "PT1H30M" → "1 hr 30 min". */
export function formatDuration(iso?: string): string | null {
  if (!iso) return null;
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return null;
  const [, h, min, s] = m;
  const parts: string[] = [];
  if (h) parts.push(`${h} hr`);
  if (min) parts.push(`${min} min`);
  if (s) parts.push(`${s} sec`);
  return parts.join(' ') || null;
}

const VULGAR: Record<string, string> = {
  '0.25': '¼',
  '0.5': '½',
  '0.75': '¾',
  '0.33': '⅓',
  '0.333': '⅓',
  '0.67': '⅔',
  '0.667': '⅔',
  '0.66': '⅔',
  '0.125': '⅛',
};

/** Minimal base-amount quantity formatting (whole + common vulgar fraction). */
export function formatQty(qty?: number): string | null {
  if (qty === undefined) return null;
  const whole = Math.floor(qty);
  const frac = +(qty - whole).toFixed(3);
  const glyph = frac > 0 ? VULGAR[String(frac)] : '';
  if (glyph) return whole > 0 ? `${whole}${glyph}` : glyph;
  return String(qty);
}
