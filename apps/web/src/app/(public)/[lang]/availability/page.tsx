import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { ArrowRight } from 'lucide-react';

import { type Locale, isSupportedLocale } from '@workspace/shared/i18n';
import { buildPublicAlternates, DEFAULT_OG_IMAGE, getOgLocale } from '@/lib/i18n-runtime/seo';
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) return {};

  const locale = lang as Locale;
  const t = await getTranslations({ locale: lang, namespace: 'availability' });
  const { canonical, languages } = buildPublicAlternates(locale, '/availability');

  return {
    title: t('list.metaTitle'),
    description: t('list.metaDescription'),
    alternates: { canonical, languages },
    openGraph: {
      type: 'website',
      locale: getOgLocale(locale),
      url: canonical,
      siteName: 'Binbang',
      title: t('list.metaTitle'),
      description: t('list.metaOgDescription'),
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary',
      title: t('list.metaTitle'),
      description: t('list.metaDescription'),
      images: ['/icon.png'],
    },
  };
}

export default async function AvailabilityListPage({ params }: PageProps): Promise<React.ReactElement> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  const locale = lang as Locale;
  const t = await getTranslations({ locale: lang, namespace: 'availability' });
  const items = await getPublicAvailabilityList({ limit: 72, locale });

  return (
    <main className='min-h-screen bg-background py-12 md:py-16'>
      <div className='mx-auto w-full max-w-6xl px-4'>
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
            {items.map((item) => (
              <article key={item.id} className='rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm'>
                <p className='text-xs font-semibold tracking-wide text-primary'>{t(`platform.${item.platform}`)}</p>
                <Link
                  href={`/${lang}/availability/${item.platformSegment}/${item.slug}`}
                  className='group mt-2 inline-flex items-center gap-1 text-lg font-medium text-foreground hover:text-primary'
                >
                  <span className='line-clamp-2'>{item.name}</span>
                  <ArrowRight className='size-4 shrink-0 transition-transform group-hover:translate-x-0.5' />
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

                <p className='mt-4 text-xs text-muted-foreground'>
                  {t('list.updatedAt', { value: formatDateTime(locale, item.lastObservedAt) })}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
