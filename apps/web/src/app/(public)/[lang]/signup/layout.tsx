import type { Metadata } from 'next';

import { type Locale, isSupportedLocale } from '@workspace/shared/i18n';
import { buildPublicAlternates, DEFAULT_OG_IMAGE, getOgLocale } from '@/lib/i18n-runtime/seo';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) return {};
  const { canonical, languages } = buildPublicAlternates(lang as Locale, '/signup');
  const title = '회원가입 | Binbang';
  const description = 'Binbang(빈방) 회원가입. 이메일로 가입하고 빈방 알림을 받아보세요.';
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
