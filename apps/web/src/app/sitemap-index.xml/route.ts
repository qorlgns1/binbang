import { NextResponse } from 'next/server';

import { getBaseUrl } from '@/lib/i18n-runtime/seo';
import { getPublicAvailabilitySitemapTotalCount } from '@/services/public-availability.service';

export const revalidate = 3600;

const PROPERTY_SITEMAP_BATCH_SIZE = 10_000;
const STATIC_SITEMAP_ID = 0;
const REGIONS_SITEMAP_ID = 1;
const PROPERTIES_SITEMAP_START_ID = 2;

function buildSitemapIndexXml(urls: string[]): string {
  const lastModified = new Date().toISOString();
  const entries = urls
    .map((url) => `<sitemap><loc>${url}</loc><lastmod>${lastModified}</lastmod></sitemap>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`;
}

export async function GET(): Promise<NextResponse> {
  const baseUrl = getBaseUrl();
  let propertyTotalCount = 0;

  try {
    propertyTotalCount = await getPublicAvailabilitySitemapTotalCount();
  } catch (error) {
    console.error('[sitemap-index.xml] failed to fetch property sitemap count', error);
    propertyTotalCount = 0;
  }

  const propertySitemapCount = Math.ceil(propertyTotalCount / PROPERTY_SITEMAP_BATCH_SIZE);
  const sitemapUrls = [
    `${baseUrl}/sitemap/${STATIC_SITEMAP_ID}.xml`,
    `${baseUrl}/sitemap/${REGIONS_SITEMAP_ID}.xml`,
    ...Array.from({ length: propertySitemapCount }, (_, index) => {
      const id = PROPERTIES_SITEMAP_START_ID + index;
      return `${baseUrl}/sitemap/${id}.xml`;
    }),
  ];

  return new NextResponse(buildSitemapIndexXml(sitemapUrls), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
