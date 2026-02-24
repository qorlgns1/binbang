import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { DestinationDetail } from '@/components/destinations/DestinationDetail';
import { serializeJsonLd } from '@/lib/jsonLd';
import { getDestinationBySlug } from '@/services/destination.service';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// ISR: 24시간마다 재생성
export const revalidate = 86400;

// 동적 라우팅 사용 (generateStaticParams는 시드 데이터 투입 후 활성화)
export const dynamicParams = true;

const getCachedDestination = cache(async (slug: string) => getDestinationBySlug(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const destination = await getCachedDestination(slug);
  const t = await getTranslations({ locale, namespace: 'destinations' });

  if (!destination) {
    return {
      title: t('notFound'),
    };
  }

  const name = locale === 'ko' ? destination.nameKo : destination.nameEn;
  const description =
    typeof destination.description === 'object' && destination.description !== null
      ? ((destination.description as Record<string, string>)[locale] ?? '')
      : '';
  const title = t('travelGuideTitle', { name });

  return {
    title,
    description: description.slice(0, 160),
    openGraph: {
      title,
      description: description.slice(0, 160),
      type: 'website',
      locale: locale === 'ko' ? 'ko_KR' : 'en_US',
      images: destination.imageUrl ? [{ url: destination.imageUrl }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} Travel Guide`,
      description: description.slice(0, 160),
      images: destination.imageUrl ? [destination.imageUrl] : [],
    },
    alternates: {
      canonical: `/${locale}/destinations/${slug}`,
      languages: {
        ko: `/ko/destinations/${slug}`,
        en: `/en/destinations/${slug}`,
      },
    },
  };
}

export default async function DestinationPage({ params }: Props) {
  const { locale, slug } = await params;
  const destination = await getCachedDestination(slug);

  if (!destination) {
    notFound();
  }

  const name = locale === 'ko' ? destination.nameKo : destination.nameEn;
  const description =
    typeof destination.description === 'object' && destination.description !== null
      ? ((destination.description as Record<string, string>)[locale] ?? '')
      : '';
  const highlights =
    typeof destination.highlights === 'object' && destination.highlights !== null
      ? ((destination.highlights as Record<string, string[]>)[locale] ?? [])
      : [];

  // JSON-LD 구조화 데이터 (TouristDestination)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name,
    description,
    image: destination.imageUrl,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: destination.latitude,
      longitude: destination.longitude,
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: destination.countryCode,
    },
  };

  return (
    <>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: serializeJsonLd escapes </script> and HTML-special chars */}
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <DestinationDetail
        destination={{
          name,
          description,
          highlights,
          country: destination.country,
          imageUrl: destination.imageUrl ?? undefined,
          latitude: destination.latitude,
          longitude: destination.longitude,
          currency: destination.currency ?? undefined,
          weather: destination.weather as Record<string, unknown> | undefined,
        }}
        locale={locale}
      />
    </>
  );
}
