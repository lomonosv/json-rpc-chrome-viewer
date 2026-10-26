import type { MetadataRoute } from 'next';
import { siteUrl } from '~/lib/links';

// One page. /demo/ is deliberately absent: it is the embedded panel, marked
// noindex, and only makes sense inside the hero.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${ siteUrl }/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1
    }
  ];
}
