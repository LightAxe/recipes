import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { SITE, SITE_NAME } from '../lib/site';

export async function GET(context: APIContext) {
  const recipes = (await getCollection('recipes')).sort(
    (a, b) => (b.data.datePublished?.getTime() ?? 0) - (a.data.datePublished?.getTime() ?? 0),
  );
  return rss({
    title: SITE_NAME,
    description: 'New recipes from the Ogilvie family collection.',
    site: context.site ?? SITE,
    items: recipes.map((r) => ({
      title: r.data.title,
      description: r.data.description,
      link: `/recipes/${r.id}/`,
      pubDate: r.data.datePublished,
    })),
  });
}
