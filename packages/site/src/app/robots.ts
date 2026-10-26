import type { MetadataRoute } from 'next';
import { siteUrl } from '~/lib/links';

// Cloudflare's managed robots.txt merges its AI-crawler rules with this file
// rather than replacing it, so the Sitemap line still reaches search engines.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/demo/' },
    sitemap: `${ siteUrl }/sitemap.xml`
  };
}
