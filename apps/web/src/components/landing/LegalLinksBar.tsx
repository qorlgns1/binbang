import type { LandingCopy } from '@/lib/i18n/landing';

interface LegalLinksBarProps {
  copy: LandingCopy;
  /** 절대 URL 기준 (예: https://binbang.moodybeard.com). Google 검증 봇이 링크를 확실히 인식하도록 사용. */
  baseUrl: string;
}

/**
 * 메인 콘텐츠 최상단에 배치되는 개인정보처리방침·서비스 약관 링크 띠.
 * 일반 <a> + 절대 URL로 렌더링하여 OAuth 검증 봇이 반드시 인식하도록 함.
 */
export function LegalLinksBar({ copy, baseUrl }: LegalLinksBarProps): React.ReactElement {
  const privacyHref = `${baseUrl}/privacy`;
  const termsHref = `${baseUrl}/terms`;

  return (
    <nav
      className='border-b border-border bg-muted/30 px-4 py-2 text-center text-sm text-muted-foreground'
      aria-label='개인정보처리방침 및 서비스 약관'
    >
      <a href={privacyHref} className='underline underline-offset-2 hover:text-foreground'>
        {copy.footer.privacy}
      </a>
      <span className='mx-2' aria-hidden>
        ·
      </span>
      <a href={termsHref} className='underline underline-offset-2 hover:text-foreground'>
        {copy.footer.terms}
      </a>
    </nav>
  );
}
