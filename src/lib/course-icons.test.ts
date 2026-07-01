import { describe, it, expect } from 'vitest';
import { COURSE_ICONS, courseIcon } from './course-icons';
import { COURSE_SLUGS } from './taxonomy';

describe('course icons', () => {
  it('has an icon for every course slug', () => {
    for (const slug of COURSE_SLUGS) {
      expect(COURSE_ICONS[slug]).toBeTruthy();
      expect(COURSE_ICONS[slug]).toContain('<'); // some SVG markup
    }
  });
  it('falls back to the `other` icon for unknown slugs', () => {
    expect(courseIcon('not-a-course')).toBe(COURSE_ICONS.other);
  });
  it('returns the matching icon for a known slug', () => {
    expect(courseIcon('dessert')).toBe(COURSE_ICONS.dessert);
  });
});
