import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { ChevronRight, ExternalLink, Lightbulb, LineChart, TrendingUp } from 'lucide-react';

import { type Locale, isSupportedLocale } from '@workspace/shared/i18n';
import { buildAvailabilityPath, buildPublicAlternates, DEFAULT_OG_IMAGE, getOgLocale } from '@/lib/i18n-runtime/seo';
import {
  getPublicAvailabilityPageData,
  type PublicAvailabilityPredictionView,
  type PublicAvailabilitySnapshotView,
} from '@/services/public-availability.service';

import { AvailabilityCtaButton } from './_components/AvailabilityCtaButton';
import { AvailabilityPageViewTracker } from './_components/AvailabilityPageViewTracker';

interface PageProps {
  params: Promise<{ lang: string; platform: string; slug: string }>;
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

function formatPercent(locale: Locale, value: number | null): string {
  if (typeof value !== 'number') return '-';
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value * 100)}%`;
}

function formatSignedPercentPoint(locale: Locale, value: number | null): string {
  if (typeof value !== 'number') return '-';
  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    signDisplay: 'always',
  }).format(value)}pp`;
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

function formatSignedCurrency(locale: Locale, amount: number | null, currency: string | null): string {
  if (typeof amount !== 'number') return '-';
  if (!currency) {
    return new Intl.NumberFormat(locale, { signDisplay: 'always' }).format(amount);
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
      signDisplay: 'always',
    }).format(amount);
  } catch {
    return `${new Intl.NumberFormat(locale, { signDisplay: 'always' }).format(amount)} ${currency}`;
  }
}

function formatDateRange(locale: Locale, snapshot: PublicAvailabilitySnapshotView | null): string {
  if (!snapshot) return '-';

  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
  return `${formatter.format(new Date(snapshot.windowStartAt))} - ${formatter.format(new Date(snapshot.windowEndAt))}`;
}

