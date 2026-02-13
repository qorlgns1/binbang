import type { MetadataRoute } from 'next';

import { getBaseUrl } from '@/lib/i18n-runtime/seo';

/**
 * Provide robots.txt metadata for the site including host, sitemap, and access rules.
 *
 * @returns A `MetadataRoute.Robots` object containing the site host, a sitemap URL, and two access rules that allow `/` and disallow `/dashboard`, `/accommodations/`, `/settings/`, and `/admin/` for user agents `*` and `Yeti`.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();
  return {
    host: new URL(baseUrl).host,
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/accommodations/', '/settings/', '/admin/'],
      },
      {
        userAgent: 'Yeti',
        allow: '/',
        disallow: ['/dashboard', '/accommodations/', '/settings/', '/admin/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}