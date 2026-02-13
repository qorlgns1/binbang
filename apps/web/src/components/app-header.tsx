'use client';

import { useEffect, useState } from 'react';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Home, LogOut, Menu, Moon, Settings, Sun, User } from 'lucide-react';

import { LangToggle } from '@/components/landing/LangToggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/settings/subscription', label: '설정', icon: Settings },
] as const;

interface AppHeaderProps {
  userName: string | null;
  userImage?: string | null;
  isAdmin?: boolean;
  locale?: string;
}

export function AppHeader({ userName, isAdmin, locale }: AppHeaderProps): React.ReactElement {
  const t = useTranslations('common');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState<boolean | null>(null);

  // 초기 테마 로드
  useEffect(() => {
    const initialDark = document.documentElement.classList.contains('dark');
    setIsDark(initialDark);
  }, []);

  // 테마 적용
  useEffect(() => {
    if (isDark === null) return;
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('binbang-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = (): void => {
    setIsDark((prev) => !(prev ?? document.documentElement.classList.contains('dark')));
  };

  return (
    <header className='bg-background/80 backdrop-blur-sm border-b sticky top-0 z-40'>
      <div className='max-w-7xl mx-auto px-4 py-3 flex items-center justify-between'>
        {/* 좌측: 로고 + 데스크톱 네비게이션 */}
        <div className='flex items-center gap-6'>
          <Link href='/dashboard' className='flex items-center gap-2'>
            <span className='flex size-8 items-center justify-center rounded-full bg-primary'>
              <span className='size-2 rounded-full bg-primary-foreground animate-ping' />
            </span>
            <span className='text-sm font-semibold tracking-wide text-foreground md:text-base'>{t('brand')}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className='hidden md:flex gap-1'>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3 py-1.5 text-sm transition-colors',
                    isActive ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href='/admin/monitoring'
                className={cn(
                  'px-3 py-1.5 text-sm transition-colors',
                  pathname.startsWith('/admin')
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        {/* 우측: 데스크톱 유저 정보 */}
        <div className='hidden md:flex items-center gap-4'>
          <button
            type='button'
            onClick={toggleTheme}
            aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
            className='flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/50 hover:text-primary'
          >
            {isDark ? <Sun className='size-3.5' /> : <Moon className='size-3.5' />}
            {isDark ? 'Light' : 'Dark'}
          </button>
          {locale && <LangToggle currentLang={locale as 'ko' | 'en'} />}
          <span className='text-sm text-muted-foreground'>{userName}</span>
          <Button variant='ghost' size='sm' onClick={() => signOut({ callbackUrl: '/login' })}>
            {t('logout')}
          </Button>
        </div>

        {/* 모바일: 햄버거 메뉴 */}
        <div className='md:hidden'>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant='outline' size='icon'>
                <Menu className='size-5' />
                <span className='sr-only'>메뉴 열기</span>
              </Button>
            </SheetTrigger>
            <SheetContent side='right' className='w-72'>
              <SheetHeader>
                <SheetTitle>메뉴</SheetTitle>
              </SheetHeader>

              {/* 유저 정보 */}
              {userName && (
                <div className='py-4 border-b flex items-center gap-3'>
                  <div className='size-10 rounded-full bg-muted flex items-center justify-center'>
                    <User className='size-5 text-muted-foreground' />
                  </div>
                  <div>
                    <p className='font-medium'>{userName}</p>
                    <p className='text-xs text-muted-foreground'>로그인됨</p>
                  </div>
                </div>
              )}

              {/* 네비게이션 */}
              <nav className='flex flex-col gap-1 py-4'>
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-3',
                        isActive
                          ? 'text-foreground font-medium bg-muted'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                      )}
                    >
                      <Icon className='size-4' />
                      {item.label}
                    </Link>
                  );
                })}
                {isAdmin && (
                  <Link
                    href='/admin/monitoring'
                    onClick={() => setOpen(false)}
                    className={cn(
                      'px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-3',
                      pathname.startsWith('/admin')
                        ? 'text-foreground font-medium bg-muted'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                    )}
                  >
                    <Settings className='size-4' />
                    Admin
                  </Link>
                )}
              </nav>

              {/* 하단 액션 */}
              <div className='border-t pt-4 space-y-2'>
                <button
                  type='button'
                  onClick={toggleTheme}
                  className='flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                >
                  {isDark ? <Sun className='size-4' /> : <Moon className='size-4' />}
                  {isDark ? '라이트 모드' : '다크 모드'}
                </button>
                {locale && <LangToggle currentLang={locale as 'ko' | 'en'} variant='mobile' />}
                <Button
                  variant='ghost'
                  className='w-full justify-start text-destructive hover:text-destructive'
                  onClick={() => signOut({ callbackUrl: '/login' })}
                >
                  <LogOut className='size-4 mr-2' />
                  {t('logout')}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
