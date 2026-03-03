import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { ChevronRight } from 'lucide-react';

import { type Locale, isSupportedLocale } from '@workspace/shared/i18n';
import { buildPublicPath } from '@/lib/i18n-runtime/publicPath';
import { buildPublicAlternates, DEFAULT_OG_IMAGE, getBaseUrl, getOgLocale } from '@/lib/i18n-runtime/seo';
import { serializeJsonLd } from '@/lib/jsonLd';
import { buildAvailabilityRegionMeta } from '@/lib/seo/availabilityMeta';
import { buildBreadcrumbJsonLd, buildItemListJsonLd } from '@/lib/seo/structuredData';
import { getRegionalAvailabilityData, type PublicAvailabilityListItem } from '@/services/public-availability.service';

interface PageProps {
  params: Promise<{ lang: string; platform: string; regionKey: string }>;
}

export const revalidate = 3600;

function formatPercent(locale: Locale, value: number | null): string {
  if (typeof value !== 'number') return '-';
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value * 100)}%`;
}

function formatCurrency(locale: Locale, amount: number | null, currency: string | null): string {
  if (typeof amount !== 'number') return '-';
  if (!currency) return new Intl.NumberFormat(locale).format(amount);

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${new Intl.NumberFormat(locale).format(amount)} ${currency}`;
  }
}

function formatRegionName(regionKey: string): string {
  return regionKey
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getHomeLabel(locale: Locale): string {
  return locale === 'ko' ? '홈' : 'Home';
}

function getAvailabilityLabel(locale: Locale): string {
  return locale === 'ko' ? '숙소 예약 가능 여부' : 'Accommodation availability';
}

function getDetailAnchorText(locale: Locale, propertyName: string): string {
  return locale === 'ko'
    ? `${propertyName} 예약 가능 여부와 가격 추이 보기`
    : `View ${propertyName} availability and price trends`;
}

function getBackToListLabel(locale: Locale): string {
  return locale === 'ko'
    ? '전체 숙소 예약 가능 여부 목록으로 이동'
    : 'Back to the full accommodation availability list';
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, platform, regionKey } = await params;
  if (!isSupportedLocale(lang)) return {};

  const locale = lang as Locale;
  const data = await getRegionalAvailabilityData({ platform, regionKey, limit: 20 });
  if (!data) return {};

  const t = await getTranslations({ locale: lang, namespace: 'availability' });
  const platformLabel = t(`platform.${data.platform}`);
  const regionName = formatRegionName(data.region.key);

  const canonicalPath = `/availability/${data.platformSegment}/region/${data.region.key}`;
  const { canonical, languages } = buildPublicAlternates(locale, canonicalPath);
  const meta = buildAvailabilityRegionMeta({
    locale,
    regionName,
    platformLabel,
    propertyCount: data.region.propertyCount,
  });

  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical, languages },
    openGraph: {
      type: 'article',
      locale: getOgLocale(locale),
      url: canonical,
      siteName: 'Binbang',
      title: meta.title,
      description: meta.ogDescription,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary',
      title: meta.title,
      description: meta.description,
      images: ['/icon.png'],
    },
  };
}

