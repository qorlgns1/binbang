import type { MetadataRoute } from 'next';

import { getBaseUrl } from '@/lib/i18n-runtime/seo';

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
