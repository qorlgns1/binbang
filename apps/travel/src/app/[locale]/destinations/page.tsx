import type { Destination } from '@workspace/db';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import { DestinationGrid } from '@/components/destinations/DestinationGrid';
import { serializeJsonLd } from '@/lib/jsonLd';
import { getPublishedDestinations } from '@/services/destination.service';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://travel.moodybeard.com';

type Props = {
  params: Promise<{ locale: string }>;
};

// ISR: 1시간마다 재생성
export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: 'Popular Travel Destinations',
    description: 'Discover amazing travel destinations around the world with detailed guides, photos, and tips.',
    openGraph: {
      title: 'Popular Travel Destinations',
      description: 'Discover amazing travel destinations around the world',
      type: 'website',
      locale: locale === 'ko' ? 'ko_KR' : 'en_US',
    },
    alternates: {
      canonical: `/${locale}/destinations`,
      languages: {
        ko: '/ko/destinations',
        en: '/en/destinations',
      },
    },
  };
}

export default async function DestinationsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const destinations = await getPublishedDestinations().catch(() => [] as Destination[]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: destinations.map((dest, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'TouristDestination',
        name: locale === 'ko' ? dest.nameKo : dest.nameEn,
        url: `${BASE_URL}/${locale}/destinations/${dest.slug}`,
        image: dest.imageUrl,
      },
    })),
  };

  return (
    <>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: serializeJsonLd escapes </script> and HTML-special chars */}
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <div className='min-h-screen bg-background'>
        {/* Header */}
        <header className='border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50'>
          <div className='container mx-auto px-4 py-4 flex items-center justify-between'>
            <Link href={`/${locale}`} className='text-xl font-bold hover:text-primary transition-colors'>
              Binbang
            </Link>
            <Link
              href={`/${locale}/chat`}
              className='px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors'
            >
              {t('landing.hero.cta')}
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className='bg-gradient-to-r from-primary to-brand-amber py-16'>
          <div className='container mx-auto px-4 text-center'>
            <h1 className='text-4xl md:text-5xl font-bold text-white mb-4'>{t('destinations.heroTitle')}</h1>
            <p className='text-lg md:text-xl text-white/90 max-w-2xl mx-auto'>
              {t('destinations.heroSubtitle', { count: destinations.length })}
            </p>
          </div>
        </section>

        {/* Destinations Grid */}
        <section className='container mx-auto px-4 py-12'>
          <DestinationGrid destinations={destinations} locale={locale} />
        </section>
      </div>
    </>
  );
}
