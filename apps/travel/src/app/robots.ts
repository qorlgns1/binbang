import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://travel.moodybeard.com';
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/login'] },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
