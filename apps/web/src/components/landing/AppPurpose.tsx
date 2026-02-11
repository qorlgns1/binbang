import Link from 'next/link';

import type { LandingCopy } from '@/lib/i18n/landing';

interface AppPurposeProps {
  copy: LandingCopy;
}

/**
 * 앱 목적 및 데이터 사용 목적 안내. Google OAuth 검증 요건(홈페이지에 앱 목적 명시) 충족용.
 * 로그인 없이 보이며, 개인정보처리방침 링크를 포함합니다.
 */
export function AppPurpose({ copy }: AppPurposeProps): React.ReactElement {
  return (
    <section className='border-t border-border bg-muted/40 px-4 py-6 text-center' aria-label='앱 목적 및 데이터 사용'>
      <p className='mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground'>
        {copy.appPurpose}{' '}
        <Link href='/privacy' className='font-medium text-primary underline underline-offset-4 hover:text-primary/80'>
          {copy.footer.privacy}
        </Link>
      </p>
    </section>
  );
}