export default async function RegionalAvailabilityPage({ params }: PageProps): Promise<React.ReactElement> {
  const { lang, platform, regionKey } = await params;
  if (!isSupportedLocale(lang)) notFound();

  const locale = lang as Locale;
  const t = await getTranslations({ locale: lang, namespace: 'availability' });
  const data = await getRegionalAvailabilityData({ platform, regionKey, limit: 20 });

  if (!data) notFound();

  const baseUrl = getBaseUrl();
  const platformLabel = t(`platform.${data.platform}`);
  const regionName = formatRegionName(data.region.key);
  const regionPath = `/availability/${data.platformSegment}/region/${data.region.key}`;
  const regionUrl = `${baseUrl}${buildPublicPath(lang, regionPath)}`;

  const meta = buildAvailabilityRegionMeta({
    locale,
    regionName,
    platformLabel,
    propertyCount: data.region.propertyCount,
  });

  const breadcrumbStructuredData = buildBreadcrumbJsonLd([
    { name: getHomeLabel(locale), url: `${baseUrl}${buildPublicPath(lang, '')}` },
    { name: getAvailabilityLabel(locale), url: `${baseUrl}${buildPublicPath(lang, '/availability')}` },
    { name: `${platformLabel} ${regionName}`, url: regionUrl },
  ]);

  const itemListStructuredData = buildItemListJsonLd({
    name: `${platformLabel} ${regionName}`,
    url: regionUrl,
    description: meta.description,
    items: data.topProperties.slice(0, 20).map((property) => ({
      name: property.name,
      url: `${baseUrl}${buildPublicPath(lang, `/availability/${data.platformSegment}/${property.slug}`)}`,
    })),
  });

  return (
    <main className='relative min-h-screen overflow-hidden bg-background pb-20'>
      <script
        type='application/ld+json'
        // biome-ignore lint/security/noDangerouslySetInnerHtml: serializeJsonLd escapes script-breaking characters
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbStructuredData) }}
      />
      <script
        type='application/ld+json'
        // biome-ignore lint/security/noDangerouslySetInnerHtml: serializeJsonLd escapes script-breaking characters
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(itemListStructuredData) }}
      />

      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -left-28 top-8 size-72 rounded-full bg-primary/10 blur-3xl' />
        <div className='absolute -right-24 bottom-0 size-80 rounded-full bg-brand-navy/10 blur-3xl' />
      </div>

      <div className='relative z-10 mx-auto max-w-6xl px-4 py-12 md:py-16'>
        <nav aria-label='Breadcrumb' className='mb-6'>
          <ol className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
            <li>
              <Link href={buildPublicPath(lang, '')} className='hover:text-foreground'>
                {getHomeLabel(locale)}
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href={buildPublicPath(lang, '/availability')} className='hover:text-foreground'>
                {getAvailabilityLabel(locale)}
              </Link>
            </li>
            <li>/</li>
            <li className='font-medium text-foreground'>{`${platformLabel} ${regionName}`}</li>
          </ol>
        </nav>

        <section className='mb-8'>
          <p className='mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary'>
            {t('region.eyebrow', { platform: platformLabel })}
          </p>
          <h1 className='mb-4 text-4xl font-semibold text-foreground md:text-5xl'>{regionName}</h1>
          <p className='text-lg text-muted-foreground'>
            {t('region.subtitle', {
              propertyCount: data.region.propertyCount,
              platform: platformLabel,
            })}
          </p>
        </section>

        <section className='mb-8 flex flex-wrap items-center gap-3'>
          <Link
            href={buildPublicPath(lang, '/availability')}
            className='inline-flex items-center rounded-full border border-border/70 bg-card/70 px-4 py-2 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary'
          >
            {getBackToListLabel(locale)}
          </Link>
          {data.topProperties.slice(0, 4).map((property: PublicAvailabilityListItem) => (
            <Link
              key={property.id}
              href={buildPublicPath(lang, `/availability/${data.platformSegment}/${property.slug}`)}
              className='inline-flex items-center rounded-full border border-border/70 bg-card/70 px-4 py-2 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary'
            >
              {getDetailAnchorText(locale, property.name)}
            </Link>
          ))}
        </section>

        <section className='mb-10 grid gap-4 md:grid-cols-4'>
          <div className='rounded-xl border border-border/70 bg-card/80 p-5'>
            <h3 className='mb-1 text-xs font-medium text-muted-foreground'>{t('region.stats.avgOpenRate')}</h3>
            <p className='text-2xl font-semibold text-foreground'>
              {formatPercent(locale, data.aggregateStats.avgOpenRate)}
            </p>
          </div>
          <div className='rounded-xl border border-border/70 bg-card/80 p-5'>
            <h3 className='mb-1 text-xs font-medium text-muted-foreground'>{t('region.stats.avgPrice')}</h3>
            <p className='text-2xl font-semibold text-foreground'>
              {formatCurrency(locale, data.aggregateStats.avgPriceAmount, data.aggregateStats.currency)}
            </p>
          </div>
          <div className='rounded-xl border border-border/70 bg-card/80 p-5'>
            <h3 className='mb-1 text-xs font-medium text-muted-foreground'>{t('region.stats.priceRange')}</h3>
            <p className='text-sm font-medium text-foreground'>
              {typeof data.aggregateStats.minPriceAmount === 'number' &&
              typeof data.aggregateStats.maxPriceAmount === 'number'
                ? `${formatCurrency(locale, data.aggregateStats.minPriceAmount, data.aggregateStats.currency)} - ${formatCurrency(
                    locale,
                    data.aggregateStats.maxPriceAmount,
                    data.aggregateStats.currency,
                  )}`
                : '-'}
            </p>
          </div>
          <div className='rounded-xl border border-border/70 bg-card/80 p-5'>
            <h3 className='mb-1 text-xs font-medium text-muted-foreground'>{t('region.stats.properties')}</h3>
            <p className='text-2xl font-semibold text-foreground'>{data.region.propertyCount}</p>
          </div>
        </section>

        <section>
          <h2 className='mb-4 text-2xl font-semibold text-foreground'>{t('region.topProperties')}</h2>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {data.topProperties.map((property: PublicAvailabilityListItem) => (
              <article
                key={property.id}
                className='rounded-xl border border-border/70 bg-card/80 p-5 shadow-xs transition-shadow hover:shadow-sm'
              >
                <Link
                  href={buildPublicPath(lang, `/availability/${data.platformSegment}/${property.slug}`)}
                  className='group inline-flex items-start gap-1 text-base font-medium text-foreground hover:text-primary'
                >
                  <span className='line-clamp-2'>{getDetailAnchorText(locale, property.name)}</span>
                  <ChevronRight className='mt-0.5 size-4 shrink-0 transition-transform group-hover:translate-x-0.5' />
                </Link>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {property.addressLocality && property.addressRegion
                    ? `${property.addressLocality}, ${property.addressRegion}`
                    : property.addressLocality || property.addressRegion || t('labels.unknownLocation')}
                </p>
                <dl className='mt-4 grid grid-cols-2 gap-3 text-sm'>
                  <div>
                    <dt className='text-xs text-muted-foreground'>{t('stats.openRate')}</dt>
                    <dd className='font-semibold text-foreground'>
                      {formatPercent(locale, property.latestSnapshot?.openRate ?? null)}
                    </dd>
                  </div>
                  <div>
                    <dt className='text-xs text-muted-foreground'>{t('stats.avgPrice')}</dt>
                    <dd className='font-semibold text-foreground'>
                      {formatCurrency(
                        locale,
                        property.latestSnapshot?.avgPriceAmount ?? null,
                        property.latestSnapshot?.currency ?? null,
                      )}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className='mt-12 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center md:p-8'>
          <h2 className='mb-3 text-2xl font-semibold text-foreground'>{t('region.cta.title')}</h2>
          <p className='mx-auto mb-4 max-w-2xl text-sm text-muted-foreground'>{t('region.cta.description')}</p>
          <Link
            href={buildPublicPath(lang, '/signup')}
            className='inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90'
          >
            {t('region.cta.button')}
          </Link>
        </section>
      </div>
    </main>
  );
}
