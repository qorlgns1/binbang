import type { Metadata } from 'next';

import { isValidLang } from '@/lib/i18n/landing';
import type { Lang } from '@/lib/i18n/config';
import { buildPublicAlternates, DEFAULT_OG_IMAGE, getOgLocale } from '@/lib/i18n-runtime/seo';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLang(lang)) return {};
  const { canonical, languages } = buildPublicAlternates(lang as Lang, '/login');
  const title = '로그인 | Binbang';
  const description = 'Binbang(빈방) 로그인. 이메일 또는 소셜 로그인으로 서비스를 이용하세요.';
  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      type: 'website',
      locale: getOgLocale(lang as Lang),
      url: canonical,
      siteName: 'Binbang',
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default function LoginLayout({ children }: LayoutProps): React.ReactElement {
  return <>{children}</>;
}
