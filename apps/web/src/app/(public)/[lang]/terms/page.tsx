import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { isValidLang } from '@/lib/i18n/landing';
import type { Lang } from '@/lib/i18n/config';
import { buildPublicAlternates, DEFAULT_OG_IMAGE, getOgLocale } from '@/lib/i18n-runtime/seo';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLang(lang)) return {};
  const t = await getTranslations({ locale: lang, namespace: 'legal' });
  const { canonical, languages } = buildPublicAlternates(lang as Lang, '/terms');
  const title = `${t('terms.title')} | Binbang`;
  const description = 'Binbang(빈방) 이용약관. 서비스 이용에 관한 약관을 안내합니다.';
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

/**
 * Public terms of service page. Accessible without authentication.
 */
export default async function TermsPage({ params }: PageProps): Promise<React.ReactElement> {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();

  const t = await getTranslations({ locale: lang, namespace: 'legal' });

  return (
    <main className='mx-auto max-w-3xl px-4 py-12'>
      <h1 className='text-3xl font-semibold text-foreground'>{t('terms.title')}</h1>
      <p className='mt-2 text-sm text-muted-foreground'>{t('terms.lastUpdated')}</p>
      <div className='prose prose-neutral mt-8 dark:prose-invert'>
        <p className='text-muted-foreground'>{t('terms.intro')}</p>
        <section className='mt-8'>
          <h2 className='text-xl font-medium text-foreground'>{t('terms.section1Title')}</h2>
          <p className='mt-2 text-muted-foreground'>{t('terms.section1Body')}</p>
        </section>
        <section className='mt-6'>
          <h2 className='text-xl font-medium text-foreground'>{t('terms.section2Title')}</h2>
          <p className='mt-2 text-muted-foreground'>{t('terms.section2Body')}</p>
        </section>
        <section className='mt-6'>
          <h2 className='text-xl font-medium text-foreground'>{t('terms.section3Title')}</h2>
          <p className='mt-2 text-muted-foreground'>{t('terms.section3Body')}</p>
        </section>
        <section className='mt-6'>
          <h2 className='text-xl font-medium text-foreground'>{t('terms.section4Title')}</h2>
          <p className='mt-2 text-muted-foreground'>{t('terms.section4Body')}</p>
        </section>
        <section className='mt-6'>
          <h2 className='text-xl font-medium text-foreground'>{t('terms.section5Title')}</h2>
          <p className='mt-2 text-muted-foreground'>{t('terms.section5Body')}</p>
        </section>
      </div>
      <div className='mt-12 flex gap-4'>
        <Link
          href={`/${lang}/privacy`}
          className='text-sm text-primary underline underline-offset-4 hover:text-primary/80'
        >
          {t('terms.privacyLink')}
        </Link>
        <Link href={`/${lang}`} className='text-sm text-primary underline underline-offset-4 hover:text-primary/80'>
          {t('terms.homeLink')}
        </Link>
      </div>
    </main>
  );
}
