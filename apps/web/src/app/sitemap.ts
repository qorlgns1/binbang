import type { MetadataRoute } from 'next';

import { SUPPORTED_LOCALES } from '@workspace/shared/i18n';

import { buildPublicPath } from '@/lib/i18n-runtime/publicPath';
import { buildAvailabilityPath, getBaseUrl, PUBLIC_PATHS } from '@/lib/i18n-runtime/seo';
import { getPublicAvailabilitySitemapItems, getRegionalSitemapItems } from '@/services/public-availability.service';

// 빌드 때는 DB가 없어 정적 페이지만 담긴다. 미리 만들어 두면 배포 직후 그 빈약한 버전이 나가므로 요청마다 만든다.
export const dynamic = 'force-dynamic';

// sitemap 한 파일의 URL 상한(sitemaps.org). 숙소 1곳은 언어 수만큼 URL이 된다.
const MAX_SITEMAP_URLS = 50_000;

const PRIORITY_AND_FREQ: Record<string, { priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly' }> = {
  '': { priority: 1.0, changeFrequency: 'weekly' },
  '/availability': { priority: 0.8, changeFrequency: 'weekly' },
  '/pricing': { priority: 0.8, changeFrequency: 'monthly' },
  '/faq': { priority: 0.7, changeFrequency: 'monthly' },
  '/about': { priority: 0.7, changeFrequency: 'monthly' },
  '/login': { priority: 0.5, changeFrequency: 'yearly' },
  '/terms': { priority: 0.5, changeFrequency: 'monthly' },
  '/privacy': { priority: 0.5, changeFrequency: 'monthly' },
};

function buildStaticSitemapEntries(baseUrl: string): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const path of PUBLIC_PATHS) {
    const { priority, changeFrequency } = PRIORITY_AND_FREQ[path] ?? {
      priority: 0.5,
      changeFrequency: 'monthly' as const,
    };

    for (const lang of SUPPORTED_LOCALES) {
      entries.push({
        url: `${baseUrl}${buildPublicPath(lang, path)}`,
        changeFrequency,
        priority,
      });
    }
  }

  return entries;
}

async function buildRegionalSitemapEntries(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  try {
    const regionalItems = await getRegionalSitemapItems({ limit: 50_000 });

    for (const region of regionalItems) {
      for (const lang of SUPPORTED_LOCALES) {
        entries.push({
          url: `${baseUrl}${buildPublicPath(lang, `/availability/${region.platformSegment}/region/${region.regionKey}`)}`,
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }
  } catch (error) {
    console.error('[sitemap] failed to build regional sitemap entries', error);
  }

  return entries;
}

async function buildPropertySitemapEntries(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  try {
    const availabilityItems = await getPublicAvailabilitySitemapItems();

    const entries: MetadataRoute.Sitemap = [];

    for (const item of availabilityItems) {
      const path = buildAvailabilityPath(item.platformSegment, item.slug);
      for (const lang of SUPPORTED_LOCALES) {
        entries.push({
          url: `${baseUrl}${buildPublicPath(lang, path)}`,
          lastModified: new Date(item.lastModified),
          changeFrequency: 'daily',
          priority: 0.7,
        });
      }
    }

    return entries;
  } catch (error) {
    console.error('[sitemap] failed to build property sitemap entries', error);
    return [];
  }
}

// generateSitemaps로 나누면 /sitemap.xml(robots.txt가 가리키는 주소)이 생기지 않고,
// 나눌 개수가 DB 없는 빌드 시점에 정해져 숙소 sitemap이 아예 만들어지지 않는다. 그래서 한 파일로 둔다.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const [regionalEntries, propertyEntries] = await Promise.all([
    buildRegionalSitemapEntries(baseUrl),
    buildPropertySitemapEntries(baseUrl),
  ]);

  return [...buildStaticSitemapEntries(baseUrl), ...regionalEntries, ...propertyEntries].slice(0, MAX_SITEMAP_URLS);
}
