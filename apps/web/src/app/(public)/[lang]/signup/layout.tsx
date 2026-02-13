import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { type Locale, isSupportedLocale } from '@workspace/shared/i18n';
import { buildPublicAlternates, DEFAULT_OG_IMAGE, getOgLocale } from '@/lib/i18n-runtime/seo';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) return {};
  const t = await getTranslations({ locale: lang, namespace: 'auth' });
  const { canonical, languages } = buildPublicAlternates(lang as Locale, '/signup');
  const title = t('signup.metaTitle');
  const description = t('signup.metaDescription');
  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      type: 'website',
      locale: getOgLocale(lang as Locale),
      url: canonical,
      siteName: 'Binbang',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default function SignupLayout({ children }: LayoutProps): React.ReactElement {
  return <>{children}</>;
}
