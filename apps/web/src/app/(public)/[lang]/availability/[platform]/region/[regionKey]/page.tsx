import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { ChevronRight } from 'lucide-react';

import { type Locale, isSupportedLocale } from '@workspace/shared/i18n';
import { buildPublicAlternates, DEFAULT_OG_IMAGE, getOgLocale } from '@/lib/i18n-runtime/seo';
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
  // Convert kebab-case to Title Case
  return regionKey
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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

  const title = t('region.metaTitle', {
    platform: platformLabel,
    region: regionName,
  });

  const description = t('region.metaDescription', {
    region: regionName,
    platform: platformLabel,
    propertyCount: data.region.propertyCount,
    avgOpenRate: formatPercent(locale, data.aggregateStats.avgOpenRate),
  });

  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      type: 'article',
      locale: getOgLocale(locale),
      url: canonical,
      siteName: 'Binbang',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary',
      title,
      description,
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

  const platformLabel = t(`platform.${data.platform}`);
  const regionName = formatRegionName(data.region.key);

  return (
    <main className='relative min-h-screen overflow-hidden bg-background pb-20'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -left-28 top-8 size-72 rounded-full bg-primary/10 blur-3xl' />
        <div className='absolute -right-24 bottom-0 size-80 rounded-full bg-brand-navy/10 blur-3xl' />
      </div>

      <div className='relative z-10 mx-auto max-w-6xl px-4 py-12 md:py-16'>
        {/* Hero Section */}
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

        {/* Aggregate Stats */}
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

        {/* Top Properties */}
        <section>
          <h2 className='mb-4 text-2xl font-semibold text-foreground'>{t('region.topProperties')}</h2>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {data.topProperties.map((property: PublicAvailabilityListItem) => (
              <article
                key={property.id}
                className='rounded-xl border border-border/70 bg-card/80 p-5 shadow-xs transition-shadow hover:shadow-sm'
              >
                <Link
                  href={`/${lang}/availability/${data.platformSegment}/${property.slug}`}
                  className='group inline-flex items-center gap-1 text-lg font-medium text-foreground hover:text-primary'
                >
                  {property.name}
                  <ChevronRight className='size-4 transition-transform group-hover:translate-x-0.5' />
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

        {/* CTA Section */}
        <section className='mt-12 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center md:p-8'>
          <h2 className='mb-3 text-2xl font-semibold text-foreground'>{t('region.cta.title')}</h2>
          <p className='mx-auto mb-4 max-w-2xl text-sm text-muted-foreground'>{t('region.cta.description')}</p>
          <Link
            href={`/${lang}/signup`}
            className='inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90'
          >
            {t('region.cta.button')}
          </Link>
        </section>
      </div>
    </main>
  );
}
