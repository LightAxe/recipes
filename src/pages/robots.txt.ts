import { SITE, SITE_LIVE } from '../lib/site';

// Staged: allow crawling but rely on per-page noindex (no Disallow, which would block
// crawlers before they could read the noindex). The sitemap is advertised only at launch.
export function GET() {
  const body = SITE_LIVE
    ? `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap-index.xml\n`
    : `User-agent: *\nAllow: /\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
}