function formatDateTime(locale: Locale, iso: string | null): string {
  if (!iso) return '-';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

function getConfidenceBadgeClass(confidence: PublicAvailabilityPredictionView['confidence']): string {
  switch (confidence) {
    case 'HIGH':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'LOW':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400';
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, platform, slug } = await params;
  if (!isSupportedLocale(lang)) return {};

  const locale = lang as Locale;
  const data = await getPublicAvailabilityPageData({ platform, slug, alternativesLimit: 4 });
  if (!data) return {};

  const t = await getTranslations({ locale: lang, namespace: 'availability' });
  const platformLabel = t(`platform.${data.platform}`);
  const locationLabel = resolveLocationLabel(
    data.property.addressLocality,
    data.property.addressRegion,
    t('labels.unknownLocation'),
  );

  const canonicalPath = buildAvailabilityPath(data.platformSegment, data.property.slug);
  const { canonical, languages } = buildPublicAlternates(locale, canonicalPath);

  const title = t('meta.title', {
    propertyName: data.property.name,
    platform: platformLabel,
  });

  // 동적 description: 데이터가 있으면 구체적 수치 포함
  let description: string;
  if (data.latestSnapshot && data.latestSnapshot.openRate !== null && data.latestSnapshot.avgPriceAmount !== null) {
    const openRateDelta =
      typeof data.latestSnapshot.openRate === 'number' && typeof data.previousSnapshot?.openRate === 'number'
        ? data.latestSnapshot.openRate - data.previousSnapshot.openRate
        : 0;

    const trend = openRateDelta > 0.05 ? t('meta.trendUp') : openRateDelta < -0.05 ? t('meta.trendDown') : '';

    description = t('meta.descriptionWithData', {
      propertyName: data.property.name,
      location: locationLabel,
      openRate: formatPercent(locale, data.latestSnapshot.openRate),
      trend,
      avgPrice: formatCurrency(locale, data.latestSnapshot.avgPriceAmount, data.latestSnapshot.currency),
    });
  } else {
    description = t('meta.description', {
      propertyName: data.property.name,
      platform: platformLabel,
      location: locationLabel,
    });
  }

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
      description: t('meta.ogDescription', {
        propertyName: data.property.name,
        platform: platformLabel,
      }),
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

export default async function AvailabilityPage({ params }: PageProps): Promise<React.ReactElement> {
  const { lang, platform, slug } = await params;
  if (!isSupportedLocale(lang)) notFound();

  const locale = lang as Locale;
  const t = await getTranslations({ locale: lang, namespace: 'availability' });
  const data = await getPublicAvailabilityPageData({ platform, slug, alternativesLimit: 4 });

  if (!data) notFound();

  const platformLabel = t(`platform.${data.platform}`);
  const locationLabel = resolveLocationLabel(
    data.property.addressLocality,
    data.property.addressRegion,
    t('labels.unknownLocation'),
  );

  const openRateDelta =
    typeof data.latestSnapshot?.openRate === 'number' && typeof data.previousSnapshot?.openRate === 'number'
      ? (data.latestSnapshot.openRate - data.previousSnapshot.openRate) * 100
      : null;
  const avgPriceDelta =
    typeof data.latestSnapshot?.avgPriceAmount === 'number' && typeof data.previousSnapshot?.avgPriceAmount === 'number'
      ? data.latestSnapshot.avgPriceAmount - data.previousSnapshot.avgPriceAmount
      : null;

  const faqItems = [
    {
      question: t('faq.q1', { propertyName: data.property.name }),
      answer: t('faq.a1', { platform: platformLabel }),
    },
    {
      question: t('faq.q2'),
      answer: t('faq.a2'),
    },
    {
      question: t('faq.q3'),
      answer: t('faq.a3'),
    },
  ];

  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <main className='relative min-h-screen overflow-hidden bg-background pb-20'>
      <AvailabilityPageViewTracker lang={locale} propertyName={data.property.name} platform={data.platform} />
      <script
        type='application/ld+json'
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD from controlled translations and server data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -left-28 top-8 size-72 rounded-full bg-primary/10 blur-3xl' />
        <div className='absolute -right-24 bottom-0 size-80 rounded-full bg-brand-navy/10 blur-3xl' />
      </div>

      <div className='relative z-10 mx-auto max-w-6xl px-4 py-12 md:py-16'>
        <section className='grid gap-6 rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur md:grid-cols-[1.2fr_0.8fr] md:p-8'>
          <div className='space-y-4'>
            <p className='text-xs font-semibold tracking-[0.2em] text-primary'>
              {t('hero.eyebrow', { platform: platformLabel })}
            </p>
            <h1 className='text-3xl font-semibold leading-tight text-foreground md:text-4xl'>{data.property.name}</h1>
            <p className='text-sm text-muted-foreground md:text-base'>
              {t('hero.summary', {
                location: locationLabel,
                openRate: formatPercent(locale, data.latestSnapshot?.openRate ?? null),
              })}
            </p>
            <p className='text-xs text-muted-foreground'>
              {t('hero.window', { window: formatDateRange(locale, data.latestSnapshot) })}
            </p>

            <div className='flex flex-wrap items-center gap-3 pt-2'>
              <AvailabilityCtaButton
                lang={locale}
                href={`/${lang}/signup?prefill=${encodeURIComponent(
                  JSON.stringify({
                    url: data.property.sourceUrl,
                    platform: data.platform,
                    name: data.property.name,
                  }),
                )}`}
                source='availability_page_primary_cta'
                label={t('hero.ctaPrimary')}
                className='bg-primary text-primary-foreground hover:bg-primary/90'
              />
              <a
                href={data.property.sourceUrl}
                target='_blank'
                rel='noopener noreferrer nofollow'
                className='inline-flex items-center gap-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground'
              >
                {t('hero.sourceLink')}
                <ExternalLink className='size-4' />
              </a>
            </div>
          </div>

          <div className='rounded-xl border border-border/70 bg-background/80 p-4 md:p-5'>
            <h2 className='mb-4 text-sm font-semibold text-foreground'>{t('stats.title')}</h2>
            <dl className='grid grid-cols-2 gap-3 text-sm'>
              <div className='rounded-lg border border-border/70 bg-card/80 p-3'>
                <dt className='text-xs text-muted-foreground'>{t('stats.openRate')}</dt>
                <dd className='mt-1 text-lg font-semibold'>
                  {formatPercent(locale, data.latestSnapshot?.openRate ?? null)}
                </dd>
              </div>
              <div className='rounded-lg border border-border/70 bg-card/80 p-3'>
                <dt className='text-xs text-muted-foreground'>{t('stats.avgPrice')}</dt>
                <dd className='mt-1 text-lg font-semibold'>
                  {formatCurrency(
                    locale,
                    data.latestSnapshot?.avgPriceAmount ?? null,
                    data.latestSnapshot?.currency ?? null,
                  )}
                </dd>
              </div>
              <div className='rounded-lg border border-border/70 bg-card/80 p-3'>
                <dt className='text-xs text-muted-foreground'>{t('stats.priceRange')}</dt>
                <dd className='mt-1 text-sm font-medium'>
                  {data.latestSnapshot &&
                  typeof data.latestSnapshot.minPriceAmount === 'number' &&
                  typeof data.latestSnapshot.maxPriceAmount === 'number'
                    ? `${formatCurrency(locale, data.latestSnapshot.minPriceAmount, data.latestSnapshot.currency)} - ${formatCurrency(
                        locale,
                        data.latestSnapshot.maxPriceAmount,
                        data.latestSnapshot.currency,
                      )}`
                    : '-'}
                </dd>
              </div>
              <div className='rounded-lg border border-border/70 bg-card/80 p-3'>
                <dt className='text-xs text-muted-foreground'>{t('stats.sampleSize')}</dt>
                <dd className='mt-1 text-lg font-semibold'>
                  {new Intl.NumberFormat(locale).format(data.latestSnapshot?.sampleSize ?? 0)}
                </dd>
              </div>
            </dl>
            <p className='mt-3 text-xs text-muted-foreground'>
              {t('stats.updatedAt', { value: formatDateTime(locale, data.property.lastObservedAt) })}
            </p>
          </div>
        </section>

        <section className='mt-8 grid gap-4 md:grid-cols-2'>
          <div className='rounded-xl border border-border/70 bg-card/80 p-5'>
            <div className='mb-2 flex items-center gap-2 text-sm font-semibold text-foreground'>
              <LineChart className='size-4 text-primary' />
              {t('trend.openRateTitle')}
            </div>
            <p className='text-2xl font-semibold text-foreground'>{formatSignedPercentPoint(locale, openRateDelta)}</p>
            <p className='mt-1 text-sm text-muted-foreground'>
              {data.previousSnapshot ? t('trend.vsPrevious') : t('trend.notEnoughHistory')}
            </p>
          </div>
          <div className='rounded-xl border border-border/70 bg-card/80 p-5'>
            <div className='mb-2 flex items-center gap-2 text-sm font-semibold text-foreground'>
              <TrendingUp className='size-4 text-primary' />
              {t('trend.priceTitle')}
            </div>
            <p className='text-2xl font-semibold text-foreground'>
              {formatSignedCurrency(locale, avgPriceDelta, data.latestSnapshot?.currency ?? null)}
            </p>
            <p className='mt-1 text-sm text-muted-foreground'>
              {data.previousSnapshot ? t('trend.vsPrevious') : t('trend.notEnoughHistory')}
            </p>
          </div>
        </section>

        {data.prediction ? (
          <section className='mt-8 rounded-xl border border-primary/20 bg-primary/5 p-5 md:p-6'>
            <div className='mb-3 flex items-center gap-2 text-sm font-semibold text-foreground'>
              <Lightbulb className='size-4 text-primary' />
              {t('prediction.title')}
            </div>
            <div className='grid gap-3 md:grid-cols-3'>
              <div className='rounded-lg border border-border/70 bg-background/80 p-3'>
                <dt className='text-xs text-muted-foreground'>{t('prediction.nextAvailableAt')}</dt>
                <dd className='mt-1 text-lg font-semibold text-foreground'>
                  {data.prediction.nextLikelyAvailableAt
                    ? formatDateTime(locale, data.prediction.nextLikelyAvailableAt)
                    : '-'}
                </dd>
              </div>
              <div className='rounded-lg border border-border/70 bg-background/80 p-3'>
                <dt className='text-xs text-muted-foreground'>{t('prediction.confidence')}</dt>
                <dd className='mt-1'>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getConfidenceBadgeClass(data.prediction.confidence)}`}
                  >
                    {t(
                      `prediction.confidence${data.prediction.confidence.charAt(0)}${data.prediction.confidence.slice(1).toLowerCase()}`,
                    )}
                  </span>
                </dd>
              </div>
              <div className='rounded-lg border border-border/70 bg-background/80 p-3'>
                <dt className='text-xs text-muted-foreground'>{t('prediction.reasoning')}</dt>
                <dd className='mt-1 text-sm text-muted-foreground'>{data.prediction.reasoning}</dd>
              </div>
            </div>
            <p className='mt-3 text-xs text-muted-foreground'>
              {t('prediction.predictedAt', { value: formatDateTime(locale, data.prediction.predictedAt) })}
            </p>
          </section>
        ) : null}

        <section className='mt-10'>
          <div className='mb-4 flex items-center justify-between gap-4'>
            <h2 className='text-xl font-semibold text-foreground'>{t('alternatives.title')}</h2>
          </div>
          {data.alternatives.length === 0 ? (
            <p className='rounded-xl border border-border/70 bg-card/80 p-5 text-sm text-muted-foreground'>
              {t('alternatives.empty')}
            </p>
          ) : (
            <div className='grid gap-4 md:grid-cols-2'>
              {data.alternatives.map((item) => (
                <article key={item.id} className='rounded-xl border border-border/70 bg-card/80 p-5 shadow-xs'>
                  <Link
                    href={`/${lang}/availability/${data.platformSegment}/${item.slug}`}
                    className='group inline-flex items-center gap-1 text-lg font-medium text-foreground hover:text-primary'
                  >
                    {item.name}
                    <ChevronRight className='size-4 transition-transform group-hover:translate-x-0.5' />
                  </Link>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {resolveLocationLabel(item.addressLocality, item.addressRegion, t('labels.unknownLocation'))}
                  </p>
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
                </article>
              ))}
            </div>
          )}
        </section>

        <section className='mt-12 rounded-2xl border border-primary/30 bg-primary/5 p-6 md:p-8'>
          <h2 className='text-2xl font-semibold text-foreground'>{t('cta.title')}</h2>
          <p className='mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground'>{t('cta.description')}</p>
          <div className='mt-4'>
            <AvailabilityCtaButton
              lang={locale}
              href={`/${lang}/signup?prefill=${encodeURIComponent(
                JSON.stringify({
                  url: data.property.sourceUrl,
                  platform: data.platform,
                  name: data.property.name,
                }),
              )}`}
              source='availability_page_footer_cta'
              label={t('cta.button')}
              className='bg-primary text-primary-foreground hover:bg-primary/90'
            />
          </div>
        </section>

        <section className='mt-12 rounded-2xl border border-border/70 bg-card/80 p-6 md:p-8'>
          <h2 className='mb-4 text-xl font-semibold text-foreground'>{t('faq.title')}</h2>
          <div className='space-y-4'>
            {faqItems.map((item) => (
              <article key={item.question} className='rounded-lg border border-border/70 bg-background/70 p-4'>
                <h3 className='font-medium text-foreground'>{item.question}</h3>
                <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
