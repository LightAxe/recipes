import { describe, it, expect } from 'vitest';
import {
  normalizeUnit,
  toFraction,
  formatUSVolume,
  formatMetricVolume,
  formatMetricWeight,
  formatUSWeight,
  formatCount,
  pluralizeUnit,
  amountFor,
} from './units';

describe('normalizeUnit', () => {
  it('maps synonyms/plurals/abbreviations + dots/case', () => {
    expect(normalizeUnit('Tablespoons')).toBe('tbsp');
    expect(normalizeUnit('tsp.')).toBe('tsp');
    expect(normalizeUnit('CUP')).toBe('cup');
    expect(normalizeUnit('grams')).toBe('g');
    expect(normalizeUnit('lbs')).toBe('lb');
  });
  it('returns undefined for unknown units', () => {
    expect(normalizeUnit('smidgen')).toBeUndefined();
    expect(normalizeUnit('')).toBeUndefined();
  });
});

describe('toFraction (display snapping)', () => {
  it('renders nice kitchen fractions', () => {
    expect(toFraction(0.75)).toBe('¾');
    expect(toFraction(0.5)).toBe('½');
    expect(toFraction(0.25)).toBe('¼');
    expect(toFraction(0.333)).toBe('⅓');
    expect(toFraction(0.66)).toBe('⅔');
    expect(toFraction(0.125)).toBe('⅛');
    expect(toFraction(1.5)).toBe('1½');
    expect(toFraction(2)).toBe('2');
  });
});

describe('display formatting', () => {
  it('US volume promotes tsp→tbsp→cup', () => {
    expect(formatUSVolume(0.75 * 236.588)).toBe('¾ cup');
    expect(formatUSVolume(1.5 * 236.588)).toBe('1½ cups');
    expect(formatUSVolume(2 * 14.7868)).toBe('2 tbsp');
    expect(formatUSVolume(4 * 14.7868)).toBe('¼ cup'); // 4 tbsp promotes
    expect(formatUSVolume(1 * 4.92892)).toBe('1 tsp');
  });
  it('metric volume promotes ml→l', () => {
    expect(formatMetricVolume(355)).toBe('355 ml');
    expect(formatMetricVolume(1200)).toBe('1.2 l');
  });
  it('metric weight promotes g→kg', () => {
    expect(formatMetricWeight(150)).toBe('150 g');
    expect(formatMetricWeight(1080)).toBe('1.08 kg');
  });
  it('US weight promotes oz→lb, and shows grams for tiny amounts', () => {
    expect(formatUSWeight(900)).toBe('2 lb');
    expect(formatUSWeight(150)).toBe('5¼ oz');
    expect(formatUSWeight(3)).toBe('3 g'); // < ¼ oz → grams, not "0 oz"
  });
  it('counts snap to halves', () => {
    expect(formatCount(6)).toBe('6');
    expect(formatCount(1.5)).toBe('1½');
  });
});

describe('amountFor — the §6 display matrix', () => {
  const sugar = { qty: 0.75, unit: 'cup', grams: 150 };
  const apples = { qty: 6, grams: 1080, gramsApprox: true }; // count + grams
  const nutmeg = { qty: 0.25, unit: 'tsp' }; // no grams
  const crusts = { qty: 2 }; // count, no grams

  it('volume view (US)', () => {
    expect(amountFor(sugar, { system: 'us', measure: 'volume', factor: 1 }).text).toBe(
      '¾ cup',
    );
    expect(amountFor(sugar, { system: 'us', measure: 'volume', factor: 2 }).text).toBe(
      '1½ cups',
    );
  });
  it('volume view (metric)', () => {
    expect(amountFor(sugar, { system: 'metric', measure: 'volume', factor: 1 }).text).toBe(
      '175 ml',
    );
    expect(amountFor(sugar, { system: 'metric', measure: 'volume', factor: 2 }).text).toBe(
      '355 ml',
    );
  });
  it('weight view uses grams', () => {
    expect(amountFor(sugar, { system: 'metric', measure: 'weight', factor: 1 }).text).toBe(
      '150 g',
    );
    expect(amountFor(sugar, { system: 'us', measure: 'weight', factor: 1 }).text).toBe(
      '5¼ oz',
    );
  });
  it('count+grams renders by weight (approx) in weight view', () => {
    const a = amountFor(apples, { system: 'metric', measure: 'weight', factor: 2 });
    expect(a.text).toBe('2.16 kg');
    expect(a.approx).toBe(true);
  });
  it('count+grams stays a count in volume view', () => {
    expect(amountFor(apples, { system: 'us', measure: 'volume', factor: 1 }).text).toBe('6');
  });
  it('grams-less unit item falls back to ≈ volume in weight view', () => {
    const n = amountFor(nutmeg, { system: 'metric', measure: 'weight', factor: 1 });
    expect(n.text).toBe('1 ml');
    expect(n.approx).toBe(true);
  });
  it('grams-less count item stays unchanged in weight view', () => {
    const c = amountFor(crusts, { system: 'metric', measure: 'weight', factor: 1 });
    expect(c.text).toBe('2');
    expect(c.approx).toBe(false);
  });
  it('to-taste (no qty) renders empty', () => {
    expect(
      amountFor({ unit: 'pinch' }, { system: 'us', measure: 'volume', factor: 1 }).text,
    ).toBe('');
  });
  it('opaque unit pluralizes when scaled past 1', () => {
    const stick = { qty: 1, unit: 'stick' };
    expect(amountFor(stick, { system: 'us', measure: 'volume', factor: 1 }).text).toBe(
      '1 stick',
    );
    expect(amountFor(stick, { system: 'us', measure: 'volume', factor: 2 }).text).toBe(
      '2 sticks',
    );
  });
  it('grams-only ingredient shows its weight (not an invisible/0 amount)', () => {
    const ginger = { grams: 3, gramsApprox: false }; // no qty/unit
    expect(amountFor(ginger, { system: 'metric', measure: 'volume', factor: 1 }).text).toBe(
      '3 g',
    );
    expect(amountFor(ginger, { system: 'metric', measure: 'weight', factor: 2 }).text).toBe(
      '6 g',
    );
  });
});

describe('pluralizeUnit', () => {
  it('singular for ≤1, plural for >1', () => {
    expect(pluralizeUnit('can', 1)).toBe('can');
    expect(pluralizeUnit('can', 0.5)).toBe('can');
    expect(pluralizeUnit('can', 5)).toBe('cans');
  });
  it('handles -es and -ies and leaves already-plural alone', () => {
    expect(pluralizeUnit('pinch', 2)).toBe('pinches');
    expect(pluralizeUnit('box', 2)).toBe('boxes');
    expect(pluralizeUnit('cans', 3)).toBe('cans'); // no double-plural
  });
});

describe('cup pluralization at the snap boundary', () => {
  it('a value that snaps to "1" reads "1 cup", not "1 cups"', () => {
    expect(formatUSVolume(250)).toBe('1 cup'); // 250 ml ≈ 1.057 cups → snaps to 1
    expect(formatUSVolume(1 * 236.588)).toBe('1 cup');
    expect(formatUSVolume(1.5 * 236.588)).toBe('1½ cups');
  });
});
