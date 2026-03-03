import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { ArrowRight } from 'lucide-react';

import { type Locale, isSupportedLocale } from '@workspace/shared/i18n';
import { buildPublicPath } from '@/lib/i18n-runtime/publicPath';
import { buildPublicAlternates, DEFAULT_OG_IMAGE, getBaseUrl, getOgLocale } from '@/lib/i18n-runtime/seo';
import { serializeJsonLd } from '@/lib/jsonLd';
import { buildAvailabilityListMeta } from '@/lib/seo/availabilityMeta';
import { buildBreadcrumbJsonLd, buildItemListJsonLd } from '@/lib/seo/structuredData';
import { getPublicAvailabilityList } from '@/services/public-availability.service';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export const revalidate = 3600;

function resolveLocationLabel(
  addressLocality: string | null,
  addressRegion: string | null,
  unknownLocationLabel: string,
): string {
  const values = [addressLocality, addressRegion]
    .map((value): string => value?.trim() ?? '')
    .filter((value): boolean => value.length > 0);

  if (values.length === 0) return unknownLocationLabel;
  return values.join(', ');
}

function formatRegionName(regionKey: string): string {
  return regionKey
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

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

function formatDateTime(locale: Locale, iso: string | null): string {
  if (!iso) return '-';

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
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

function getRegionAnchorText(locale: Locale, platformLabel: string, regionName: string): string {
  return locale === 'ko'
    ? `${regionName} ${platformLabel} 지역 숙소 더 보기`
    : `Browse more ${platformLabel} stays in ${regionName}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) return {};

  const locale = lang as Locale;
  const meta = buildAvailabilityListMeta({ locale });
  const { canonical, languages } = buildPublicAlternates(locale, '/availability');

  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical, languages },
    openGraph: {
      type: 'website',
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

export default async function AvailabilityListPage({ params }: PageProps): Promise<React.ReactElement> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  const locale = lang as Locale;
  const t = await getTranslations({ locale: lang, namespace: 'availability' });
  const baseUrl = getBaseUrl();
  const meta = buildAvailabilityListMeta({ locale });
  const items = await getPublicAvailabilityList({ limit: 18, locale });

  const listUrl = `${baseUrl}${buildPublicPath(lang, '/availability')}`;
  const breadcrumbStructuredData = buildBreadcrumbJsonLd([
    { name: getHomeLabel(locale), url: `${baseUrl}${buildPublicPath(lang, '')}` },
    { name: getAvailabilityLabel(locale), url: listUrl },
  ]);

  const collectionStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: meta.title,
    description: meta.description,
    url: listUrl,
    inLanguage: locale,
    mainEntity: buildItemListJsonLd({
      includeContext: false,
      name: getAvailabilityLabel(locale),
      url: listUrl,
      description: meta.description,
      items: items.slice(0, 20).map((item) => ({
        name: item.name,
        url: `${baseUrl}${buildPublicPath(lang, `/availability/${item.platformSegment}/${item.slug}`)}`,
      })),
    }),
  };

  return (
    <main className='min-h-screen bg-background py-12 md:py-16'>
      <script
        type='application/ld+json'
        // biome-ignore lint/security/noDangerouslySetInnerHtml: serializeJsonLd escapes script-breaking characters
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbStructuredData) }}
      />
      <script
        type='application/ld+json'
        // biome-ignore lint/security/noDangerouslySetInnerHtml: serializeJsonLd escapes script-breaking characters
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(collectionStructuredData) }}
      />

      <div className='mx-auto w-full max-w-6xl px-4'>
        <nav aria-label='Breadcrumb' className='mb-6'>
          <ol className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
            <li>
              <Link href={buildPublicPath(lang, '')} className='hover:text-foreground'>
                {getHomeLabel(locale)}
              </Link>
            </li>
            <li>/</li>
            <li className='font-medium text-foreground'>{getAvailabilityLabel(locale)}</li>
          </ol>
        </nav>

        <header className='mb-8 space-y-3 md:mb-10'>
          <h1 className='text-3xl font-semibold tracking-tight text-foreground md:text-4xl'>{t('list.heading')}</h1>
          <p className='max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base'>{t('list.subheading')}</p>
        </header>

        {items.length === 0 ? (
          <p className='rounded-xl border border-border/70 bg-card/80 p-5 text-sm text-muted-foreground'>
            {t('list.empty')}
          </p>
        ) : (
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {items.map((item) => {
              const platformLabel = t(`platform.${item.platform}`);
              const detailHref = buildPublicPath(lang, `/availability/${item.platformSegment}/${item.slug}`);
              const regionName = resolveLocationLabel(
                item.addressLocality,
                item.addressRegion,
                item.cityKey ? formatRegionName(item.cityKey) : t('labels.unknownLocation'),
              );
              const regionHref = item.cityKey
                ? buildPublicPath(lang, `/availability/${item.platformSegment}/region/${item.cityKey}`)
                : null;

              return (
                <article key={item.id} className='rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm'>
                  <p className='text-xs font-semibold tracking-wide text-primary'>{platformLabel}</p>

                  <Link
                    href={detailHref}
                    className='group mt-2 inline-flex items-start gap-1 text-base font-medium text-foreground hover:text-primary'
                  >
                    <span className='line-clamp-2'>{getDetailAnchorText(locale, item.name)}</span>
                    <ArrowRight className='mt-0.5 size-4 shrink-0 transition-transform group-hover:translate-x-0.5' />
                  </Link>

                  <p className='mt-2 text-sm text-muted-foreground'>{regionName}</p>

                  {regionHref ? (
                    <Link
                      href={regionHref}
                      className='mt-2 inline-flex items-center text-xs font-medium text-primary underline-offset-4 hover:underline'
                    >
                      {getRegionAnchorText(locale, platformLabel, regionName)}
                    </Link>
                  ) : null}

                  <dl className='mt-4 grid grid-cols-2 gap-3 text-sm'>
                    <div>
                      <dt className='text-xs text-muted-foreground'>{t('stats.openRate')}</dt>
                      <dd className='font-semibold text-foreground'>
                        {formatPercent(locale, item.latestSnapshot?.openRate ?? null)}
                      </dd>
                    </div>
                    <div>
                      <dt className='text-xs text-muted-foreground'>{t('stats.avgPrice')}</dt>
                      <dd className='font-semibold text-foreground'>
                        {formatCurrency(
                          locale,
                          item.latestSnapshot?.avgPriceAmount ?? null,
                          item.latestSnapshot?.currency ?? null,
                        )}
                      </dd>
                    </div>
                  </dl>

                  <p className='mt-4 text-xs text-muted-foreground'>
                    {t('list.updatedAt', { value: formatDateTime(locale, item.lastObservedAt) })}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
