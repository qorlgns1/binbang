import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { getTranslations } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';

import { LandingPage } from '@/components/landing/LandingPage';
import { authOptions } from '@/lib/auth';
import { type Locale, SUPPORTED_LOCALES, isSupportedLocale } from '@workspace/shared/i18n';
import { buildPublicAlternates, DEFAULT_OG_IMAGE, getOgLocale } from '@/lib/i18n-runtime/seo';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) return {};
  const langTyped = lang as Locale;
  const t = await getTranslations({ locale: lang, namespace: 'landing' });
  const { canonical, languages } = buildPublicAlternates(langTyped, '');
  const title = t('meta.title');
  const description = t('meta.description');
  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      type: 'website',
      locale: getOgLocale(langTyped),
      url: canonical,
      siteName: 'Binbang',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary',
      title,
      description: t('meta.twitterDescription'),
      images: ['/icon.png'],
    },
  };
}

/**
 * Provide static route parameters for each supported language.
 *
 * @returns An array of objects where each object has a `lang` property set to a supported language (e.g., `{ lang: 'en' }`)
 */
export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((lang) => ({ lang }));
}

/**
 * Render the localized landing page for the requested language, redirecting authenticated users to /dashboard.
 *
 * If the route `lang` is not a supported language, triggers a 404 via `notFound()`. If a server session with a user exists, redirects to `/dashboard`.
 *
 * @param params - A promise resolving to an object with the route `lang` string (e.g., `{ lang: 'en' }`)
 * @returns A React element rendering the landing page localized to the provided `lang`
 */
export default async function Home({ params }: PageProps): Promise<React.ReactElement> {
  const session = await getServerSession(authOptions);

  if (session?.user) redirect('/dashboard');

  const { lang: langParam } = await params;

  if (!isSupportedLocale(langParam)) {
    notFound();
  }

  return <LandingPage lang={langParam} />;
}
