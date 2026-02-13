'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

/**
 * 앱 목적 및 데이터 사용 목적 안내. Google OAuth 검증 요건(홈페이지에 앱 목적 명시) 충족용.
 */
export function AppPurpose(): React.ReactElement {
  const t = useTranslations('landing');
  const locale = useLocale();

  return (
    <section className='border-t border-border bg-muted/40 px-4 py-6 text-center' aria-label='앱 목적 및 데이터 사용'>
      <p className='mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground'>
        {t('appPurpose')}{' '}
        <Link
          href={`/${locale}/privacy`}
          className='font-medium text-primary underline underline-offset-4 hover:text-primary/80'
        >
          {t('footer.privacy')}
        </Link>
      </p>
    </section>
  );
}
