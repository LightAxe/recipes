// Single source for site identity + the launch gate.
// SITE_LIVE (env, default false) ties together: noindex meta, robots, and sitemap
// advertisement — flip it (SITE_LIVE=true) only at real go-live.
export const SITE = 'https://recipes.axpr.net';
export const SITE_NAME = 'Ogilvie Family Recipes';
export const SITE_LIVE = process.env.SITE_LIVE === 'true';

// Cloudflare Web Analytics (cookieless). Public client-side token; overridable via env.
// Loaded only on the live build (see Base.astro) so dev/staged pageviews aren't counted.
export const CF_ANALYTICS_TOKEN =
  process.env.CF_ANALYTICS_TOKEN ?? '15bbfa7b74c7461ea7adefac58454a66';

/** Absolute URL for a path, using the configured site origin. */
export function abs(path: string): string {
  return new URL(path, SITE).href;
}
