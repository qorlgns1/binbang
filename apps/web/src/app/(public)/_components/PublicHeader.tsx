'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { LangToggle } from '@/components/landing/LangToggle';
import { MobileMenu } from '@/components/landing/MobileMenu';
import { ThemeToggle } from '@/components/landing/ThemeToggle';
import { trackClickEvent } from '@/lib/analytics/click-tracker';
import type { Locale } from '@workspace/shared/i18n';

export type PublicHeaderVariant = 'default' | 'landing' | 'pricing' | 'auth' | 'legal';

export interface PublicHeaderProps {
  /** 현재 locale. layout에서 params.lang으로 전달. */
  lang: Locale;
  /** 생략 시 pathname으로 자동 판단. */
  variant?: PublicHeaderVariant;
}

const navLinkClass =
  'rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background';

function resolveVariant(pathname: string | null, lang: Locale): PublicHeaderVariant {
  if (!pathname) return 'default';
  if (pathname === `/${lang}`) return 'landing';
  if (pathname === `/${lang}/pricing` || pathname === `/${lang}/faq` || pathname === `/${lang}/about`) return 'pricing';
  if (pathname === `/${lang}/login` || pathname === `/${lang}/signup`) return 'auth';
  if (pathname === `/${lang}/terms` || pathname === `/${lang}/privacy`) return 'legal';
  return 'default';
}

const backButtonClass =
  'flex min-h-9 min-w-9 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/**
 * Public 공통 헤더. 한 개의 &lt;header&gt;와 한 개의 &lt;nav&gt;로 라우트별 한 줄 구성.
 * - landing: 브랜드 | 네비 | 테마 | 언어 | 로그인
 * - pricing: 브랜드 | 뒤로 | 언어 | (대시보드 or 로그인/가입)
 * - auth: 브랜드 | 언어
 * - legal: 브랜드 | 홈으로 | 언어
 * - default: 브랜드 | 언어
 */
export function PublicHeader({ lang, variant: variantProp }: PublicHeaderProps): React.ReactElement {
  const pathname = usePathname();
  const variant = variantProp ?? resolveVariant(pathname, lang);
  const { data: session } = useSession();
  const tCommon = useTranslations('common');
  const tLanding = useTranslations('landing');
  const tPricing = useTranslations('pricing');

  const isLoggedIn = !!session?.user;
  const handleNavPricingClick = (): void => {
    trackClickEvent({
      eventName: 'nav_pricing',
      source: 'public_header_desktop',
      locale: lang,
    });
  };
  const handleNavSignupClick = (): void => {
    trackClickEvent({
      eventName: 'nav_signup',
      source: 'public_header_pricing',
      locale: lang,
    });
  };

  return (
    <header className='sticky top-0 z-50 border-b border-border/50 bg-background/95 shadow-sm backdrop-blur-md'>
      <div className='mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6'>
        <div className='flex min-h-10 items-center gap-2'>
          <Link
            href={`/${lang}`}
            className='flex items-center gap-2.5 rounded-md text-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background'
            aria-label={tCommon('brand')}
          >
            <span
              className='flex size-9 shrink-0 items-center justify-center rounded-full bg-primary transition-transform hover:scale-105'
              aria-hidden
            >
              <span className='size-2 rounded-full bg-primary-foreground' />
            </span>
            <span className='hidden text-sm font-semibold tracking-tight text-foreground sm:inline md:text-base'>
              {tCommon('brand')}
            </span>
          </Link>

          {(variant === 'pricing' || variant === 'legal') && (
            <Link
              href={`/${lang}`}
              className={`${backButtonClass} gap-1.5 px-2 text-sm sm:px-3`}
              aria-label={tCommon('back')}
            >
              <ArrowLeft className='size-5 shrink-0' />
            </Link>
          )}
        </div>

        {variant === 'landing' && (
          <>
            <nav className='hidden gap-1 md:flex mr-auto' aria-label='Main'>
              <Link href={`/${lang}/about`} className={navLinkClass}>
                {tLanding('nav.about')}
              </Link>
              <Link href={`/${lang}/pricing`} className={navLinkClass} onClick={handleNavPricingClick}>
                {tLanding('nav.pricing')}
              </Link>
              <Link href={`/${lang}/faq`} className={navLinkClass}>
                {tLanding('nav.faq')}
              </Link>
            </nav>
            <div className='flex items-center gap-2'>
              <span className='hidden md:inline'>
                <ThemeToggle lang={lang} />
              </span>
              <LangToggle currentLang={lang} />
              <Button
                asChild
                variant='outline'
                size='sm'
                className='hidden border-primary/50 bg-transparent text-primary hover:bg-primary/10 hover:text-primary md:inline-flex'
              >
                <Link href={`/${lang}/login`}>{tLanding('nav.login')}</Link>
              </Button>
              <div className='flex items-center gap-1 md:hidden'>
                <ThemeToggle lang={lang} variant='mobile' />
                <MobileMenu lang={lang} />
              </div>
            </div>
          </>
        )}

        {variant === 'pricing' && (
          <div className='flex items-center gap-2'>
            <LangToggle currentLang={lang} />
            {isLoggedIn ? (
              <>
                <span className='hidden text-sm text-muted-foreground sm:inline'>{session?.user?.name}</span>
                <Button asChild size='sm' className='bg-primary text-primary-foreground hover:bg-primary/90'>
                  <Link href='/dashboard'>{tPricing('nav.dashboard')}</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant='outline' size='sm' asChild>
                  <Link href={`/${lang}/login`}>{tPricing('nav.login')}</Link>
                </Button>
                <Button size='sm' asChild className='bg-primary text-primary-foreground hover:bg-primary/90'>
                  <Link href={`/${lang}/signup`} onClick={handleNavSignupClick}>
                    {tPricing('nav.getStarted')}
                  </Link>
                </Button>
              </>
            )}
          </div>
        )}

        {(variant === 'auth' || variant === 'legal' || variant === 'default') && (
          <div className='flex items-center'>
            <LangToggle currentLang={lang} />
          </div>
        )}
      </div>
    </header>
  );
}
