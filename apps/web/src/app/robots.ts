import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/accommodations/', '/settings/', '/admin/'],
      },
    ],
    sitemap: 'https://binbang.moodybeard.com/sitemap.xml',
  };
}
