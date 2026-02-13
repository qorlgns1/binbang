import type { MetadataRoute } from 'next';

import { getBaseUrl } from '@/lib/i18n-runtime/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/accommodations/', '/settings/', '/admin/'],
      },
    ],
    sitemap: `${getBaseUrl()}/sitemap.xml`,
  };
}
