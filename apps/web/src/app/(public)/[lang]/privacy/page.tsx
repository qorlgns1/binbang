import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { type Locale, isSupportedLocale } from '@workspace/shared/i18n';
import { buildPublicAlternates, DEFAULT_OG_IMAGE, getOgLocale } from '@/lib/i18n-runtime/seo';

/** 정적 생성으로 항상 200 HTML 응답 보장 (OAuth 검증용). */
export const dynamic = 'force-static';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) return {};
  const t = await getTranslations({ locale: lang, namespace: 'legal' });
  const { canonical, languages } = buildPublicAlternates(lang as Locale, '/privacy');
  const title = `${t('privacy.title')} | Binbang`;
  const description = 'Binbang(빈방) 개인정보처리방침. 수집·이용·보관·삭제 등 개인정보 처리 방식을 안내합니다.';
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

/**
 * Public privacy policy page. Accessible without authentication.
 * Required by Google OAuth verification: responsive, same domain, clearly linked to app (Binbang).
 */
export default async function PrivacyPage({ params }: PageProps): Promise<React.ReactElement> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  const t = await getTranslations({ locale: lang, namespace: 'legal' });

  return (
    <main className='mx-auto max-w-3xl px-4 py-12'>
      <h1 className='text-3xl font-semibold text-foreground'>{t('privacy.title')}</h1>
      <p className='mt-2 text-sm text-muted-foreground'>{t('privacy.lastUpdated')}</p>
      <div className='prose prose-neutral mt-8 dark:prose-invert'>
        <p className='text-muted-foreground'>{t('privacy.intro')}</p>
        <section className='mt-8'>
          <h2 className='text-xl font-medium text-foreground'>{t('privacy.section1Title')}</h2>
          <p className='mt-2 text-muted-foreground'>{t('privacy.section1Body')}</p>
        </section>
        <section className='mt-6'>
          <h2 className='text-xl font-medium text-foreground'>{t('privacy.section2Title')}</h2>
          <p className='mt-2 text-muted-foreground'>{t('privacy.section2Body')}</p>
        </section>
        <section className='mt-6'>
          <h2 className='text-xl font-medium text-foreground'>{t('privacy.section3Title')}</h2>
          <p className='mt-2 text-muted-foreground'>{t('privacy.section3Body')}</p>
        </section>
        <section className='mt-6'>
          <h2 className='text-xl font-medium text-foreground'>{t('privacy.section4Title')}</h2>
          <p className='mt-2 text-muted-foreground'>{t('privacy.section4Body')}</p>
        </section>
      </div>
      <div className='mt-12 flex gap-4'>
        <Link
          href={`/${lang}/terms`}
          className='text-sm text-primary underline underline-offset-4 hover:text-primary/80'
        >
          {t('privacy.termsLink')}
        </Link>
        <Link href={`/${lang}`} className='text-sm text-primary underline underline-offset-4 hover:text-primary/80'>
          {t('privacy.homeLink')}
        </Link>
      </div>
    </main>
  );
}
